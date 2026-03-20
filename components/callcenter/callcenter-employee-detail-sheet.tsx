'use client'

import { useMemo } from 'react'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  PhoneCall, CheckCircle, XCircle, Clock, ShieldAlert, AlertTriangle,
  Mail, Phone, PhoneIncoming, PhoneOutgoing, Bell,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCallbackStore } from '@/lib/stores/callback-store'
import { employeeRoleConfig, employeeStatusConfig, callbackPriorityConfig, callbackStatusConfig } from '@/lib/constants'
import type { Employee } from '@/lib/types'

interface EmployeeDetailSheetProps {
  open: boolean
  employee: Employee | null
  onOpenChange: (open: boolean) => void
}

const beraterStats: Record<string, { totalReceived: number; accepted: number; declined: number; escalated: number; lateResponded: number; avgResponseMin: number }> = {
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
}

const ccAgentStats: Record<string, { callsReceived: number; callbacksCreated: number; callbacksAccepted: number; remindersSent: number; escalations: number; avgHandlingMin: number; topAdvisors: { name: string; count: number }[] }> = {
  'emp-msc': { callsReceived: 312, callbacksCreated: 156, callbacksAccepted: 148, remindersSent: 34, escalations: 6, avgHandlingMin: 3, topAdvisors: [{ name: 'Alexander Eckhardt', count: 42 }, { name: 'Gabriel Otlik', count: 38 }, { name: 'Alexander Dittus', count: 31 }] },
  'emp-jsc': { callsReceived: 278, callbacksCreated: 134, callbacksAccepted: 128, remindersSent: 28, escalations: 5, avgHandlingMin: 4, topAdvisors: [{ name: 'Cedric Bauerdick', count: 45 }, { name: 'Alexander Eckhardt', count: 35 }, { name: 'Alexander Seez', count: 22 }] },
  'emp-jhz': { callsReceived: 241, callbacksCreated: 112, callbacksAccepted: 107, remindersSent: 22, escalations: 4, avgHandlingMin: 5, topAdvisors: [{ name: 'Gabriel Otlik', count: 38 }, { name: 'Daniel Bühler', count: 30 }, { name: 'Sebastian Erhard', count: 18 }] },
  'emp-jom': { callsReceived: 198, callbacksCreated: 98, callbacksAccepted: 94, remindersSent: 19, escalations: 3, avgHandlingMin: 3, topAdvisors: [{ name: 'Alexander Dittus', count: 32 }, { name: 'Alexander Eckhardt', count: 28 }, { name: 'Cedric Bauerdick', count: 20 }] },
  'emp-dpi': { callsReceived: 187, callbacksCreated: 89, callbacksAccepted: 85, remindersSent: 16, escalations: 2, avgHandlingMin: 4, topAdvisors: [{ name: 'Alexander Seez', count: 29 }, { name: 'Gabriel Otlik', count: 25 }, { name: 'Daniel Bühler', count: 16 }] },
}

const defaultBeraterStats = { totalReceived: 0, accepted: 0, declined: 0, escalated: 0, lateResponded: 0, avgResponseMin: 0 }
const defaultCcStats = { callsReceived: 0, callbacksCreated: 0, callbacksAccepted: 0, remindersSent: 0, escalations: 0, avgHandlingMin: 0, topAdvisors: [] as { name: string; count: number }[] }

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function StatCard({ icon: Icon, label, value, color, bgColor, suffix }: {
  icon: typeof PhoneCall; label: string; value: number; color: string; bgColor: string; suffix?: string
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
  const isCC = employee?.role === 'callcenter_agent'

  const assignedCallbacks = useMemo(() => {
    if (!employee) return []
    return callbacks.filter(cb => cb.assignedAdvisor === employee.name)
  }, [callbacks, employee])

  const createdCallbacks = useMemo(() => {
    if (!employee) return []
    return callbacks.filter(cb => cb.takenBy.name === employee.name)
  }, [callbacks, employee])

  const relevantCallbacks = isCC ? createdCallbacks : assignedCallbacks

  const currentMetrics = useMemo(() => {
    const cbs = relevantCallbacks
    return {
      open: cbs.filter(cb => cb.status === 'offen').length,
      inProgress: cbs.filter(cb => cb.status === 'in_bearbeitung').length,
      overdue: cbs.filter(cb => cb.status === 'ueberfaellig').length,
      completed: cbs.filter(cb => cb.status === 'erledigt').length,
      total: cbs.length,
    }
  }, [relevantCallbacks])

  if (!employee) return null

  const roleCfg = employeeRoleConfig[employee.role]
  const statusCfg = employeeStatusConfig[employee.status]

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[480px] p-0 flex flex-col gap-0 overflow-hidden">
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-11 w-11">
              <AvatarFallback className="text-sm bg-primary/10 text-primary font-semibold">{getInitials(employee.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <SheetTitle className="flex items-center gap-2">
                {employee.name}
                <span className={cn('h-2 w-2 rounded-full shrink-0', statusCfg.dot)} title={statusCfg.label} />
              </SheetTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className={cn('text-[10px] px-1.5 py-0', roleCfg.color)}>{roleCfg.label}</Badge>
                <span className="text-xs text-muted-foreground">{statusCfg.label}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
            {employee.email && <div className="flex items-center gap-1.5"><Mail className="h-3 w-3 shrink-0" /><span className="truncate">{employee.email}</span></div>}
            {employee.phone && <div className="flex items-center gap-1.5"><Phone className="h-3 w-3 shrink-0" /><span>{employee.phone}</span></div>}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <Separator />

          {isCC ? (
            <>
              {/* CC Agent: current activity */}
              <div className="px-6 py-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Aktuelle Aktivität</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg border p-2.5 text-center">
                    <p className="text-xl font-bold text-blue-600 tabular-nums">{currentMetrics.total}</p>
                    <p className="text-[10px] text-muted-foreground">Erstellt (gesamt)</p>
                  </div>
                  <div className="rounded-lg border p-2.5 text-center">
                    <p className="text-xl font-bold text-emerald-600 tabular-nums">{currentMetrics.completed}</p>
                    <p className="text-[10px] text-muted-foreground">Davon erledigt</p>
                  </div>
                  <div className="rounded-lg border p-2.5 text-center">
                    <p className={cn('text-xl font-bold tabular-nums', currentMetrics.overdue > 0 ? 'text-red-600' : 'text-muted-foreground')}>{currentMetrics.overdue}</p>
                    <p className="text-[10px] text-muted-foreground">Überfällig</p>
                  </div>
                  <div className="rounded-lg border p-2.5 text-center">
                    <p className="text-xl font-bold text-amber-600 tabular-nums">{currentMetrics.open + currentMetrics.inProgress}</p>
                    <p className="text-[10px] text-muted-foreground">Noch offen</p>
                  </div>
                </div>
              </div>
              <Separator />

              {/* CC Agent: Performance */}
              {(() => {
                const s = ccAgentStats[employee.id] ?? defaultCcStats
                const rate = s.callbacksCreated > 0 ? Math.round((s.callbacksAccepted / s.callbacksCreated) * 100) : 100
                return (
                  <>
                    <div className="px-6 py-4">
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Gesamte Performance</h3>
                      <div className="grid grid-cols-2 gap-2">
                        <StatCard icon={PhoneIncoming} label="Anrufe entgegengenommen" value={s.callsReceived} color="text-blue-600" bgColor="bg-blue-100 dark:bg-blue-900/30" />
                        <StatCard icon={PhoneOutgoing} label="Rückrufe erstellt" value={s.callbacksCreated} color="text-indigo-600" bgColor="bg-indigo-100 dark:bg-indigo-900/30" />
                        <StatCard icon={CheckCircle} label="Davon angenommen" value={s.callbacksAccepted} color="text-emerald-600" bgColor="bg-emerald-100 dark:bg-emerald-900/30" />
                        <StatCard icon={Bell} label="Erinnerungen gesendet" value={s.remindersSent} color="text-amber-600" bgColor="bg-amber-100 dark:bg-amber-900/30" />
                        <StatCard icon={ShieldAlert} label="Eskalationen" value={s.escalations} color="text-orange-600" bgColor="bg-orange-100 dark:bg-orange-900/30" />
                        <StatCard icon={Clock} label="Ø Bearbeitungszeit" value={s.avgHandlingMin} color="text-cyan-600" bgColor="bg-cyan-100 dark:bg-cyan-900/30" suffix=" min" />
                      </div>
                    </div>
                    <Separator />

                    <div className="px-6 py-4">
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Annahmequote</h3>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Erstellte Rückrufe → angenommen</span>
                        <span className={cn('font-semibold', rate >= 90 ? 'text-emerald-600' : rate >= 70 ? 'text-amber-600' : 'text-red-600')}>{rate}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div className={cn('h-full rounded-full', rate >= 90 ? 'bg-emerald-500' : rate >= 70 ? 'bg-amber-500' : 'bg-red-500')} style={{ width: `${rate}%` }} />
                      </div>
                    </div>
                    <Separator />

                    {s.topAdvisors.length > 0 && (
                      <>
                        <div className="px-6 py-4">
                          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Häufigste Zuweisung an</h3>
                          <div className="space-y-2">
                            {s.topAdvisors.map((adv, i) => (
                              <div key={adv.name} className="flex items-center gap-3">
                                <span className="text-xs text-muted-foreground w-4 text-right font-mono">{i + 1}.</span>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium truncate">{adv.name}</span>
                                    <span className="text-xs text-muted-foreground tabular-nums">{adv.count}</span>
                                  </div>
                                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden mt-1">
                                    <div className="h-full rounded-full bg-blue-400" style={{ width: `${(adv.count / s.topAdvisors[0].count) * 100}%` }} />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <Separator />
                      </>
                    )}
                  </>
                )
              })()}
            </>
          ) : (
            <>
              {/* Berater/Verkäufer: current callbacks */}
              <div className="px-6 py-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Aktuelle Rückrufe</h3>
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

              {(() => {
                const s = beraterStats[employee.id] ?? defaultBeraterStats
                const aRate = s.totalReceived > 0 ? Math.round((s.accepted / s.totalReceived) * 100) : 100
                const sRate = s.totalReceived > 0 ? Math.round(((s.totalReceived - s.lateResponded) / s.totalReceived) * 100) : 100
                return (
                  <>
                    <div className="px-6 py-4">
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Gesamte Performance</h3>
                      <div className="grid grid-cols-2 gap-2">
                        <StatCard icon={PhoneCall} label="Rückrufe erhalten" value={s.totalReceived} color="text-blue-600" bgColor="bg-blue-100 dark:bg-blue-900/30" />
                        <StatCard icon={CheckCircle} label="Angenommen" value={s.accepted} color="text-emerald-600" bgColor="bg-emerald-100 dark:bg-emerald-900/30" />
                        <StatCard icon={XCircle} label="Nicht angenommen" value={s.declined} color="text-red-600" bgColor="bg-red-100 dark:bg-red-900/30" />
                        <StatCard icon={ShieldAlert} label="Eskaliert" value={s.escalated} color="text-orange-600" bgColor="bg-orange-100 dark:bg-orange-900/30" />
                        <StatCard icon={AlertTriangle} label="Zu spät beantwortet" value={s.lateResponded} color="text-amber-600" bgColor="bg-amber-100 dark:bg-amber-900/30" />
                        <StatCard icon={Clock} label="Ø Reaktionszeit" value={s.avgResponseMin} color="text-cyan-600" bgColor="bg-cyan-100 dark:bg-cyan-900/30" suffix=" min" />
                      </div>
                    </div>
                    <Separator />
                    <div className="px-6 py-4">
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Quoten</h3>
                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Annahmequote</span>
                            <span className={cn('font-semibold', aRate >= 90 ? 'text-emerald-600' : aRate >= 70 ? 'text-amber-600' : 'text-red-600')}>{aRate}%</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                            <div className={cn('h-full rounded-full', aRate >= 90 ? 'bg-emerald-500' : aRate >= 70 ? 'bg-amber-500' : 'bg-red-500')} style={{ width: `${aRate}%` }} />
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground">SLA-Einhaltung</span>
                            <span className={cn('font-semibold', sRate >= 90 ? 'text-emerald-600' : sRate >= 70 ? 'text-amber-600' : 'text-red-600')}>{sRate}%</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                            <div className={cn('h-full rounded-full', sRate >= 90 ? 'bg-emerald-500' : sRate >= 70 ? 'bg-amber-500' : 'bg-red-500')} style={{ width: `${sRate}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )
              })()}
              <Separator />
            </>
          )}

          {/* Recent callbacks */}
          <div className="px-6 py-4 pb-6">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              {isCC ? `Erstellte Rückrufe (${relevantCallbacks.length})` : `Letzte Rückrufe (${relevantCallbacks.length})`}
            </h3>
            {relevantCallbacks.length === 0 ? (
              <p className="text-xs text-muted-foreground">{isCC ? 'Keine Rückrufe erstellt' : 'Keine Rückrufe zugewiesen'}</p>
            ) : (
              <div className="space-y-1.5">
                {relevantCallbacks.slice(0, 10).map(cb => {
                  const sCfg = callbackStatusConfig[cb.status]
                  const pCfg = callbackPriorityConfig[cb.priority]
                  return (
                    <div key={cb.id} className="flex items-center gap-2 rounded-md border px-3 py-2">
                      <div className={cn('h-1.5 w-1.5 rounded-full flex-shrink-0',
                        cb.status === 'ueberfaellig' ? 'bg-red-500' : cb.status === 'erledigt' ? 'bg-emerald-400' : cb.status === 'in_bearbeitung' ? 'bg-amber-400' : 'bg-blue-400'
                      )} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{cb.customerName}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{isCC ? `→ ${cb.assignedAdvisor}` : cb.reason}</p>
                      </div>
                      <Badge variant="secondary" className={cn('text-[8px] px-1 py-0 h-3.5 flex-shrink-0', sCfg.color)}>{sCfg.label}</Badge>
                      <Badge variant="secondary" className={cn('text-[8px] px-1 py-0 h-3.5 flex-shrink-0', pCfg.color)}>{pCfg.label}</Badge>
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
