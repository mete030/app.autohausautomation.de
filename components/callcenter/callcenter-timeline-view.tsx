'use client'

import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Phone, Globe, MessageCircle, Bot, PenLine, Clock,
  CheckCircle, ChevronDown, ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  callbackPriorityConfig, callSourceConfig,
} from '@/lib/constants'
import type { Callback, CallbackStatus, CallSource } from '@/lib/types'
import { useCountdown } from '@/lib/hooks/use-countdown'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CallcenterTimelineViewProps {
  callbacks: Callback[]
  onComplete: (id: string) => void
  onReassign: (id: string) => void
  onEscalate: (id: string) => void
  onViewTranscript: (id: string) => void
}

// ---------------------------------------------------------------------------
// Time-group definitions
// ---------------------------------------------------------------------------

interface TimeGroup {
  key: string
  label: string
  borderColor: string
  badgeColor: string
}

const TIME_GROUPS: TimeGroup[] = [
  {
    key: 'overdue',
    label: 'Jetzt überfällig',
    borderColor: 'border-l-red-500',
    badgeColor: 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400',
  },
  {
    key: 'next5',
    label: 'Nächste 5 Minuten',
    borderColor: 'border-l-orange-500',
    badgeColor: 'bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400',
  },
  {
    key: 'next15',
    label: 'Nächste 15 Minuten',
    borderColor: 'border-l-amber-500',
    badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
  },
  {
    key: 'next30',
    label: 'Nächste 30 Minuten',
    borderColor: 'border-l-yellow-500',
    badgeColor: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400',
  },
  {
    key: 'next60',
    label: 'Nächste Stunde',
    borderColor: 'border-l-blue-500',
    badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400',
  },
  {
    key: 'later',
    label: 'Später',
    borderColor: 'border-l-slate-400',
    badgeColor: 'bg-slate-100 text-slate-600 dark:bg-slate-800/40 dark:text-slate-400',
  },
  {
    key: 'completed',
    label: 'Erledigt heute',
    borderColor: 'border-l-emerald-500',
    badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400',
  },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getPriorityDot(priority: string): string {
  switch (priority) {
    case 'dringend': return 'bg-red-500'
    case 'hoch': return 'bg-orange-500'
    case 'mittel': return 'bg-blue-400'
    case 'niedrig': return 'bg-slate-400'
    default: return 'bg-slate-400'
  }
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

function getTimeGroupKey(cb: Callback, nowMs: number): string {
  const todayStr = new Date(nowMs).toDateString()

  if (cb.status === 'erledigt') {
    if (cb.completedAt && new Date(cb.completedAt).toDateString() === todayStr) {
      return 'completed'
    }
    return 'completed'
  }

  const dueMs = new Date(cb.dueAt).getTime()
  const diffMin = (dueMs - nowMs) / 60_000

  if (diffMin <= 0) return 'overdue'
  if (diffMin <= 5) return 'next5'
  if (diffMin <= 15) return 'next15'
  if (diffMin <= 30) return 'next30'
  if (diffMin <= 60) return 'next60'
  return 'later'
}

const PRIORITY_ORDER: Record<string, number> = {
  dringend: 0, hoch: 1, mittel: 2, niedrig: 3,
}

// ---------------------------------------------------------------------------
// TimelineRow — separate component so useCountdown can be called as a hook
// ---------------------------------------------------------------------------

interface TimelineRowProps {
  cb: Callback
  onViewTranscript: (id: string) => void
}

function TimelineRow({ cb, onViewTranscript }: TimelineRowProps) {
  const { formatted, isOverdue, percentRemaining } = useCountdown(cb.dueAt, cb.slaDurationMinutes)

  const priorityCfg = callbackPriorityConfig[cb.priority]
  const SourceIcon = getSourceIcon(cb.source)
  const isCompleted = cb.status === 'erledigt'

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-2.5 border-b last:border-b-0 hover:bg-muted/30 transition-colors cursor-pointer',
        isCompleted && 'opacity-50',
      )}
      onClick={() => onViewTranscript(cb.id)}
    >
      {/* Priority dot */}
      <div className={cn('w-2 h-2 rounded-full flex-shrink-0', getPriorityDot(cb.priority))} />

      {/* Customer name */}
      <span className="font-medium text-sm whitespace-nowrap">{cb.customerName}</span>

      {/* Reason */}
      <span className="text-xs text-muted-foreground truncate min-w-0 flex-1">{cb.reason}</span>

      {/* Assigned advisor */}
      <span className="text-xs text-muted-foreground whitespace-nowrap hidden sm:inline">
        {cb.assignedAdvisor}
      </span>

      {/* Countdown badge */}
      {!isCompleted && (
        <span
          className={cn(
            'flex items-center gap-1 text-[11px] tabular-nums font-medium flex-shrink-0 rounded-full px-2 py-0.5',
            isOverdue
              ? 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400'
              : percentRemaining < 30
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
                : 'bg-muted text-muted-foreground',
          )}
        >
          <Clock className="h-3 w-3" />
          {formatted}
        </span>
      )}

      {isCompleted && cb.completedAt && (
        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex-shrink-0">
          Erledigt
        </span>
      )}

      {/* Source icon */}
      <SourceIcon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Timeline View
// ---------------------------------------------------------------------------

export function CallcenterTimelineView({
  callbacks,
  onComplete,
  onReassign,
  onEscalate,
  onViewTranscript,
}: CallcenterTimelineViewProps) {
  const [completedCollapsed, setCompletedCollapsed] = useState(true)

  const grouped = useMemo(() => {
    const nowMs = Date.now()
    const map: Record<string, Callback[]> = {}

    for (const group of TIME_GROUPS) {
      map[group.key] = []
    }

    for (const cb of callbacks) {
      const key = getTimeGroupKey(cb, nowMs)
      map[key].push(cb)
    }

    // Sort each group: overdue items by how far overdue (most overdue first),
    // upcoming items by soonest due first, completed by completion time desc
    for (const key of Object.keys(map)) {
      if (key === 'overdue') {
        map[key].sort((a, b) => {
          const aDue = new Date(a.dueAt).getTime()
          const bDue = new Date(b.dueAt).getTime()
          return aDue - bDue // most overdue first (smallest = earliest deadline)
        })
      } else if (key === 'completed') {
        map[key].sort((a, b) => {
          const aTime = a.completedAt ? new Date(a.completedAt).getTime() : 0
          const bTime = b.completedAt ? new Date(b.completedAt).getTime() : 0
          return bTime - aTime // most recently completed first
        })
      } else {
        map[key].sort((a, b) => {
          const aDue = new Date(a.dueAt).getTime()
          const bDue = new Date(b.dueAt).getTime()
          if (aDue !== bDue) return aDue - bDue
          return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
        })
      }
    }

    return map
  }, [callbacks])

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
    <div className="space-y-3">
      {TIME_GROUPS.map((group) => {
        const items = grouped[group.key]
        if (!items || items.length === 0) return null

        const isCompletedGroup = group.key === 'completed'
        const isCollapsed = isCompletedGroup && completedCollapsed

        return (
          <div
            key={group.key}
            className={cn('rounded-lg border overflow-hidden', group.borderColor, 'border-l-4')}
          >
            {/* Group header */}
            <div
              className={cn(
                'flex items-center justify-between px-3 py-2 bg-muted/30',
                isCompletedGroup && 'cursor-pointer hover:bg-muted/50 transition-colors',
              )}
              onClick={isCompletedGroup ? () => setCompletedCollapsed((v) => !v) : undefined}
            >
              <div className="flex items-center gap-2">
                {isCompletedGroup && (
                  isCollapsed
                    ? <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    : <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-sm font-semibold">{group.label}</span>
              </div>
              <Badge
                variant="secondary"
                className={cn('text-[10px] font-bold tabular-nums', group.badgeColor)}
              >
                {items.length}
              </Badge>
            </div>

            {/* Rows */}
            {!isCollapsed && (
              <div>
                {items.map((cb) => (
                  <TimelineRow
                    key={cb.id}
                    cb={cb}
                    onViewTranscript={onViewTranscript}
                  />
                ))}
              </div>
            )}
          </div>
        )
      })}

      {/* Footer */}
      <div className="px-3 py-2 text-xs text-muted-foreground">
        {callbacks.length} Rückruf{callbacks.length !== 1 ? 'e' : ''} gesamt
      </div>
    </div>
  )
}
