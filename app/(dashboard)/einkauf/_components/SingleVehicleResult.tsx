'use client'

import { useState, type ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { priceCategoryConfig } from '@/lib/constants'
import {
  channelLabels,
  regionalMarketFor,
  recommendedEk,
  DATA_WINDOW_LABEL,
  SECONDARY_REFERENCE_NOTE,
  DEFAULT_TARGET_MARGIN_PCT,
  type EinkaufPricingResult,
  type VerwertungChannel,
  type SearchRadiusKm,
  type TrendDirection,
} from '@/lib/mock-data-einkauf'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Clock, ShieldCheck, Globe, Gavel, BarChart3, MapPin, TrendingUp, TrendingDown, Minus, AlertTriangle, Activity, Calculator } from 'lucide-react'
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

  // D1/D2: Trade-Republic-Trend — Farbe grün bei Aufwärts-, rot bei Abwärtstrend.
  const trend = result.trend
  const trendColor = trend?.direction === 'down' ? '#ef4444' : trend?.direction === 'up' ? '#10b981' : '#94a3b8'
  const trendVals = trend?.points.map((p) => p.value) ?? []
  const trendMin = trendVals.length ? Math.min(...trendVals) : 0
  const trendMax = trendVals.length ? Math.max(...trendVals) : 0
  const trendPad = (trendMax - trendMin) * 0.4 || 500
  const trendDomain: [number, number] = [Math.round(trendMin - trendPad), Math.round(trendMax + trendPad)]

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
          {/* B6: Makro-Badge — Segment-/Kraftstoff-Trend über dem Fahrzeug, mit Vorsicht-Flag */}
          {segment && (
            <div
              className={`flex flex-wrap items-center gap-x-2 gap-y-1.5 rounded-xl border px-4 py-2.5 text-xs ${
                segment.caution
                  ? 'border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20'
                  : 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/15'
              }`}
            >
              <span className="font-semibold">Segment-Trend</span>
              <Badge variant="secondary" className="text-[10px]">{segment.segment}</Badge>
              <span className="text-muted-foreground">{segment.segmentTrendLabel}</span>
              {segment.caution && (
                <span className="inline-flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Vorsicht: Segment-/Kraftstoff-Trend rückläufig — Empfehlung kritisch prüfen
                </span>
              )}
            </div>
          )}

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

          {/* D1/D2: Markttrend im Trade-Republic-Stil (8 Wochen, grün ↑ / rot ↓) */}
          {trend && (
            <Card className="border-border/60">
              <CardHeader className="pb-1">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    Markttrend
                    <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary border-0">
                      {DATA_WINDOW_LABEL}
                    </Badge>
                  </CardTitle>
                  <TrendArrow dir={trend.direction} pct={trend.changePercent} />
                </div>
              </CardHeader>
              <CardContent className="pt-1">
                <div className="h-[120px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trend.points} margin={{ top: 6, right: 8, bottom: 0, left: 8 }}>
                      <defs>
                        <linearGradient id="einkaufTrendFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={trendColor} stopOpacity={0.35} />
                          <stop offset="100%" stopColor={trendColor} stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <YAxis hide domain={trendDomain} />
                      <XAxis dataKey="week" hide />
                      <RechartsTooltip formatter={(v) => formatCurrency(Number(v))} labelStyle={{ fontWeight: 600 }} />
                      <Area type="monotone" dataKey="value" stroke={trendColor} strokeWidth={2} fill="url(#einkaufTrendFill)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">Signal kombiniert: {trend.drivers}</p>
              </CardContent>
            </Card>
          )}

          {/* B1/B2/B3/B5: Regionaler Markt & KBA-Nachfrage (Datenfenster „Letzte 8 Wochen" = erste Klasse) */}
          {regional && (
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    Regionaler Markt
                    <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary border-0">
                      {DATA_WINDOW_LABEL}
                    </Badge>
                  </CardTitle>
                  {/* B1: Standort + Radius-Umschalter */}
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
                {/* B2: regionale mobile.de-Marktdaten */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <p className="text-[11px] text-muted-foreground">Ø Angebotspreis (Region)</p>
                    <p className="text-lg font-bold tabular-nums">{formatCurrency(regional.avgOfferPrice)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground">Preis-Range</p>
                    <p className="text-sm font-semibold tabular-nums mt-1.5">
                      {formatCurrency(regional.priceRange.min)} &ndash; {formatCurrency(regional.priceRange.max)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground">Gleiches Modell im Umkreis</p>
                    <p className="text-lg font-bold tabular-nums">{regional.countSameModelInRegion}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground">Ø Standtage (Region)</p>
                    <p className="text-lg font-bold tabular-nums">{regional.avgStandtage} Tage</p>
                  </div>
                </div>

                {/* B3/B5: KBA-Nachfrage — Umschlagsrate hervorgehoben, rohe Umschreibungszahl sekundär */}
                {demand && (
                  <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                          Nachfrage-Indikator (KBA · Besitzumschreibungen)
                        </p>
                        <div className="flex items-baseline gap-2 mt-0.5">
                          <span className="text-3xl font-bold tabular-nums">{demand.umschlagsrate}%</span>
                          <span className="text-xs text-muted-foreground">Umschlagsrate / 8 Wo.</span>
                          <TrendArrow dir={demand.trendDirection} pct={demand.changePercent} />
                        </div>
                        {/* B3: rohe Umschreibungszahl bleibt sichtbar, aber sekundär */}
                        <p className="text-[11px] text-muted-foreground mt-1 tabular-nums">
                          {demand.besitzumschreibungenLast8Weeks} Besitzumschreibungen ÷ {demand.regionalerBestand.toLocaleString('de-DE')} regionaler Bestand
                        </p>
                      </div>
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
                    </div>
                  </div>
                )}

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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {result.mobileDe.comparables.map((comp) => {
                  const cat = priceCategoryConfig[comp.priceCategory]
                  return (
                    <div key={comp.id} className="rounded-lg border border-border/60 p-3 hover:shadow-sm transition-shadow">
                      <p className="text-sm font-medium line-clamp-2 mb-2 min-h-[2.5rem]">{comp.title}</p>
                      <div className="text-xl font-bold tabular-nums mb-1">{formatCurrency(comp.price)}</div>
                      <div className="flex flex-wrap gap-x-1.5 text-[10px] text-muted-foreground">
                        <span>{comp.mileage.toLocaleString('de-DE')} km</span>
                        <span>&middot;</span>
                        <span>EZ {comp.firstRegistration}</span>
                        <span>&middot;</span>
                        <span>{comp.location}</span>
                      </div>
                      <div className="mt-2.5 flex items-center justify-between">
                        <Badge variant="secondary" className={`${cat.bg} ${cat.color} text-[10px]`}>
                          {cat.label}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">{comp.daysListed}d {isAuction ? 'Gebot' : 'online'}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
