'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Bot,
  Phone,
  RefreshCw,
  Clock,
  ChevronDown,
  Check,
  Inbox,
  Car as CarIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatTimeAgo, formatDateTime } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  kiCategoryConfig,
  kiStatusConfig,
} from '@/lib/ki-rezeptionist/ki-reception-config'
import type { KiReceptionCallDto } from '@/lib/ki-rezeptionist/types'

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

  const markDone = useCallback(
    async (id: string) => {
      setBusyId(id)
      try {
        const res = await fetch(`/api/ki-rezeptionist/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'erledigt', completedBy: 'Dashboard' }),
        })
        if (res.ok) {
          const { call } = await res.json()
          setCalls((prev) => prev.map((c) => (c.id === id ? call : c)))
        }
      } finally {
        setBusyId(null)
      }
    },
    [],
  )

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
              onToggle={() => setExpandedId(expandedId === call.id ? null : call.id)}
              onMarkDone={() => void markDone(call.id)}
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

function CallRow({
  call,
  expanded,
  busy,
  onToggle,
  onMarkDone,
}: {
  call: KiReceptionCallDto
  expanded: boolean
  busy: boolean
  onToggle: () => void
  onMarkDone: () => void
}) {
  const cat = kiCategoryConfig[call.category]
  const status = kiStatusConfig[call.status]
  const CatIcon = cat.icon ?? CarIcon
  const duration = formatDuration(call.callDurationSec)
  const isDone = call.status === 'erledigt'

  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
      {/* Row header */}
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-muted/40 md:px-4"
      >
        <span
          className={cn('flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg', cat.color)}
        >
          <CatIcon className="h-[18px] w-[18px]" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium">{call.customerName}</span>
            <Badge variant="secondary" className={cn('hidden sm:inline-flex', cat.color)}>
              {cat.label}
            </Badge>
          </div>
          <p className="truncate text-[13px] text-muted-foreground">
            {call.summary || 'Keine Zusammenfassung'}
          </p>
        </div>

        <div className="hidden flex-shrink-0 flex-col items-end gap-1 sm:flex">
          <Badge variant="secondary" className={status.color}>
            {status.label}
          </Badge>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {formatTimeAgo(call.receivedAt)}
          </span>
        </div>

        <ChevronDown
          className={cn(
            'h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform',
            expanded && 'rotate-180',
          )}
        />
      </button>

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
            <DetailItem label="Eingegangen" value={formatDateTime(call.receivedAt)} />
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
            {!isDone && (
              <Button size="sm" onClick={onMarkDone} disabled={busy}>
                <Check className="h-4 w-4" />
                {busy ? 'Wird gespeichert …' : 'Als erledigt markieren'}
              </Button>
            )}
            {isDone && call.completedAt && (
              <span className="text-xs text-muted-foreground">
                Erledigt {formatTimeAgo(call.completedAt)}
                {call.completedBy ? ` · ${call.completedBy}` : ''}
              </span>
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
