'use client'

import { useMemo, useState } from 'react'
import { Phone, Moon, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { KiReceptionCallDto } from '@/lib/ki-rezeptionist/types'
import {
  computeKiMetrics,
  METRICS_PERIODS,
  type MetricsPeriod,
} from '@/lib/ki-rezeptionist/metrics'
import { OPENING_HOURS_LABEL } from '@/lib/ki-rezeptionist/opening-hours'

function subFor(p: MetricsPeriod): string {
  return METRICS_PERIODS.find((x) => x.value === p)?.sub ?? ''
}

export function KiMetricsBar({ calls }: { calls: KiReceptionCallDto[] }) {
  // Jede filterbare Card hat ihren EIGENEN Zeitraum — kein globaler Filter,
  // der missverständlich auch die feste 24-Std-Card zu ändern scheint.
  const [periodAll, setPeriodAll] = useState<MetricsPeriod>('woche')
  const [periodOoh, setPeriodOoh] = useState<MetricsPeriod>('woche')

  const mAll = useMemo(() => computeKiMetrics(calls, periodAll, Date.now()), [calls, periodAll])
  const mOoh = useMemo(() => computeKiMetrics(calls, periodOoh, Date.now()), [calls, periodOoh])
  const pct = Math.round(mOoh.oohSharePeriod * 100)

  return (
    <section className="space-y-2.5">
      <h2 className="text-sm font-semibold tracking-tight">Anruf-Übersicht</h2>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 md:gap-3">
        <StatCard
          icon={Phone}
          tone="primary"
          label="Alle Anrufe"
          value={mAll.allCalls}
          sub={subFor(periodAll)}
          period={periodAll}
          onPeriod={setPeriodAll}
        />
        <StatCard
          icon={Moon}
          tone="amber"
          label="Außerhalb Öffnungszeiten"
          value={mAll.oohLast24h}
          sub="letzte 24 Std"
          fixedBadge="24 Std"
        />
        <StatCard
          icon={Moon}
          tone="amber"
          label="Außerhalb Öffnungszeiten"
          value={mOoh.oohInPeriod}
          sub={mOoh.allCalls > 0 ? `${subFor(periodOoh)} · ${pct}% aller Anrufe` : subFor(periodOoh)}
          period={periodOoh}
          onPeriod={setPeriodOoh}
        />
      </div>

      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Öffnungszeiten: {OPENING_HOURS_LABEL}. „Außerhalb" = vom KI-Assistenten entgegengenommen, während niemand erreichbar war.
      </p>
    </section>
  )
}

function PeriodSelect({
  value,
  onChange,
}: {
  value: MetricsPeriod
  onChange: (p: MetricsPeriod) => void
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as MetricsPeriod)}
      aria-label="Zeitraum dieser Kennzahl"
      className="-mr-0.5 flex-shrink-0 cursor-pointer rounded-md border border-border/60 bg-background px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground outline-none transition hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
    >
      {METRICS_PERIODS.map((p) => (
        <option key={p.value} value={p.value}>
          {p.label}
        </option>
      ))}
    </select>
  )
}

function StatCard({
  icon: Icon,
  tone,
  label,
  value,
  sub,
  period,
  onPeriod,
  fixedBadge,
}: {
  icon: LucideIcon
  tone: 'primary' | 'amber'
  label: string
  value: number
  sub: string
  period?: MetricsPeriod
  onPeriod?: (p: MetricsPeriod) => void
  fixedBadge?: string
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card px-3 py-2.5 md:px-3.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <span
            className={cn(
              'flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md',
              tone === 'amber'
                ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'
                : 'bg-primary/10 text-primary',
            )}
          >
            <Icon className="h-3.5 w-3.5" />
          </span>
          <p className="truncate text-[10px] font-medium uppercase tracking-wide text-muted-foreground md:text-[11px]">
            {label}
          </p>
        </div>

        {period && onPeriod ? (
          <PeriodSelect value={period} onChange={onPeriod} />
        ) : fixedBadge ? (
          <span className="flex-shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
            {fixedBadge}
          </span>
        ) : null}
      </div>

      <p className="mt-1 text-xl font-bold tabular-nums md:text-2xl">{value}</p>
      <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{sub}</p>
    </div>
  )
}
