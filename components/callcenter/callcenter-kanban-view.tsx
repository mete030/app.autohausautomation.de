'use client'

import { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Phone, Globe, MessageCircle, Bot, PenLine, Clock,
  Shield, CheckCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  callbackStatusConfig, callbackPriorityConfig, callSourceConfig,
  escalationLevelConfig,
} from '@/lib/constants'
import type { Callback, CallbackStatus, CallSource } from '@/lib/types'
import { useCountdown } from '@/lib/hooks/use-countdown'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CallcenterKanbanViewProps {
  callbacks: Callback[]
  onComplete?: (id: string) => void
  onReassign?: (id: string) => void
  onEscalate?: (id: string) => void
  onViewTranscript: (id: string) => void
}

// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------

interface ColumnDef {
  status: CallbackStatus
  label: string
  borderColor: string
  badgeColor: string
}

const COLUMNS: ColumnDef[] = [
  {
    status: 'offen',
    label: 'Offen',
    borderColor: 'border-t-blue-500',
    badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400',
  },
  {
    status: 'in_bearbeitung',
    label: 'In Bearbeitung',
    borderColor: 'border-t-amber-500',
    badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
  },
  {
    status: 'ueberfaellig',
    label: 'Überfällig',
    borderColor: 'border-t-red-500',
    badgeColor: 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400',
  },
  {
    status: 'erledigt',
    label: 'Erledigt',
    borderColor: 'border-t-emerald-500',
    badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400',
  },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getStatusDot(status: CallbackStatus): string {
  switch (status) {
    case 'ueberfaellig': return 'bg-red-500'
    case 'in_bearbeitung': return 'bg-amber-400'
    case 'offen': return 'bg-blue-400'
    case 'erledigt': return 'bg-emerald-400'
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

const PRIORITY_ORDER: Record<string, number> = {
  dringend: 0, hoch: 1, mittel: 2, niedrig: 3,
}

// ---------------------------------------------------------------------------
// KanbanCard — separate component so useCountdown can be called as a hook
// ---------------------------------------------------------------------------

interface KanbanCardProps {
  cb: Callback
  onViewTranscript: (id: string) => void
}

function KanbanCard({ cb, onViewTranscript }: KanbanCardProps) {
  const { formatted, isOverdue, percentRemaining } = useCountdown(cb.dueAt, cb.slaDurationMinutes)

  const priorityCfg = callbackPriorityConfig[cb.priority]
  const sourceCfg = callSourceConfig[cb.source]
  const SourceIcon = getSourceIcon(cb.source)
  const advisorInitials = cb.assignedAdvisor
    .split(' ')
    .map((n) => n[0])
    .join('')

  const isCompleted = cb.status === 'erledigt'

  return (
    <div
      className={cn(
        'border rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer bg-card',
        isCompleted && 'opacity-50',
      )}
      onClick={() => onViewTranscript(cb.id)}
    >
      {/* Top row: status dot + priority badge + countdown */}
      <div className="flex items-center justify-between gap-1.5 mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className={cn('w-2 h-2 rounded-full flex-shrink-0', getStatusDot(cb.status))} />
          <Badge
            variant="secondary"
            className={cn('text-[10px] font-medium px-1.5 py-0', priorityCfg.color)}
          >
            {priorityCfg.label}
          </Badge>
        </div>
        {!isCompleted && (
          <span
            className={cn(
              'flex items-center gap-1 text-[11px] tabular-nums font-medium flex-shrink-0',
              isOverdue
                ? 'text-red-600 dark:text-red-400'
                : percentRemaining < 30
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-muted-foreground',
            )}
          >
            <Clock className="h-3 w-3" />
            {formatted}
          </span>
        )}
      </div>

      {/* Customer info */}
      <p className="font-medium text-sm truncate">{cb.customerName}</p>
      <p className="text-xs text-muted-foreground">{cb.customerPhone}</p>

      {/* Reason */}
      <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{cb.reason}</p>

      {/* Bottom row: avatar + advisor name + source badge */}
      <div className="flex items-center justify-between gap-2 mt-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <Avatar className="h-5 w-5">
            <AvatarFallback className="text-[9px] bg-primary/10 text-primary font-semibold">
              {advisorInitials}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground truncate">{cb.assignedAdvisor}</span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {cb.escalationLevel > 1 && (
            <span
              className={cn(
                'flex items-center gap-0.5 text-[10px] font-semibold',
                escalationLevelConfig[cb.escalationLevel].color,
              )}
            >
              <Shield className="h-3 w-3" />
              {cb.escalationLevel}
            </span>
          )}
          <span className={cn('text-[10px] rounded-full px-1.5 py-0.5 font-medium', sourceCfg.color)}>
            <SourceIcon className="h-3 w-3 inline-block" />
          </span>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Kanban View
// ---------------------------------------------------------------------------

export function CallcenterKanbanView({
  callbacks,
  onComplete,
  onReassign,
  onEscalate,
  onViewTranscript,
}: CallcenterKanbanViewProps) {
  const grouped = useMemo(() => {
    const map: Record<CallbackStatus, Callback[]> = {
      offen: [],
      in_bearbeitung: [],
      ueberfaellig: [],
      erledigt: [],
    }

    for (const cb of callbacks) {
      map[cb.status].push(cb)
    }

    // Sort each column by priority
    for (const status of Object.keys(map) as CallbackStatus[]) {
      map[status].sort(
        (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority],
      )
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
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {COLUMNS.map((col) => {
        const items = grouped[col.status]

        return (
          <div
            key={col.status}
            className={cn(
              'rounded-xl border border-t-4 bg-muted/20',
              col.borderColor,
            )}
          >
            {/* Column header */}
            <div className="flex items-center justify-between px-3 py-2.5 border-b">
              <span className="text-sm font-semibold">{col.label}</span>
              <Badge
                variant="secondary"
                className={cn('text-[10px] font-bold tabular-nums', col.badgeColor)}
              >
                {items.length}
              </Badge>
            </div>

            {/* Card stack */}
            <ScrollArea className="max-h-[calc(100vh-280px)]">
              <div className="p-2 space-y-2">
                {items.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">
                    Keine Einträge
                  </p>
                ) : (
                  items.map((cb) => (
                    <KanbanCard
                      key={cb.id}
                      cb={cb}
                      onViewTranscript={onViewTranscript}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        )
      })}
    </div>
  )
}
