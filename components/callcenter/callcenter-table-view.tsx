'use client'

import { useEffect, useMemo, useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  MoreHorizontal, Bot, CheckCircle, ArrowRightLeft,
  ChevronUp, FileText, Phone, Globe, MessageCircle, PenLine,
  Shield, Bell, Trash2,
} from 'lucide-react'
import { cn, formatTimeAgo } from '@/lib/utils'
import { useCountdown } from '@/lib/hooks/use-countdown'
import { callSourceConfig, callbackStatusConfig, callbackPriorityConfig, escalationLevelConfig } from '@/lib/constants'
import type { Callback, CallbackStatus, CallSource } from '@/lib/types'

interface CallcenterTableViewProps {
  callbacks: Callback[]
  onComplete?: (id: string) => void
  onReassign?: (id: string) => void
  onEscalate?: (id: string) => void
  onViewTranscript: (id: string) => void
  onSetReminder?: (id: string) => void
  onEscalateToLevel?: (id: string) => void
  onDelete?: (id: string) => void
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

function useClientNow(refreshMs = 30_000) {
  const [now, setNow] = useState<number | null>(null)

  useEffect(() => {
    const updateNow = () => setNow(Date.now())
    const timeout = setTimeout(updateNow, 0)
    const interval = setInterval(updateNow, refreshMs)

    return () => {
      clearTimeout(timeout)
      clearInterval(interval)
    }
  }, [refreshMs])

  return now
}

function getSlaDisplay(cb: Callback, now: number | null): { text: string; className: string } {
  if (cb.status === 'erledigt') {
    if (cb.completedAt && new Date(cb.completedAt) <= new Date(cb.slaDeadline)) {
      return { text: 'Im SLA', className: 'text-emerald-600 dark:text-emerald-400' }
    }
    return { text: 'SLA überschritten', className: 'text-red-600 dark:text-red-400' }
  }

  if (now === null) return { text: '--', className: 'text-muted-foreground' }

  const diffMs = new Date(cb.slaDeadline).getTime() - now
  if (diffMs < 0) return { text: 'Überfällig', className: 'text-red-600 font-semibold' }
  if (diffMs < 30 * 60 * 1000) {
    const mins = Math.ceil(diffMs / 60000)
    return { text: `${mins} min`, className: 'text-amber-600 font-medium' }
  }
  const mins = Math.ceil(diffMs / 60000)
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return { text: h > 0 ? `${h}h ${m}m` : `${m} min`, className: 'text-muted-foreground' }
}

function getSourceIcon(source: CallSource) {
  switch (source) {
    case 'telefon': return Phone
    case 'website': return Globe
    case 'whatsapp': return MessageCircle
    case 'ki_agent': return Bot
    case 'manuell': return PenLine
  }
}

function CountdownCell({ dueAt, slaDurationMinutes, status }: { dueAt: string; slaDurationMinutes: number; status: string }) {
  const { formatted, isOverdue, percentRemaining } = useCountdown(dueAt, slaDurationMinutes)
  if (status === 'erledigt') return <span className="text-xs text-muted-foreground">&mdash;</span>
  return (
    <span className={cn(
      'text-xs font-mono font-medium tabular-nums',
      isOverdue ? 'text-red-600 dark:text-red-400 animate-pulse' :
      percentRemaining < 25 ? 'text-red-600 dark:text-red-400' :
      percentRemaining < 50 ? 'text-amber-600 dark:text-amber-400' :
      'text-emerald-600 dark:text-emerald-400'
    )}>
      {formatted}
    </span>
  )
}

export function CallcenterTableView({
  callbacks, onComplete, onReassign, onEscalate, onViewTranscript,
  onSetReminder, onEscalateToLevel, onDelete,
}: CallcenterTableViewProps) {
  const [sortKey, setSortKey] = useState<'status' | 'priority' | 'created'>('status')
  const now = useClientNow()

  const sorted = useMemo(() => {
    return [...callbacks].sort((a, b) => {
      if (sortKey === 'priority') return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
      if (sortKey === 'created') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      return STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
    })
  }, [callbacks, sortKey])

  if (callbacks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <CheckCircle className="h-10 w-10 mb-3 text-emerald-500 opacity-60" />
        <p className="text-sm font-medium">Keine Rückrufe gefunden</p>
        <p className="text-xs opacity-70">Filter anpassen oder neuen Rückruf erstellen</p>
      </div>
    )
  }

  return (
    <>
      {/* Mobile: card stack */}
      <div className="md:hidden space-y-3">
        {/* Mobile sort pills */}
        <div className="flex items-center gap-1.5 -mx-3 px-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <span className="text-[11px] font-medium text-muted-foreground flex-shrink-0">Sortieren:</span>
          {(['status', 'priority', 'created'] as const).map((key) => {
            const labels = { status: 'Status', priority: 'Priorität', created: 'Neueste' }
            const isActive = sortKey === key
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSortKey(key)}
                className={cn(
                  'px-3 h-8 rounded-full border text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0',
                  isActive
                    ? 'bg-foreground text-background border-foreground'
                    : 'border-border text-muted-foreground',
                )}
              >
                {labels[key]}
              </button>
            )
          })}
        </div>

        <ul className="space-y-2">
          {sorted.map((cb) => (
            <li key={cb.id}>
              <CallbackCard
                callback={cb}
                onComplete={onComplete}
                onReassign={onReassign}
                onEscalate={onEscalate}
                onViewTranscript={onViewTranscript}
                onSetReminder={onSetReminder}
                onEscalateToLevel={onEscalateToLevel}
                onDelete={onDelete}
              />
            </li>
          ))}
        </ul>

        <p className="text-xs text-muted-foreground pt-1 px-1">
          {callbacks.length} Rückruf{callbacks.length !== 1 ? 'e' : ''}
        </p>
      </div>

      {/* Desktop & Tablet: table */}
      <div className="hidden md:block border rounded-xl overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30 [&_th]:md:py-3.5 [&_th]:md:text-[11px] [&_th]:md:uppercase [&_th]:md:tracking-wide [&_th]:md:font-semibold">
              <TableHead className="w-[110px] md:w-[120px]">
                <button className="text-xs font-medium hover:text-foreground" onClick={() => setSortKey('status')}>
                  Status {sortKey === 'status' && '↓'}
                </button>
              </TableHead>
              <TableHead className="w-[90px] hidden lg:table-cell">
                <button className="text-xs font-medium hover:text-foreground" onClick={() => setSortKey('priority')}>
                  Priorität {sortKey === 'priority' && '↓'}
                </button>
              </TableHead>
              <TableHead>Kunde</TableHead>
              <TableHead className="hidden lg:table-cell">Anliegen</TableHead>
              <TableHead className="hidden lg:table-cell">Berater</TableHead>
              <TableHead className="hidden xl:table-cell">Angenommen von</TableHead>
              <TableHead className="hidden xl:table-cell w-[100px]">Quelle</TableHead>
              <TableHead className="w-[100px]">SLA</TableHead>
              <TableHead className="w-[100px]">Fällig</TableHead>
              <TableHead className="w-[90px] hidden lg:table-cell">
                <button className="text-xs font-medium hover:text-foreground" onClick={() => setSortKey('created')}>
                  Erstellt {sortKey === 'created' && '↓'}
                </button>
              </TableHead>
              <TableHead className="w-[60px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map(cb => {
              const isCompleted = cb.status === 'erledigt'
              const isOverdue = cb.status === 'ueberfaellig'
              const isKi = cb.takenBy.type === 'ki'
              const statusCfg = callbackStatusConfig[cb.status]
              const priorityCfg = callbackPriorityConfig[cb.priority]
              const sourceCfg = callSourceConfig[cb.source]
              const sla = getSlaDisplay(cb, now)
              const SourceIcon = getSourceIcon(cb.source)
              const advisorInitials = cb.assignedAdvisor.split(' ').map(n => n[0]).join('')
              const agentInitials = cb.takenBy.name.split(' ').map(n => n[0]).join('')

              return (
                <TableRow
                  key={cb.id}
                  className={cn(
                    'cursor-pointer transition-colors [&>td]:md:py-3.5 lg:[&>td]:py-2.5',
                    isOverdue && 'bg-red-50/40 dark:bg-red-950/10',
                    isCompleted && 'opacity-50',
                    isKi && !isCompleted && !isOverdue && 'bg-violet-50/20 dark:bg-violet-950/5',
                  )}
                  onClick={() => onViewTranscript(cb.id)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className={cn('w-2 h-2 rounded-full flex-shrink-0', getStatusDot(cb.status))} />
                      <Badge variant="secondary" className={cn('text-[10px] md:text-[11px] font-medium', statusCfg.color)}>
                        {statusCfg.label}
                      </Badge>
                      {cb.escalationLevel > 1 && (
                        <span className={cn('inline-flex items-center gap-0.5', escalationLevelConfig[cb.escalationLevel].color)}>
                          <Shield className="h-3 w-3" />
                          <span className="text-[10px] font-semibold">{cb.escalationLevel}</span>
                        </span>
                      )}
                      {cb.reminders.length > 0 && (
                        <Bell className="h-3 w-3 text-amber-500 flex-shrink-0" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <Badge variant="secondary" className={cn('text-[10px] font-medium', priorityCfg.color)}>
                      {priorityCfg.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {/* Master cell — at md (tablet) we inline priority, source, advisor; at lg+ keep slim */}
                    <div className="space-y-1 lg:space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm md:text-[15px] lg:text-sm font-medium md:font-semibold lg:font-normal truncate max-w-[220px] md:max-w-[240px] lg:max-w-[200px]">
                          {cb.customerName}
                        </p>
                        {/* Tablet-only inline priority badge */}
                        <Badge
                          variant="secondary"
                          className={cn(
                            'hidden md:inline-flex lg:hidden text-[10px] font-medium',
                            priorityCfg.color,
                          )}
                        >
                          {priorityCfg.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs md:text-[13px] lg:text-xs text-muted-foreground tabular-nums">
                          {cb.customerPhone}
                        </p>
                        {/* Tablet-only inline advisor (compact: avatar + first name) */}
                        <span className="hidden md:inline-flex lg:hidden items-center gap-1.5 text-xs text-muted-foreground">
                          <span className="text-muted-foreground/40">·</span>
                          <Avatar className="h-5 w-5">
                            <AvatarFallback className="text-[10px] md:text-[9px] bg-primary/10 text-primary font-semibold">
                              {advisorInitials}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-foreground/80 truncate max-w-[100px]">
                            {cb.assignedAdvisor.split(' ')[0]}
                          </span>
                          {isKi && (
                            <span className="ml-0.5 inline-flex items-center gap-0.5 text-[10px] font-semibold text-violet-600 dark:text-violet-400">
                              <Bot className="h-3 w-3" />
                              KI
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <p className="text-sm truncate max-w-[200px]">{cb.reason}</p>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-semibold">
                          {advisorInitials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-semibold truncate max-w-[120px]">{cb.assignedAdvisor}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden xl:table-cell">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className={cn(
                          'text-[10px] font-semibold',
                          isKi
                            ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'
                            : 'bg-muted text-muted-foreground',
                        )}>
                          {isKi ? <Bot className="h-3 w-3" /> : agentInitials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm truncate max-w-[110px]">{cb.takenBy.name}</span>
                      {isKi && (
                        <Badge variant="secondary" className="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 text-[10px] md:text-[9px] px-1 py-0">
                          KI
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden xl:table-cell">
                    <div className="flex items-center gap-1">
                      <SourceIcon className="h-3 w-3 text-muted-foreground" />
                      <span className={cn('text-[10px] font-medium rounded-full px-1.5 py-0.5', sourceCfg.color)}>
                        {sourceCfg.label}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={cn('text-xs md:text-[13px] lg:text-xs tabular-nums whitespace-nowrap', sla.className)}>
                      {sla.text}
                    </span>
                  </TableCell>
                  <TableCell>
                    <CountdownCell dueAt={cb.dueAt} slaDurationMinutes={cb.slaDurationMinutes} status={cb.status} />
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                      {now === null ? '--' : formatTimeAgo(cb.createdAt)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" className="h-9 w-9 md:h-10 md:w-10 lg:h-7 lg:w-7 p-0">
                          <MoreHorizontal className="h-4 w-4 md:h-[18px] md:w-[18px] lg:h-4 lg:w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="md:min-w-[220px] md:[&_[role=menuitem]]:py-2.5 md:[&_[role=menuitem]]:text-sm">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onViewTranscript(cb.id) }}>
                          <FileText className="h-3.5 w-3.5 mr-2" />
                          Transkript anzeigen
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
                            Priorität erhöhen
                          </DropdownMenuItem>
                        )}
                        {onSetReminder && (
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onSetReminder(cb.id) }}>
                            <Bell className="h-3.5 w-3.5 mr-2" />
                            Erinnerung setzen
                          </DropdownMenuItem>
                        )}
                        {onEscalateToLevel && !isCompleted && (
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEscalateToLevel(cb.id) }}>
                            <Shield className="h-3.5 w-3.5 mr-2" />
                            Eskalieren an...
                          </DropdownMenuItem>
                        )}
                        {onComplete && !isCompleted && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onComplete(cb.id) }}>
                              <CheckCircle className="h-3.5 w-3.5 mr-2" />
                              Als erledigt markieren
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
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
        <div className="px-4 md:px-5 py-2 md:py-2.5 border-t bg-muted/20 text-xs md:text-[13px] text-muted-foreground">
          {callbacks.length} Rückruf{callbacks.length !== 1 ? 'e' : ''}
        </div>
      </div>
    </>
  )
}

// ---------------------------------------------------------------------------
// Mobile callback card
// ---------------------------------------------------------------------------

interface CallbackCardProps {
  callback: Callback
  onComplete?: (id: string) => void
  onReassign?: (id: string) => void
  onEscalate?: (id: string) => void
  onViewTranscript: (id: string) => void
  onSetReminder?: (id: string) => void
  onEscalateToLevel?: (id: string) => void
  onDelete?: (id: string) => void
}

function CallbackCard({
  callback: cb,
  onComplete,
  onReassign,
  onEscalate,
  onViewTranscript,
  onSetReminder,
  onEscalateToLevel,
  onDelete,
}: CallbackCardProps) {
  const isCompleted = cb.status === 'erledigt'
  const isOverdue = cb.status === 'ueberfaellig'
  const isKi = cb.takenBy.type === 'ki'
  const statusCfg = callbackStatusConfig[cb.status]
  const priorityCfg = callbackPriorityConfig[cb.priority]
  const advisorInitials = cb.assignedAdvisor.split(' ').map((n) => n[0]).join('')

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onViewTranscript(cb.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onViewTranscript(cb.id)
        }
      }}
      className={cn(
        'group relative flex flex-col gap-2 rounded-xl border bg-card p-3 transition active:scale-[0.99]',
        isOverdue && 'border-l-4 border-l-red-500',
        isKi && !isOverdue && !isCompleted && 'border-l-4 border-l-violet-400',
        isCompleted && 'opacity-60',
      )}
    >
      {/* Top row: status dot, name, kebab */}
      <div className="flex items-start gap-2">
        <div className={cn('mt-1.5 h-2 w-2 rounded-full flex-shrink-0', getStatusDot(cb.status))} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-semibold truncate">{cb.customerName}</p>
            {cb.escalationLevel > 1 && (
              <span className={cn('inline-flex items-center gap-0.5 flex-shrink-0', escalationLevelConfig[cb.escalationLevel].color)}>
                <Shield className="h-3 w-3" />
                <span className="text-[10px] font-semibold">{cb.escalationLevel}</span>
              </span>
            )}
            {cb.reminders.length > 0 && (
              <Bell className="h-3 w-3 text-amber-500 flex-shrink-0" />
            )}
          </div>
          <p className="text-xs text-muted-foreground tabular-nums">{cb.customerPhone}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-9 w-9 -mt-1 -mr-1 flex-shrink-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onViewTranscript(cb.id) }}>
              <FileText className="h-3.5 w-3.5 mr-2" />
              Transkript anzeigen
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
                Priorität erhöhen
              </DropdownMenuItem>
            )}
            {onSetReminder && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onSetReminder(cb.id) }}>
                <Bell className="h-3.5 w-3.5 mr-2" />
                Erinnerung setzen
              </DropdownMenuItem>
            )}
            {onEscalateToLevel && !isCompleted && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEscalateToLevel(cb.id) }}>
                <Shield className="h-3.5 w-3.5 mr-2" />
                Eskalieren an...
              </DropdownMenuItem>
            )}
            {onComplete && !isCompleted && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onComplete(cb.id) }}>
                  <CheckCircle className="h-3.5 w-3.5 mr-2" />
                  Als erledigt markieren
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

      {/* Reason */}
      {cb.reason && (
        <p className="text-xs text-foreground/80 line-clamp-2 pl-4">{cb.reason}</p>
      )}

      {/* Bottom row: advisor + meta + status */}
      <div className="flex items-center justify-between gap-2 pl-4">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <Avatar className="h-5 w-5 flex-shrink-0">
            <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-semibold">
              {advisorInitials}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs font-medium truncate">{cb.assignedAdvisor}</span>
          <SourceIconInline source={cb.source} />
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Badge variant="secondary" className={cn('text-[10px] px-1.5 py-0 h-4', statusCfg.color)}>
            {statusCfg.label}
          </Badge>
          <CountdownCell dueAt={cb.dueAt} slaDurationMinutes={cb.slaDurationMinutes} status={cb.status} />
          <Badge variant="secondary" className={cn('text-[10px] px-1.5 py-0 h-4', priorityCfg.color)}>
            {priorityCfg.label}
          </Badge>
        </div>
      </div>
    </div>
  )
}

function SourceIconInline({ source }: { source: CallSource }) {
  switch (source) {
    case 'telefon':
      return <Phone className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
    case 'website':
      return <Globe className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
    case 'whatsapp':
      return <MessageCircle className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
    case 'ki_agent':
      return <Bot className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
    case 'manuell':
      return <PenLine className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
  }
}
