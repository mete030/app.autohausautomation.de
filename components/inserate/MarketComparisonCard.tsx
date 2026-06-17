'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useListingStore } from '@/lib/stores/listing-store'
import { getMarketAnalysis } from '@/lib/market-analysis'
import { priceCategoryConfig } from '@/lib/constants'
import { formatCurrency } from '@/lib/utils'
import { RankingImpact } from './RankingImpact'
import { MarketDetailDialog } from './MarketDetailDialog'
import { Maximize2, TrendingDown, ShieldCheck, Check, BarChart3, ArrowRight } from 'lucide-react'
import type { Listing } from '@/lib/types'

const SYNC_MS = 700

export function MarketComparisonCard({ listing }: { listing: Listing }) {
  const updateListingPrice = useListingStore((s) => s.updateListingPrice)
  const [radiusKm, setRadiusKm] = useState(50)
  const [isSyncing, setIsSyncing] = useState(true)
  const [detailOpen, setDetailOpen] = useState(false)

  const analysis = useMemo(() => getMarketAnalysis(listing, radiusKm), [listing, radiusKm])

  // Tagesaktueller Abgleich beim Öffnen des Inserats. Der Effect plant nur das
  // Ende des Abgleichs; gestartet wird über den State-Startwert.
  useEffect(() => {
    if (!isSyncing) return
    const t = setTimeout(() => setIsSyncing(false), SYNC_MS)
    return () => clearTimeout(t)
  }, [isSyncing])

  const { recommendation, currentRank, projectedRank, totalListings, priceCategory } = analysis
  const { action, suggestedPrice, targetCategory } = recommendation
  const isHalten = action === 'halten'
  const curCfg = priceCategoryConfig[priceCategory]
  const targetCfg = priceCategoryConfig[targetCategory]

  return (
    <Card className="overflow-hidden">
      {/* Kopf */}
      <div className="flex items-start gap-2.5 p-4 pb-3">
        <div
          className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
          style={{ background: '#FF6600' }}
        >
          <BarChart3 className="h-4 w-4 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm font-semibold">Marktabgleich</h3>
            <span className="text-[10px] text-muted-foreground">mobile.de</span>
          </div>
          <p className="mt-0.5 flex items-center gap-1.5 truncate text-[11px] text-muted-foreground">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            {isSyncing ? 'Wird abgeglichen …' : `Heute ${analysis.aktualisiertUm} aktualisiert`}
          </p>
        </div>
      </div>

      <div className="px-4 pb-4">
        {isSyncing ? (
          <OverviewSkeleton />
        ) : (
          <div className="space-y-3">
            {/* Empfehlungs-Headline */}
            {isHalten ? (
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-semibold">Preis marktgerecht</span>
                <Badge variant="outline" className={`${curCfg.bg} ${curCfg.color} ml-auto border-0`}>
                  {curCfg.label}
                </Badge>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <span className="text-sm font-semibold">
                    {action === 'senken' ? 'Abpreisung empfohlen' : 'Leichte Abpreisung empfohlen'}
                  </span>
                </div>
                <div className="mt-1 flex items-baseline gap-2 pl-6">
                  <span className="text-xs text-muted-foreground line-through">{formatCurrency(listing.price)}</span>
                  <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground" />
                  <span className="text-lg font-bold">{formatCurrency(suggestedPrice)}</span>
                </div>
              </div>
            )}

            {/* Platzierung — der Hero der Übersicht */}
            <div className="rounded-lg border bg-muted/30 p-2.5">
              <RankingImpact currentRank={currentRank} projectedRank={projectedRank} totalListings={totalListings} />
              {!isHalten && (
                <div className="mt-2.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 border-t border-border/60 pt-2.5 text-[11px]">
                  <span className="text-muted-foreground">Bewertung</span>
                  <Badge variant="outline" className={`${curCfg.bg} ${curCfg.color} border-0`}>
                    {curCfg.label}
                  </Badge>
                  <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground" />
                  <Badge variant="outline" className={`${targetCfg.bg} ${targetCfg.color} border-0`}>
                    {targetCfg.label}
                  </Badge>
                </div>
              )}
            </div>

            {/* Aktionen */}
            <div className="space-y-1.5">
              {!isHalten && (
                <Button
                  size="sm"
                  className="w-full bg-amber-600 text-white hover:bg-amber-700"
                  onClick={() => updateListingPrice(listing.id, suggestedPrice)}
                >
                  <Check className="mr-1.5 h-3.5 w-3.5" />
                  Preis übernehmen
                </Button>
              )}
              <Button
                size="sm"
                variant={isHalten ? 'outline' : 'ghost'}
                className="w-full"
                onClick={() => setDetailOpen(true)}
              >
                <Maximize2 className="mr-1.5 h-3.5 w-3.5" />
                Details ansehen
              </Button>
            </div>
          </div>
        )}
      </div>

      <MarketDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        listing={listing}
        analysis={analysis}
        radiusKm={radiusKm}
        onRadiusChange={setRadiusKm}
        onSetPrice={(p) => updateListingPrice(listing.id, p)}
      />
    </Card>
  )
}

function OverviewSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-5 w-44" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-8 w-full" />
    </div>
  )
}
