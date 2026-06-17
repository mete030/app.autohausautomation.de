'use client'

import { useState } from 'react'
import { addDays } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { priceCategoryConfig } from '@/lib/constants'
import { RankingImpact } from './RankingImpact'
import {
  TrendingDown,
  ShieldCheck,
  Database,
  ArrowRight,
  Check,
  BellRing,
  X,
  RotateCcw,
} from 'lucide-react'
import type { MarketAnalysis } from '@/lib/types'

interface Props {
  analysis: MarketAnalysis
  currentPrice: number
  onSetPrice: (price: number) => void
}

export function PriceRecommendationPanel({ analysis, currentPrice, onSetPrice }: Props) {
  const [reminderSet, setReminderSet] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [appliedPrice, setAppliedPrice] = useState<number | null>(null)
  const [previousPrice, setPreviousPrice] = useState<number | null>(null)

  const { recommendation, currentRank, projectedRank, totalListings, priceCategory } = analysis
  const { action, suggestedPrice, reasons, targetCategory } = recommendation
  const isHalten = action === 'halten'

  const basisLine = `Basis: ${analysis.comparableCount} Vergleichsinserate · heute ${analysis.aktualisiertUm} abgeglichen`
  const curCfg = priceCategoryConfig[priceCategory]
  const targetCfg = priceCategoryConfig[targetCategory]

  // ── Zustand: Empfehlung übernommen ──────────────────────────────────────
  if (appliedPrice !== null) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 dark:border-emerald-900 dark:bg-emerald-950/30">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500">
            <Check className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Preis übernommen</p>
            <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80">
              Neuer Angebotspreis: {formatCurrency(appliedPrice)} · Platzierung & Bewertung aktualisiert
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            if (previousPrice !== null) onSetPrice(previousPrice)
            setAppliedPrice(null)
          }}
          className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 hover:underline dark:text-emerald-400"
        >
          <RotateCcw className="h-3 w-3" />
          Rückgängig
        </button>
      </div>
    )
  }

  // ── Zustand: Empfehlung verworfen ───────────────────────────────────────
  if (dismissed) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-dashed px-3.5 py-2.5">
        <span className="text-[11px] text-muted-foreground">Empfehlung verworfen</span>
        <button
          onClick={() => setDismissed(false)}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="h-3 w-3" />
          Wieder anzeigen
        </button>
      </div>
    )
  }

  // ── Zustand: Preis halten (marktgerecht) ────────────────────────────────
  if (isHalten) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5 dark:border-emerald-900 dark:bg-emerald-950/20">
        <div className="flex items-start gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
            <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Preis ist marktgerecht</p>
            <p className="mt-0.5 text-[11px] text-emerald-700/80 dark:text-emerald-400/80">
              Aktuell optimal positioniert — keine Abpreisung nötig.
            </p>
          </div>
          <Badge variant="outline" className={`${curCfg.bg} ${curCfg.color} shrink-0 border-0`}>
            {curCfg.label}
          </Badge>
        </div>

        <div className="mt-3 rounded-lg bg-background/60 p-2.5">
          <RankingImpact
            currentRank={currentRank}
            projectedRank={projectedRank}
            totalListings={totalListings}
          />
        </div>

        <ul className="mt-2.5 space-y-1">
          {reasons.map((r, i) => (
            <li key={i} className="flex items-start gap-1.5 text-[11px] text-emerald-800/90 dark:text-emerald-300/90">
              <Check className="mt-0.5 h-3 w-3 shrink-0" />
              <span>{r}</span>
            </li>
          ))}
        </ul>

        <p className="mt-2.5 flex items-center gap-1.5 text-[10px] text-emerald-700/70 dark:text-emerald-400/70">
          <Database className="h-3 w-3" />
          {basisLine}
        </p>
      </div>
    )
  }

  // ── Zustand: Abpreisung empfohlen ───────────────────────────────────────
  const title = action === 'senken' ? 'Abpreisung empfohlen' : 'Leichte Abpreisung empfohlen'

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 dark:border-amber-900/60 dark:bg-amber-950/20">
      {/* Kopf */}
      <div className="flex items-start gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
          <TrendingDown className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-300">{title}</p>
          {/* Preis alt → neu */}
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xs text-muted-foreground line-through">{formatCurrency(currentPrice)}</span>
            <span className="text-lg font-bold text-foreground">{formatCurrency(suggestedPrice)}</span>
          </div>
        </div>
      </div>

      {/* Repositionierung (deterministisch, kein Prognosewert) */}
      <div className="mt-3 rounded-lg bg-background/70 p-2.5">
        <RankingImpact
          currentRank={currentRank}
          projectedRank={projectedRank}
          totalListings={totalListings}
        />
        <div className="mt-2.5 flex items-center gap-2 border-t border-border/60 pt-2.5 text-[11px]">
          <span className="text-muted-foreground">Bewertung</span>
          <Badge variant="outline" className={`${curCfg.bg} ${curCfg.color} border-0`}>
            {curCfg.label}
          </Badge>
          <ArrowRight className="h-3 w-3 text-muted-foreground" />
          <Badge variant="outline" className={`${targetCfg.bg} ${targetCfg.color} border-0`}>
            {targetCfg.label}
          </Badge>
        </div>
      </div>

      {/* Begründung */}
      <ul className="mt-2.5 space-y-1">
        {reasons.map((r, i) => (
          <li key={i} className="flex items-start gap-1.5 text-[11px] text-foreground/80">
            <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-amber-500" />
            <span>{r}</span>
          </li>
        ))}
      </ul>

      <p className="mt-2.5 flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <Database className="h-3 w-3" />
        {basisLine}
      </p>

      {/* Aktionen */}
      <div className="mt-3 space-y-1.5">
        <Button
          size="sm"
          className="w-full bg-amber-600 text-white hover:bg-amber-700"
          onClick={() => {
            setPreviousPrice(currentPrice)
            setAppliedPrice(suggestedPrice)
            onSetPrice(suggestedPrice)
          }}
        >
          <Check className="mr-1.5 h-3.5 w-3.5" />
          Preis übernehmen
        </Button>
        <div className="flex gap-1.5">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-[11px]"
            onClick={() => setReminderSet((v) => !v)}
          >
            <BellRing className="mr-1 h-3.5 w-3.5" />
            {reminderSet ? 'Erinnerung aktiv' : 'In 7 Tagen'}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="flex-1 text-[11px] text-muted-foreground"
            onClick={() => setDismissed(true)}
          >
            <X className="mr-1 h-3.5 w-3.5" />
            Verwerfen
          </Button>
        </div>
        {reminderSet && (
          <p className="flex items-center gap-1 pt-0.5 text-[10px] text-muted-foreground">
            <BellRing className="h-3 w-3" />
            Erneute Prüfung am {formatDate(addDays(new Date(), 7))}
          </p>
        )}
      </div>
    </div>
  )
}
