'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Bot,
  Phone,
  RefreshCw,
  Clock,
  ChevronDown,
  Check,
  RotateCcw,
  Inbox,
} from 'lucide-react'
import { cn, formatTimeAgo } from '@/lib/utils'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { kiCategoryConfig, kiStatusConfig } from '@/lib/ki-rezeptionist/ki-reception-config'
import type { KiReceptionCallDto, KiReceptionCategory } from '@/lib/ki-rezeptionist/types'

type FilterMode = 'offen' | 'erledigt' | 'alle'

const FILTERS: { value: FilterMode; label: string }[] = [
  { value: 'offen', label: 'Offen' },
  { value: 'erledigt', label: 'Erledigt' },
  { value: 'alle', label: 'Alle' },
]

function formatDuration(sec?: number): string | null {
  if (!sec || sec <= 0) return null
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s.toString().padStart(2, '0')} min`
}

/** Exakter Zeitstempel, sekundengenau: „22.06.2026, 20:36:01". */
function formatExact(iso: string): string {
  return format(new Date(iso), 'dd.MM.yyyy, HH:mm:ss', { locale: de })
}

/** Aktuelle Zeit, aktualisiert jede Sekunde (isolierter Re-Render). */
function useNowTick(): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  return now
}

/** Live hochzählende Wartezeit seit Anrufeingang, eingefärbt nach Anliegen-Zielzeit. */
function WaitingSince({ receivedAt, slaMinutes }: { receivedAt: string; slaMinutes: number }) {
  const now = useNowTick()
  const totalSec = Math.max(0, Math.floor((now - new Date(receivedAt).getTime()) / 1000))
  const d = Math.floor(totalSec / 86400)
  const h = Math.floor((totalSec % 86400) / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60

  const parts: string[] = []
  if (d > 0) parts.push(`${d} Tg.`)
  if (d > 0 || h > 0) parts.push(`${h} Std.`)
  if (d > 0 || h > 0 || m > 0) parts.push(`${m} Min.`)
  parts.push(`${s.toString().padStart(2, '0')} Sek.`)

  const ratio = slaMinutes > 0 ? totalSec / 60 / slaMinutes : 0
  const color =
    ratio >= 1
      ? 'text-red-600 dark:text-red-400'
      : ratio >= 0.5
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-foreground'

  return (
    <span className={cn('tabular-nums font-semibold', color)} title={`Zielzeit: ${slaMinutes} Min.`}>
      {parts.join(' ')}
    </span>
  )
}

export default function KiRezeptionistPageClient() {
  const [calls, setCalls] = useState<KiReceptionCallDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterMode>('offen')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/ki-rezeptionist', { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok || data.available === false) {
        setError(data.error ?? 'Daten konnten nicht geladen werden.')
        setCalls([])
        return
      }
      setCalls(data.calls ?? [])
    } catch {
      setError('Verbindung zum Server fehlgeschlagen.')
      setCalls([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(() => {
    if (filter === 'erledigt') return calls.filter((c) => c.status === 'erledigt')
    if (filter === 'offen') return calls.filter((c) => c.status !== 'erledigt')
    return calls
  }, [calls, filter])

  const kpis = useMemo(() => {
    const today = new Date().toDateString()
    return {
      offen: calls.filter((c) => c.status !== 'erledigt').length,
      heute: calls.filter((c) => new Date(c.receivedAt).toDateString() === today).length,
      erledigt: calls.filter((c) => c.status === 'erledigt').length,
    }
  }, [calls])

  const toggleDone = useCallback(async (id: string, done: boolean) => {
    setBusyId(id)
    try {
      const res = await fetch(`/api/ki-rezeptionist/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          done ? { status: 'erledigt', completedBy: 'Dashboard' } : { status: 'offen' },
        ),
      })
      if (res.ok) {
        const { call } = await res.json()
        setCalls((prev) => prev.map((c) => (c.id === id ? call : c)))
      }
    } finally {
      setBusyId(null)
    }
  }, [])

  return (
    <div className="space-y-4 md:space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 md:gap-2.5">
            <Bot className="h-5 w-5 md:h-[22px] md:w-[22px] text-primary flex-shrink-0" />
            <h1 className="text-xl md:text-[22px] lg:text-2xl font-bold tracking-tight truncate">
              KI-Rezeptionist
            </h1>
          </div>
          <p className="text-sm md:text-[13px] lg:text-sm text-muted-foreground mt-0.5">
            Eingehende Anrufe & Rückruf-Aufträge deiner digitalen Assistenz
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          Aktualisieren
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-2 md:gap-3">
        <KpiCard label="Offen" value={kpis.offen} accent="text-blue-600 dark:text-blue-400" />
        <KpiCard label="Heute eingegangen" value={kpis.heute} accent="text-foreground" />
        <KpiCard label="Erledigt" value={kpis.erledigt} accent="text-emerald-600 dark:text-emerald-400" />
      </div>

      {/* Filter */}
      <div className="inline-flex rounded-lg border border-border/60 bg-card p-0.5">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              'rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors',
              filter === f.value
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* States */}
      {error && (
        <div className="rounded-lg border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300">
          {error}
        </div>
      )}

      {!error && loading && calls.length === 0 && (
        <div className="py-16 text-center text-sm text-muted-foreground">Lädt …</div>
      )}

      {!error && !loading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Inbox className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <p className="font-medium">Noch keine Anrufe</p>
            <p className="text-sm text-muted-foreground">
              Sobald der KI-Rezeptionist einen Anruf entgegennimmt, erscheint hier ein Rückruf-Auftrag.
            </p>
          </div>
        </div>
      )}

      {/* List */}
      {filtered.length > 0 && (
        <div className="space-y-2">
          {filtered.map((call) => (
            <CallRow
              key={call.id}
              call={call}
              expanded={expandedId === call.id}
              busy={busyId === call.id}
              onToggleExpand={() => setExpandedId(expandedId === call.id ? null : call.id)}
              onToggleDone={() => void toggleDone(call.id, call.status !== 'erledigt')}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function KpiCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card px-3 py-3 md:px-4 md:py-4">
      <p className="text-[11px] md:text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className={cn('mt-1 text-2xl md:text-3xl font-bold tabular-nums', accent)}>{value}</p>
    </div>
  )
}

/** Things/Linear-Stil Erledigt-Toggle: leerer Kreis → Hover ✓ → grün erledigt. */
function CompletionToggle({
  done,
  busy,
  onToggle,
}: {
  done: boolean
  busy: boolean
  onToggle: () => void
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          disabled={busy}
          onClick={(e) => {
            e.stopPropagation()
            onToggle()
          }}
          aria-label={done ? 'Als offen markieren' : 'Als erledigt markieren'}
          className={cn(
            'group/cb relative flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border transition-all',
            done
              ? 'border-emerald-500 bg-emerald-500 text-white'
              : 'border-muted-foreground/30 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/40',
            busy && 'opacity-50',
          )}
        >
          <Check
            strokeWidth={3}
            className={cn(
              'h-4 w-4 transition-opacity',
              done
                ? 'opacity-100'
                : 'text-emerald-500 opacity-0 group-hover/cb:opacity-100',
            )}
          />
        </button>
      </TooltipTrigger>
      <TooltipContent className="text-xs">
        {done ? 'Wieder öffnen' : 'Als erledigt markieren'}
      </TooltipContent>
    </Tooltip>
  )
}

function CategoryChip({ category, dimmed }: { category: KiReceptionCategory; dimmed?: boolean }) {
  const cat = kiCategoryConfig[category]
  const Icon = cat.icon
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
        dimmed ? 'bg-muted text-muted-foreground' : cat.color,
      )}
    >
      <Icon className="h-3 w-3" />
      {cat.label}
    </span>
  )
}

function CallRow({
  call,
  expanded,
  busy,
  onToggleExpand,
  onToggleDone,
}: {
  call: KiReceptionCallDto
  expanded: boolean
  busy: boolean
  onToggleExpand: () => void
  onToggleDone: () => void
}) {
  const cat = kiCategoryConfig[call.category]
  const duration = formatDuration(call.callDurationSec)
  const isDone = call.status === 'erledigt'
  const inProgress = call.status === 'in_bearbeitung'

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-border/60 bg-card transition-all',
        isDone ? 'opacity-65' : 'hover:border-border',
      )}
    >
      {/* Row */}
      <div className="flex items-center gap-2.5 px-3 py-2.5 md:gap-3 md:px-4 md:py-3">
        <CompletionToggle done={isDone} busy={busy} onToggle={onToggleDone} />

        {/* Klickbarer Mittelteil → Details aufklappen */}
        <button type="button" onClick={onToggleExpand} className="min-w-0 flex-1 text-left">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span
              className={cn(
                'truncate font-medium',
                isDone && 'text-muted-foreground line-through decoration-muted-foreground/40',
              )}
            >
              {call.customerName}
            </span>
            <CategoryChip category={call.category} dimmed={isDone} />
            {inProgress && (
              <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', kiStatusConfig.in_bearbeitung.color)}>
                In Bearbeitung
              </span>
            )}
          </div>
          <p className="mt-0.5 truncate text-[13px] text-muted-foreground">
            {call.summary || 'Kein Anliegen erkannt'}
          </p>
        </button>

        {/* Rechte Spalten: Wartet-seit · Eingegangen · Aktionen */}
        <div className="flex flex-shrink-0 items-center gap-3 md:gap-5">
          {!isDone && (
            <div className="text-right">
              <p className="hidden whitespace-nowrap text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:block">
                Wartet auf Rückruf seit
              </p>
              <div className="flex items-center justify-end gap-1 text-[13px]">
                <Clock className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
                <WaitingSince receivedAt={call.receivedAt} slaMinutes={cat.slaMinutes} />
              </div>
            </div>
          )}

          <div className="hidden text-right md:block">
            <p className="whitespace-nowrap text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Eingegangen
            </p>
            <p className="whitespace-nowrap text-[13px] tabular-nums text-muted-foreground">
              {formatExact(call.receivedAt)}
            </p>
          </div>

          <div className="flex items-center gap-0.5">
            {call.customerPhone && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <a
                    href={`tel:${call.customerPhone}`}
                    onClick={(e) => e.stopPropagation()}
                    aria-label="Zurückrufen"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-primary transition-colors hover:bg-primary/10"
                  >
                    <Phone className="h-[18px] w-[18px]" />
                  </a>
                </TooltipTrigger>
                <TooltipContent className="text-xs">Zurückrufen</TooltipContent>
              </Tooltip>
            )}

            <button
              type="button"
              onClick={onToggleExpand}
              aria-label={expanded ? 'Zuklappen' : 'Details'}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted"
            >
              <ChevronDown className={cn('h-4 w-4 transition-transform', expanded && 'rotate-180')} />
            </button>
          </div>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="space-y-4 border-t border-border/60 px-3 py-4 md:px-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <DetailItem label="Anliegen" value={cat.label} />
            <DetailItem
              label="Telefon"
              value={
                call.customerPhone ? (
                  <a href={`tel:${call.customerPhone}`} className="text-primary hover:underline">
                    {call.customerPhone}
                  </a>
                ) : (
                  '—'
                )
              }
            />
            <DetailItem label="Eingegangen" value={formatExact(call.receivedAt)} />
            <DetailItem label="Dauer" value={duration ?? '—'} />
            {call.vehicle && <DetailItem label="Fahrzeug" value={call.vehicle} />}
            {call.desiredAppt && <DetailItem label="Wunschtermin" value={call.desiredAppt} />}
          </div>

          {call.recordingUrl && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Aufnahme
              </p>
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <audio controls preload="none" src={call.recordingUrl} className="w-full" />
            </div>
          )}

          {call.transcript && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Transkript
              </p>
              <div className="max-h-64 overflow-y-auto whitespace-pre-wrap rounded-lg bg-muted/40 p-3 text-[13px] leading-relaxed">
                {call.transcript}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {call.customerPhone && (
              <Button asChild variant="outline" size="sm">
                <a href={`tel:${call.customerPhone}`}>
                  <Phone className="h-4 w-4" />
                  Anrufen
                </a>
              </Button>
            )}
            {!isDone ? (
              <Button size="sm" onClick={onToggleDone} disabled={busy}>
                <Check className="h-4 w-4" />
                {busy ? 'Wird gespeichert …' : 'Als erledigt markieren'}
              </Button>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={onToggleDone} disabled={busy}>
                  <RotateCcw className="h-4 w-4" />
                  Wieder öffnen
                </Button>
                {call.completedAt && (
                  <span className="text-xs text-muted-foreground">
                    Erledigt {formatTimeAgo(call.completedAt)}
                    {call.completedBy ? ` · ${call.completedBy}` : ''}
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm">{value}</p>
    </div>
  )
}
