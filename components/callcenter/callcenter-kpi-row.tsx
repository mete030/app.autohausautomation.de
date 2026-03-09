'use client'

import { AlertTriangle, PhoneCall, CheckCircle, Clock, Bot } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CallcenterKpiRowProps {
  overdue: number
  active: number
  completedToday: number
  slaPercentage: number
  aiHandled: number
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
  { key: 'overdue', label: 'Überfällig', icon: AlertTriangle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' },
  { key: 'active', label: 'Aktiv', icon: PhoneCall, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  { key: 'completedToday', label: 'Heute erledigt', icon: CheckCircle, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
  { key: 'slaPercentage', label: 'SLA-Quote', icon: Clock, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30', suffix: '%' },
  { key: 'aiHandled', label: 'KI-bearbeitet', icon: Bot, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-100 dark:bg-violet-900/30' },
]

export function CallcenterKpiRow({ overdue, active, completedToday, slaPercentage, aiHandled }: CallcenterKpiRowProps) {
  const values: Record<string, number> = { overdue, active, completedToday, slaPercentage, aiHandled }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {kpis.map(({ key, label, icon: Icon, color, bg, suffix }) => (
        <div
          key={key}
          className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3"
        >
          <div className={cn('flex items-center justify-center h-9 w-9 rounded-lg', bg)}>
            <Icon className={cn('h-4.5 w-4.5', color)} />
          </div>
          <div>
            <p className="text-xl font-bold tabular-nums leading-none">
              {values[key]}{suffix ?? ''}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
