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
  endOfWeek,
  startOfDay,
  startOfMonth,
  endOfMonth,
  addDays,
  addWeeks,
  addMonths,
  format,
  isSameDay,
  isSameMonth,
  isToday,
} from 'date-fns'
import { de } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  KiAppointmentFormDialog,
  type AppointmentPrefill,
} from '@/components/ki-rezeptionist/calendar/ki-appointment-form-dialog'
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

type CalView = 'tag' | 'woche' | 'monat'

const VIEWS: { value: CalView; label: string }[] = [
  { value: 'tag', label: 'Tag' },
  { value: 'woche', label: 'Woche' },
  { value: 'monat', label: 'Monat' },
]

interface Tentative {
  key: string
  /** Quell-Anruf (KiReceptionCallRecord.id) → Konversation im Termin-Modal. */
  callId: string
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

/** Anliegen → vorgeschlagener Service beim Bestätigen eines Wunschtermins. */
const CATEGORY_TO_SERVICE: Record<KiReceptionCategory, string> = {
  neuwagen: 'Beratung Neuwagen',
  gebrauchtwagen: 'Beratung Gebrauchtwagen',
  probefahrt: 'Probefahrt',
  finanzierung_leasing: 'Finanzierungsberatung',
  inzahlungnahme: 'Fahrzeugbewertung / Inzahlungnahme',
  werkstatt_service: 'Inspektion',
  beschwerde: 'Sonstiges',
  sonstiges: 'Sonstiges',
}

/** Ein zu platzierender Block (echter Termin ODER tentativer Wunschtermin). */
interface CalBlock {
  key: string
  kind: 'appt' | 'tentative'
  start: Date
  end: Date
  appt?: KiAppointmentDto
  tentative?: Tentative
}
type Positioned = { lane: number; lanes: number }

/**
 * Weist sich überlappenden Blöcken nebeneinanderliegende Spalten („Lanes") zu,
 * damit nichts mehr verdeckt wird. Cluster = transitiv überlappende Gruppe;
 * `lanes` = max. Parallelität im Cluster, `lane` = Spaltenindex.
 */
function assignLanes<T extends { start: Date; end: Date }>(blocks: T[]): Array<T & Positioned> {
  const sorted = [...blocks].sort(
    (a, b) => a.start.getTime() - b.start.getTime() || a.end.getTime() - b.end.getTime(),
  )
  const result: Array<T & Positioned> = []
  let cluster: Array<T & Positioned> = []
  let clusterEnd = 0
  const columnEnds: number[] = []

  const flush = () => {
    const lanes = columnEnds.length || 1
    for (const b of cluster) b.lanes = lanes
    result.push(...cluster)
    cluster = []
    columnEnds.length = 0
    clusterEnd = 0
  }

  for (const blk of sorted) {
    const s = blk.start.getTime()
    const e = blk.end.getTime()
    if (cluster.length && s >= clusterEnd) flush()
    let lane = columnEnds.findIndex((end) => end <= s)
    if (lane === -1) {
      lane = columnEnds.length
      columnEnds.push(e)
    } else {
      columnEnds[lane] = e
    }
    cluster.push({ ...blk, lane, lanes: 1 } as T & Positioned)
    clusterEnd = Math.max(clusterEnd, e)
  }
  flush()
  return result
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
  const [view, setView] = useState<CalView>('woche')
  const [anchor, setAnchor] = useState<Date>(() => new Date())
  const [appointments, setAppointments] = useState<KiAppointmentDto[]>([])
  const [closures, setClosures] = useState<KiClosureDto[]>([])
  const [calls, setCalls] = useState<KiReceptionCallDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [now, setNow] = useState<Date>(() => new Date())

  const [newApptOpen, setNewApptOpen] = useState(false)
  const [closureOpen, setClosureOpen] = useState(false)
  const [editAppt, setEditAppt] = useState<KiAppointmentDto | null>(null)
  const [prefill, setPrefill] = useState<AppointmentPrefill | null>(null)

  // Auf kleinen Bildschirmen ist die Tagesansicht die sinnvollste Default —
  // das Wochenraster wäre dort nur horizontal scrollbar.
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches) {
      setView('tag')
    }
  }, [])

  const weekStart = useMemo(() => startOfWeek(anchor, { weekStartsOn: 1 }), [anchor])
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart])
  const monthGridStart = useMemo(
    () => startOfWeek(startOfMonth(anchor), { weekStartsOn: 1 }),
    [anchor],
  )
  const monthGridEnd = useMemo(
    () => endOfWeek(endOfMonth(anchor), { weekStartsOn: 1 }),
    [anchor],
  )
  const monthDays = useMemo(() => {
    const out: Date[] = []
    for (let d = monthGridStart; d <= monthGridEnd; d = addDays(d, 1)) out.push(d)
    return out
  }, [monthGridStart, monthGridEnd])

  // Lade-Bereich abhängig von der Ansicht.
  const [rangeStart, rangeEnd] = useMemo<[Date, Date]>(() => {
    if (view === 'tag') return [startOfDay(anchor), addDays(startOfDay(anchor), 1)]
    if (view === 'woche') return [weekStart, addDays(weekStart, 7)]
    return [monthGridStart, addDays(monthGridEnd, 1)]
  }, [view, anchor, weekStart, monthGridStart, monthGridEnd])

  // Jetzt-Linie jede Minute aktualisieren.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  const load = useCallback(async (attempt = 0) => {
    setLoading(true)
    if (attempt === 0) setError(null)
    const from = rangeStart.toISOString()
    const to = rangeEnd.toISOString()
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
  }, [rangeStart, rangeEnd])

  useEffect(() => {
    void load()
  }, [load])

  // Tentative Wunschtermine aus offenen Anrufen (unbestätigt).
  const tentatives = useMemo<Tentative[]>(() => {
    const out: Tentative[] = []
    for (const c of calls) {
      if (c.status === 'erledigt' || !c.desiredAppt) continue
      const parsed = parseDesiredAppt(c.desiredAppt, now)
      if (!parsed) continue
      if (parsed.start < rangeStart || parsed.start >= rangeEnd) continue
      const end = new Date(parsed.start.getTime() + 45 * 60000)
      out.push({
        key: `wunsch-${c.id}`,
        callId: c.id,
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
  }, [calls, now, rangeStart, rangeEnd])

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

  /** Alle Blöcke (Termine + Wunschtermine) eines Tages, einsatzbereit fürs Lane-Layout. */
  const blocksForDay = useCallback(
    (day: Date): CalBlock[] => {
      const appts: CalBlock[] = appointments
        .filter((a) => isSameDay(new Date(a.startTime), day))
        .map((a) => ({
          key: a.id,
          kind: 'appt',
          start: new Date(a.startTime),
          end: new Date(a.endTime),
          appt: a,
        }))
      const tents: CalBlock[] = tentatives
        .filter((t) => isSameDay(t.start, day))
        .map((t) => ({ key: t.key, kind: 'tentative', start: t.start, end: t.end, tentative: t }))
      return [...appts, ...tents]
    },
    [appointments, tentatives],
  )

  function openNewAt(day: Date, hour: number) {
    const start = new Date(day)
    start.setHours(hour, 0, 0, 0)
    setPrefill({ start })
    setEditAppt(null)
    setNewApptOpen(true)
  }

  function openAppt(a: KiAppointmentDto) {
    setEditAppt(a)
    setPrefill(null)
    setNewApptOpen(true)
  }

  function openTentative(t: Tentative) {
    setPrefill({
      start: t.start,
      customerName: t.customerName,
      customerPhone: t.customerPhone,
      service: CATEGORY_TO_SERVICE[t.category],
      notesPublic: t.summary,
      sourceCallId: t.callId,
      call: calls.find((c) => c.id === t.callId) ?? null,
    })
    setEditAppt(null)
    setNewApptOpen(true)
  }

  function navigate(dir: -1 | 1) {
    setAnchor((a) =>
      view === 'tag' ? addDays(a, dir) : view === 'woche' ? addWeeks(a, dir) : addMonths(a, dir),
    )
  }

  const periodLabel =
    view === 'tag'
      ? format(anchor, 'EEEE, d. MMMM yyyy', { locale: de })
      : view === 'woche'
        ? `${format(weekStart, 'd. MMM', { locale: de })} – ${format(addDays(weekStart, 6), 'd. MMM yyyy', { locale: de })}`
        : format(anchor, 'MMMM yyyy', { locale: de })

  // ----- Render-Helfer: eine Tagesspalte (Tag- & Wochenansicht) -----
  const renderDayColumn = (day: Date) => {
    const closure = closuresByDay(day)
    const hours = OPENING_HOURS[day.getDay()]
    const fullyClosed = !hours || Boolean(closure)
    const laidOut = assignLanes(blocksForDay(day))

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

        {/* Blöcke (überlappungsfrei nebeneinander) */}
        {laidOut.map((b) => {
          const geom = blockGeom(b.start, b.end)
          if (!geom) return null
          const widthPct = 100 / b.lanes
          const leftPct = b.lane * widthPct
          const pos = {
            top: geom.top,
            height: geom.height,
            left: `calc(${leftPct}% + 2px)`,
            width: `calc(${widthPct}% - 4px)`,
          } as const

          if (b.kind === 'tentative' && b.tentative) {
            const t = b.tentative
            const short = CATEGORY_SHORT[t.category]
            return (
              <Tooltip key={b.key}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => openTentative(t)}
                    className="absolute z-10 overflow-hidden rounded-md border border-dashed border-violet-400 bg-violet-50/70 px-1.5 py-0.5 text-left text-violet-900 dark:border-violet-700 dark:bg-violet-950/40 dark:text-violet-200"
                    style={pos}
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
                  <p className="mt-0.5 flex items-center gap-1 opacity-80">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    Standort {KI_DEFAULT_LOCATION}
                  </p>
                  {t.summary && <p className="mt-0.5 opacity-80">{t.summary}</p>}
                  <p className="mt-1 opacity-70">
                    Unbestätigter Wunschtermin aus Anruf — klicken zum Anlegen/Bestätigen
                  </p>
                </TooltipContent>
              </Tooltip>
            )
          }

          if (b.appt) {
            const a = b.appt
            const accent = serviceAccent(a.service)
            const confirmed = a.status === 'bestaetigt'
            return (
              <button
                key={b.key}
                type="button"
                onClick={() => openAppt(a)}
                className={cn(
                  'absolute z-10 overflow-hidden rounded-md px-1.5 py-0.5 text-left shadow-sm transition hover:brightness-105',
                  accent.bg,
                  accent.text,
                  !confirmed && 'border border-dashed border-current',
                )}
                style={pos}
              >
                {confirmed ? (
                  <span className={cn('absolute left-0 top-0 h-full w-[3px]', accent.bar)} />
                ) : (
                  <HatchOverlay />
                )}
                <span className="relative block truncate text-[11px] font-semibold tabular-nums">
                  {format(b.start, 'HH:mm')} {a.customerName}
                </span>
                {geom.height > 30 && (
                  <span className="relative block truncate text-[10px] opacity-85">
                    {a.service}
                  </span>
                )}
                {geom.height > 46 && a.staff && (
                  <span className="relative block truncate text-[10px] opacity-70">{a.staff}</span>
                )}
              </button>
            )
          }
          return null
        })}
      </div>
    )
  }

  // ----- Render: Zeitraster (Tag & Woche) -----
  const renderTimeGrid = (gridDays: Date[]) => (
    <div className="overflow-x-auto rounded-xl border border-border/60 bg-card">
      <div className={cn(gridDays.length > 1 && 'min-w-[760px]')}>
        {/* Tag-Köpfe */}
        <div className="flex border-b border-border/60">
          <div className="w-14 flex-shrink-0" />
          {gridDays.map((day) => (
            <div
              key={day.toISOString()}
              className={cn(
                'flex-1 border-l border-border/60 py-2 text-center',
                isToday(day) && 'bg-primary/5',
              )}
            >
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                {format(day, gridDays.length > 1 ? 'EEEEEE' : 'EEEE', { locale: de })}
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
          <div className="w-14 flex-shrink-0">
            {HOURS.map((h) => (
              <div key={h} className="relative" style={{ height: HOUR_PX }}>
                <span className="absolute -top-2 right-1.5 text-[10px] tabular-nums text-muted-foreground">
                  {String(h).padStart(2, '0')}:00
                </span>
              </div>
            ))}
          </div>
          {gridDays.map((day) => renderDayColumn(day))}
        </div>
      </div>
    </div>
  )

  // ----- Render: Monatsraster -----
  const renderMonth = () => (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
      <div className="grid grid-cols-7 border-b border-border/60">
        {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((d) => (
          <div key={d} className="py-2 text-center text-[11px] uppercase tracking-wide text-muted-foreground">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {monthDays.map((day) => {
          const inMonth = isSameMonth(day, anchor)
          const closure = closuresByDay(day)
          const hours = OPENING_HOURS[day.getDay()]
          const closed = !hours || Boolean(closure)
          const items = assignLanes(blocksForDay(day)).sort(
            (a, b) => a.start.getTime() - b.start.getTime(),
          )
          const shown = items.slice(0, 3)
          const moreCount = items.length - shown.length

          return (
            <div
              key={day.toISOString()}
              className={cn(
                'min-h-[88px] border-b border-l border-border/60 p-1 [&:nth-child(7n+1)]:border-l-0',
                !inMonth && 'bg-muted/30',
                closed && inMonth && 'bg-muted/40',
              )}
            >
              <button
                type="button"
                onClick={() => {
                  setAnchor(day)
                  setView('tag')
                }}
                className={cn(
                  'mb-0.5 flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold tabular-nums transition-colors hover:bg-muted',
                  isToday(day) && 'bg-primary text-primary-foreground hover:bg-primary',
                  !inMonth && !isToday(day) && 'text-muted-foreground/60',
                )}
                aria-label={`Tagesansicht ${format(day, 'd. MMMM', { locale: de })}`}
              >
                {format(day, 'd')}
              </button>

              <div className="space-y-0.5">
                {shown.map((b) => {
                  if (b.kind === 'tentative' && b.tentative) {
                    const t = b.tentative
                    return (
                      <button
                        key={b.key}
                        type="button"
                        onClick={() => openTentative(t)}
                        className="flex w-full items-center gap-1 overflow-hidden rounded border border-dashed border-violet-400 bg-violet-50/70 px-1 py-0.5 text-left text-[10px] text-violet-900 dark:border-violet-700 dark:bg-violet-950/40 dark:text-violet-200"
                      >
                        <Sparkles className="h-2.5 w-2.5 flex-shrink-0" />
                        <span className="truncate">
                          {format(t.start, 'HH:mm')} {t.customerName}
                        </span>
                      </button>
                    )
                  }
                  if (b.appt) {
                    const a = b.appt
                    const accent = serviceAccent(a.service)
                    return (
                      <button
                        key={b.key}
                        type="button"
                        onClick={() => openAppt(a)}
                        className={cn(
                          'flex w-full items-center gap-1 overflow-hidden rounded px-1 py-0.5 text-left text-[10px]',
                          accent.bg,
                          accent.text,
                          a.status !== 'bestaetigt' && 'border border-dashed border-current',
                        )}
                      >
                        <span className="truncate tabular-nums">
                          {format(b.start, 'HH:mm')} {a.customerName}
                        </span>
                      </button>
                    )
                  }
                  return null
                })}
                {moreCount > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setAnchor(day)
                      setView('tag')
                    }}
                    className="px-1 text-[10px] font-medium text-muted-foreground hover:text-foreground"
                  >
                    +{moreCount} mehr
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )

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
          {/* Ansicht-Umschalter */}
          <div className="inline-flex flex-shrink-0 rounded-lg border border-border/60 bg-card p-0.5">
            {VIEWS.map((v) => (
              <button
                key={v.value}
                onClick={() => setView(v.value)}
                className={cn(
                  'rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors',
                  view === v.value
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {v.label}
              </button>
            ))}
          </div>

          <div className="inline-flex items-center rounded-lg border border-border/60 bg-card">
            <button
              onClick={() => navigate(-1)}
              aria-label="Zurück"
              className="flex h-8 w-8 items-center justify-center rounded-l-lg text-muted-foreground hover:bg-muted"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setAnchor(new Date())}
              className="h-8 border-x border-border/60 px-3 text-xs font-medium hover:bg-muted"
            >
              Heute
            </button>
            <button
              onClick={() => navigate(1)}
              aria-label="Weiter"
              className="flex h-8 w-8 items-center justify-center rounded-r-lg text-muted-foreground hover:bg-muted"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <span className="hidden text-sm font-medium tabular-nums text-muted-foreground sm:inline">
            {periodLabel}
          </span>
          <span className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-card px-2.5 py-1 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            {KI_DEFAULT_LOCATION}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setPrefill(null)
              setClosureOpen(true)
            }}
          >
            <CalendarOff className="h-4 w-4" />
            Neuer Urlaub
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setPrefill(null)
              setEditAppt(null)
              setNewApptOpen(true)
            }}
          >
            <CalendarPlus className="h-4 w-4" />
            Neuer Termin
          </Button>
        </div>
      </div>

      {/* Zeitraum-Label auf kleinen Screens (unter dem Kopf) */}
      <p className="text-sm font-medium tabular-nums text-muted-foreground sm:hidden">{periodLabel}</p>

      {error && (
        <div className="rounded-lg border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300">
          {error}
        </div>
      )}

      {/* Raster nach Ansicht */}
      {view === 'monat'
        ? renderMonth()
        : renderTimeGrid(view === 'tag' ? [anchor] : weekDays)}

      {loading && <p className="text-center text-xs text-muted-foreground">Lädt …</p>}

      {/* Dialoge */}
      <KiAppointmentFormDialog
        open={newApptOpen}
        onOpenChange={setNewApptOpen}
        appointment={editAppt}
        prefill={prefill}
        onSaved={() => void load()}
        onDeleted={() => void load()}
      />
      <KiClosureFormDialog
        open={closureOpen}
        onOpenChange={setClosureOpen}
        defaultDate={prefill?.start ?? null}
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
