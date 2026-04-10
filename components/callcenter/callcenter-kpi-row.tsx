'use client'

import { AlertTriangle, PhoneCall, ShieldAlert, Timer } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CallcenterKpiRowProps {
  totalCallbacks: number
  overdue: number
  escalations: number
  avgTime: number
}

interface KpiItem {
  key: string
  label: string
  icon: typeof AlertTriangle
  color: string
  bg: string
  suffix?: string
}

const kpis: KpiItem[] = [
  { key: 'totalCallbacks', label: 'Erstellte Rückrufe', icon: PhoneCall, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  { key: 'overdue', label: 'Überfällig', icon: AlertTriangle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' },
  { key: 'escalations', label: 'Eskalationen', icon: ShieldAlert, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/30' },
  { key: 'avgTime', label: 'Ø Bearbeitungszeit', icon: Timer, color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-100 dark:bg-cyan-900/30', suffix: ' min' },
]

export function CallcenterKpiRow({ totalCallbacks, overdue, escalations, avgTime }: CallcenterKpiRowProps) {
  const values: Record<string, number> = { totalCallbacks, overdue, escalations, avgTime }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3">
      {kpis.map(({ key, label, icon: Icon, color, bg, suffix }) => (
        <div
          key={key}
          className="flex items-center gap-2.5 rounded-xl border bg-card px-3 py-2.5 md:gap-3 md:px-4 md:py-3"
        >
          <div className={cn('flex items-center justify-center h-8 w-8 md:h-9 md:w-9 rounded-lg flex-shrink-0', bg)}>
            <Icon className={cn('h-4 w-4 md:h-4.5 md:w-4.5', color)} />
          </div>
          <div className="min-w-0">
            <p className="text-xl md:text-xl font-bold tabular-nums leading-none">
              {values[key]}{suffix ?? ''}
            </p>
            <p className="text-[11px] md:text-xs text-muted-foreground mt-0.5 truncate">{label}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
