'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Bot,
  Phone,
  RefreshCw,
  Clock,
  ChevronDown,
  SquareArrowOutUpRight,
  Check,
  Inbox,
  Search,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { KiCallDetailDialog } from '@/components/ki-rezeptionist/ki-call-detail-dialog'
import { WaitingSince } from '@/components/ki-rezeptionist/waiting-since'
import { kiCategoryConfig, kiStatusConfig } from '@/lib/ki-rezeptionist/ki-reception-config'
import { formatExact, formatDuration } from '@/lib/ki-rezeptionist/format'
import type { KiReceptionCallDto, KiReceptionCategory } from '@/lib/ki-rezeptionist/types'

type FilterMode = 'offen' | 'erledigt' | 'alle'

const FILTERS: { value: FilterMode; label: string }[] = [
  { value: 'offen', label: 'Offen' },
  { value: 'erledigt', label: 'Erledigt' },
  { value: 'alle', label: 'Alle' },
]

export default function KiRezeptionistPageClient() {
  const [calls, setCalls] = useState<KiReceptionCallDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterMode>('offen')
  const [query, setQuery] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const detailCall = useMemo(
    () => calls.find((c) => c.id === detailId) ?? null,
    [calls, detailId],
  )

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
    let result = calls
    if (filter === 'erledigt') result = result.filter((c) => c.status === 'erledigt')
    else if (filter === 'offen') result = result.filter((c) => c.status !== 'erledigt')

    const q = query.trim().toLowerCase()
    if (q) {
      result = result.filter(
        (c) =>
          c.customerName.toLowerCase().includes(q) ||
          (c.summary ?? '').toLowerCase().includes(q) ||
          c.customerPhone.toLowerCase().includes(q) ||
          kiCategoryConfig[c.category].label.toLowerCase().includes(q),
      )
    }
    return result
  }, [calls, filter, query])

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

  const deleteCall = useCallback(async (id: string) => {
    setBusyId(id)
    try {
      const res = await fetch(`/api/ki-rezeptionist/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setCalls((prev) => prev.filter((c) => c.id !== id))
        setDetailId((cur) => (cur === id ? null : cur))
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
              24/7-KI-Vertriebsassistent
            </h1>
          </div>
          <p className="text-sm md:text-[13px] lg:text-sm text-muted-foreground mt-0.5">
            Konversationen & Rückruf-Aufträge deiner digitalen Assistenz
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

      {/* Suche + Filter */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Konversationen durchsuchen…"
            className="pl-9"
          />
        </div>
        <div className="inline-flex flex-shrink-0 rounded-lg border border-border/60 bg-card p-0.5">
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
            {calls.length === 0 ? (
              <>
                <p className="font-medium">Noch keine Konversationen</p>
                <p className="text-sm text-muted-foreground">
                  Sobald dein KI-Vertriebsassistent ein Gespräch entgegennimmt, erscheint die Konversation hier.
                </p>
              </>
            ) : (
              <>
                <p className="font-medium">Keine Treffer</p>
                <p className="text-sm text-muted-foreground">
                  Keine Konversation passt zu Suche oder Filter.
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* List */}
      {filtered.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-baseline justify-between px-0.5">
            <h2 className="text-sm font-semibold tracking-tight">Konversationen</h2>
            <span className="text-xs tabular-nums text-muted-foreground">
              {filtered.length} {filtered.length === 1 ? 'Eintrag' : 'Einträge'}
            </span>
          </div>
          {filtered.map((call) => (
            <CallRow
              key={call.id}
              call={call}
              expanded={expandedId === call.id}
              busy={busyId === call.id}
              onToggleExpand={() =>
                setExpandedId((cur) => (cur === call.id ? null : call.id))
              }
              onOpen={() => setDetailId(call.id)}
              onToggleDone={() => void toggleDone(call.id, call.status !== 'erledigt')}
            />
          ))}
        </div>
      )}

      {/* Detail-Modal (ElevenLabs-Stil, mittig) */}
      <KiCallDetailDialog
        call={detailCall}
        busy={detailCall ? busyId === detailCall.id : false}
        onOpenChange={(open) => {
          if (!open) setDetailId(null)
        }}
        onToggleDone={(c) => void toggleDone(c.id, c.status !== 'erledigt')}
        onDelete={(c) => void deleteCall(c.id)}
      />
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
  onOpen,
  onToggleDone,
}: {
  call: KiReceptionCallDto
  expanded: boolean
  busy: boolean
  onToggleExpand: () => void
  onOpen: () => void
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
        isDone ? 'opacity-65' : 'hover:border-border hover:shadow-sm',
      )}
    >
      {/* Row */}
      <div className="px-3 py-2.5 md:px-4 md:py-3">
        <div className="flex items-start gap-2.5 md:items-center md:gap-3">
          <CompletionToggle done={isDone} busy={busy} onToggle={onToggleDone} />

          {/* Klickbarer Mittelteil → Konversation aufklappen */}
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
              {duration && (
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  {duration}
                </span>
              )}
            </div>
            <p className="mt-0.5 truncate text-[13px] text-muted-foreground">
              {call.summary || 'Kein Anliegen erkannt'}
            </p>
          </button>

          {/* Desktop-Spalten (ab md): Wartet-seit · Eingegangen */}
          <div className="hidden flex-shrink-0 items-center gap-5 md:flex">
            {!isDone && (
              <div className="text-right">
                <p className="whitespace-nowrap text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  Wartet auf Rückruf seit
                </p>
                <div className="flex items-center justify-end gap-1 text-[13px]">
                  <Clock className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
                  <WaitingSince receivedAt={call.receivedAt} slaMinutes={cat.slaMinutes} />
                </div>
              </div>
            )}
            <div className="text-right">
              <p className="whitespace-nowrap text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Eingegangen
              </p>
              <p className="whitespace-nowrap text-[13px] tabular-nums text-muted-foreground">
                {formatExact(call.receivedAt)}
              </p>
            </div>
          </div>

          {/* Aktionen (immer sichtbar) */}
          <div className="flex flex-shrink-0 items-center gap-0.5">
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

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onOpen}
                  aria-label="Konversation öffnen"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <SquareArrowOutUpRight className="h-[15px] w-[15px]" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="text-xs">Konversation öffnen</TooltipContent>
            </Tooltip>

            <button
              type="button"
              onClick={onToggleExpand}
              aria-label={expanded ? 'Zuklappen' : 'Aufklappen'}
              aria-expanded={expanded}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted"
            >
              <ChevronDown className={cn('h-4 w-4 transition-transform', expanded && 'rotate-180')} />
            </button>
          </div>
        </div>

        {/* Mobile-Meta (unter md): Wartezeit + Eingegangen als eigene Zeile */}
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 pl-[2.375rem] text-xs md:hidden">
          {!isDone && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
              <span className="text-muted-foreground">Wartet seit</span>
              <WaitingSince receivedAt={call.receivedAt} slaMinutes={cat.slaMinutes} />
            </span>
          )}
          <span className="whitespace-nowrap text-muted-foreground">
            Eingegangen {formatExact(call.receivedAt)}
          </span>
        </div>
      </div>

      {/* Aufgeklappte Vorschau (ElevenLabs-Stil): Metadaten + Kurz-Zusammenfassung */}
      {expanded && (
        <div className="space-y-3 border-t border-border/60 px-3 py-3.5 md:px-4">
          {/* Meta-Zeile */}
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <MetaItem label="Eingegangen" value={formatExact(call.receivedAt)} />
            <MetaItem label="Dauer" value={duration ?? '—'} />
            <MetaItem label="Anliegen" value={cat.label} />
            {call.customerPhone && <MetaItem label="Telefon" value={call.customerPhone} />}
          </div>

          {/* Kurz-Zusammenfassung */}
          <p className="text-[13px] leading-relaxed text-foreground/80">
            {call.summary?.trim() || 'Keine Zusammenfassung verfügbar.'}
          </p>

          {/* Aktionen */}
          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            <Button variant="outline" size="sm" onClick={onOpen}>
              <SquareArrowOutUpRight className="h-4 w-4" />
              Konversation öffnen
            </Button>
            {call.customerPhone && (
              <Button asChild variant="ghost" size="sm">
                <a href={`tel:${call.customerPhone}`}>
                  <Phone className="h-4 w-4" />
                  Anrufen
                </a>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/** Kompaktes „LABEL Wert"-Paar für die aufgeklappte Vorschau. */
function MetaItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="text-[13px] tabular-nums">{value}</span>
    </div>
  )
}
