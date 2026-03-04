'use client'

import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { useCallbackStore } from '@/lib/stores/callback-store'
import { cn, formatTimeAgo } from '@/lib/utils'
import { CheckCircle, AlertTriangle } from 'lucide-react'
import type { Callback, CallbackStatus } from '@/lib/types'

type FilterMode = 'aktiv' | 'alle' | 'erledigt'

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
}

function AdvisorSection({ group, onComplete }: { group: GroupData; onComplete: (id: string) => void }) {
  const initials = group.name.split(' ').map(n => n[0]).join('')
  return (
    <Card className={cn('overflow-hidden', group.overdueCount > 0 && 'border-red-200 dark:border-red-900/40')}>
      {/* Advisor header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-muted/30 border-b">
        <div className="flex items-center gap-2.5">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="text-[11px] bg-primary/10 text-primary font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="font-semibold text-sm">{group.name}</span>
        </div>
        <div className="flex items-center gap-3 text-xs">
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
        </div>
      </div>

      {/* Callback rows */}
      <div className="divide-y divide-border/50">
        {group.callbacks.map(cb => (
          <CallbackRow key={cb.id} cb={cb} onComplete={onComplete} />
        ))}
      </div>
    </Card>
  )
}

function CallbackRow({ cb, onComplete }: { cb: Callback; onComplete: (id: string) => void }) {
  const isCompleted = cb.status === 'erledigt'
  const isOverdue = cb.status === 'ueberfaellig'

  return (
    <div className={cn(
      'flex items-start gap-3 px-4 py-2.5 hover:bg-muted/20 transition-colors group',
      isOverdue && 'bg-red-50/40 dark:bg-red-950/10',
      isCompleted && 'opacity-50',
    )}>
      {/* Status dot */}
      <div className="flex-shrink-0 mt-[7px]">
        <div className={cn('w-2 h-2 rounded-full', getStatusDot(cb.status))} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm font-semibold">{cb.customerName}</span>
          {(cb.priority === 'dringend' || cb.priority === 'hoch') && !isCompleted && (
            <span className={cn(
              'text-[10px] font-bold uppercase tracking-wide px-1 rounded',
              cb.priority === 'dringend'
                ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                : 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400',
            )}>
              {cb.priority}
            </span>
          )}
          <span className="text-xs text-muted-foreground">{cb.customerPhone}</span>
        </div>

        {/* Anliegen — the most important line */}
        <p className={cn('text-sm', isCompleted && 'line-through decoration-muted-foreground/30')}>
          {cb.reason}
        </p>

        {cb.notes && !isCompleted && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">{cb.notes}</p>
        )}
        {isCompleted && cb.completionNotes && (
          <p className="text-xs text-emerald-700 dark:text-emerald-400 truncate mt-0.5">
            ✓ {cb.completionNotes}
          </p>
        )}
      </div>

      {/* Time + action */}
      <div className="flex items-center gap-1.5 flex-shrink-0 pt-0.5">
        <span className={cn('text-xs tabular-nums whitespace-nowrap', getTimeClass(cb))}>
          {formatTimeAgo(cb.createdAt)}
        </span>
        {!isCompleted && (
          <Button
            size="sm"
            variant={isOverdue ? 'destructive' : 'ghost'}
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => onComplete(cb.id)}
            title="Als erledigt markieren"
          >
            <CheckCircle className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  )
}

export default function CallcenterPage() {
  const callbacks = useCallbackStore(s => s.callbacks)
  const updateCallbackStatus = useCallbackStore(s => s.updateCallbackStatus)
  const [filter, setFilter] = useState<FilterMode>('aktiv')
  const [completeDialog, setCompleteDialog] = useState<string | null>(null)
  const [completionNotes, setCompletionNotes] = useState('')

  const handleComplete = (id: string) => {
    updateCallbackStatus({ callbackId: id, status: 'erledigt', completionNotes })
    setCompleteDialog(null)
    setCompletionNotes('')
  }

  const todayStr = new Date().toDateString()
  const totalOverdue = callbacks.filter(cb => cb.status === 'ueberfaellig').length
  const totalActive = callbacks.filter(cb => cb.status !== 'erledigt').length
  const todayCompleted = callbacks.filter(cb =>
    cb.status === 'erledigt' && cb.completedAt &&
    new Date(cb.completedAt).toDateString() === todayStr
  ).length

  const advisorNames = useMemo(
    () => [...new Set(callbacks.map(cb => cb.assignedAdvisor))].sort(),
    [callbacks],
  )

  const groups = useMemo<GroupData[]>(() => {
    const base =
      filter === 'aktiv' ? callbacks.filter(cb => cb.status !== 'erledigt') :
      filter === 'erledigt' ? callbacks.filter(cb => cb.status === 'erledigt') :
      callbacks

    return advisorNames
      .map(name => {
        const all = callbacks.filter(cb => cb.assignedAdvisor === name)
        const shown = base
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
        }
      })
      .filter(g => g.callbacks.length > 0)
      // Advisors with overdue tasks float to the top
      .sort((a, b) => b.overdueCount - a.overdueCount || b.openCount - a.openCount)
  }, [callbacks, advisorNames, filter, todayStr])

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Callcenter</h1>
          <p className="text-sm text-muted-foreground">Rückrufe nach Berater</p>
        </div>
        <div className="flex items-center gap-4 text-sm pt-1">
          {totalOverdue > 0 && (
            <span className="flex items-center gap-1 text-red-600 font-semibold">
              <AlertTriangle className="h-3.5 w-3.5" />
              {totalOverdue} überfällig
            </span>
          )}
          <span className="text-muted-foreground">{totalActive} aktiv</span>
          <span className="text-emerald-600">{todayCompleted} heute erledigt</span>
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex gap-1.5">
        {([
          { value: 'aktiv', label: 'Offen & Überfällig' },
          { value: 'alle', label: 'Alle' },
          { value: 'erledigt', label: 'Erledigt' },
        ] as { value: FilterMode; label: string }[]).map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              'px-3 py-1 text-xs rounded-full border font-medium transition-colors',
              filter === f.value
                ? 'bg-foreground text-background border-foreground'
                : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/50',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Advisor groups */}
      <div className="space-y-2.5">
        {groups.map(group => (
          <AdvisorSection key={group.name} group={group} onComplete={setCompleteDialog} />
        ))}
        {groups.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <CheckCircle className="h-10 w-10 mb-3 text-emerald-500 opacity-60" />
            <p className="text-sm font-medium">Keine offenen Rückrufe</p>
            <p className="text-xs opacity-70">Alle Aufgaben erledigt</p>
          </div>
        )}
      </div>

      {/* Completion dialog */}
      <Dialog open={!!completeDialog} onOpenChange={() => setCompleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rückruf als erledigt markieren</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Notiz zum Abschluss (Pflichtfeld)..."
            value={completionNotes}
            onChange={e => setCompletionNotes(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompleteDialog(null)}>Abbrechen</Button>
            <Button
              disabled={!completionNotes.trim()}
              onClick={() => completeDialog && handleComplete(completeDialog)}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Erledigt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
