'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { SingleVehicleResult } from './SingleVehicleResult'
import {
  buildPackageTotals,
  evaluatePackageBundle,
  allocateBundle,
  paketVerdictConfig,
  CONDITION_DAT_LABEL,
  type EinkaufPackageVehicle,
} from '@/lib/mock-data-paket'
import { packageRoleConfig } from '@/lib/mock-data-einkauf'
import { formatCurrency } from '@/lib/utils'
import { Layers, ChevronRight, ChevronDown, ArrowLeft, RefreshCw, Check, Sparkles, ArrowRight, Gavel, Info } from 'lucide-react'

interface PaketResultProps {
  vehicles: EinkaufPackageVehicle[]
  onReset: () => void
  onCreateInserat: (vehicle: EinkaufPackageVehicle) => void
}

export function PaketResult({ vehicles, onReset, onCreateInserat }: PaketResultProps) {
  const totals = useMemo(() => buildPackageTotals(vehicles), [vehicles])
  const [drillIndex, setDrillIndex] = useState<number | null>(null)
  const [drillView, setDrillView] = useState<'empfehlung' | 'details'>('empfehlung')
  const [bundlePrice, setBundlePrice] = useState<string>(String(totals.defaultBundlePrice))
  const [showAllocation, setShowAllocation] = useState(false)

  const priceNum = Number(bundlePrice) || 0
  const result = useMemo(() => ({ vehicles, totals }), [vehicles, totals])
  const bundle = evaluatePackageBundle(result, priceNum)
  const allocation = allocateBundle(vehicles, priceNum, totals.ekRecommendation)
  const maxAlloc = Math.max(1, ...allocation.map((a) => a.alloc))
  const verdict = paketVerdictConfig[bundle.verdict]

  // ── Drill-down into a single vehicle ──
  if (drillIndex !== null && vehicles[drillIndex]) {
    const v = vehicles[drillIndex]
    // Zustand der (ggf. bearbeiteten) Liste in die Detailbewertung spiegeln —
    // ohne das geteilte Mock-Objekt zu mutieren.
    const detail = { ...v.detail, packageRole: v.role, dat: { ...v.detail.dat, condition: CONDITION_DAT_LABEL[v.condition] } }
    return (
      <div className="space-y-5 animate-in fade-in duration-300">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => setDrillIndex(null)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline underline-offset-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Zurück zum Paket
          </button>
          <div className="flex items-center gap-2">
            {v.simplified && (
              <Badge variant="secondary" className="text-[10px]">Vereinfachte Schnellbewertung</Badge>
            )}
            <div className="flex gap-1 rounded-lg border bg-muted p-1">
              <button
                onClick={() => setDrillView('empfehlung')}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all ${drillView === 'empfehlung' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Preisempfehlung
              </button>
              <button
                onClick={() => setDrillView('details')}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all ${drillView === 'details' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Detailanalyse
              </button>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-12 w-16 rounded-lg overflow-hidden bg-muted ring-1 ring-border/60 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={v.imageUrl} alt={v.model} className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="text-sm font-semibold">{v.model}</p>
            <p className="text-xs text-muted-foreground">
              EZ {v.firstRegistration} &middot; {v.mileage.toLocaleString('de-DE')} km &middot; {v.equipmentSummary}
            </p>
          </div>
        </div>
        <SingleVehicleResult result={detail} resultsView={drillView} channel={v.channel} />
        <div className="flex justify-end">
          <Button
            onClick={() => onCreateInserat(v)}
            className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white"
          >
            {v.channel === 'auktion' ? <Gavel className="h-4 w-4 mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
            {v.channel === 'auktion' ? 'Auktion einliefern' : 'Inserat erstellen'}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    )
  }

  // ── Package overview ──
  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Aggregate hero */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card">
        <CardContent className="p-6 sm:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-6 items-center">
            <div className="text-center lg:text-left">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Gesamt-EK-Empfehlung</p>
              <span className="text-4xl sm:text-5xl font-bold tracking-tight tabular-nums">{formatCurrency(totals.ekRecommendation)}</span>
              <p className="text-sm text-muted-foreground mt-1">
                Bandbreite: {formatCurrency(totals.ekMin)} &ndash; {formatCurrency(totals.ekMax)}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-3 justify-center lg:justify-start">
                <Badge variant="secondary" className="text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                  {totals.confidence}% Konfidenz
                </Badge>
                <Badge variant="secondary" className="text-xs">{vehicles.length} Fahrzeuge</Badge>
                <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300">
                  {totals.channelSplit.endkunde}× Endkunde · {totals.channelSplit.auktion}× Auktion
                </Badge>
                {/* F3: Treiber/Mitnahme-Split auf einen Blick */}
                <Badge variant="secondary" className="text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                  {totals.roleSplit.treiber} Treiber · {totals.roleSplit.mitnahme} Mitnahme
                </Badge>
              </div>
            </div>

            <Separator orientation="vertical" className="hidden lg:block h-24" />
            <Separator className="lg:hidden" />

            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Erw. Gesamt-VK</p>
                <p className="text-xl font-bold tabular-nums mt-0.5">{formatCurrency(totals.expectedSaleTotal)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Erw. Gesamtmarge</p>
                <p className="text-xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {formatCurrency(totals.expectedMarginTotal)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Ø Marge (auf VK)</p>
                <p className="text-xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {totals.expectedMarginPercent.toFixed(1)}%
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Ø Standzeit</p>
                <p className="text-xl font-bold tabular-nums mt-0.5">{totals.averageDaysOnLot} Tage</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vehicle table */}
      <Card className="border-border/60">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <Layers className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Fahrzeuge im Paket</span>
            <span className="text-xs text-muted-foreground ml-auto">Zeile anklicken für Detailbewertung</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-3 font-medium">Modell</th>
                  <th className="pb-2 pr-3 font-medium text-right">km</th>
                  <th className="pb-2 pr-3 font-medium text-right">EK-Empf.</th>
                  <th className="pb-2 pr-3 font-medium text-right">Erw. VK</th>
                  <th className="pb-2 pr-3 font-medium text-right">Marge</th>
                  <th className="pb-2 pr-3 font-medium">Kanal</th>
                  <th className="pb-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {vehicles.map((v, i) => (
                  <tr
                    key={v.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setDrillIndex(i)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setDrillIndex(i)
                      }
                    }}
                    className="border-b border-border/40 cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-11 rounded overflow-hidden bg-muted shrink-0 ring-1 ring-border/40">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={v.imageUrl} alt={v.model} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="font-medium truncate">{v.model}</p>
                            {/* E3: Treiber vs. Mitnahme visuell unterscheidbar */}
                            <Badge variant="secondary" className={`shrink-0 text-[9px] px-1.5 py-0 ${packageRoleConfig[v.role].badge}`}>
                              {packageRoleConfig[v.role].label}
                            </Badge>
                          </div>
                          <p className="text-[10px] text-muted-foreground truncate">{v.firstRegistration} · {v.equipmentSummary}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 pr-3 text-right tabular-nums">{v.mileage.toLocaleString('de-DE')}</td>
                    <td className="py-2.5 pr-3 text-right tabular-nums">{formatCurrency(v.sweetSpot)}</td>
                    <td className="py-2.5 pr-3 text-right tabular-nums">{formatCurrency(v.expectedSalePrice)}</td>
                    <td className="py-2.5 pr-3 text-right tabular-nums text-emerald-600 dark:text-emerald-400 font-medium whitespace-nowrap">
                      {formatCurrency(v.margin)} ({v.marginPercent.toFixed(1)}%)
                    </td>
                    <td className="py-2.5 pr-3">
                      {v.channel === 'auktion' ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700 dark:bg-slate-800/50 dark:text-slate-300">
                                <Gavel className="h-2.5 w-2.5" /> Auktion <Info className="h-2.5 w-2.5 opacity-60" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-[240px] text-xs">{v.channelReason}</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                          Endkunde
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 text-right">
                      <ChevronRight className="h-4 w-4 text-muted-foreground/50 inline" />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border font-medium">
                  <td className="pt-2.5 pr-3">Σ Gesamt</td>
                  <td className="pt-2.5 pr-3" />
                  <td className="pt-2.5 pr-3 text-right tabular-nums">{formatCurrency(totals.ekRecommendation)}</td>
                  <td className="pt-2.5 pr-3 text-right tabular-nums">{formatCurrency(totals.expectedSaleTotal)}</td>
                  <td className="pt-2.5 pr-3 text-right tabular-nums text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                    {formatCurrency(totals.expectedMarginTotal)} ({totals.expectedMarginPercent.toFixed(1)}%)
                  </td>
                  <td className="pt-2.5" colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Bundle calculator */}
      <Card className="border-border/60">
        <CardContent className="p-5 sm:p-6 space-y-5">
          {/* Hero: ein klarer Verdict mit Marge */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${verdict.dot}`} />
                <span className="text-sm font-medium text-muted-foreground">Lohnt sich das Paket?</span>
              </div>
              <p className={`mt-1 text-3xl sm:text-4xl font-bold tracking-tight ${verdict.tone}`}>{verdict.label}</p>
              <p className="mt-1 text-base font-semibold tabular-nums">
                {formatCurrency(bundle.blendedMargin)}{' '}
                <span className="text-sm font-medium text-muted-foreground">Marge ({bundle.blendedMarginPercent.toFixed(1)}% auf Paketpreis)</span>
              </p>
            </div>

            <div className="shrink-0">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Drehscheiben-Paketpreis</Label>
              <div className="relative mt-1 w-[200px]">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-base font-medium">€</span>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={priceNum.toLocaleString('de-DE')}
                  onChange={(e) => setBundlePrice(e.target.value.replace(/[^0-9]/g, ''))}
                  className="pl-8 h-11 text-lg font-bold tabular-nums"
                />
              </div>
            </div>
          </div>

          {/* Ein schlichter Erklärsatz + genau eine Kennzahl */}
          <p className="text-sm text-muted-foreground">
            {totals.roleSplit.treiber} starke Fahrzeuge tragen {totals.roleSplit.mitnahme} schwächere — der Mischpreis entscheidet.
            Break-even bei <span className="tabular-nums font-medium text-foreground">{formatCurrency(bundle.breakEven)}</span>.
          </p>

          {/* Aufteilung — standardmäßig eingeklappt */}
          <div className="border-t border-border/60 pt-3">
            <button
              onClick={() => setShowAllocation((s) => !s)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronDown className={`h-4 w-4 transition-transform ${showAllocation ? 'rotate-180' : ''}`} />
              Aufteilung {showAllocation ? 'ausblenden' : 'anzeigen'}
            </button>
            {showAllocation && (
              <div className="mt-3 space-y-2 animate-in fade-in duration-200">
                {allocation.map((a) => (
                  <div key={a.id} className="flex items-center gap-3">
                    <span className="text-xs font-medium w-[120px] truncate">{a.model}</span>
                    <Progress value={(a.alloc / maxAlloc) * 100} className="h-2 flex-1" />
                    <span className="text-xs tabular-nums w-[72px] text-right">{formatCurrency(a.alloc)}</span>
                    <span className={`text-[11px] tabular-nums w-[88px] text-right ${a.margin >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                      {a.margin >= 0 ? '+' : ''}{formatCurrency(a.margin)} ({a.marginPercent.toFixed(0)}%)
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action bar */}
      <Card className="border-border/60 bg-gradient-to-r from-muted/40 via-muted/20 to-primary/[0.04]">
        <CardContent className="p-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium">Nächster Schritt</p>
            <p className="text-xs text-muted-foreground">
              Paket-EK ~{formatCurrency(priceNum)} &middot; Erw. VK {formatCurrency(totals.expectedSaleTotal)} &middot; Marge {formatCurrency(totals.expectedSaleTotal - priceNum)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 sm:flex-nowrap">
            <Button variant="ghost" onClick={onReset} className="shrink-0">
              <RefreshCw className="h-4 w-4 mr-2" />
              Neue Bewertung
            </Button>
            <Button variant="outline" className="shrink-0">
              <Check className="h-4 w-4 mr-2" />
              Paket ankaufen
            </Button>
            <Button
              onClick={() => onCreateInserat(vehicles.find((v) => v.channel === 'endkunde') ?? vehicles[0])}
              className="shrink-0 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-md shadow-indigo-500/20"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Inserate vorbereiten ({totals.channelSplit.endkunde})
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
