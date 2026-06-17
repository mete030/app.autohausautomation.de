'use client'

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { priceCategoryConfig } from '@/lib/constants'
import { formatCurrency, formatMileage } from '@/lib/utils'
import { PriceDistributionStrip } from './PriceDistributionStrip'
import { PriceRecommendationPanel } from './PriceRecommendationPanel'
import { RankingImpact } from './RankingImpact'
import { RefreshCw, ChevronDown, Check, MapPin, ListOrdered, Info, BarChart3, X } from 'lucide-react'
import type { Listing, MarketAnalysis, MarketComparable } from '@/lib/types'

const RADIUS_OPTIONS = [25, 50, 100, 150]
const SYNC_MS = 700

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  listing: Listing
  analysis: MarketAnalysis
  radiusKm: number
  onRadiusChange: (radiusKm: number) => void
  onSetPrice: (price: number) => void
}

export function MarketDetailDialog(props: Props) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[calc(100vw-1rem)] gap-0 overflow-y-auto p-0 sm:max-w-2xl lg:max-w-4xl"
      >
        {/* DetailBody mountet pro Öffnen neu → frischer Abgleich beim Öffnen */}
        <DetailBody {...props} />
      </DialogContent>
    </Dialog>
  )
}

function DetailBody({ listing, analysis, radiusKm, onRadiusChange, onSetPrice }: Props) {
  const [isSyncing, setIsSyncing] = useState(true)
  const [radiusOpen, setRadiusOpen] = useState(false)

  useEffect(() => {
    if (!isSyncing) return
    const t = setTimeout(() => setIsSyncing(false), SYNC_MS)
    return () => clearTimeout(t)
  }, [isSyncing])

  const { recommendation, priceCategory, currentRank, projectedRank, totalListings } = analysis
  const overMedian = analysis.deltaZuMedian > 0
  const deltaPct = Math.round((listing.price / analysis.priceMedian - 1) * 100)
  const standzeitRatio = analysis.standzeitTage / analysis.avgStandzeitMarkt
  const cfg = priceCategoryConfig[priceCategory]
  const isHalten = recommendation.action === 'halten'

  const handleSelectRadius = (r: number) => {
    onRadiusChange(r)
    setIsSyncing(true)
    setRadiusOpen(false)
  }

  return (
    <>
      {/* ─── Kopf ─────────────────────────────────────────────────────── */}
      <DialogHeader className="border-b p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div
            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
            style={{ background: '#FF6600' }}
          >
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <DialogTitle className="flex items-center gap-2 text-base">
              Marktabgleich
              <span className="text-xs font-normal text-muted-foreground">mobile.de</span>
            </DialogTitle>
            <DialogDescription className="mt-0.5 flex items-center gap-1.5 text-xs">
              <MapPin className="h-3 w-3 shrink-0" />
              {analysis.comparableCount} Vergleichsinserate · {radiusKm} km um {analysis.standort} · heute{' '}
              {analysis.aktualisiertUm} abgeglichen
            </DialogDescription>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <Popover open={radiusOpen} onOpenChange={setRadiusOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="xs">
                  Radius {radiusKm} km
                  <ChevronDown className="ml-0.5 h-3 w-3" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-32 p-1">
                {RADIUS_OPTIONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => handleSelectRadius(r)}
                    className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted ${
                      r === radiusKm ? 'font-semibold' : ''
                    }`}
                  >
                    {r} km
                    {r === radiusKm && <Check className="h-3.5 w-3.5" />}
                  </button>
                ))}
              </PopoverContent>
            </Popover>
            <Button
              variant="outline"
              size="icon-xs"
              onClick={() => setIsSyncing(true)}
              title="Neu abgleichen"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            </Button>
            <DialogClose asChild>
              <Button variant="outline" size="icon-xs" title="Schließen">
                <X className="h-3.5 w-3.5" />
              </Button>
            </DialogClose>
          </div>
        </div>
      </DialogHeader>

      {/* ─── Inhalt ───────────────────────────────────────────────────── */}
      <div className="p-4 sm:p-5">
        {isSyncing ? (
          <DetailSkeleton />
        ) : (
          <div className="space-y-5">
            {/* Preis-Positionierung */}
            <section>
              <SectionLabel>Preis-Positionierung im Umkreis</SectionLabel>
              <div className="rounded-xl border bg-muted/20 p-3 sm:p-4">
                <PriceDistributionStrip
                  min={analysis.priceMin}
                  max={analysis.priceMax}
                  median={analysis.priceMedian}
                  yourPrice={listing.price}
                  ticks={analysis.tickPrices}
                  category={priceCategory}
                />
              </div>
            </section>

            {/* KPI-Kacheln */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <KpiTile
                label="Dein Preis"
                value={formatCurrency(listing.price)}
                sub={`günstiger als ${analysis.guenstigerAlsProzent} %`}
              />
              <KpiTile
                label="Δ Marktmedian"
                value={`${overMedian ? '+' : ''}${formatCurrency(analysis.deltaZuMedian)}`}
                sub={`${deltaPct > 0 ? '+' : ''}${deltaPct} % · Median ${formatCurrency(analysis.priceMedian)}`}
                tone={overMedian ? 'warn' : 'good'}
              />
              <KpiTile
                label="Standzeit"
                value={`${analysis.standzeitTage} Tage`}
                sub={`Ø Markt ${analysis.avgStandzeitMarkt} Tage`}
                tone={standzeitRatio >= 1.5 ? 'warn' : 'neutral'}
              />
              <KpiTile
                label="Bewertung"
                valueNode={
                  <Badge variant="outline" className={`${cfg.bg} ${cfg.color} border-0`}>
                    {cfg.label}
                  </Badge>
                }
                sub="mobile.de Preisbewertung"
              />
            </div>

            {/* Empfehlung + Platzierungs-Detail */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <section>
                <SectionLabel>Empfehlung</SectionLabel>
                <PriceRecommendationPanel
                  key={radiusKm}
                  analysis={analysis}
                  currentPrice={listing.price}
                  onSetPrice={onSetPrice}
                />
              </section>

              <section>
                <SectionLabel>
                  <ListOrdered className="h-3.5 w-3.5" />
                  Platzierung & nächste Wettbewerber
                </SectionLabel>
                <div className="rounded-xl border p-3">
                  <RankingImpact
                    currentRank={currentRank}
                    projectedRank={projectedRank}
                    totalListings={totalListings}
                    showLabel={false}
                  />
                </div>
                <PriceLadder
                  comparables={analysis.comparables}
                  yourPrice={listing.price}
                  suggestedPrice={isHalten ? null : recommendation.suggestedPrice}
                />
              </section>
            </div>

            {/* Methodik */}
            <p className="flex items-start gap-1.5 rounded-lg bg-muted/40 p-3 text-[11px] text-muted-foreground">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                Vergleich basiert auf Inseraten ähnlicher Fahrzeuge (Modell, Aufbau, Baujahr, Kilometerstand)
                im gewählten Umkreis. Platzierung = Position bei Sortierung nach Preis (aufsteigend); günstiger
                bedeutet weiter oben. Bewertung und Platzierung nach Abpreisung sind exakt berechnet, keine
                Prognose.
              </span>
            </p>
          </div>
        )}
      </div>
    </>
  )
}

// ─── Sub-Komponenten ────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </p>
  )
}

function KpiTile({
  label,
  value,
  valueNode,
  sub,
  tone = 'neutral',
}: {
  label: string
  value?: string
  valueNode?: React.ReactNode
  sub: string
  tone?: 'neutral' | 'good' | 'warn'
}) {
  const toneCls =
    tone === 'warn'
      ? 'text-amber-600 dark:text-amber-400'
      : tone === 'good'
        ? 'text-emerald-600 dark:text-emerald-400'
        : 'text-foreground'
  return (
    <div className="rounded-lg border bg-muted/30 px-2.5 py-2">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      {valueNode ? (
        <div className="mt-1">{valueNode}</div>
      ) : (
        <p className={`mt-0.5 text-sm font-bold ${toneCls}`}>{value}</p>
      )}
      <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{sub}</p>
    </div>
  )
}

type LadderRow =
  | { kind: 'comp'; price: number; comp: MarketComparable }
  | { kind: 'you'; price: number }
  | { kind: 'projected'; price: number }

function PriceLadder({
  comparables,
  yourPrice,
  suggestedPrice,
}: {
  comparables: MarketComparable[]
  yourPrice: number
  suggestedPrice: number | null
}) {
  const rows: LadderRow[] = [
    ...comparables.map((c) => ({ kind: 'comp' as const, price: c.price, comp: c })),
    { kind: 'you' as const, price: yourPrice },
  ]
  if (suggestedPrice !== null) rows.push({ kind: 'projected' as const, price: suggestedPrice })
  rows.sort((a, b) => a.price - b.price)

  return (
    <div className="mt-2 max-h-[320px] space-y-1 overflow-y-auto pr-1">
      {rows.map((row) => {
        if (row.kind === 'you') {
          return (
            <div
              key="you"
              className="flex items-center gap-2 rounded-lg border-2 border-foreground/70 bg-foreground/5 px-2.5 py-2 text-xs"
            >
              <span className="font-semibold">Dein Inserat · aktuell</span>
              <span className="ml-auto font-bold">{formatCurrency(row.price)}</span>
            </div>
          )
        }
        if (row.kind === 'projected') {
          return (
            <div
              key="projected"
              className="flex items-center gap-2 rounded-lg border-2 border-dashed border-emerald-500 bg-emerald-50/60 px-2.5 py-2 text-xs dark:bg-emerald-950/20"
            >
              <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                Dein Inserat · nach Abpreisung
              </span>
              <span className="ml-auto font-bold text-emerald-700 dark:text-emerald-400">
                {formatCurrency(row.price)}
              </span>
            </div>
          )
        }
        const c = row.comp
        return (
          <div key={c.id} className="flex items-center gap-2 rounded-lg border px-2.5 py-2 text-xs">
            <div className="min-w-0 flex-1">
              <p className="truncate text-muted-foreground">
                {formatMileage(c.kilometerstand)} · EZ {c.erstzulassung} · {c.distanzKm} km {c.stadt}
              </p>
            </div>
            <span className="shrink-0 font-semibold">{formatCurrency(c.price)}</span>
          </div>
        )
      })}
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-24 w-full" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Skeleton className="h-14" />
        <Skeleton className="h-14" />
        <Skeleton className="h-14" />
        <Skeleton className="h-14" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  )
}
