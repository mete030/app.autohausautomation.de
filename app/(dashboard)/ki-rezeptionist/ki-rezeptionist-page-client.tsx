'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Bot,
  Phone,
  RefreshCw,
  Clock,
  ChevronDown,
  SquareArrowOutUpRight,
  Forward,
  Check,
  Inbox,
  Search,
  CalendarDays,
  ListFilter,
  Tag,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { KiCallDetailDialog } from '@/components/ki-rezeptionist/ki-call-detail-dialog'
import { KiForwardDialog } from '@/components/ki-rezeptionist/ki-forward-dialog'
import { KiCompletionDialog } from '@/components/ki-rezeptionist/ki-completion-dialog'
import { KiMetricsBar } from '@/components/ki-rezeptionist/ki-metrics-bar'
import { KiAutoForwardToggle } from '@/components/ki-rezeptionist/ki-auto-forward-toggle'
import { WaitingSince } from '@/components/ki-rezeptionist/waiting-since'
import {
  kiCategoryConfig,
  kiStatusConfig,
  kiMarkeConfig,
  KI_RECEPTION_CATEGORIES,
  KI_MARKEN,
} from '@/lib/ki-rezeptionist/ki-reception-config'
import { formatExact, formatDuration } from '@/lib/ki-rezeptionist/format'
import type { KiReceptionCallDto, KiReceptionCategory, KiMarke } from '@/lib/ki-rezeptionist/types'

type FilterMode = 'offen' | 'erledigt' | 'alle'
type DateRange = 'alle' | 'heute' | '7tage' | '30tage'
// Marken-Filter: konkrete Marke, „alle" oder „ohne" (keine Marke erfasst).
type MarkeFilter = KiMarke | 'alle' | 'ohne'

const FILTERS: { value: FilterMode; label: string }[] = [
  { value: 'offen', label: 'Offen' },
  { value: 'erledigt', label: 'Erledigt' },
  { value: 'alle', label: 'Alle' },
]

const DATE_RANGES: { value: DateRange; label: string }[] = [
  { value: 'alle', label: 'Alle' },
  { value: 'heute', label: 'Heute' },
  { value: '7tage', label: '7 Tage' },
  { value: '30tage', label: '30 Tage' },
]

export default function KiRezeptionistPageClient() {
  const [calls, setCalls] = useState<KiReceptionCallDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterMode>('offen')
  const [categoryFilter, setCategoryFilter] = useState<KiReceptionCategory | 'alle'>('alle')
  const [markeFilter, setMarkeFilter] = useState<MarkeFilter>('alle')
  const [dateRange, setDateRange] = useState<DateRange>('alle')
  const [query, setQuery] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [forwardId, setForwardId] = useState<string | null>(null)
  const [completeId, setCompleteId] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [pendingDeepLink, setPendingDeepLink] = useState<string | null>(null)

  const detailCall = useMemo(
    () => calls.find((c) => c.id === detailId) ?? null,
    [calls, detailId],
  )
  const forwardCall = useMemo(
    () => calls.find((c) => c.id === forwardId) ?? null,
    [calls, forwardId],
  )
  const completingCall = useMemo(
    () => calls.find((c) => c.id === completeId) ?? null,
    [calls, completeId],
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

  // Deep-Link aus der Lead-E-Mail: ?call=<id> öffnet direkt die Konversation,
  // sobald die Liste geladen ist. Funktioniert auf jeder Domain (Preview/Prod),
  // da die URL clientseitig gelesen wird.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const cid = new URLSearchParams(window.location.search).get('call')
    if (cid) setPendingDeepLink(cid)
  }, [])

  useEffect(() => {
    if (pendingDeepLink && calls.some((c) => c.id === pendingDeepLink)) {
      setDetailId(pendingDeepLink)
      setPendingDeepLink(null)
      window.history.replaceState(null, '', window.location.pathname)
    }
  }, [pendingDeepLink, calls])

  const filtered = useMemo(() => {
    let result = calls
    if (filter === 'erledigt') result = result.filter((c) => c.status === 'erledigt')
    else if (filter === 'offen') result = result.filter((c) => c.status !== 'erledigt')

    if (categoryFilter !== 'alle') result = result.filter((c) => c.category === categoryFilter)

    if (markeFilter !== 'alle') {
      result =
        markeFilter === 'ohne'
          ? result.filter((c) => !c.marke)
          : result.filter((c) => c.marke === markeFilter)
    }

    if (dateRange !== 'alle') {
      if (dateRange === 'heute') {
        const today = new Date().toDateString()
        result = result.filter((c) => new Date(c.receivedAt).toDateString() === today)
      } else {
        const days = dateRange === '7tage' ? 7 : 30
        const cutoff = Date.now() - days * 86_400_000
        result = result.filter((c) => new Date(c.receivedAt).getTime() >= cutoff)
      }
    }

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
  }, [calls, filter, query, categoryFilter, markeFilter, dateRange])

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

  // Nach einer Weiterleitung den (ggf. auf „In Bearbeitung" gesetzten) Anruf
  // in der Liste aktualisieren.
  const applyForwarded = useCallback((updated: KiReceptionCallDto) => {
    setCalls((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
  }, [])

  // Erledigt-Klick: beim Abschließen erst eine kurze Ergebnis-Notiz verlangen
  // (Dialog), beim Wieder-Öffnen direkt umschalten.
  const requestToggleDone = useCallback(
    (call: KiReceptionCallDto) => {
      if (call.status === 'erledigt') void toggleDone(call.id, false)
      else setCompleteId(call.id)
    },
    [toggleDone],
  )

  // Abschluss mit Pflicht-Notiz speichern (Ergebnis → completionNotes).
  const submitCompletion = useCallback(async (id: string, notes: string) => {
    setBusyId(id)
    try {
      const res = await fetch(`/api/ki-rezeptionist/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'erledigt', completedBy: 'Dashboard', completionNotes: notes }),
      })
      if (res.ok) {
        const { call } = await res.json()
        setCalls((prev) => prev.map((c) => (c.id === id ? call : c)))
        setCompleteId(null)
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
        <div className="flex flex-shrink-0 flex-wrap items-center justify-end gap-2">
          <KiAutoForwardToggle />
          <Button asChild variant="outline" size="sm">
            <Link href="/ki-rezeptionist/kalender">
              <CalendarDays className="h-4 w-4" />
              Kalender
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
            Aktualisieren
          </Button>
        </div>
      </div>

      {/* Anruf-Metriken (ElevenLabs-Stil) */}
      <KiMetricsBar calls={calls} />

      {/* KPIs — Arbeits-Status */}
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

      {/* Anliegen- + Zeitraum-Filter */}
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={categoryFilter}
          onValueChange={(v) => setCategoryFilter(v as KiReceptionCategory | 'alle')}
        >
          <SelectTrigger className="h-9 w-auto min-w-[190px] gap-2">
            <ListFilter className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="alle">Alle Anliegen</SelectItem>
            {KI_RECEPTION_CATEGORIES.map((catKey) => {
              const c = kiCategoryConfig[catKey]
              const Icon = c.icon
              return (
                <SelectItem key={catKey} value={catKey}>
                  <span className="inline-flex items-center gap-1.5">
                    <Icon className="h-3.5 w-3.5" />
                    {c.label}
                  </span>
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>

        <Select value={markeFilter} onValueChange={(v) => setMarkeFilter(v as MarkeFilter)}>
          <SelectTrigger className="h-9 w-auto min-w-[170px] gap-2">
            <Tag className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="alle">Alle Marken</SelectItem>
            {KI_MARKEN.map((markeKey) => (
              <SelectItem key={markeKey} value={markeKey}>
                <span className="inline-flex items-center gap-1.5">
                  <span className={cn('h-2 w-2 rounded-full', kiMarkeConfig[markeKey].color)} />
                  {kiMarkeConfig[markeKey].label}
                </span>
              </SelectItem>
            ))}
            <SelectItem value="ohne">Ohne Angabe</SelectItem>
          </SelectContent>
        </Select>

        <div className="inline-flex flex-shrink-0 rounded-lg border border-border/60 bg-card p-0.5">
          {DATE_RANGES.map((d) => (
            <button
              key={d.value}
              onClick={() => setDateRange(d.value)}
              className={cn(
                'rounded-md px-2.5 py-1.5 text-[12px] font-medium transition-colors',
                dateRange === d.value
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {d.label}
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
              onForward={() => setForwardId(call.id)}
              onToggleDone={() => requestToggleDone(call)}
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
        onToggleDone={(c) => requestToggleDone(c)}
        onDelete={(c) => void deleteCall(c.id)}
        onForward={(c) => {
          setDetailId(null)
          setForwardId(c.id)
        }}
      />

      {/* Weiterleiten-Modal (Brevo-E-Mail an Berater) */}
      <KiForwardDialog
        call={forwardCall}
        onOpenChange={(open) => {
          if (!open) setForwardId(null)
        }}
        onForwarded={applyForwarded}
      />

      {/* Erledigt-Modal (Pflicht-Ergebnisnotiz) */}
      <KiCompletionDialog
        call={completingCall}
        busy={completingCall ? busyId === completingCall.id : false}
        onOpenChange={(open) => {
          if (!open) setCompleteId(null)
        }}
        onComplete={(id, notes) => void submitCompletion(id, notes)}
      />
    </div>
  )
}

function KpiCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-card px-3 py-2">
      <p className="truncate text-[10px] md:text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className={cn('text-lg md:text-xl font-bold tabular-nums', accent)}>{value}</p>
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

function MarkeChip({ marke, dimmed }: { marke: KiMarke; dimmed?: boolean }) {
  const m = kiMarkeConfig[marke]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
        dimmed ? 'bg-muted text-muted-foreground' : m.color,
      )}
    >
      <Tag className="h-3 w-3" />
      {m.label}
    </span>
  )
}

function CallRow({
  call,
  expanded,
  busy,
  onToggleExpand,
  onOpen,
  onForward,
  onToggleDone,
}: {
  call: KiReceptionCallDto
  expanded: boolean
  busy: boolean
  onToggleExpand: () => void
  onOpen: () => void
  onForward: () => void
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
              {call.marke && <MarkeChip marke={call.marke} dimmed={isDone} />}
              {inProgress && (
                <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', kiStatusConfig.in_bearbeitung.color)}>
                  In Bearbeitung
                </span>
              )}
              {isDone && (
                <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium', kiStatusConfig.erledigt.color)}>
                  <Check className="h-3 w-3" />
                  Erledigt
                </span>
              )}
              {duration && (
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  {duration}
                </span>
              )}
            </div>
            {isDone && call.completionNotes?.trim() ? (
              <p className="mt-0.5 flex items-center gap-1 text-[13px] text-emerald-700 dark:text-emerald-400">
                <Check className="h-3 w-3 flex-shrink-0" />
                <span className="min-w-0 truncate">
                  <span className="font-medium">Ergebnis:</span> {call.completionNotes}
                </span>
              </p>
            ) : (
              <p className="mt-0.5 truncate text-[13px] text-muted-foreground">
                {call.summary || 'Kein Anliegen erkannt'}
              </p>
            )}
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
                  onClick={(e) => {
                    e.stopPropagation()
                    onForward()
                  }}
                  aria-label="An Mitarbeitenden weiterleiten"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                >
                  <Forward className="h-[16px] w-[16px]" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="text-xs">An Mitarbeitenden weiterleiten</TooltipContent>
            </Tooltip>

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
            {call.marke && <MetaItem label="Marke" value={kiMarkeConfig[call.marke].label} />}
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
            <Button variant="outline" size="sm" onClick={onForward}>
              <Forward className="h-4 w-4" />
              An Mitarbeitenden weiterleiten
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
