'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  channelLabels,
  regionalMarketFor,
  buildMarktDynamik,
  recommendedEk,
  DATA_WINDOW_LABEL,
  SECONDARY_REFERENCE_NOTE,
  type EinkaufPricingResult,
  type VerwertungChannel,
  type SearchRadiusKm,
  type TrendDirection,
  type EquipmentCoverage,
} from '@/lib/mock-data-einkauf'
import { InserateTable } from './InserateTable'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  Clock,
  ShieldCheck,
  Globe,
  Gavel,
  BarChart3,
  MapPin,
  TrendingUp,
  TrendingDown,
  Minus,
  Sun,
  Snowflake,
  Boxes,
  ShoppingCart,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
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
  /** Verwertungskanal-Strip (nur PKW) — über der Hero-Karte gerendert. */
  channelStrip?: ReactNode
  /** Meldet den aus der Zielmarge abgeleiteten Einkaufspreis nach oben (Action-Bar/Inserat). */
  onDerivedEkChange?: (ek: number) => void
}

// Fakten-Modus-Farbpalette: Einkauf = blau, VK/Markt = violett, Marge-Korridor =
// grün/rot NUR als Geld-Vorzeichen. Keine Schwellen-/Ampel-Einfärbung.
const NEUTRAL_MARKET = '#2563eb'
const EK_COLOR = '#2563eb'
const VK_COLOR = '#7c3aed'
const MARGIN_POS = '#10b981'
const MARGIN_NEG = '#ef4444'

// Trendpfeil — IMMER neutral (Richtung eines Zählwerts ist keine Wertung).
function TrendArrow({ dir, pct }: { dir: TrendDirection; pct?: number }) {
  const Icon = dir === 'up' ? TrendingUp : dir === 'down' ? TrendingDown : Minus
  return (
    <span className="inline-flex items-center gap-0.5 text-xs font-medium tabular-nums text-muted-foreground">
      <Icon className="h-3.5 w-3.5" />
      {pct != null && (
        <>
          {pct >= 0 ? '+' : ''}
          {pct}%
        </>
      )}
    </span>
  )
}

// Kleine 2×2-Kennzahl im Hero.
function HeroStat({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: 'emerald' }) {
  return (
    <div className="text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-xl font-bold tabular-nums mt-0.5 ${tone === 'emerald' ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
        {value}
      </p>
      {sub && <p className="text-[11px] text-muted-foreground tabular-nums">{sub}</p>}
    </div>
  )
}

// Referenzwerte-Spalte (nachrangige Quellen DAT + eigene Historie).
function ReferenceColumn({
  icon,
  title,
  tag,
  rows,
}: {
  icon: ReactNode
  title: string
  tag: string
  rows: [string, string, boolean?][]
}) {
  return (
    <div className="rounded-xl border border-border/60 p-3">
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-xs font-semibold">{title}</span>
        <Badge variant="outline" className="text-[11px] ml-auto border-border/60 font-normal">
          {tag}
        </Badge>
      </div>
      <dl className="space-y-1">
        {rows.map(([k, v, pos]) => (
          <div key={k} className="flex justify-between gap-2 text-xs">
            <dt className="text-muted-foreground">{k}</dt>
            <dd className={`font-medium tabular-nums ${pos ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

// Zahlenstrahl-Marker: EK-Seite (track 1) vs. VK/Markt-Seite (track 2).
type Marker = { value: number; label: string; meaning: string; track: 1 | 2; emphasis?: boolean }

// Eigener Punkt (Emphasis-Marker bekommen einen Ring).
function PriceMarkerDot(props: { cx?: number; cy?: number; payload?: Marker }) {
  const { cx = 0, cy = 0, payload } = props
  if (!payload) return null
  const fill = payload.track === 1 ? EK_COLOR : VK_COLOR
  return (
    <g>
      {payload.emphasis && <circle cx={cx} cy={cy} r={8} fill="none" stroke={fill} strokeWidth={1.5} opacity={0.5} />}
      <circle cx={cx} cy={cy} r={payload.emphasis ? 5 : 4} fill={fill} />
    </g>
  )
}

export function SingleVehicleResult({
  result,
  resultsView,
  channel: channelProp,
  empfehlungInsert,
  channelStrip,
  onDerivedEkChange,
}: SingleVehicleResultProps) {
  const channel: VerwertungChannel = channelProp ?? result.channel ?? 'endkunde'
  const isAuction = channel === 'auktion'
  const L = channelLabels[channel]

  // B1: einstellbarer Radius; B2: regionale Aggregate skalieren sichtbar mit.
  const [radiusKm, setRadiusKm] = useState<SearchRadiusKm>(result.region?.radiusKm ?? 50)
  const regional = result.region ? regionalMarketFor(result, radiusKm) : null
  const demand = result.kbaDemand
  const segment = result.segmentSignal

  // Eine VK-Basis für alles (Hero-Marge, Sell-Stat, Zahlenstrahl, Action-Bar).
  const sellPrice = isAuction
    ? result.auction?.expectedHammerPrice ?? result.mobileDe.medianPrice
    : result.mobileDe.medianPrice
  const vkBasis = sellPrice
  const vkLabel = isAuction ? 'Ø Auktionserlös' : 'mobile.de-Median'

  // Ziel-EK = VK − Zielmarge (App-Konvention: Marge auf VK). Default aus der
  // eigenen Ø-Marge; reagiert auf den Regler. Meldet den EK nach oben.
  const [targetMarginPct, setTargetMarginPct] = useState<number>(
    Math.round(result.historical.averageMarginPercent * 2) / 2,
  )
  const mMin = isAuction ? 3 : 8
  const mMax = isAuction ? 13 : 28
  const derivedEk = recommendedEk(vkBasis, targetMarginPct)
  const derivedMarginEur = vkBasis - derivedEk
  useEffect(() => {
    onDerivedEkChange?.(derivedEk)
  }, [derivedEk, onDerivedEkChange])

  // Markt-Dynamik (Angebot vs. Nachfrage) — nur noch Fakten, kein Timing-Verdict.
  const markt = result.region ? buildMarktDynamik(result, radiusKm) : null
  const marktColor = NEUTRAL_MARKET
  const angebotVals = markt?.angebot.points.map((p) => p.value) ?? []
  const angebotMin = angebotVals.length ? Math.min(...angebotVals) : 0
  const angebotMax = angebotVals.length ? Math.max(...angebotVals) : 0
  const angebotPad = Math.max(1, Math.round((angebotMax - angebotMin) * 0.5))
  const angebotDomain: [number, number] = [Math.max(0, angebotMin - angebotPad), angebotMax + angebotPad]

  // Eigene Ausstattung des bewerteten Fahrzeugs als Vergleichsbasis für die Tabelle.
  const subjectEquipment = result.dat.adjustments.filter((a) => a.amount > 0).map((a) => a.label)

  // Transporter-spezifische Blöcke (nur im Transporter-Modus gesetzt).
  const transporter = result.vehicleType === 'transporter'
  const seasonal = result.seasonalTrend
  const coverage = result.equipmentCoverage
  const dealerSignals = result.dealerBuyingSignals
  const neuzulassungPct = result.segmentSignal?.neuzulassungsTrendPercent
  // Rarity bleibt ein zählwertbasiertes Faktum — Label ja, Farbe neutral.
  const rarityLabel: Record<EquipmentCoverage['rarity'], string> = {
    einzigartig: 'Einziger im Umkreis',
    selten: 'Einer von wenigen',
    verbreitet: 'Verbreitet',
  }
  const neutralBadge = 'bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300'

  // ── Zahlenstrahl-Daten (Preisvergleich) ──
  const ekMarkers: Marker[] = [
    { value: result.historical.averagePurchasePrice, label: 'Ø EK (Historie)', meaning: 'Ø Einkauf der letzten Verkäufe', track: 1 },
    ...(isAuction
      ? [{ value: result.dat.adjustedValue, label: 'DAT Händler-EK', meaning: 'DAT/Schwacke Händler-Einkaufswert', track: 1 as const }]
      : []),
    { value: derivedEk, label: 'Ziel-EK', meaning: `EK bei ${targetMarginPct.toFixed(1)}% Zielmarge (Regler oben)`, track: 1, emphasis: true },
  ]
  const vkMarkers: Marker[] = [
    { value: result.historical.averageSalePrice, label: 'Ø VK (Historie)', meaning: 'Ø Verkaufserlös der letzten Verkäufe', track: 2 },
    ...(isAuction
      ? []
      : [{ value: result.dat.adjustedValue, label: 'DAT bereinigt', meaning: 'DAT/Schwacke bereinigter Marktwert', track: 2 as const }]),
    {
      value: vkBasis,
      label: isAuction ? 'Ø Auktionserlös' : 'mobile.de-Median',
      meaning: isAuction ? 'Ø erwarteter Zuschlag' : 'Median vergleichbarer Angebote im Umkreis',
      track: 2,
      emphasis: true,
    },
  ]
  const allMarkers = [...ekMarkers, ...vkMarkers]
  const rawMin = Math.min(...allMarkers.map((m) => m.value))
  const rawMax = Math.max(...allMarkers.map((m) => m.value))
  const span = rawMax - rawMin || 1000
  const pad = span * 0.15
  const chartDomain: [number, number] = [
    Math.floor((rawMin - pad) / 1000) * 1000,
    Math.ceil((rawMax + pad) / 1000) * 1000,
  ]
  // Nahe beieinander liegende Marker einer Spur vertikal versetzen.
  const scatterData = (['1', '2'] as const).flatMap((t) => {
    const on = allMarkers.filter((m) => String(m.track) === t).sort((a, b) => a.value - b.value)
    let dir = 1
    return on.map((m, i) => {
      const near = i > 0 && Math.abs(m.value - on[i - 1].value) < span * 0.02
      if (near) dir = -dir
      const y = Number(t) + (near ? dir * 0.14 : 0)
      return { x: m.value, y, ...m }
    })
  })
  const fmtK = (v: number) => `${(v / 1000).toFixed(0)}k`

  return (
    <>
      {/* ── Recommendation View ── */}
      {resultsView === 'empfehlung' && (
        <div className="space-y-5 animate-in fade-in duration-300">
          {/* Segment-/Kraftstoff-Trend — eine kompakte, neutrale Faktenzeile */}
          {segment &&
            (() => {
              const dir = segment.segmentTrendDirection
              const TrendIcon = dir === 'up' ? TrendingUp : dir === 'down' ? TrendingDown : Minus
              return (
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 rounded-xl border border-border/60 bg-muted/30 px-4 py-2.5 text-xs">
                  <TrendIcon className="h-4 w-4 text-muted-foreground" />
                  <Badge variant="secondary" className="text-[10px]">
                    {segment.segment}
                  </Badge>
                  <span className="text-muted-foreground">{segment.segmentTrendLabel}</span>
                </div>
              )
            })()}

          {/* Verwertungskanal-Strip (nur PKW) — über der Hero-Karte, die er steuert */}
          {channelStrip}

          {/* Hero — transparente EK-Rechnung (Ziel-EK aus VK − Zielmarge) */}
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card">
            <CardContent className="p-6 sm:p-8">
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-6 items-center">
                <div className="text-center lg:text-left">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    Ziel-Einkaufspreis
                  </p>
                  <div className="flex items-baseline gap-2 justify-center lg:justify-start">
                    <span className="text-4xl sm:text-5xl font-bold tracking-tight tabular-nums">
                      {formatCurrency(derivedEk)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Engine-Spanne: {formatCurrency(result.recommendedMin)} &ndash; {formatCurrency(result.recommendedMax)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 tabular-nums">
                    {formatCurrency(vkBasis)} {vkLabel} &minus; {targetMarginPct.toFixed(1)}% ={' '}
                    <span className="font-medium text-foreground">{formatCurrency(derivedEk)}</span>
                  </p>

                  {/* Zielmarge-Regler */}
                  <div className="mt-3 flex items-center gap-3 justify-center lg:justify-start">
                    <span className="text-xs font-medium whitespace-nowrap">Zielmarge (auf VK)</span>
                    <input
                      type="range"
                      min={mMin}
                      max={mMax}
                      step={0.5}
                      value={targetMarginPct}
                      onChange={(e) => setTargetMarginPct(Number(e.target.value))}
                      className="w-36 accent-primary"
                      aria-label="Zielmarge"
                    />
                    <span className="text-sm font-bold tabular-nums w-12 text-right">{targetMarginPct.toFixed(1)}%</span>
                  </div>

                  {/* Fakten-Chips */}
                  <div className="flex flex-wrap items-center gap-2 mt-3 justify-center lg:justify-start">
                    <Badge variant="secondary" className={`text-xs ${neutralBadge}`}>
                      {isAuction ? <Gavel className="h-3 w-3 mr-1" /> : null}
                      {L.tag}
                    </Badge>
                    {result.marketPosition?.percentile != null && (
                      <Badge variant="secondary" className="text-xs">
                        EK im {result.marketPosition.percentile}. Perzentil der Regionalangebote
                      </Badge>
                    )}
                  </div>
                </div>

                <Separator orientation="vertical" className="hidden lg:block h-24" />
                <Separator className="lg:hidden" />

                <div className="grid grid-cols-2 gap-4">
                  <HeroStat label={L.sellLabel} value={formatCurrency(sellPrice)} />
                  <HeroStat
                    label={`${isAuction ? 'Spread' : 'Marge'} bei diesem EK`}
                    value={formatCurrency(derivedMarginEur)}
                    tone="emerald"
                  />
                  <HeroStat
                    label="Ø Marge (Historie)"
                    value={`${result.historical.averageMarginPercent.toFixed(1)}%`}
                    tone="emerald"
                  />
                  <HeroStat label={L.standzeitLabel} value={`${result.historical.averageDaysOnLot.toFixed(0)} Tage`} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Markt im Umkreis: Angebot (mobile.de) vs. Nachfrage (KBA) — nur Fakten */}
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
                {/* Neutrale Relations-Zeile: mobile.de-Angebot neben KBA-Nachfrage */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-xs">
                  <span className="text-muted-foreground">
                    Angebot (mobile.de):{' '}
                    <span className="font-semibold text-foreground tabular-nums">{markt.angebot.current}</span> vergleichbare
                    &middot; Ø {markt.standtage} Tage Standzeit
                  </span>
                  <span className="hidden text-border sm:inline">&middot;</span>
                  <span className="text-muted-foreground">
                    Nachfrage (KBA):{' '}
                    <span className="font-semibold text-foreground tabular-nums">{markt.nachfrage.umschlagsrate}%</span>{' '}
                    Umschlagsrate &middot; {markt.nachfrage.besitzumschreibungen} Umschreibungen / 8 Wo.
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* ANGEBOT (Quelle mobile.de) */}
                  <div className="rounded-xl border border-border/60 p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Angebot</p>
                      <div className="flex items-center gap-2">
                        <TrendArrow dir={markt.angebot.direction} pct={markt.angebot.changePercent} />
                        <Badge variant="outline" className="text-[10px] border-border/60 font-normal">
                          Quelle: mobile.de
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold tabular-nums">{markt.angebot.current}</span>
                      <span className="text-xs text-muted-foreground">vergleichbare Fahrzeuge</span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground tabular-nums">
                      <span>Median VK {formatCurrency(result.mobileDe.medianPrice)}</span>
                      <span>
                        {formatCurrency(regional.priceRange.min)} &ndash; {formatCurrency(regional.priceRange.max)}
                      </span>
                      <span>Ø {markt.standtage} Tage Standzeit</span>
                    </div>

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
                            <XAxis dataKey="week" interval={1} tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                            <RechartsTooltip formatter={(v) => [`${v} Inserate`, 'Angebot']} labelStyle={{ fontWeight: 600 }} />
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

                  {/* NACHFRAGE (Quelle KBA) */}
                  <div className="rounded-xl border border-border/60 p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Nachfrage</p>
                      <div className="flex items-center gap-2">
                        <TrendArrow dir={markt.nachfrage.direction} pct={markt.nachfrage.changePercent} />
                        <Badge variant="outline" className="text-[10px] border-border/60 font-normal">
                          Quelle: KBA
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold tabular-nums">{markt.nachfrage.umschlagsrate}%</span>
                      <span className="text-xs text-muted-foreground">Umschlagsrate / 8 Wo.</span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground tabular-nums">
                      <span>{markt.nachfrage.besitzumschreibungen} Besitzumschreibungen</span>
                      {demand && <span>Bestand {demand.regionalerBestand.toLocaleString('de-DE')}</span>}
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Umschlagsrate = Besitzumschreibungen &divide; regionaler Bestand (letzte 8 Wochen).
                    </p>
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

          {/* ── Transporter-Modus: Nischen-, Saison- & Beobachtungsfakten ── */}
          {transporter && (
            <div className="space-y-5">
              {/* Neuzulassungs-Frühindikator (neutrale Zahl) */}
              {neuzulassungPct != null && (
                <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-4 py-2.5 text-xs">
                  <span className="font-medium">Neuzulassungen (Segment)</span>
                  <TrendArrow dir={neuzulassungPct >= 0 ? 'up' : 'down'} pct={neuzulassungPct} />
                  <span className="text-muted-foreground">im Quartal</span>
                </div>
              )}

              {/* Saisonale Nachfrage (Sommer/Winter) */}
              {seasonal && (
                <Card className="border-border/60">
                  <CardHeader className="pb-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Sun className="h-4 w-4 text-amber-500" />
                        Saisonale Nachfrage
                        <Badge variant="secondary" className="text-[10px]">
                          Umkreis {seasonal.region}
                        </Badge>
                      </CardTitle>
                      <div className="flex items-center gap-3 text-xs font-medium">
                        <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                          <Sun className="h-3.5 w-3.5" /> Sommer {seasonal.summerIndex}
                        </span>
                        <span className="inline-flex items-center gap-1 text-sky-600 dark:text-sky-400">
                          <Snowflake className="h-3.5 w-3.5" /> Winter {seasonal.winterIndex}
                        </span>
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
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Index 100 = Jahresschnitt &middot; Sommer {seasonal.summerIndex} / Winter {seasonal.winterIndex}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Nischen-/Ausstattungsabdeckung im Umkreis (volle Breite) */}
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
                          <Badge variant="secondary" className={`text-[10px] ${neutralBadge}`}>
                            {rarityLabel[c.rarity]}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Was Mercedes-Händler aktuell einkaufen (Fakten: Count + Trend-Token) */}
              {dealerSignals && dealerSignals.length > 0 && (
                <Card className="border-border/60">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                      Was Mercedes-Händler aktuell einkaufen
                      <Badge variant="outline" className="text-[10px] border-border/60">
                        nur Beobachtung
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {dealerSignals.map((s) => (
                      <div
                        key={s.model}
                        className="flex items-center justify-between gap-3 border-b border-border/40 pb-2.5 last:border-0 last:pb-0"
                      >
                        <div className="min-w-0 flex items-center gap-2">
                          <span className="text-sm font-medium truncate">{s.model}</span>
                          <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                            Trend: {s.trend === 'up' ? 'steigend' : s.trend === 'down' ? 'rückläufig' : 'stabil'}
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-lg font-bold tabular-nums">{s.dealersBuying}</p>
                          <p className="text-[10px] text-muted-foreground">Händler kaufen</p>
                        </div>
                      </div>
                    ))}
                    <p className="text-[10px] text-muted-foreground">
                      Quelle: Auktions-/Großhandelssignale (Demo) — reine Beobachtung, kein automatisches Bieten.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Optional inserted block (z.B. Listenplatz-Rechner) */}
          {empfehlungInsert}

          {/* Referenzwerte (nachrangige Quellen: DAT + eigene Historie) */}
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ReferenceColumn
                icon={<ShieldCheck className="h-4 w-4" />}
                title={L.datTitle}
                tag={isAuction ? 'Händler-EK' : 'Offiziell'}
                rows={[
                  [L.datSub, formatCurrency(result.dat.adjustedValue)],
                  ['Grundwert', formatCurrency(result.dat.baseValue)],
                  [
                    'Korrekturen',
                    `${result.dat.adjustments.length} · ${result.dat.totalAdjustment >= 0 ? '+' : ''}${formatCurrency(result.dat.totalAdjustment)}`,
                  ],
                  ['Stand', formatDate(result.dat.valuationDate)],
                ]}
              />
              <ReferenceColumn
                icon={<Clock className="h-4 w-4" />}
                title={L.histTitle}
                tag="Referenz"
                rows={[
                  ['Ø VK', formatCurrency(result.historical.averageSalePrice)],
                  [
                    'Ø Marge',
                    `${formatCurrency(result.historical.averageMargin)} (${result.historical.averageMarginPercent.toFixed(1)}%)`,
                    true,
                  ],
                  [L.standzeitLabel, `${result.historical.averageDaysOnLot.toFixed(0)} Tage`],
                  [isAuction ? 'Einlieferungen' : 'Verkäufe', String(result.historical.sales.length)],
                ]}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">
              Nachrangige Referenz &middot; {SECONDARY_REFERENCE_NOTE}. Primärvergleich (mobile.de ↔ KBA) siehe „Markt im
              Umkreis“.
            </p>
          </div>

          {/* Preisvergleich — Zahlenstrahl: Einkauf-Seite vs. VK/Markt-Seite */}
          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                Preisvergleich
                <span className="text-xs font-normal text-muted-foreground">— Einkauf-Seite vs. VK/Markt-Seite</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ left: 8, right: 24, top: 16, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" dataKey="x" domain={chartDomain} tickFormatter={fmtK} tick={{ fontSize: 11 }} />
                    <YAxis
                      type="number"
                      dataKey="y"
                      domain={[0.4, 2.6]}
                      ticks={[1, 2]}
                      tick={{ fontSize: 10 }}
                      tickFormatter={(v) => (v === 1 ? 'EINKAUF' : isAuction ? 'AUKTION' : 'VK / MARKT')}
                      width={72}
                    />
                    <ReferenceArea
                      x1={Math.min(derivedEk, vkBasis)}
                      x2={Math.max(derivedEk, vkBasis)}
                      y1={0.4}
                      y2={2.6}
                      fill={derivedMarginEur >= 0 ? MARGIN_POS : MARGIN_NEG}
                      fillOpacity={0.08}
                    />
                    <ReferenceLine x={derivedEk} stroke={EK_COLOR} strokeDasharray="4 3" />
                    <Scatter data={scatterData} shape={<PriceMarkerDot />}>
                      <LabelList dataKey="x" position="top" formatter={(v) => formatCurrency(Number(v))} style={{ fontSize: 10 }} />
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              {/* Faktische Legende (kein Verdict) */}
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                {allMarkers.map((m) => (
                  <span key={m.label} className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <span className="h-2 w-2 rounded-full" style={{ background: m.track === 1 ? EK_COLOR : VK_COLOR }} />
                    <span className="font-medium text-foreground">{m.label}</span> — {m.meaning}
                  </span>
                ))}
                <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span
                    className="h-2 w-3 rounded-sm"
                    style={{ background: derivedMarginEur >= 0 ? MARGIN_POS : MARGIN_NEG, opacity: 0.3 }}
                  />
                  <span className="font-medium text-foreground">Marge-Korridor</span> — Ziel-EK ↔ VK ={' '}
                  {formatCurrency(derivedMarginEur)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Detail View ── */}
      {resultsView === 'details' && (
        <div className="space-y-5 animate-in fade-in duration-300">
          {/* Verwertungskanal-Strip (nur PKW) */}
          {channelStrip}

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
                  <span
                    className={`font-medium tabular-nums shrink-0 ml-4 ${adj.amount >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}
                  >
                    {adj.amount >= 0 ? '+' : ''}
                    {formatCurrency(adj.amount)}
                  </span>
                </div>
              ))}
              <Separator className="my-2" />
              <div className="flex justify-between items-center text-sm py-2.5">
                <span className="font-semibold">{L.datSub}</span>
                <span className="text-lg font-bold tabular-nums">{formatCurrency(result.dat.adjustedValue)}</span>
              </div>
              <p className="text-[10px] text-muted-foreground pt-1">
                Zustand: {result.dat.condition} &middot; Schwacke-ID: {result.dat.schwackeId} &middot; Stand:{' '}
                {formatDate(result.dat.valuationDate)}
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
