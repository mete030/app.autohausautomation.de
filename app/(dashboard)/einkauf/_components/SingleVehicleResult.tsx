'use client'

import { useState, type ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  channelLabels,
  regionalMarketFor,
  buildMarktDynamik,
  recommendedEk,
  buyRecommendationConfig,
  reasoningTypeLabel,
  packageRoleConfig,
  DATA_WINDOW_LABEL,
  SECONDARY_REFERENCE_NOTE,
  DEFAULT_TARGET_MARGIN_PCT,
  type EinkaufPricingResult,
  type VerwertungChannel,
  type SearchRadiusKm,
  type TrendDirection,
  type EquipmentCoverage,
} from '@/lib/mock-data-einkauf'
import { InserateTable } from './InserateTable'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Clock, ShieldCheck, Globe, Gavel, BarChart3, MapPin, TrendingUp, TrendingDown, Minus, AlertTriangle, Calculator, Sun, Snowflake, Package, Boxes, ShoppingCart } from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts'

interface SingleVehicleResultProps {
  result: EinkaufPricingResult
  resultsView: 'empfehlung' | 'details'
  /** Effektiver Kanal (z.B. nach manuellem Override); Default = result.channel. */
  channel?: VerwertungChannel
  /** Optional block rendered between the Hero card and the source cards (Empfehlung-Ansicht). */
  empfehlungInsert?: ReactNode
}

const chartColors = ['#2563eb', '#10b981', '#f97316', '#7c3aed']

// Trendpfeil (grün ↑ / rot ↓ / neutral) für KBA-Nachfrage & Co.
function TrendArrow({ dir, pct }: { dir: TrendDirection; pct: number }) {
  const Icon = dir === 'up' ? TrendingUp : dir === 'down' ? TrendingDown : Minus
  const tone =
    dir === 'up'
      ? 'text-emerald-600 dark:text-emerald-400'
      : dir === 'down'
        ? 'text-red-600 dark:text-red-400'
        : 'text-muted-foreground'
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold tabular-nums ${tone}`}>
      <Icon className="h-3.5 w-3.5" />
      {pct >= 0 ? '+' : ''}{pct}%
    </span>
  )
}

export function SingleVehicleResult({ result, resultsView, channel: channelProp, empfehlungInsert }: SingleVehicleResultProps) {
  const channel: VerwertungChannel = channelProp ?? result.channel ?? 'endkunde'
  const isAuction = channel === 'auktion'
  const L = channelLabels[channel]

  // B1: einstellbarer Radius; B2: regionale Aggregate skalieren sichtbar mit.
  const [radiusKm, setRadiusKm] = useState<SearchRadiusKm>(result.region?.radiusKm ?? 50)
  const regional = result.region ? regionalMarketFor(result, radiusKm) : null
  const demand = result.kbaDemand
  const segment = result.segmentSignal
  const umschlagLabel = (rate: number) => (rate >= 8 ? 'Dreht schnell' : rate >= 4 ? 'Mittel' : 'Träge')

  // C1/C2: Zielmarge → empfohlener EK (rückwärts aus regionalem VK). Reaktiv auf
  // Zielmarge UND Radius (Marktpreis-Basis ändert sich mit dem Umkreis).
  const [targetMarginPct, setTargetMarginPct] = useState<number>(isAuction ? 7 : DEFAULT_TARGET_MARGIN_PCT)
  const regionalVk = regional?.avgOfferPrice ?? result.mobileDe.medianPrice
  const derivedEk = recommendedEk(regionalVk, targetMarginPct)
  const derivedMarginEur = regionalVk - derivedEk

  // Markt im Umkreis: Angebot (8-Wochen-Inseratezahl) vs. Nachfrage (KBA) +
  // Klartext-Verdict zum Ankauf-Timing. Reaktiv auf den Radius.
  const markt = result.region ? buildMarktDynamik(result, radiusKm) : null
  // Farbe der Angebotskurve an das Verdict koppeln (gut=emerald, schwach=red, neutral=slate).
  const marktTone = markt?.verdict.tone ?? 'neutral'
  const marktColor = marktTone === 'gut' ? '#10b981' : marktTone === 'schwach' ? '#ef4444' : '#94a3b8'
  const marktDotClass =
    marktTone === 'gut' ? 'bg-emerald-500' : marktTone === 'schwach' ? 'bg-red-500' : 'bg-slate-400'
  const angebotVals = markt?.angebot.points.map((p) => p.value) ?? []
  const angebotMin = angebotVals.length ? Math.min(...angebotVals) : 0
  const angebotMax = angebotVals.length ? Math.max(...angebotVals) : 0
  const angebotPad = Math.max(1, Math.round((angebotMax - angebotMin) * 0.5))
  const angebotDomain: [number, number] = [Math.max(0, angebotMin - angebotPad), angebotMax + angebotPad]
  // Eigene Ausstattung des bewerteten Fahrzeugs als Vergleichsbasis für die Tabelle.
  const subjectEquipment = result.dat.adjustments
    .filter((a) => a.amount > 0)
    .map((a) => a.label)

  // G1–G5/B7: Transporter-spezifische Blöcke (nur im Transporter-Modus gesetzt).
  const transporter = result.vehicleType === 'transporter'
  const seasonal = result.seasonalTrend
  const coverage = result.equipmentCoverage
  const vorrat = result.vorratskauf
  const dealerSignals = result.dealerBuyingSignals
  const neuzulassungHinweis = result.segmentSignal?.neuzulassungsHinweis
  const rarityConfig: Record<EquipmentCoverage['rarity'], { label: string; badge: string }> = {
    einzigartig: { label: 'Einziger im Umkreis', badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' },
    selten: { label: 'Einer von wenigen', badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400' },
    verbreitet: { label: 'Verbreitet', badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300' },
  }

  const sellPrice = isAuction ? (result.auction?.expectedHammerPrice ?? result.mobileDe.medianPrice) : result.mobileDe.medianPrice
  const spread = isAuction ? (result.auction?.spread ?? sellPrice - result.sweetSpot) : sellPrice - result.sweetSpot

  const accentClass = isAuction
    ? 'bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300'
    : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'

  const chartData = [
    { source: 'Historisch (Ø EK)', value: result.historical.averagePurchasePrice },
    { source: 'DAT bereinigt', value: result.dat.adjustedValue },
    { source: isAuction ? 'Ø Auktionserlös' : 'mobile.de Median', value: sellPrice },
    { source: 'Empfehlung (EK)', value: result.sweetSpot },
  ]
  const values = chartData.map((d) => d.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const pad = (max - min) * 0.18 || 1500
  const domain: [number, number] = [
    Math.floor((min - pad) / 1000) * 1000,
    Math.ceil((max + pad) / 1000) * 1000,
  ]

  return (
    <>
      {/* ── Recommendation View ── */}
      {resultsView === 'empfehlung' && (
        <div className="space-y-5 animate-in fade-in duration-300">
          {/* B6: Segment-/Kraftstoff-Trend — eine kompakte, scannbare Zeile */}
          {segment && (() => {
            const dir = segment.segmentTrendDirection
            const TrendIcon = dir === 'up' ? TrendingUp : dir === 'down' ? TrendingDown : Minus
            const fuelLabel = segment.kraftstoffart.charAt(0).toUpperCase() + segment.kraftstoffart.slice(1)
            return (
              <div
                className={`flex flex-wrap items-center gap-x-2 gap-y-1.5 rounded-xl border px-4 py-2.5 text-xs ${
                  segment.caution
                    ? 'border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20'
                    : 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/15'
                }`}
              >
                <TrendIcon className={`h-4 w-4 ${segment.caution ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`} />
                <Badge variant="secondary" className="text-[10px]">{segment.segment}</Badge>
                <span className={`font-medium ${segment.caution ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                  {fuelLabel}-Trend {dir === 'up' ? 'steigend' : dir === 'down' ? 'rückläufig' : 'seitwärts'}
                </span>
                {segment.caution && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                    <AlertTriangle className="h-3 w-3" />
                    Kraftstoff-Trend rückläufig — kritisch prüfen
                  </span>
                )}
              </div>
            )
          })()}

          {/* Hero Price Card */}
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card">
            <CardContent className="p-6 sm:p-8">
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-6 items-center">
                <div className="text-center lg:text-left">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    Empfohlener Einkaufspreis
                  </p>
                  <div className="flex items-baseline gap-2 justify-center lg:justify-start">
                    <span className="text-4xl sm:text-5xl font-bold tracking-tight tabular-nums">
                      {formatCurrency(result.sweetSpot)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Bandbreite: {formatCurrency(result.recommendedMin)} &ndash; {formatCurrency(result.recommendedMax)}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-3 justify-center lg:justify-start">
                    {/* E1: Kauf-/Nicht-Kauf-Ampel */}
                    {result.buyDecision && (
                      <Badge
                        variant="secondary"
                        className={`text-xs font-semibold ${buyRecommendationConfig[result.buyDecision.recommendation].badge}`}
                      >
                        <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${buyRecommendationConfig[result.buyDecision.recommendation].dot}`} />
                        {buyRecommendationConfig[result.buyDecision.recommendation].label}
                      </Badge>
                    )}
                    {/* E2: Begründungstyp */}
                    {result.buyDecision && (
                      <Badge variant="outline" className="text-xs border-border/60">
                        {reasoningTypeLabel[result.buyDecision.reasoningType]}
                      </Badge>
                    )}
                    {/* E3: Paket-Rolle (nur im Paket-Kontext) */}
                    {result.packageRole && (
                      <Badge variant="secondary" className={`text-xs ${packageRoleConfig[result.packageRole].badge}`}>
                        {packageRoleConfig[result.packageRole].label}
                      </Badge>
                    )}
                    <Badge variant="secondary" className="text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                      {result.confidence}% Konfidenz
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {result.marketPosition.label}
                    </Badge>
                    <Badge variant="secondary" className={`text-xs ${accentClass}`}>
                      {isAuction ? <Gavel className="h-3 w-3 mr-1" /> : null}
                      {L.tag}
                    </Badge>
                  </div>
                  {/* E2: Begründungstext */}
                  {result.buyDecision && (
                    <p className="text-xs text-muted-foreground mt-2 max-w-md mx-auto lg:mx-0">
                      {result.buyDecision.rationale}
                    </p>
                  )}
                </div>

                <Separator orientation="vertical" className="hidden lg:block h-24" />
                <Separator className="lg:hidden" />

                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">{L.sellLabel}</p>
                    <p className="text-xl font-bold tabular-nums mt-0.5">{formatCurrency(sellPrice)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">{L.spreadLabel}</p>
                    <p className="text-xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {formatCurrency(spread)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Ø Marge (historisch)</p>
                    <p className="text-xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {result.historical.averageMarginPercent.toFixed(1)}%
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">{L.standzeitLabel}</p>
                    <p className="text-xl font-bold tabular-nums mt-0.5">
                      {result.historical.averageDaysOnLot.toFixed(0)} Tage
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Markt im Umkreis: Angebot vs. Nachfrage + Klartext-Ankauf-Timing (8 Wochen) */}
          {regional && markt && (
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    Markt im Umkreis
                    <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary border-0">
                      {DATA_WINDOW_LABEL}
                    </Badge>
                  </CardTitle>
                  {/* Standort + Radius-Umschalter */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Umkreis {regional.location}</span>
                    <div className="flex gap-1 rounded-lg border bg-muted p-1">
                      {([50, 100] as SearchRadiusKm[]).map((r) => (
                        <button
                          key={r}
                          onClick={() => setRadiusKm(r)}
                          className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                            radiusKm === r ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {r} km
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Verdict-Zeile: farbiger Punkt + Klartext-Fazit zum Ankauf-Timing */}
                <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
                  <span className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${marktDotClass}`} />
                  <span className="text-sm font-semibold">{markt.verdict.headline}</span>
                  <span className="w-full text-xs text-muted-foreground sm:w-auto sm:flex-1">
                    {markt.verdict.sentence}
                  </span>
                </div>

                {/* Angebot vs. Nachfrage — zwei klar getrennte Blöcke */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* ANGEBOT (Supply) */}
                  <div className="rounded-xl border border-border/60 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Angebot</p>
                      <TrendArrow dir={markt.angebot.direction} pct={markt.angebot.changePercent} />
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold tabular-nums">{markt.angebot.current}</span>
                      <span className="text-xs text-muted-foreground">vergleichbare Fahrzeuge</span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground tabular-nums">
                      <span>Ø {markt.standtage} Tage Standzeit</span>
                      <span>
                        {formatCurrency(regional.priceRange.min)} &ndash; {formatCurrency(regional.priceRange.max)}
                      </span>
                    </div>

                    {/* 8-Wochen-Angebotskurve mit beschrifteten Achsen */}
                    <div>
                      <p className="text-[10px] text-muted-foreground mb-1">
                        Angebot im Umkreis &mdash; letzte 8 Wochen (Anzahl vergleichbarer Inserate)
                      </p>
                      <div className="h-[112px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={markt.angebot.points} margin={{ top: 6, right: 8, bottom: 0, left: -18 }}>
                            <defs>
                              <linearGradient id="einkaufAngebotFill" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={marktColor} stopOpacity={0.32} />
                                <stop offset="100%" stopColor={marktColor} stopOpacity={0.02} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                            <YAxis
                              domain={angebotDomain}
                              allowDecimals={false}
                              width={32}
                              tick={{ fontSize: 9 }}
                              tickLine={false}
                              axisLine={false}
                            />
                            <XAxis
                              dataKey="week"
                              interval={1}
                              tick={{ fontSize: 9 }}
                              tickLine={false}
                              axisLine={false}
                            />
                            <RechartsTooltip
                              formatter={(v) => [`${v} Inserate`, 'Angebot']}
                              labelStyle={{ fontWeight: 600 }}
                            />
                            <Area
                              type="monotone"
                              dataKey="value"
                              stroke={marktColor}
                              strokeWidth={2}
                              fill="url(#einkaufAngebotFill)"
                              dot={false}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* NACHFRAGE (Demand) */}
                  <div className="rounded-xl border border-border/60 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Nachfrage</p>
                      <TrendArrow dir={markt.nachfrage.direction} pct={markt.nachfrage.changePercent} />
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold tabular-nums">{markt.nachfrage.umschlagsrate}%</span>
                      <span className="text-xs text-muted-foreground">Umschlagsrate / 8 Wo.</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground tabular-nums">
                      {markt.nachfrage.besitzumschreibungen} Besitzumschreibungen im Umkreis
                    </p>
                    {demand && (
                      <Badge
                        variant="secondary"
                        className={`text-[11px] ${
                          demand.umschlagsrate >= 8
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                            : demand.umschlagsrate >= 4
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
                              : 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400'
                        }`}
                      >
                        {umschlagLabel(demand.umschlagsrate)}
                      </Badge>
                    )}
                    <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                      <p className="text-[11px] text-muted-foreground">Ø Angebotspreis (Region)</p>
                      <p className="text-lg font-bold tabular-nums mt-0.5">{formatCurrency(regional.avgOfferPrice)}</p>
                    </div>
                  </div>
                </div>

                {/* Echte vergleichbare Inserate als Tabelle */}
                <InserateTable
                  comparables={result.mobileDe.comparables}
                  radiusKm={radiusKm}
                  location={regional.location}
                  subjectEquipment={subjectEquipment}
                  isAuction={isAuction}
                />

                <p className="text-[10px] text-muted-foreground">
                  Quelle: mobile.de Umkreissuche + KBA-Signale (Demo) &middot; Fenster {DATA_WINDOW_LABEL}.
                </p>
              </CardContent>
            </Card>
          )}

          {/* C1/C2: Zielmarge → empfohlener EK (rückwärts aus regionalem VK), reaktiv */}
          {regional && (
            <Card className="border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-muted-foreground" />
                  Preis- & Margenkalkulation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-sm font-medium">Zielmarge (auf VK)</span>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={5}
                      max={15}
                      step={0.5}
                      value={targetMarginPct}
                      onChange={(e) => setTargetMarginPct(Number(e.target.value))}
                      className="w-44 accent-primary"
                      aria-label="Zielmarge"
                    />
                    <span className="text-sm font-bold tabular-nums w-12 text-right">{targetMarginPct.toFixed(1)}%</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                    <p className="text-[11px] text-muted-foreground">Regionaler VK (Basis)</p>
                    <p className="text-lg font-bold tabular-nums mt-0.5">{formatCurrency(regionalVk)}</p>
                  </div>
                  <div className="rounded-lg border border-primary/30 bg-primary/[0.04] p-3">
                    <p className="text-[11px] text-muted-foreground">Empfohlener EK (= VK − Marge)</p>
                    <p className="text-lg font-bold tabular-nums mt-0.5">{formatCurrency(derivedEk)}</p>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                    <p className="text-[11px] text-muted-foreground">Erwartete Marge</p>
                    <p className="text-lg font-bold tabular-nums mt-0.5 text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(derivedMarginEur)} <span className="text-xs font-medium">({targetMarginPct.toFixed(1)}%)</span>
                    </p>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Engine-Empfehlung (EK): {formatCurrency(result.sweetSpot)} &middot; die Zielmarge rechnet den EK rückwärts aus dem regionalen Marktpreis (reagiert auf Radius &amp; Zielmarge).
                </p>
              </CardContent>
            </Card>
          )}

          {/* ── Transporter-Modus: Nischen-, Saison- & Beobachtungslogik (G2–G5, B7) ── */}
          {transporter && (
            <div className="space-y-5">
              {/* B7: Neuzulassungs-Frühindikator */}
              {neuzulassungHinweis && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs dark:border-amber-800 dark:bg-amber-950/20">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-semibold">Neuzulassungs-Frühindikator</span>
                    <p className="text-muted-foreground">{neuzulassungHinweis}</p>
                  </div>
                </div>
              )}

              {/* G2: Saisonale Nachfrage (Sommer/Winter) */}
              {seasonal && (
                <Card className="border-border/60">
                  <CardHeader className="pb-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Sun className="h-4 w-4 text-amber-500" />
                        Saisonale Nachfrage
                        <Badge variant="secondary" className="text-[10px]">Umkreis {seasonal.region}</Badge>
                      </CardTitle>
                      <div className="flex items-center gap-3 text-xs font-medium">
                        <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400"><Sun className="h-3.5 w-3.5" /> Sommer {seasonal.summerIndex}</span>
                        <span className="inline-flex items-center gap-1 text-sky-600 dark:text-sky-400"><Snowflake className="h-3.5 w-3.5" /> Winter {seasonal.winterIndex}</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[150px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={seasonal.points} margin={{ top: 6, right: 6, bottom: 0, left: -10 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                          <XAxis dataKey="month" tick={{ fontSize: 10 }} interval={0} />
                          <YAxis hide domain={[80, 'dataMax + 6']} />
                          <RechartsTooltip formatter={(v) => [`${v} Index`, 'Nachfrage']} labelStyle={{ fontWeight: 600 }} />
                          <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                            {seasonal.points.map((p, i) => (
                              <Cell key={i} fill={p.value >= 100 ? '#f59e0b' : '#94a3b8'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">{seasonal.note}</p>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* G3: Nischen-/Ausstattungsabdeckung */}
                {coverage && coverage.length > 0 && (
                  <Card className="border-border/60">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Boxes className="h-4 w-4 text-muted-foreground" />
                        Nischen-Abdeckung im Umkreis
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {coverage.map((c) => (
                        <div key={c.feature} className="flex items-center justify-between gap-2 text-sm">
                          <span className="truncate">{c.feature}</span>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs text-muted-foreground tabular-nums">{c.comparableInRegion}× in Region</span>
                            <Badge variant="secondary" className={`text-[10px] ${rarityConfig[c.rarity].badge}`}>
                              {rarityConfig[c.rarity].label}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* G4: Vorratskauf (lange Standzeit unkritisch) */}
                {vorrat && (
                  <Card className="border-border/60">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        Vorratskauf
                        {vorrat.recommended && (
                          <Badge variant="secondary" className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                            empfohlen
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-sm text-muted-foreground">{vorrat.note}</p>
                      <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-400">
                        <Clock className="h-3.5 w-3.5" />
                        Lange Standzeit wird im Transporter-Modus nicht negativ gewertet.
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* G5: Was kaufen andere Mercedes-Händler aktuell ein? (Frühindikator, nur Beobachtung) */}
              {dealerSignals && dealerSignals.length > 0 && (
                <Card className="border-border/60">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                      Was Mercedes-Händler aktuell einkaufen
                      <Badge variant="outline" className="text-[10px] border-border/60">nur Beobachtung</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {dealerSignals.map((s) => (
                      <div key={s.model} className="flex items-start justify-between gap-3 border-b border-border/40 pb-2.5 last:border-0 last:pb-0">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium truncate">{s.model}</span>
                            <TrendArrow dir={s.trend} pct={s.trend === 'up' ? 8 : s.trend === 'down' ? -8 : 0} />
                          </div>
                          <p className="text-[11px] text-muted-foreground">{s.note}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-lg font-bold tabular-nums">{s.dealersBuying}</p>
                          <p className="text-[10px] text-muted-foreground">Händler kaufen</p>
                        </div>
                      </div>
                    ))}
                    <p className="text-[10px] text-muted-foreground">
                      Nachfrage-Frühindikator aus Auktions-/Großhandelssignalen — reine Beobachtung, kein automatisches Bieten.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Optional inserted block (e.g. Listenplatz-Rechner) */}
          {empfehlungInsert}

          {/* Three Source Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-border/60 hover:shadow-md transition-shadow opacity-80">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
                    <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <span className="text-xs font-medium">{L.histTitle}</span>
                    <p className="text-[10px] text-muted-foreground">
                      {result.historical.sales.length} {isAuction ? 'Einlieferungen' : 'Verkäufe'}
                    </p>
                  </div>
                </div>
                <div className="text-2xl font-bold tabular-nums">{formatCurrency(result.historical.averageSalePrice)}</div>
                <p className="text-xs text-muted-foreground">{isAuction ? 'Ø Zuschlagserlös' : 'Ø Verkaufspreis'}</p>
                <div className="mt-3 pt-2.5 border-t border-border/40">
                  <span className="text-xs text-muted-foreground">
                    Ø {result.historical.averageDaysOnLot.toFixed(0)} Tage {isAuction ? 'bis Zuschlag' : 'Standzeit'}
                  </span>
                  <p className="text-[10px] italic text-muted-foreground/80 mt-1">{SECONDARY_REFERENCE_NOTE}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 hover:shadow-md transition-shadow opacity-80">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
                    <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <span className="text-xs font-medium">{L.datTitle}</span>
                    <p className="text-[10px] text-muted-foreground">{isAuction ? 'Händler-EK' : 'Offiziell'}</p>
                  </div>
                </div>
                <div className="text-2xl font-bold tabular-nums">{formatCurrency(result.dat.adjustedValue)}</div>
                <p className="text-xs text-muted-foreground">{L.datSub}</p>
                <div className="mt-3 pt-2.5 border-t border-border/40">
                  <span className="text-xs text-muted-foreground">
                    Basis {formatCurrency(result.dat.baseValue)} + {result.dat.adjustments.length} Korrekturen
                  </span>
                  <p className="text-[10px] italic text-muted-foreground/80 mt-1">{SECONDARY_REFERENCE_NOTE}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-8 w-8 rounded-lg bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center">
                    {isAuction ? (
                      <Gavel className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    ) : (
                      <Globe className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-medium">{L.source3Title}</span>
                    <p className="text-[10px] text-muted-foreground">
                      {result.mobileDe.count} {isAuction ? 'Referenzen' : 'Angebote'}
                    </p>
                  </div>
                </div>
                <div className="text-2xl font-bold tabular-nums">{formatCurrency(sellPrice)}</div>
                <p className="text-xs text-muted-foreground">{L.source3Sub}</p>
                <div className="mt-3 pt-2.5 border-t border-border/40">
                  <span className="text-xs text-muted-foreground">
                    {formatCurrency(result.mobileDe.lowestPrice)} &ndash; {formatCurrency(result.mobileDe.highestPrice)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chart */}
          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                Preisvergleich
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 30, top: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                  <XAxis
                    type="number"
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    tick={{ fontSize: 11 }}
                    domain={domain}
                  />
                  <YAxis type="category" dataKey="source" tick={{ fontSize: 11 }} width={130} />
                  <RechartsTooltip formatter={(v) => formatCurrency(Number(v))} labelStyle={{ fontWeight: 600 }} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={32}>
                    {chartData.map((_, index) => (
                      <Cell key={index} fill={chartColors[index]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Detail View ── */}
      {resultsView === 'details' && (
        <div className="space-y-5 animate-in fade-in duration-300">
          {/* Historical */}
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                {L.histTitle} ({result.historical.sales.length} {isAuction ? 'Einlieferungen' : 'vergleichbare Fahrzeuge'})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 pr-4 font-medium">Datum</th>
                      <th className="pb-2 pr-4 font-medium">Fahrzeug</th>
                      <th className="pb-2 pr-4 font-medium text-right">km</th>
                      <th className="pb-2 pr-4 font-medium text-right">EK</th>
                      <th className="pb-2 pr-4 font-medium text-right">{isAuction ? 'Zuschlag' : 'VK'}</th>
                      <th className="pb-2 pr-4 font-medium text-right">{isAuction ? 'Spread' : 'Marge'}</th>
                      <th className="pb-2 font-medium text-right">Tage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.historical.sales.map((sale) => (
                      <tr key={sale.id} className="border-b border-border/40">
                        <td className="py-2.5 pr-4 tabular-nums whitespace-nowrap">{formatDate(sale.date)}</td>
                        <td className="py-2.5 pr-4 text-xs max-w-[200px] truncate">{sale.vehicleDescription}</td>
                        <td className="py-2.5 pr-4 text-right tabular-nums">{sale.mileageAtSale.toLocaleString('de-DE')}</td>
                        <td className="py-2.5 pr-4 text-right tabular-nums">{formatCurrency(sale.purchasePrice)}</td>
                        <td className="py-2.5 pr-4 text-right tabular-nums">{formatCurrency(sale.salePrice)}</td>
                        <td className="py-2.5 pr-4 text-right tabular-nums text-emerald-600 dark:text-emerald-400 font-medium whitespace-nowrap">
                          {formatCurrency(sale.margin)} ({sale.marginPercent.toFixed(1)}%)
                        </td>
                        <td className="py-2.5 text-right tabular-nums">{sale.daysOnLot}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-border font-medium">
                      <td className="pt-2.5 pr-4">Durchschnitt</td>
                      <td className="pt-2.5 pr-4" />
                      <td className="pt-2.5 pr-4 text-right tabular-nums">&mdash;</td>
                      <td className="pt-2.5 pr-4 text-right tabular-nums">{formatCurrency(result.historical.averagePurchasePrice)}</td>
                      <td className="pt-2.5 pr-4 text-right tabular-nums">{formatCurrency(result.historical.averageSalePrice)}</td>
                      <td className="pt-2.5 pr-4 text-right tabular-nums text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                        {formatCurrency(result.historical.averageMargin)} ({result.historical.averageMarginPercent.toFixed(1)}%)
                      </td>
                      <td className="pt-2.5 text-right tabular-nums">{result.historical.averageDaysOnLot.toFixed(0)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* DAT */}
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                {L.datTitle} Bewertung
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="flex justify-between items-center text-sm py-2.5 border-b border-border/40">
                <span className="font-medium">Grundwert (DAT)</span>
                <span className="font-bold tabular-nums">{formatCurrency(result.dat.baseValue)}</span>
              </div>
              {result.dat.adjustments.map((adj, i) => (
                <div key={i} className="flex justify-between items-center text-sm py-2 border-b border-border/20">
                  <div>
                    <span>{adj.label}</span>
                    <p className="text-[10px] text-muted-foreground">{adj.reason}</p>
                  </div>
                  <span className={`font-medium tabular-nums shrink-0 ml-4 ${adj.amount >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                    {adj.amount >= 0 ? '+' : ''}{formatCurrency(adj.amount)}
                  </span>
                </div>
              ))}
              <Separator className="my-2" />
              <div className="flex justify-between items-center text-sm py-2.5">
                <span className="font-semibold">{L.datSub}</span>
                <span className="text-lg font-bold tabular-nums">{formatCurrency(result.dat.adjustedValue)}</span>
              </div>
              <p className="text-[10px] text-muted-foreground pt-1">
                Zustand: {result.dat.condition} &middot; Schwacke-ID: {result.dat.schwackeId} &middot; Stand: {formatDate(result.dat.valuationDate)}
              </p>
            </CardContent>
          </Card>

          {/* mobile.de / B2B comparables */}
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                {isAuction ? (
                  <Gavel className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                ) : (
                  <Globe className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                )}
                {isAuction
                  ? `B2B-Auktionsreferenzen (BCA / Autobid.de / Mercedes-Benz Remarketing) (${result.mobileDe.count})`
                  : `mobile.de Vergleichsangebote (${result.mobileDe.count})`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <InserateTable
                comparables={result.mobileDe.comparables}
                radiusKm={radiusKm}
                location={regional?.location ?? 'Nagold'}
                subjectEquipment={subjectEquipment}
                isAuction={isAuction}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
