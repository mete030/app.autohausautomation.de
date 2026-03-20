'use client'

import { useMemo } from 'react'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  PhoneCall, CheckCircle, XCircle, Clock, ShieldAlert, AlertTriangle,
  Mail, Phone, TrendingUp, TrendingDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCallbackStore } from '@/lib/stores/callback-store'
import { employeeRoleConfig, employeeStatusConfig, callbackPriorityConfig, callbackStatusConfig } from '@/lib/constants'
import type { Employee, Callback } from '@/lib/types'

interface EmployeeDetailSheetProps {
  open: boolean
  employee: Employee | null
  onOpenChange: (open: boolean) => void
}

// Dummy historical stats per employee (simulated data beyond current callbacks)
const historicalStats: Record<string, { totalReceived: number; accepted: number; declined: number; escalated: number; lateResponded: number; avgResponseMin: number }> = {
  'emp-mp': { totalReceived: 12, accepted: 12, declined: 0, escalated: 0, lateResponded: 0, avgResponseMin: 5 },
  'emp-rh': { totalReceived: 28, accepted: 26, declined: 0, escalated: 2, lateResponded: 3, avgResponseMin: 10 },
  'emp-ar': { totalReceived: 31, accepted: 29, declined: 1, escalated: 1, lateResponded: 2, avgResponseMin: 8 },
  'emp-ae': { totalReceived: 87, accepted: 72, declined: 3, escalated: 8, lateResponded: 12, avgResponseMin: 18 },
  'emp-cb': { totalReceived: 64, accepted: 58, declined: 1, escalated: 4, lateResponded: 6, avgResponseMin: 14 },
  'emp-go': { totalReceived: 93, accepted: 78, declined: 5, escalated: 11, lateResponded: 15, avgResponseMin: 22 },
  'emp-ad': { totalReceived: 71, accepted: 65, declined: 2, escalated: 5, lateResponded: 8, avgResponseMin: 12 },
  'emp-as': { totalReceived: 34, accepted: 29, declined: 2, escalated: 3, lateResponded: 5, avgResponseMin: 25 },
  'emp-db': { totalReceived: 22, accepted: 20, declined: 1, escalated: 1, lateResponded: 2, avgResponseMin: 16 },
  'emp-se': { totalReceived: 45, accepted: 41, declined: 1, escalated: 3, lateResponded: 4, avgResponseMin: 19 },
  // Call-Center-Agenten
  'emp-msc': { totalReceived: 156, accepted: 148, declined: 2, escalated: 6, lateResponded: 4, avgResponseMin: 3 },
  'emp-jsc': { totalReceived: 134, accepted: 128, declined: 1, escalated: 5, lateResponded: 3, avgResponseMin: 4 },
  'emp-jhz': { totalReceived: 112, accepted: 107, declined: 3, escalated: 4, lateResponded: 5, avgResponseMin: 5 },
  'emp-jom': { totalReceived: 98,  accepted: 94,  declined: 1, escalated: 3, lateResponded: 2, avgResponseMin: 3 },
  'emp-dpi': { totalReceived: 89,  accepted: 85,  declined: 2, escalated: 2, lateResponded: 3, avgResponseMin: 4 },
}

const defaultStats = { totalReceived: 0, accepted: 0, declined: 0, escalated: 0, lateResponded: 0, avgResponseMin: 0 }

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function StatCard({ icon: Icon, label, value, color, bgColor, suffix }: {
  icon: typeof PhoneCall
  label: string
  value: number
  color: string
  bgColor: string
  suffix?: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border p-3">
      <div className={cn('flex items-center justify-center h-8 w-8 rounded-lg', bgColor)}>
        <Icon className={cn('h-4 w-4', color)} />
      </div>
      <div>
        <p className="text-lg font-bold tabular-nums leading-none">{value}{suffix}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
      </div>
    </div>
  )
}

export function EmployeeDetailSheet({ open, employee, onOpenChange }: EmployeeDetailSheetProps) {
  const callbacks = useCallbackStore(s => s.callbacks)

  const empCallbacks = useMemo(() => {
    if (!employee) return []
    return callbacks.filter(cb => cb.assignedAdvisor === employee.name)
  }, [callbacks, employee])

  const currentMetrics = useMemo(() => {
    const open = empCallbacks.filter(cb => cb.status === 'offen').length
    const inProgress = empCallbacks.filter(cb => cb.status === 'in_bearbeitung').length
    const overdue = empCallbacks.filter(cb => cb.status === 'ueberfaellig').length
    const completed = empCallbacks.filter(cb => cb.status === 'erledigt').length
    return { open, inProgress, overdue, completed, total: empCallbacks.length }
  }, [empCallbacks])

  if (!employee) return null

  const roleCfg = employeeRoleConfig[employee.role]
  const statusCfg = employeeStatusConfig[employee.status]
  const stats = historicalStats[employee.id] ?? defaultStats
  const acceptRate = stats.totalReceived > 0 ? Math.round((stats.accepted / stats.totalReceived) * 100) : 100
  const slaRate = stats.totalReceived > 0 ? Math.round(((stats.totalReceived - stats.lateResponded) / stats.totalReceived) * 100) : 100

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[480px] p-0 flex flex-col gap-0 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-11 w-11">
              <AvatarFallback className="text-sm bg-primary/10 text-primary font-semibold">
                {getInitials(employee.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <SheetTitle className="flex items-center gap-2">
                {employee.name}
                <span className={cn('h-2 w-2 rounded-full shrink-0', statusCfg.dot)} title={statusCfg.label} />
              </SheetTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className={cn('text-[10px] px-1.5 py-0', roleCfg.color)}>
                  {roleCfg.label}
                </Badge>
                <span className="text-xs text-muted-foreground">{statusCfg.label}</span>
              </div>
            </div>
          </div>
          {/* Contact */}
          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
            {employee.email && (
              <div className="flex items-center gap-1.5">
                <Mail className="h-3 w-3 shrink-0" />
                <span className="truncate">{employee.email}</span>
              </div>
            )}
            {employee.phone && (
              <div className="flex items-center gap-1.5">
                <Phone className="h-3 w-3 shrink-0" />
                <span>{employee.phone}</span>
              </div>
            )}
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          <Separator />

          {/* Aktuelle Rückrufe */}
          <div className="px-6 py-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Aktuelle Rückrufe
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border p-2.5 text-center">
                <p className="text-xl font-bold text-blue-600 tabular-nums">{currentMetrics.open}</p>
                <p className="text-[10px] text-muted-foreground">Offen</p>
              </div>
              <div className="rounded-lg border p-2.5 text-center">
                <p className="text-xl font-bold text-amber-600 tabular-nums">{currentMetrics.inProgress}</p>
                <p className="text-[10px] text-muted-foreground">In Bearbeitung</p>
              </div>
              <div className="rounded-lg border p-2.5 text-center">
                <p className={cn('text-xl font-bold tabular-nums', currentMetrics.overdue > 0 ? 'text-red-600' : 'text-muted-foreground')}>{currentMetrics.overdue}</p>
                <p className="text-[10px] text-muted-foreground">Überfällig</p>
              </div>
              <div className="rounded-lg border p-2.5 text-center">
                <p className="text-xl font-bold text-emerald-600 tabular-nums">{currentMetrics.completed}</p>
                <p className="text-[10px] text-muted-foreground">Erledigt</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Historische Performance */}
          <div className="px-6 py-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Gesamte Performance
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <StatCard
                icon={PhoneCall}
                label="Rückrufe erhalten"
                value={stats.totalReceived}
                color="text-blue-600"
                bgColor="bg-blue-100 dark:bg-blue-900/30"
              />
              <StatCard
                icon={CheckCircle}
                label="Angenommen"
                value={stats.accepted}
                color="text-emerald-600"
                bgColor="bg-emerald-100 dark:bg-emerald-900/30"
              />
              <StatCard
                icon={XCircle}
                label="Nicht angenommen"
                value={stats.declined}
                color="text-red-600"
                bgColor="bg-red-100 dark:bg-red-900/30"
              />
              <StatCard
                icon={ShieldAlert}
                label="Eskaliert"
                value={stats.escalated}
                color="text-orange-600"
                bgColor="bg-orange-100 dark:bg-orange-900/30"
              />
              <StatCard
                icon={AlertTriangle}
                label="Zu spät beantwortet"
                value={stats.lateResponded}
                color="text-amber-600"
                bgColor="bg-amber-100 dark:bg-amber-900/30"
              />
              <StatCard
                icon={Clock}
                label="Ø Reaktionszeit"
                value={stats.avgResponseMin}
                color="text-cyan-600"
                bgColor="bg-cyan-100 dark:bg-cyan-900/30"
                suffix=" min"
              />
            </div>
          </div>

          <Separator />

          {/* Rates */}
          <div className="px-6 py-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Quoten
            </h3>
            <div className="space-y-3">
              {/* Annahmequote */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Annahmequote</span>
                  <span className={cn('font-semibold', acceptRate >= 90 ? 'text-emerald-600' : acceptRate >= 70 ? 'text-amber-600' : 'text-red-600')}>
                    {acceptRate}%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-500',
                      acceptRate >= 90 ? 'bg-emerald-500' : acceptRate >= 70 ? 'bg-amber-500' : 'bg-red-500'
                    )}
                    style={{ width: `${acceptRate}%` }}
                  />
                </div>
              </div>

              {/* SLA-Einhaltung */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">SLA-Einhaltung</span>
                  <span className={cn('font-semibold', slaRate >= 90 ? 'text-emerald-600' : slaRate >= 70 ? 'text-amber-600' : 'text-red-600')}>
                    {slaRate}%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-500',
                      slaRate >= 90 ? 'bg-emerald-500' : slaRate >= 70 ? 'bg-amber-500' : 'bg-red-500'
                    )}
                    style={{ width: `${slaRate}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Recent callbacks list */}
          <div className="px-6 py-4 pb-6">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Letzte Rückrufe ({empCallbacks.length})
            </h3>
            {empCallbacks.length === 0 ? (
              <p className="text-xs text-muted-foreground">Keine Rückrufe zugewiesen</p>
            ) : (
              <div className="space-y-1.5">
                {empCallbacks.slice(0, 10).map(cb => {
                  const statusCfg = callbackStatusConfig[cb.status]
                  const prioCfg = callbackPriorityConfig[cb.priority]
                  return (
                    <div key={cb.id} className="flex items-center gap-2 rounded-md border px-3 py-2">
                      <div className={cn(
                        'h-1.5 w-1.5 rounded-full flex-shrink-0',
                        cb.status === 'ueberfaellig' ? 'bg-red-500' :
                        cb.status === 'erledigt' ? 'bg-emerald-400' :
                        cb.status === 'in_bearbeitung' ? 'bg-amber-400' : 'bg-blue-400'
                      )} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{cb.customerName}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{cb.reason}</p>
                      </div>
                      <Badge variant="secondary" className={cn('text-[8px] px-1 py-0 h-3.5 flex-shrink-0', statusCfg.color)}>
                        {statusCfg.label}
                      </Badge>
                      <Badge variant="secondary" className={cn('text-[8px] px-1 py-0 h-3.5 flex-shrink-0', prioCfg.color)}>
                        {prioCfg.label}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
