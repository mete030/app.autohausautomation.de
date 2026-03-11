'use client'

import { useMemo } from 'react'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  PhoneCall,
  Timer,
  ShieldAlert,
  Bell,
  CheckCircle2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCallbackStore } from '@/lib/stores/callback-store'
import {
  callbackStatusConfig,
  callSourceConfig,
  employeeStatusConfig,
  escalationLevelConfig,
} from '@/lib/constants'
import type { Callback, EscalationEvent, EscalationLevel } from '@/lib/types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatRelativeTime(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'gerade eben'
  if (mins < 60) return `vor ${mins} Min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `vor ${hrs} Std`
  return `vor ${Math.floor(hrs / 24)} Tagen`
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

// ---------------------------------------------------------------------------
// SLA Progress Ring
// ---------------------------------------------------------------------------

function SlaProgressRing({
  percentage,
  size = 64,
  strokeWidth = 6,
}: {
  percentage: number
  size?: number
  strokeWidth?: number
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference

  const strokeColor =
    percentage >= 90
      ? 'stroke-emerald-500'
      : percentage >= 70
        ? 'stroke-amber-500'
        : 'stroke-red-500'

  const textColor =
    percentage >= 90
      ? 'text-emerald-600 dark:text-emerald-400'
      : percentage >= 70
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-red-600 dark:text-red-400'

  return (
    <svg
      width={size}
      height={size}
      className="flex-shrink-0"
      viewBox={`0 0 ${size} ${size}`}
    >
      {/* Background track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        strokeWidth={strokeWidth}
        className="stroke-muted"
      />
      {/* Progress arc */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        className={cn('transition-all duration-500', strokeColor)}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      {/* Percentage text */}
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        className={cn('text-sm font-bold fill-current', textColor)}
      >
        {percentage}%
      </text>
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Escalation dot color helper
// ---------------------------------------------------------------------------

function escalationDotColor(level: EscalationLevel): string {
  if (level === 1) return 'bg-blue-500'
  if (level === 2) return 'bg-amber-500'
  return 'bg-red-500'
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function CallcenterAdminDashboard() {
  const { callbacks, employees, reminders } = useCallbackStore()

  // ---- Computed data ----

  const openCallbacks = useMemo(
    () => callbacks.filter((cb) => cb.status !== 'erledigt'),
    [callbacks],
  )

  const dringendCount = useMemo(
    () => openCallbacks.filter((cb) => cb.priority === 'dringend').length,
    [openCallbacks],
  )

  // SLA compliance
  const slaPercentage = useMemo(() => {
    const completed = callbacks.filter((cb) => cb.status === 'erledigt')
    if (completed.length === 0) return 100
    const withinSla = completed.filter((cb) => {
      if (!cb.completedAt) return true
      return (
        new Date(cb.completedAt).getTime() <=
        new Date(cb.slaDeadline).getTime()
      )
    }).length
    return Math.round((withinSla / completed.length) * 100)
  }, [callbacks])

  // Average processing time in minutes
  const avgProcessingTime = useMemo(() => {
    const completed = callbacks.filter(
      (cb) => cb.status === 'erledigt' && cb.completedAt,
    )
    if (completed.length === 0) return 0
    const totalMs = completed.reduce((sum, cb) => {
      const created = new Date(cb.createdAt).getTime()
      const done = new Date(cb.completedAt!).getTime()
      return sum + (done - created)
    }, 0)
    return Math.round(totalMs / completed.length / 60000)
  }, [callbacks])

  // Escalations today
  const escalationsToday = useMemo(() => {
    const today = new Date()
    return callbacks.reduce((count, cb) => {
      return (
        count +
        cb.escalationHistory.filter((e) =>
          isSameDay(new Date(e.escalatedAt), today),
        ).length
      )
    }, 0)
  }, [callbacks])

  // All escalation events (sorted desc), take 5
  const recentEscalations = useMemo(() => {
    const allEvents: (EscalationEvent & { customerName: string; assignedAdvisor: string })[] = []
    for (const cb of callbacks) {
      for (const event of cb.escalationHistory) {
        allEvents.push({ ...event, customerName: cb.customerName, assignedAdvisor: cb.assignedAdvisor })
      }
    }
    allEvents.sort(
      (a, b) =>
        new Date(b.escalatedAt).getTime() - new Date(a.escalatedAt).getTime(),
    )
    return allEvents.slice(0, 5)
  }, [callbacks])

  // Employee table metrics
  const employeeRows = useMemo(() => {
    return employees.map((emp) => {
      const empCbs = callbacks.filter(
        (cb) => cb.assignedEmployeeId === emp.id,
      )
      const offen = empCbs.filter((cb) => cb.status === 'offen').length
      const ueberfaellig = empCbs.filter(
        (cb) => cb.status === 'ueberfaellig',
      ).length
      const inBearbeitung = empCbs.filter(
        (cb) => cb.status === 'in_bearbeitung',
      ).length
      const erledigt = empCbs.filter((cb) => cb.status === 'erledigt').length
      return { employee: emp, offen, ueberfaellig, inBearbeitung, erledigt }
    })
  }, [employees, callbacks])

  const totals = useMemo(() => {
    return employeeRows.reduce(
      (acc, row) => ({
        offen: acc.offen + row.offen,
        ueberfaellig: acc.ueberfaellig + row.ueberfaellig,
        inBearbeitung: acc.inBearbeitung + row.inBearbeitung,
        erledigt: acc.erledigt + row.erledigt,
      }),
      { offen: 0, ueberfaellig: 0, inBearbeitung: 0, erledigt: 0 },
    )
  }, [employeeRows])

  // Source distribution
  const sourceData = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const cb of callbacks) {
      counts[cb.source] = (counts[cb.source] || 0) + 1
    }
    const maxCount = Math.max(...Object.values(counts), 1)
    return Object.entries(callSourceConfig).map(([key, cfg]) => ({
      key,
      label: cfg.label,
      color: cfg.color,
      count: counts[key] || 0,
      pct: ((counts[key] || 0) / maxCount) * 100,
    }))
  }, [callbacks])

  // SLA violations
  const slaViolations = useMemo(() => {
    const violations: {
      cb: Callback
      overMinutes: number
    }[] = []
    for (const cb of callbacks) {
      if (cb.status === 'ueberfaellig') {
        const overMs =
          Date.now() - new Date(cb.slaDeadline).getTime()
        violations.push({ cb, overMinutes: Math.round(overMs / 60000) })
      } else if (
        cb.status === 'erledigt' &&
        cb.completedAt &&
        new Date(cb.completedAt).getTime() >
          new Date(cb.slaDeadline).getTime()
      ) {
        const overMs =
          new Date(cb.completedAt).getTime() -
          new Date(cb.slaDeadline).getTime()
        violations.push({ cb, overMinutes: Math.round(overMs / 60000) })
      }
    }
    violations.sort((a, b) => b.overMinutes - a.overMinutes)
    return violations.slice(0, 5)
  }, [callbacks])

  // Active reminders
  const activeReminders = useMemo(() => {
    return reminders.filter((r) => r.status === 'ausstehend')
  }, [reminders])

  // ---- Render ----

  return (
    <div className="space-y-4">
      {/* ================================================================ */}
      {/* 1. Hero KPI Strip                                                */}
      {/* ================================================================ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Offene Rueckrufe */}
        <Card className="py-0 gap-0">
          <div className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950/40">
              <PhoneCall className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-3xl font-bold tabular-nums leading-none">
                {openCallbacks.length}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Offene Rückrufe
              </p>
              {dringendCount > 0 && (
                <p className="text-[11px] text-red-600 dark:text-red-400 mt-0.5">
                  {dringendCount} dringend
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* SLA-Einhaltung */}
        <Card className="py-0 gap-0">
          <div className="flex items-center gap-4 p-5">
            <SlaProgressRing percentage={slaPercentage} />
            <div>
              <p className="text-xs text-muted-foreground">SLA-Einhaltung</p>
              <p
                className={cn(
                  'text-sm font-medium mt-0.5',
                  slaPercentage >= 90
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : slaPercentage >= 70
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-red-600 dark:text-red-400',
                )}
              >
                {slaPercentage >= 90
                  ? 'Sehr gut'
                  : slaPercentage >= 70
                    ? 'Verbesserbar'
                    : 'Kritisch'}
              </p>
            </div>
          </div>
        </Card>

        {/* Ø Bearbeitungszeit */}
        <Card className="py-0 gap-0">
          <div className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/40">
              <Timer className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-3xl font-bold tabular-nums leading-none">
                {avgProcessingTime}
                <span className="text-sm font-normal text-muted-foreground ml-1">
                  Min
                </span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Ø Bearbeitungszeit
              </p>
            </div>
          </div>
        </Card>

        {/* Eskalationen heute */}
        <Card className="py-0 gap-0">
          <div className="flex items-center gap-4 p-5">
            <div
              className={cn(
                'flex h-11 w-11 items-center justify-center rounded-full',
                escalationsToday > 0
                  ? 'bg-red-100 dark:bg-red-950/40'
                  : 'bg-gray-100 dark:bg-gray-800/40',
              )}
            >
              <ShieldAlert
                className={cn(
                  'h-5 w-5',
                  escalationsToday > 0
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-gray-400 dark:text-gray-500',
                )}
              />
            </div>
            <div>
              <p
                className={cn(
                  'text-3xl font-bold tabular-nums leading-none',
                  escalationsToday > 0 && 'text-red-600 dark:text-red-400',
                )}
              >
                {escalationsToday}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Eskalationen heute
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* ================================================================ */}
      {/* 2. Two-column layout                                             */}
      {/* ================================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* -------------------------------------------------------------- */}
        {/* Left Column (3/5)                                               */}
        {/* -------------------------------------------------------------- */}
        <div className="lg:col-span-3 space-y-4">
          {/* a) Aktuelle Lage */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Aktuelle Lage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-muted-foreground border-b">
                      <th className="text-left py-2 pr-2 font-medium">
                        Mitarbeiter
                      </th>
                      <th className="text-center py-2 px-2 font-medium">
                        Offen
                      </th>
                      <th className="text-center py-2 px-2 font-medium">
                        Überfällig
                      </th>
                      <th className="text-center py-2 px-2 font-medium">
                        In Bearbeit.
                      </th>
                      <th className="text-center py-2 pl-2 font-medium">
                        Erledigt
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {employeeRows.map((row) => {
                      const statusCfg =
                        employeeStatusConfig[row.employee.status]
                      return (
                        <tr
                          key={row.employee.id}
                          className={cn(
                            'border-b last:border-b-0',
                            row.ueberfaellig > 0 &&
                              'border-l-2 border-l-red-400',
                          )}
                        >
                          <td className="py-2 pr-2">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-7 w-7 flex-shrink-0">
                                <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-semibold">
                                  {getInitials(row.employee.name)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium truncate">
                                {row.employee.name}
                              </span>
                              <span
                                className={cn(
                                  'h-2 w-2 rounded-full flex-shrink-0',
                                  statusCfg.dot,
                                )}
                                title={statusCfg.label}
                              />
                            </div>
                          </td>
                          <td className="text-center py-2 px-2 tabular-nums">
                            {row.offen}
                          </td>
                          <td
                            className={cn(
                              'text-center py-2 px-2 tabular-nums',
                              row.ueberfaellig > 0 &&
                                'text-red-600 dark:text-red-400 font-semibold',
                            )}
                          >
                            {row.ueberfaellig}
                          </td>
                          <td className="text-center py-2 px-2 tabular-nums">
                            {row.inBearbeitung}
                          </td>
                          <td className="text-center py-2 pl-2 tabular-nums">
                            {row.erledigt}
                          </td>
                        </tr>
                      )
                    })}
                    {/* Gesamt row */}
                    <tr className="bg-muted/40 font-semibold text-xs">
                      <td className="py-2 pr-2">Gesamt</td>
                      <td className="text-center py-2 px-2 tabular-nums">
                        {totals.offen}
                      </td>
                      <td
                        className={cn(
                          'text-center py-2 px-2 tabular-nums',
                          totals.ueberfaellig > 0 &&
                            'text-red-600 dark:text-red-400',
                        )}
                      >
                        {totals.ueberfaellig}
                      </td>
                      <td className="text-center py-2 px-2 tabular-nums">
                        {totals.inBearbeitung}
                      </td>
                      <td className="text-center py-2 pl-2 tabular-nums">
                        {totals.erledigt}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* b) Eskalations-Feed */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Eskalations-Feed</CardTitle>
            </CardHeader>
            <CardContent>
              {recentEscalations.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Keine Eskalationen
                </p>
              ) : (
                <ScrollArea className="max-h-[320px]">
                  <div className="space-y-3">
                    {recentEscalations.map((event) => {
                      const dotColor = escalationDotColor(event.toLevel)
                      return (
                        <div key={event.id} className="flex gap-3">
                          {/* Colored dot */}
                          <div className="flex flex-col items-center pt-1.5">
                            <span
                              className={cn(
                                'h-2.5 w-2.5 rounded-full flex-shrink-0',
                                dotColor,
                              )}
                            />
                            <div className="w-px flex-1 bg-border mt-1" />
                          </div>
                          {/* Content */}
                          <div className="pb-3 min-w-0">
                            <p className="text-sm font-semibold leading-snug">
                              {event.escalatedTo}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Rückruf von {event.customerName}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              von{' '}
                              <Badge
                                variant="secondary"
                                className={cn(
                                  'text-[10px] px-1.5 py-0',
                                  escalationLevelConfig[event.fromLevel].bg,
                                  escalationLevelConfig[event.fromLevel].color,
                                )}
                              >
                                Stufe {event.fromLevel}
                              </Badge>
                              {' → '}
                              <Badge
                                variant="secondary"
                                className={cn(
                                  'text-[10px] px-1.5 py-0',
                                  escalationLevelConfig[event.toLevel].bg,
                                  escalationLevelConfig[event.toLevel].color,
                                )}
                              >
                                Stufe {event.toLevel}
                              </Badge>
                              {' '}
                              durch {event.escalatedBy}
                            </p>
                            <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                              {formatRelativeTime(event.escalatedAt)}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>

        {/* -------------------------------------------------------------- */}
        {/* Right Column (2/5)                                              */}
        {/* -------------------------------------------------------------- */}
        <div className="lg:col-span-2 space-y-4">
          {/* a) Leistung nach Quelle */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Leistung nach Quelle</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sourceData.map((src) => (
                  <div key={src.key} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{src.label}</span>
                      <span className="font-medium tabular-nums">
                        {src.count}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-500',
                          src.color.split(' ')[0],
                        )}
                        style={{ width: `${src.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* b) SLA-Verletzungen */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">SLA-Verletzungen</CardTitle>
            </CardHeader>
            <CardContent>
              {slaViolations.length === 0 ? (
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Keine Verletzungen
                  </span>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {slaViolations.map(({ cb, overMinutes }) => (
                    <div
                      key={cb.id}
                      className="flex items-start justify-between gap-2 text-sm"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold truncate">
                          {cb.assignedAdvisor}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          Rückruf von {cb.customerName}
                        </p>
                      </div>
                      <Badge
                        variant="secondary"
                        className="flex-shrink-0 bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400"
                      >
                        +{overMinutes} Min
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* c) Aktive Erinnerungen */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Aktive Erinnerungen</CardTitle>
            </CardHeader>
            <CardContent>
              {activeReminders.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Keine aktiven Erinnerungen
                </p>
              ) : (
                <ScrollArea className="max-h-[240px]">
                  <div className="space-y-3">
                    {activeReminders.map((reminder) => {
                      const linkedCallback = callbacks.find(
                        (cb) => cb.id === reminder.callbackId,
                      )
                      return (
                        <div key={reminder.id} className="flex gap-2.5">
                          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-100 dark:bg-amber-950/30 flex-shrink-0 mt-0.5">
                            <Bell className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                          </div>
                          <div className="min-w-0">
                            {linkedCallback && (
                              <p className="text-sm font-medium truncate">
                                {linkedCallback.customerName}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {reminder.message}
                            </p>
                            <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                              {new Date(reminder.reminderAt).toLocaleString(
                                'de-DE',
                                {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                },
                              )}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
