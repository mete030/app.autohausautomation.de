'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ChevronLeft,
  ChevronRight,
  CalendarPlus,
  CalendarOff,
  MapPin,
  ArrowLeft,
  Sparkles,
} from 'lucide-react'
import {
  startOfWeek,
  addDays,
  addWeeks,
  format,
  isSameDay,
  isToday,
} from 'date-fns'
import { de } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { KiAppointmentFormDialog } from '@/components/ki-rezeptionist/calendar/ki-appointment-form-dialog'
import { KiClosureFormDialog } from '@/components/ki-rezeptionist/calendar/ki-closure-form-dialog'
import {
  CALENDAR_START_HOUR,
  CALENDAR_END_HOUR,
  KI_DEFAULT_LOCATION,
  serviceAccent,
} from '@/lib/ki-rezeptionist/calendar-config'
import { OPENING_HOURS } from '@/lib/ki-rezeptionist/opening-hours'
import { parseDesiredAppt } from '@/lib/ki-rezeptionist/desired-appt'
import type { KiAppointmentDto, KiClosureDto } from '@/lib/ki-rezeptionist/appointment-types'
import type { KiReceptionCallDto, KiReceptionCategory } from '@/lib/ki-rezeptionist/types'

const HOUR_PX = 52
const START = CALENDAR_START_HOUR
const END = CALENDAR_END_HOUR
const TOTAL_MIN = (END - START) * 60
const GRID_H = (END - START) * HOUR_PX
const HOURS = Array.from({ length: END - START }, (_, i) => START + i)

interface Tentative {
  key: string
  start: Date
  end: Date
  customerName: string
  customerPhone?: string
  category: KiReceptionCategory
  vehicle?: string
  summary?: string
}

/** Kurzlabel je Anliegen für die kompakten Kalenderblöcke. */
const CATEGORY_SHORT: Record<KiReceptionCategory, string> = {
  neuwagen: 'Neuwagen',
  gebrauchtwagen: 'Gebrauchtwagen',
  probefahrt: 'Probefahrt',
  finanzierung_leasing: 'Finanzierung',
  inzahlungnahme: 'Inzahlungnahme',
  werkstatt_service: 'Werkstatt',
  beschwerde: 'Beschwerde',
  sonstiges: 'Sonstiges',
}

/** Diagonale Schraffur-Auflage für unbestätigte/tentative Blöcke. */
function HatchOverlay() {
  return (
    <span className="pointer-events-none absolute inset-0 [background:repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(120,120,120,0.18)_4px,rgba(120,120,120,0.18)_8px)]" />
  )
}

function minutesFromGridStart(d: Date): number {
  return (d.getHours() - START) * 60 + d.getMinutes()
}

function blockGeom(start: Date, end: Date): { top: number; height: number } | null {
  const sMin = minutesFromGridStart(start)
  const eMin = minutesFromGridStart(end)
  if (eMin <= 0 || sMin >= TOTAL_MIN) return null
  const top = Math.max(0, (sMin / 60) * HOUR_PX)
  const clampedEnd = Math.min(eMin, TOTAL_MIN)
  const height = Math.max(20, ((clampedEnd - Math.max(0, sMin)) / 60) * HOUR_PX)
  return { top, height }
}

export function KiCalendarClient() {
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [appointments, setAppointments] = useState<KiAppointmentDto[]>([])
  const [closures, setClosures] = useState<KiClosureDto[]>([])
  const [calls, setCalls] = useState<KiReceptionCallDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [now, setNow] = useState<Date>(() => new Date())

  const [newApptOpen, setNewApptOpen] = useState(false)
  const [closureOpen, setClosureOpen] = useState(false)
  const [editAppt, setEditAppt] = useState<KiAppointmentDto | null>(null)
  const [defaultStart, setDefaultStart] = useState<Date | null>(null)

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart])
  const weekEnd = useMemo(() => addDays(weekStart, 7), [weekStart])

  // Jetzt-Linie jede Minute aktualisieren.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  const load = useCallback(async (attempt = 0) => {
    setLoading(true)
    if (attempt === 0) setError(null)
    const from = weekStart.toISOString()
    const to = weekEnd.toISOString()
    try {
      const [aRes, cRes, callsRes] = await Promise.all([
        fetch(`/api/ki-rezeptionist/appointments?from=${from}&to=${to}`, { cache: 'no-store' }),
        fetch(`/api/ki-rezeptionist/closures?from=${from}&to=${to}`, { cache: 'no-store' }),
        fetch('/api/ki-rezeptionist', { cache: 'no-store' }),
      ])
      const aData = await aRes.json()
      const cData = await cRes.json()
      const callsData = await callsRes.json()
      if (!aRes.ok || aData.available === false) {
        // Cold-Start-Blip o. Ä. → einmal automatisch erneut versuchen.
        if (attempt < 1) {
          setTimeout(() => void load(attempt + 1), 800)
          return
        }
        setError('Termine konnten gerade nicht geladen werden. Bitte erneut versuchen.')
        setAppointments([])
      } else {
        setError(null)
        setAppointments(aData.appointments ?? [])
      }
      setClosures(cData.closures ?? [])
      setCalls(callsData.calls ?? [])
    } catch {
      if (attempt < 1) {
        setTimeout(() => void load(attempt + 1), 800)
        return
      }
      setError('Verbindung zum Server fehlgeschlagen.')
    } finally {
      setLoading(false)
    }
  }, [weekStart, weekEnd])

  useEffect(() => {
    void load()
  }, [load])

  // Tentative Wunschtermine aus offenen Anrufen (Option C, unbestätigt).
  const tentatives = useMemo<Tentative[]>(() => {
    const out: Tentative[] = []
    for (const c of calls) {
      if (c.status === 'erledigt' || !c.desiredAppt) continue
      const parsed = parseDesiredAppt(c.desiredAppt, now)
      if (!parsed) continue
      if (parsed.start < weekStart || parsed.start >= weekEnd) continue
      const end = new Date(parsed.start.getTime() + 45 * 60000)
      out.push({
        key: `wunsch-${c.id}`,
        start: parsed.start,
        end,
        customerName: c.customerName,
        customerPhone: c.customerPhone || undefined,
        category: c.category,
        vehicle: c.vehicle || undefined,
        summary: c.summary || undefined,
      })
    }
    return out
  }, [calls, now, weekStart, weekEnd])

  const closuresByDay = useCallback(
    (day: Date): KiClosureDto | null => {
      return (
        closures.find((cl) => {
          const s = new Date(cl.startDate)
          const e = new Date(cl.endDate)
          return day >= new Date(s.getFullYear(), s.getMonth(), s.getDate()) && day <= e
        }) ?? null
      )
    },
    [closures],
  )

  function openNewAt(day: Date, hour: number) {
    const start = new Date(day)
    start.setHours(hour, 0, 0, 0)
    setDefaultStart(start)
    setEditAppt(null)
    setNewApptOpen(true)
  }

  const weekLabel = `${format(weekStart, 'd. MMM', { locale: de })} – ${format(addDays(weekStart, 6), 'd. MMM yyyy', { locale: de })}`

  return (
    <div className="space-y-4">
      {/* Kopf */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <Link
            href="/ki-rezeptionist"
            className="mb-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Zurück zur Übersicht
          </Link>
          <h1 className="text-xl font-bold tracking-tight md:text-2xl">Kalender</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center rounded-lg border border-border/60 bg-card">
            <button
              onClick={() => setWeekStart((w) => addWeeks(w, -1))}
              aria-label="Vorige Woche"
              className="flex h-8 w-8 items-center justify-center rounded-l-lg text-muted-foreground hover:bg-muted"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
              className="h-8 border-x border-border/60 px-3 text-xs font-medium hover:bg-muted"
            >
              Heute
            </button>
            <button
              onClick={() => setWeekStart((w) => addWeeks(w, 1))}
              aria-label="Nächste Woche"
              className="flex h-8 w-8 items-center justify-center rounded-r-lg text-muted-foreground hover:bg-muted"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <span className="hidden text-sm font-medium tabular-nums text-muted-foreground sm:inline">
            {weekLabel}
          </span>
          <span className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-card px-2.5 py-1 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            {KI_DEFAULT_LOCATION}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setDefaultStart(null)
              setClosureOpen(true)
            }}
          >
            <CalendarOff className="h-4 w-4" />
            Neuer Urlaub
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setDefaultStart(null)
              setEditAppt(null)
              setNewApptOpen(true)
            }}
          >
            <CalendarPlus className="h-4 w-4" />
            Neuer Termin
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300">
          {error}
        </div>
      )}

      {/* Raster */}
      <div className="overflow-x-auto rounded-xl border border-border/60 bg-card">
        <div className="min-w-[760px]">
          {/* Tag-Köpfe */}
          <div className="flex border-b border-border/60">
            <div className="w-14 flex-shrink-0" />
            {days.map((day) => (
              <div
                key={day.toISOString()}
                className={cn(
                  'flex-1 border-l border-border/60 py-2 text-center',
                  isToday(day) && 'bg-primary/5',
                )}
              >
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  {format(day, 'EEEEEE', { locale: de })}
                </p>
                <p
                  className={cn(
                    'mx-auto mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold tabular-nums',
                    isToday(day) && 'bg-primary text-primary-foreground',
                  )}
                >
                  {format(day, 'd')}
                </p>
              </div>
            ))}
          </div>

          {/* Zeitraster */}
          <div className="flex">
            {/* Zeit-Gutter */}
            <div className="w-14 flex-shrink-0">
              {HOURS.map((h) => (
                <div key={h} className="relative" style={{ height: HOUR_PX }}>
                  <span className="absolute -top-2 right-1.5 text-[10px] tabular-nums text-muted-foreground">
                    {String(h).padStart(2, '0')}:00
                  </span>
                </div>
              ))}
            </div>

            {/* Tagespalten */}
            {days.map((day) => {
              const closure = closuresByDay(day)
              const hours = OPENING_HOURS[day.getDay()]
              const fullyClosed = !hours || Boolean(closure)
              const dayAppts = appointments.filter((a) => isSameDay(new Date(a.startTime), day))
              const dayTentatives = tentatives.filter((t) => isSameDay(t.start, day))

              return (
                <div
                  key={day.toISOString()}
                  className="relative flex-1 border-l border-border/60"
                  style={{ height: GRID_H }}
                >
                  {/* Stundenlinien + Klickflächen */}
                  {HOURS.map((h) => (
                    <button
                      key={h}
                      type="button"
                      disabled={fullyClosed}
                      onClick={() => openNewAt(day, h)}
                      className="absolute left-0 right-0 border-t border-border/40 transition-colors enabled:hover:bg-primary/5 disabled:cursor-default"
                      style={{ top: (h - START) * HOUR_PX, height: HOUR_PX }}
                      aria-label={`Termin am ${format(day, 'EEEE d.M.', { locale: de })} um ${h}:00`}
                    />
                  ))}

                  {/* Außerhalb-Öffnungszeiten-Schraffur */}
                  {!fullyClosed && hours && (
                    <>
                      {hours.open > START * 60 && (
                        <ClosedOverlay top={0} height={((hours.open - START * 60) / 60) * HOUR_PX} />
                      )}
                      {hours.close < END * 60 && (
                        <ClosedOverlay
                          top={((hours.close - START * 60) / 60) * HOUR_PX}
                          height={((END * 60 - hours.close) / 60) * HOUR_PX}
                        />
                      )}
                    </>
                  )}

                  {/* Ganztägig geschlossen */}
                  {fullyClosed && (
                    <div className="absolute inset-0 [background:repeating-linear-gradient(45deg,transparent,transparent_7px,rgba(120,120,120,0.10)_7px,rgba(120,120,120,0.10)_14px)]">
                      <p className="mt-2 text-center text-[11px] font-medium text-muted-foreground">
                        {closure ? closure.name || 'Geschlossen' : 'Geschlossen'}
                      </p>
                    </div>
                  )}

                  {/* Jetzt-Linie */}
                  {isToday(day) &&
                    (() => {
                      const m = minutesFromGridStart(now)
                      if (m < 0 || m > TOTAL_MIN) return null
                      const top = (m / 60) * HOUR_PX
                      return (
                        <div className="pointer-events-none absolute left-0 right-0 z-20" style={{ top }}>
                          <div className="relative h-px bg-red-500">
                            <span className="absolute -left-1 -top-[3px] h-[7px] w-[7px] rounded-full bg-red-500" />
                          </div>
                        </div>
                      )
                    })()}

                  {/* Tentative Wunschtermine */}
                  {dayTentatives.map((t) => {
                    const geom = blockGeom(t.start, t.end)
                    if (!geom) return null
                    const short = CATEGORY_SHORT[t.category]
                    return (
                      <Tooltip key={t.key}>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() => {
                              setDefaultStart(t.start)
                              setEditAppt(null)
                              setNewApptOpen(true)
                            }}
                            className="absolute left-1 right-1 z-10 overflow-hidden rounded-md border border-dashed border-violet-400 bg-violet-50/70 px-1.5 py-0.5 text-left text-violet-900 dark:border-violet-700 dark:bg-violet-950/40 dark:text-violet-200"
                            style={{ top: geom.top, height: geom.height }}
                          >
                            <HatchOverlay />
                            <span className="relative block truncate text-[11px] font-semibold tabular-nums">
                              {format(t.start, 'HH:mm')} {t.customerName}
                            </span>
                            {geom.height > 30 && (
                              <span className="relative flex items-center gap-1 truncate text-[10px] opacity-90">
                                <Sparkles className="h-2.5 w-2.5 flex-shrink-0" />
                                <span className="truncate">
                                  Wunsch · {short}
                                  {t.vehicle ? ` · ${t.vehicle}` : ''}
                                </span>
                              </span>
                            )}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs text-xs">
                          <p className="font-semibold">
                            {t.customerName} · {short}
                            {t.vehicle ? ` · ${t.vehicle}` : ''}
                          </p>
                          {t.summary && <p className="mt-0.5 opacity-80">{t.summary}</p>}
                          <p className="mt-1 opacity-70">
                            Unbestätigter Wunschtermin aus Anruf — klicken zum Anlegen/Bestätigen
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    )
                  })}

                  {/* Termine */}
                  {dayAppts.map((a) => {
                    const start = new Date(a.startTime)
                    const end = new Date(a.endTime)
                    const geom = blockGeom(start, end)
                    if (!geom) return null
                    const accent = serviceAccent(a.service)
                    const confirmed = a.status === 'bestaetigt'
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => {
                          setEditAppt(a)
                          setDefaultStart(null)
                          setNewApptOpen(true)
                        }}
                        className={cn(
                          'absolute left-1 right-1 z-10 overflow-hidden rounded-md px-1.5 py-0.5 text-left shadow-sm transition hover:brightness-105',
                          accent.bg,
                          accent.text,
                          !confirmed && 'border border-dashed border-current',
                        )}
                        style={{ top: geom.top, height: geom.height }}
                      >
                        {confirmed ? (
                          <span className={cn('absolute left-0 top-0 h-full w-[3px]', accent.bar)} />
                        ) : (
                          <HatchOverlay />
                        )}
                        <span className="relative block truncate text-[11px] font-semibold tabular-nums">
                          {format(start, 'HH:mm')} {a.customerName}
                        </span>
                        {geom.height > 30 && (
                          <span className="relative block truncate text-[10px] opacity-85">{a.service}</span>
                        )}
                        {geom.height > 46 && a.staff && (
                          <span className="relative block truncate text-[10px] opacity-70">{a.staff}</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {loading && <p className="text-center text-xs text-muted-foreground">Lädt …</p>}

      {/* Dialoge */}
      <KiAppointmentFormDialog
        open={newApptOpen}
        onOpenChange={setNewApptOpen}
        appointment={editAppt}
        defaultStart={defaultStart}
        onSaved={() => void load()}
        onDeleted={() => void load()}
      />
      <KiClosureFormDialog
        open={closureOpen}
        onOpenChange={setClosureOpen}
        defaultDate={defaultStart}
        onSaved={() => void load()}
      />
    </div>
  )
}

function ClosedOverlay({ top, height }: { top: number; height: number }) {
  return (
    <div
      className="pointer-events-none absolute left-0 right-0 [background:repeating-linear-gradient(45deg,transparent,transparent_6px,rgba(120,120,120,0.07)_6px,rgba(120,120,120,0.07)_12px)]"
      style={{ top, height }}
    />
  )
}
