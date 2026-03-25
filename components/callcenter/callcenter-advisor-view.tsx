'use client'

import { useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { CheckCircle, AlertTriangle, MoreHorizontal, Bot, FileText, ArrowRightLeft, ChevronUp, Trash2 } from 'lucide-react'
import { cn, formatTimeAgo } from '@/lib/utils'
import { callSourceConfig, callbackPriorityConfig } from '@/lib/constants'
import type { Callback, CallbackStatus } from '@/lib/types'

interface CallcenterAdvisorViewProps {
  callbacks: Callback[]
  allCallbacks: Callback[]
  onComplete?: (id: string) => void
  onReassign?: (id: string) => void
  onEscalate?: (id: string) => void
  onDelete?: (id: string) => void
  onViewTranscript: (id: string) => void
}

const STATUS_ORDER: Record<CallbackStatus, number> = {
  ueberfaellig: 0,
  in_bearbeitung: 1,
  offen: 2,
  erledigt: 3,
}

const PRIORITY_ORDER: Record<string, number> = { dringend: 0, hoch: 1, mittel: 2, niedrig: 3 }

function getStatusDot(status: CallbackStatus): string {
  switch (status) {
    case 'ueberfaellig': return 'bg-red-500'
    case 'in_bearbeitung': return 'bg-amber-400'
    case 'offen': return 'bg-blue-400'
    case 'erledigt': return 'bg-emerald-400'
  }
}

function getTimeClass(cb: Callback): string {
  if (cb.status === 'ueberfaellig') return 'text-red-600 font-semibold'
  if (cb.status === 'erledigt') return 'text-muted-foreground'
  const diffMs = new Date(cb.slaDeadline).getTime() - Date.now()
  if (diffMs < 0) return 'text-red-600 font-semibold'
  if (diffMs < 30 * 60 * 1000) return 'text-amber-600 font-medium'
  return 'text-muted-foreground'
}

interface GroupData {
  name: string
  callbacks: Callback[]
  openCount: number
  overdueCount: number
  completedTodayCount: number
  aiCount: number
}

export function CallcenterAdvisorView({
  callbacks, allCallbacks, onComplete, onReassign, onEscalate, onDelete, onViewTranscript,
}: CallcenterAdvisorViewProps) {
  const todayStr = new Date().toDateString()

  const groups = useMemo<GroupData[]>(() => {
    const advisorNames = [...new Set(allCallbacks.map(cb => cb.assignedAdvisor))].sort()

    return advisorNames
      .map(name => {
        const all = allCallbacks.filter(cb => cb.assignedAdvisor === name)
        const shown = callbacks
          .filter(cb => cb.assignedAdvisor === name)
          .sort((a, b) =>
            STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
            PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
          )
        return {
          name,
          callbacks: shown,
          openCount: all.filter(cb => cb.status === 'offen' || cb.status === 'in_bearbeitung').length,
          overdueCount: all.filter(cb => cb.status === 'ueberfaellig').length,
          completedTodayCount: all.filter(cb =>
            cb.status === 'erledigt' && cb.completedAt &&
            new Date(cb.completedAt).toDateString() === todayStr
          ).length,
          aiCount: all.filter(cb => cb.takenBy.type === 'ki').length,
        }
      })
      .filter(g => g.callbacks.length > 0)
      .sort((a, b) => b.overdueCount - a.overdueCount || b.openCount - a.openCount)
  }, [callbacks, allCallbacks, todayStr])

  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <CheckCircle className="h-10 w-10 mb-3 text-emerald-500 opacity-60" />
        <p className="text-sm font-medium">Keine offenen Rückrufe</p>
        <p className="text-xs opacity-70">Alle Aufgaben erledigt</p>
      </div>
    )
  }

  return (
    <div className="space-y-2.5">
      {groups.map(group => {
        const initials = group.name.split(' ').map(n => n[0]).join('')
        return (
          <Card key={group.name} className={cn('overflow-hidden', group.overdueCount > 0 && 'border-red-200 dark:border-red-900/40')}>
            {/* Advisor header */}
            <div className="flex flex-col gap-2 px-4 py-2.5 bg-muted/30 border-b sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2.5">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="text-[11px] bg-primary/10 text-primary font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="font-semibold text-sm">{group.name}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {group.overdueCount > 0 && (
                  <span className="flex items-center gap-1 font-semibold text-red-600">
                    <AlertTriangle className="h-3 w-3" />
                    {group.overdueCount} überfällig
                  </span>
                )}
                {group.openCount > 0 && (
                  <span className="text-muted-foreground">{group.openCount} offen</span>
                )}
                {group.completedTodayCount > 0 && (
                  <span className="text-emerald-600">{group.completedTodayCount} erledigt</span>
                )}
                {group.aiCount > 0 && (
                  <span className="flex items-center gap-1 text-violet-600 dark:text-violet-400">
                    <Bot className="h-3 w-3" />
                    {group.aiCount} KI
                  </span>
                )}
              </div>
            </div>

            {/* Callback rows */}
            <div className="divide-y divide-border/50">
              {group.callbacks.map(cb => {
                const isCompleted = cb.status === 'erledigt'
                const isOverdue = cb.status === 'ueberfaellig'
                const isKi = cb.takenBy.type === 'ki'
                const sourceCfg = callSourceConfig[cb.source]
                const priorityCfg = callbackPriorityConfig[cb.priority]

                return (
                  <div
                    key={cb.id}
                    className={cn(
                      'flex items-start gap-3 px-4 py-2.5 hover:bg-muted/20 transition-colors group cursor-pointer',
                      isOverdue && 'bg-red-50/40 dark:bg-red-950/10',
                      isCompleted && 'opacity-50',
                      isKi && !isCompleted && !isOverdue && 'bg-violet-50/20 dark:bg-violet-950/5',
                    )}
                    onClick={() => onViewTranscript(cb.id)}
                  >
                    {/* Status dot */}
                    <div className="flex-shrink-0 mt-[7px]">
                      <div className={cn('w-2 h-2 rounded-full', getStatusDot(cb.status))} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-semibold">{cb.customerName}</span>
                        {(cb.priority === 'dringend' || cb.priority === 'hoch') && !isCompleted && (
                          <Badge variant="secondary" className={cn('text-[10px] font-bold uppercase tracking-wide px-1 py-0', priorityCfg.color)}>
                            {priorityCfg.label}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">{cb.customerPhone}</span>
                      </div>

                      <p className={cn('text-sm', isCompleted && 'line-through decoration-muted-foreground/30')}>
                        {cb.reason}
                      </p>

                      {/* Agent + transcript preview */}
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          {isKi ? <Bot className="h-3 w-3 text-violet-500" /> : null}
                          <span className={isKi ? 'text-violet-600 dark:text-violet-400' : ''}>
                            {cb.takenBy.name}
                          </span>
                        </span>
                        <span className={cn('text-[10px] rounded-full px-1.5 py-0.5', sourceCfg.color)}>
                          {sourceCfg.label}
                        </span>
                        {cb.callTranscript && (
                          <span className="text-xs text-muted-foreground truncate max-w-[200px] hidden sm:inline">
                            &quot;{cb.callTranscript.slice(0, 60)}...&quot;
                          </span>
                        )}
                      </div>

                      {isCompleted && cb.completionNotes && (
                        <p className="text-xs text-emerald-700 dark:text-emerald-400 truncate mt-0.5">
                          ✓ {cb.completionNotes}
                        </p>
                      )}
                    </div>

                    {/* Time + actions */}
                    <div className="flex items-center gap-1.5 flex-shrink-0 pt-0.5">
                      <span className={cn('text-xs tabular-nums whitespace-nowrap', getTimeClass(cb))}>
                        {formatTimeAgo(cb.createdAt)}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
                          >
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onViewTranscript(cb.id) }}>
                            <FileText className="h-3.5 w-3.5 mr-2" />
                            Transkript
                          </DropdownMenuItem>
                          {onReassign && (
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onReassign(cb.id) }}>
                              <ArrowRightLeft className="h-3.5 w-3.5 mr-2" />
                              Neu zuweisen
                            </DropdownMenuItem>
                          )}
                          {onEscalate && cb.priority !== 'dringend' && !isCompleted && (
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEscalate(cb.id) }}>
                              <ChevronUp className="h-3.5 w-3.5 mr-2" />
                              Eskalieren
                            </DropdownMenuItem>
                          )}
                          {onComplete && !isCompleted && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onComplete(cb.id) }}>
                                <CheckCircle className="h-3.5 w-3.5 mr-2" />
                                Erledigt
                              </DropdownMenuItem>
                            </>
                          )}
                          {onDelete && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={(e) => { e.stopPropagation(); onDelete(cb.id) }}
                              >
                                <Trash2 className="h-3.5 w-3.5 mr-2" />
                                Rückruf löschen
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        )
      })}
    </div>
  )
}
