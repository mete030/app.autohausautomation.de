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

export function KiMetricsBar({ calls }: { calls: KiReceptionCallDto[] }) {
  const [period, setPeriod] = useState<MetricsPeriod>('woche')

  const metrics = useMemo(
    () => computeKiMetrics(calls, period, Date.now()),
    [calls, period],
  )

  const sub = METRICS_PERIODS.find((p) => p.value === period)?.sub ?? ''
  const sharePct = Math.round(metrics.oohSharePeriod * 100)

  return (
    <section className="space-y-2.5">
      {/* Kopf: Titel + Zeitraum-Umschalter */}
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold tracking-tight">Anruf-Übersicht</h2>
        <div className="inline-flex rounded-lg border border-border/60 bg-card p-0.5">
          {METRICS_PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={cn(
                'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                period === p.value
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3 Metrik-Cards */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 md:gap-3">
        <StatCard icon={Phone} tone="primary" label="Alle Anrufe" value={metrics.allCalls} sub={sub} />
        <StatCard
          icon={Moon}
          tone="amber"
          label="Außerhalb Öffnungszeiten"
          value={metrics.oohLast24h}
          sub="letzte 24 Std"
        />
        <StatCard
          icon={Moon}
          tone="amber"
          label="Außerhalb Öffnungszeiten"
          value={metrics.oohInPeriod}
          sub={metrics.allCalls > 0 ? `${sub} · ${sharePct}% aller Anrufe` : sub}
        />
      </div>

      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Öffnungszeiten: {OPENING_HOURS_LABEL}. „Außerhalb" = vom KI-Assistenten entgegengenommen, während niemand erreichbar war.
      </p>
    </section>
  )
}

function StatCard({
  icon: Icon,
  tone,
  label,
  value,
  sub,
}: {
  icon: LucideIcon
  tone: 'primary' | 'amber'
  label: string
  value: number
  sub: string
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card px-3 py-3 md:px-4 md:py-3.5">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg',
            tone === 'amber'
              ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'
              : 'bg-primary/10 text-primary',
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
        <p className="truncate text-[11px] font-medium uppercase tracking-wide text-muted-foreground md:text-xs">
          {label}
        </p>
      </div>
      <p className="mt-1.5 text-2xl font-bold tabular-nums md:text-3xl">{value}</p>
      <p className="mt-0.5 truncate text-xs text-muted-foreground">{sub}</p>
    </div>
  )
}
