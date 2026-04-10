'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  AlarmClock,
  ArrowUpRight,
  Bot,
  CheckCircle2,
  Clock,
  Globe,
  Headset,
  MessageCircle,
  PenLine,
  Phone,
  PhoneCall,
  Timer,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCallbackStore } from '@/lib/stores/callback-store'
import { callSourceConfig, mockCallAgents } from '@/lib/constants'
import type { Callback, CallSource } from '@/lib/types'

const REFRESH_INTERVAL_MS = 10_000
const RECENT_WINDOW_MS = 60 * 60 * 1000

function isToday(date: Date): boolean {
  const now = new Date()
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  )
}

function formatRelative(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  return `${h}h ${m % 60}m`
}

function formatCountdown(targetIso: string, now: number): {
  text: string
  overdue: boolean
  severity: 'fine' | 'warn' | 'critical' | 'overdue'
} {
  const target = new Date(targetIso).getTime()
  const diffSec = Math.round((target - now) / 1000)
  if (diffSec <= 0) {
    return { text: `+${formatRelative(-diffSec)}`, overdue: true, severity: 'overdue' }
  }
  if (diffSec < 5 * 60) return { text: formatRelative(diffSec), overdue: false, severity: 'critical' }
  if (diffSec < 15 * 60) return { text: formatRelative(diffSec), overdue: false, severity: 'warn' }
  return { text: formatRelative(diffSec), overdue: false, severity: 'fine' }
}

const SOURCE_ICONS: Record<CallSource, React.ComponentType<{ className?: string }>> = {
  telefon: Phone,
  website: Globe,
  whatsapp: MessageCircle,
  ki_agent: Bot,
  manuell: PenLine,
}

function SourceIcon({ source, className }: { source: CallSource; className?: string }) {
  const Icon = SOURCE_ICONS[source]
  return <Icon className={className} />
}

const PRIORITY_DOT: Record<Callback['priority'], string> = {
  dringend: 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]',
  hoch: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]',
  mittel: 'bg-sky-400',
  niedrig: 'bg-slate-400 dark:bg-slate-500',
}

export function CallcenterLiveDashboard() {
  const callbacks = useCallbackStore((s) => s.callbacks)
  const loadPersistedCallbacks = useCallbackStore((s) => s.loadPersistedCallbacks)
  const [now, setNow] = useState(() => Date.now())
  const [clock, setClock] = useState(() => new Date())

  // Auto-refresh callbacks from the server every REFRESH_INTERVAL_MS.
  useEffect(() => {
    void loadPersistedCallbacks()
    const interval = setInterval(() => {
      void loadPersistedCallbacks()
    }, REFRESH_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [loadPersistedCallbacks])

  // 1-second tick to update countdowns and the clock display.
  useEffect(() => {
    const tick = setInterval(() => {
      setNow(Date.now())
      setClock(new Date())
    }, 1000)
    return () => clearInterval(tick)
  }, [])

  const open = useMemo(() => callbacks.filter((c) => c.status !== 'erledigt'), [callbacks])
  const overdue = useMemo(
    () =>
      callbacks.filter(
        (c) =>
          c.status === 'ueberfaellig' ||
          (c.status !== 'erledigt' && new Date(c.dueAt).getTime() < now),
      ),
    [callbacks, now],
  )
  const completedToday = useMemo(
    () => callbacks.filter((c) => c.completedAt && isToday(new Date(c.completedAt))),
    [callbacks],
  )

  const avgHandleMinutes = useMemo(() => {
    if (completedToday.length === 0) return 0
    const totalMs = completedToday.reduce((sum, cb) => {
      return sum + (new Date(cb.completedAt!).getTime() - new Date(cb.createdAt).getTime())
    }, 0)
    return Math.round(totalMs / completedToday.length / 60000)
  }, [completedToday])

  const recentCallbacks = useMemo(() => {
    return [...callbacks]
      .filter((c) => now - new Date(c.createdAt).getTime() < RECENT_WINDOW_MS)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 12)
  }, [callbacks, now])

  const dueSoon = useMemo(() => {
    return [...open]
      .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())
      .slice(0, 7)
  }, [open])

  // Per-agent performance for today.
  const agentPerformance = useMemo(() => {
    const humanAgents = mockCallAgents.filter((a) => a.type === 'mensch')
    const todaysCallbacks = callbacks.filter((c) => isToday(new Date(c.createdAt)))
    return humanAgents
      .map((agent) => {
        const created = todaysCallbacks.filter((c) => c.takenBy.id === agent.id).length
        const done = todaysCallbacks.filter(
          (c) => c.takenBy.id === agent.id && c.status === 'erledigt',
        ).length
        return { agent, created, done }
      })
      .sort((a, b) => b.created - a.created)
  }, [callbacks])
  const maxPerAgent = Math.max(1, ...agentPerformance.map((a) => a.created))

  // Source distribution for today.
  const sourceTotals = useMemo(() => {
    const totals: Record<CallSource, number> = {
      telefon: 0, website: 0, whatsapp: 0, ki_agent: 0, manuell: 0,
    }
    for (const cb of callbacks) {
      if (isToday(new Date(cb.createdAt))) {
        totals[cb.source] = (totals[cb.source] ?? 0) + 1
      }
    }
    return totals
  }, [callbacks])
  const totalToday = Object.values(sourceTotals).reduce((a, b) => a + b, 0)

  return (
    <div className="-m-4 sm:-m-6 min-h-[calc(100vh-2rem)] bg-background text-foreground dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(56,189,248,0.10),transparent_60%),radial-gradient(ellipse_60%_50%_at_100%_100%,rgba(16,185,129,0.06),transparent_50%),#020617]">
      <div className="mx-auto flex h-full max-w-[1800px] flex-col gap-5 p-6 lg:p-8">
        {/* ───── Header ───── */}
        <header className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-sky-500/30 bg-sky-500/10">
              <Headset className="h-7 w-7 text-sky-500 dark:text-sky-400" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                  Callcenter Live
                </h1>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-300">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  </span>
                  Live
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Auto-Refresh alle 10 s · {open.length} offen
                {overdue.length > 0 && (
                  <span className="ml-1 text-red-600 dark:text-red-400">
                    · {overdue.length} überfällig
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="font-mono text-5xl font-bold tabular-nums tracking-tight text-foreground">
              {clock.toLocaleTimeString('de-DE', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </p>
            <p className="mt-0.5 text-sm capitalize text-muted-foreground">
              {clock.toLocaleDateString('de-DE', {
                weekday: 'long',
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
        </header>

        {/* ───── Hero KPI strip ───── */}
        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KpiTile
            label="Offene Rückrufe"
            value={open.length}
            icon={PhoneCall}
            tone="primary"
            hint="aktuell in Bearbeitung"
          />
          <KpiTile
            label="Überfällig"
            value={overdue.length}
            icon={AlarmClock}
            tone={overdue.length > 0 ? 'danger' : 'muted'}
            hint={overdue.length > 0 ? 'sofort eskalieren' : 'alles im grünen Bereich'}
          />
          <KpiTile
            label="Erledigt heute"
            value={completedToday.length}
            icon={CheckCircle2}
            tone="success"
            hint="abgeschlossene Rückrufe"
          />
          <KpiTile
            label="Ø Bearbeitungszeit"
            value={avgHandleMinutes}
            unit="min"
            icon={Timer}
            tone="neutral"
            hint="Erstellung bis Abschluss"
          />
        </section>

        {/* ───── Main two-column grid ───── */}
        <section className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-5">
          {/* ─── Left: Live feed (60%) ─── */}
          <div className="lg:col-span-3 flex">
            <DashboardCard
              title="Live-Feed"
              meta={`${recentCallbacks.length} Einträge · letzte 60 Min`}
              icon={ArrowUpRight}
              accent="sky"
            >
              {recentCallbacks.length === 0 ? (
                <EmptyState text="Noch keine neuen Rückrufe in der letzten Stunde." />
              ) : (
                <ul className="space-y-2">
                  {recentCallbacks.map((cb, index) => (
                    <LiveFeedRow key={cb.id} callback={cb} now={now} isFirst={index === 0} />
                  ))}
                </ul>
              )}
            </DashboardCard>
          </div>

          {/* ─── Right column: Due soon + Performance ─── */}
          <div className="lg:col-span-2 grid gap-4 grid-rows-[minmax(0,1fr)_minmax(0,1fr)]">
            <DashboardCard
              title="Fällig in Kürze"
              meta={`Top ${dueSoon.length}`}
              icon={Clock}
              accent="amber"
            >
              {dueSoon.length === 0 ? (
                <EmptyState text="Keine offenen Rückrufe." />
              ) : (
                <ul className="space-y-2">
                  {dueSoon.map((cb) => (
                    <DueSoonRow key={cb.id} callback={cb} now={now} />
                  ))}
                </ul>
              )}
            </DashboardCard>

            <DashboardCard
              title="Performance heute"
              meta="Pro Agent"
              icon={CheckCircle2}
              accent="emerald"
            >
              {agentPerformance.length === 0 ? (
                <EmptyState text="Noch keine Aktivität heute." />
              ) : (
                <ul className="space-y-3">
                  {agentPerformance.map(({ agent, created, done }) => {
                    const ratio = created === 0 ? 0 : Math.round((done / created) * 100)
                    const widthPct = (created / maxPerAgent) * 100
                    return (
                      <li key={agent.id} className="space-y-1.5">
                        <div className="flex items-baseline justify-between gap-2 text-sm">
                          <span className="truncate text-foreground">{agent.name}</span>
                          <span className="font-mono tabular-nums text-muted-foreground">
                            <span className="font-semibold text-emerald-600 dark:text-emerald-300">
                              {done}
                            </span>
                            <span className="text-muted-foreground/60"> / </span>
                            <span className="text-foreground">{created}</span>
                          </span>
                        </div>
                        <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-700"
                            style={{ width: `${widthPct}%` }}
                          />
                          {created > 0 && (
                            <div
                              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-300/40 to-emerald-200/30"
                              style={{ width: `${(done / maxPerAgent) * 100}%` }}
                            />
                          )}
                        </div>
                        {created > 0 && (
                          <p className="text-[10px] text-muted-foreground">
                            {ratio}% erledigt
                          </p>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
            </DashboardCard>
          </div>
        </section>

        {/* ───── Footer source distribution ───── */}
        <footer className="rounded-2xl border border-border bg-card px-5 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Quellen heute
              </span>
              <span className="text-[10px] text-muted-foreground/60">·</span>
              <span className="text-[10px] tabular-nums text-muted-foreground">
                {totalToday} Rückrufe gesamt
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {(Object.keys(sourceTotals) as CallSource[]).map((source) => {
                const value = sourceTotals[source]
                const cfg = callSourceConfig[source]
                const pct = totalToday === 0 ? 0 : Math.round((value / totalToday) * 100)
                return (
                  <div
                    key={source}
                    className="flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1.5"
                  >
                    <SourceIcon source={source} className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[11px] text-muted-foreground">{cfg.label}</span>
                    <span className="font-mono text-[11px] font-semibold tabular-nums text-foreground">
                      {value}
                    </span>
                    {totalToday > 0 && (
                      <span className="text-[10px] tabular-nums text-muted-foreground/70">
                        {pct}%
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Subcomponents
// ---------------------------------------------------------------------------

function KpiTile({
  label,
  value,
  unit,
  icon: Icon,
  tone,
  hint,
}: {
  label: string
  value: number
  unit?: string
  icon: React.ComponentType<{ className?: string }>
  tone: 'primary' | 'success' | 'danger' | 'neutral' | 'muted'
  hint?: string
}) {
  const styles = {
    primary: {
      ring: 'border-sky-500/30 dark:border-sky-500/20',
      bg: 'bg-gradient-to-br from-sky-500/10 via-sky-500/[0.04] to-transparent',
      number: 'text-foreground',
      icon: 'text-sky-600 dark:text-sky-400 bg-sky-500/15 border-sky-500/30',
      accent: 'from-sky-500/0 via-sky-500/60 dark:via-sky-400/70 to-sky-500/0',
    },
    success: {
      ring: 'border-emerald-500/30 dark:border-emerald-500/20',
      bg: 'bg-gradient-to-br from-emerald-500/10 via-emerald-500/[0.04] to-transparent',
      number: 'text-foreground',
      icon: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 border-emerald-500/30',
      accent: 'from-emerald-500/0 via-emerald-500/60 dark:via-emerald-400/70 to-emerald-500/0',
    },
    danger: {
      ring:
        'border-red-500/40 ring-2 ring-red-500/20 shadow-[0_0_40px_-10px_rgba(239,68,68,0.45)]',
      bg: 'bg-gradient-to-br from-red-500/15 via-red-500/[0.06] to-transparent',
      number: 'text-red-600 dark:text-red-50',
      icon: 'text-red-600 dark:text-red-300 bg-red-500/15 dark:bg-red-500/20 border-red-500/40',
      accent: 'from-red-500/0 via-red-500 to-red-500/0',
    },
    neutral: {
      ring: 'border-violet-500/30 dark:border-violet-500/15',
      bg: 'bg-gradient-to-br from-violet-500/10 via-violet-500/[0.03] to-transparent',
      number: 'text-foreground',
      icon: 'text-violet-600 dark:text-violet-300 bg-violet-500/15 border-violet-500/30',
      accent: 'from-violet-500/0 via-violet-500/60 dark:via-violet-400/60 to-violet-500/0',
    },
    muted: {
      ring: 'border-border',
      bg: 'bg-card',
      number: 'text-foreground',
      icon: 'text-muted-foreground bg-muted border-border',
      accent: 'from-transparent via-border to-transparent',
    },
  }[tone]

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border p-5',
        styles.ring,
        styles.bg,
      )}
    >
      <div className="flex items-start justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {label}
        </p>
        <div
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-xl border',
            styles.icon,
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <div className="mt-4 flex items-baseline gap-2">
        <p
          className={cn(
            'font-bold tabular-nums leading-none tracking-tight',
            'text-6xl lg:text-7xl',
            styles.number,
          )}
        >
          {value}
        </p>
        {unit && (
          <span className="text-2xl font-medium text-muted-foreground">{unit}</span>
        )}
      </div>

      {hint && <p className="mt-3 text-xs text-muted-foreground">{hint}</p>}

      <div
        className={cn(
          'pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r',
          styles.accent,
        )}
      />
    </div>
  )
}

function DashboardCard({
  title,
  meta,
  icon: Icon,
  accent,
  children,
}: {
  title: string
  meta?: string
  icon?: React.ComponentType<{ className?: string }>
  accent: 'sky' | 'amber' | 'emerald'
  children: React.ReactNode
}) {
  const accentClasses = {
    sky: 'text-sky-600 dark:text-sky-400',
    amber: 'text-amber-600 dark:text-amber-400',
    emerald: 'text-emerald-600 dark:text-emerald-400',
  }[accent]

  return (
    <div className="flex h-full min-h-0 w-full flex-col rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          {Icon && <Icon className={cn('h-4 w-4', accentClasses)} />}
          <h3 className="text-base font-semibold tracking-tight text-foreground">{title}</h3>
        </div>
        {meta && (
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
            {meta}
          </span>
        )}
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto p-4">{children}</div>
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex h-full min-h-[120px] items-center justify-center text-sm text-muted-foreground">
      {text}
    </div>
  )
}

function LiveFeedRow({
  callback,
  now,
  isFirst,
}: {
  callback: Callback
  now: number
  isFirst: boolean
}) {
  const ageSec = Math.max(0, Math.floor((now - new Date(callback.createdAt).getTime()) / 1000))
  return (
    <li
      className={cn(
        'group flex items-center gap-3 rounded-xl border border-border bg-background/40 px-3.5 py-3 transition-colors',
        isFirst && 'border-sky-500/30 bg-sky-500/[0.06] dark:bg-sky-500/[0.04]',
      )}
    >
      <div
        className={cn(
          'h-2.5 w-2.5 rounded-full flex-shrink-0',
          PRIORITY_DOT[callback.priority],
        )}
      />
      <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-muted/60 flex-shrink-0">
        <SourceIcon source={callback.source} className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-semibold text-foreground">{callback.customerName}</p>
        <p className="truncate text-xs text-muted-foreground">
          {callback.assignedAdvisor}
          <span className="mx-1 text-muted-foreground/50">·</span>
          aufgenommen von {callback.takenBy.name}
        </p>
      </div>
      <div className="flex-shrink-0 text-right">
        <span className="font-mono text-xs tabular-nums text-muted-foreground">
          vor {formatRelative(ageSec)}
        </span>
      </div>
    </li>
  )
}

function DueSoonRow({ callback, now }: { callback: Callback; now: number }) {
  const cd = formatCountdown(callback.dueAt, now)
  const chipClass = {
    overdue:
      'bg-red-500/15 text-red-600 dark:bg-red-500/20 dark:text-red-200 border-red-500/40 shadow-[0_0_12px_-2px_rgba(239,68,68,0.5)]',
    critical:
      'bg-red-500/10 text-red-600 dark:bg-red-500/15 dark:text-red-300 border-red-500/30',
    warn:
      'bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 border-amber-500/30',
    fine:
      'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 border-emerald-500/25',
  }[cd.severity]

  return (
    <li className="flex items-center gap-3 rounded-xl border border-border bg-background/40 px-3.5 py-3">
      <div
        className={cn(
          'h-2.5 w-2.5 rounded-full flex-shrink-0',
          PRIORITY_DOT[callback.priority],
        )}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{callback.customerName}</p>
        <p className="truncate text-[11px] text-muted-foreground">{callback.assignedAdvisor}</p>
      </div>
      <span
        className={cn(
          'flex-shrink-0 rounded-full border px-2.5 py-1 font-mono text-xs font-semibold tabular-nums',
          chipClass,
        )}
      >
        {cd.text}
      </span>
    </li>
  )
}
