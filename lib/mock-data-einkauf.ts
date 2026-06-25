import type { PriceCategory } from './types'
import { mercedesMedia } from './mercedes-inventory'

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface EinkaufVehicleData {
  vin: string
  make: string
  model: string
  modelYear: number
  firstRegistration: string
  color: string
  fuelType: string
  transmission: string
  power: number
  displacement: number
  mileage: number
  serienausstattung: string[]
  sonderausstattung: string[]
  imageUrl: string
}

export interface HistoricalSale {
  id: string
  date: string
  vehicleDescription: string
  mileageAtSale: number
  salePrice: number
  purchasePrice: number
  daysOnLot: number
  margin: number
  marginPercent: number
}

export interface DATAdjustment {
  label: string
  amount: number
  reason: string
}

export interface DATValuation {
  baseValue: number
  adjustments: DATAdjustment[]
  totalAdjustment: number
  adjustedValue: number
  valuationDate: string
  condition: string
  schwackeId: string
}

export interface MobileDeComparable {
  id: string
  title: string
  price: number
  mileage: number
  year: number
  firstRegistration: string
  location: string
  dealerName: string
  daysListed: number
  priceCategory: PriceCategory
}

// ─── Verwertungskanal (Endkunde vs. Auktion/Remarketing) ─────────────────────

export type VerwertungChannel = 'endkunde' | 'auktion'
export type EinkaufCondition = 'sehr_gut' | 'gut' | 'maengel' | 'unfallschaden'
export type RuleSeverity = 'hard' | 'soft'

export interface RoutingRule {
  id: 'R1' | 'R2' | 'R3' | 'R4' | 'R5' | 'R6'
  label: string
  severity: RuleSeverity
  triggered: boolean
  actualText: string // z.B. "145.800 km" / "9 Jahre (EZ 06/2017)"
  routesTo: VerwertungChannel | null
}

export interface ChannelDecision {
  channel: VerwertungChannel // Engine-Empfehlung
  recommendedChannel: VerwertungChannel // == channel vor Override
  confidence: number
  score: number // Summe der weichen Risiko-Punkte
  rationale: string // einzeiliges deutsches Urteil
  triggeredRules: RoutingRule[] // alle bewertet; .triggered markiert ausgelöste
}

export interface AuctionBenchmark {
  platform: 'BCA' | 'Autobid.de' | 'MB Remarketing'
  medianHammer: number
  lowest: number
  highest: number
  count: number
  note: string
}

export interface AuctionResult {
  expectedHammerPrice: number // Ø erwarteter Zuschlag (Aggregat)
  spread: number // expectedHammerPrice − sweetSpot
  spreadPercent: number // Marge auf Auktionserlös (einstellig)
  avgDaysToHammer: number
  benchmarks: AuctionBenchmark[]
}

// ─── B1–B7: Regionale Marktsicht & KBA-/Nachfrage-Signale (8-Wochen-Fenster) ──
// Glaubwürdige Demo-Mocks. Echte Quellen docken hier an:
// TODO[real-backend]: mobile.de Umkreissuche (PLZ + Radius) für region/regionalMobile.
// TODO[real-backend]: KBA-Signale via Marktdaten-Anbieter (nicht roh vom KBA) für kbaDemand/segmentSignal.

export type SearchRadiusKm = 50 | 100
export type TrendDirection = 'up' | 'down' | 'flat'
export type Kraftstoffart = 'diesel' | 'benzin' | 'hybrid' | 'bev'

export const DEFAULT_REGION_LOCATION = 'Nagold'
export const DEFAULT_RADIUS_KM: SearchRadiusKm = 50
export const DATA_WINDOW_LABEL = 'Letzte 8 Wochen' // B4: erstklassiges Datenfenster
export const SECONDARY_REFERENCE_NOTE = 'Referenz, nicht tagesaktuell' // B4: DAT/Historie nachrangig

export interface RegionalMarket {
  location: string
  radiusKm: SearchRadiusKm
  avgOfferPrice: number // Ø regionaler mobile.de-Angebotspreis
  priceRange: { min: number; max: number }
  countSameModelInRegion: number // gleiches Modell im Umkreis
  avgStandtage: number // Ø Standtage in der Region
}

export interface KbaDemand {
  besitzumschreibungenLast8Weeks: number // rohe Umschreibungszahl (B3 — in B5 sekundär)
  trendDirection: TrendDirection
  changePercent: number // ggü. Vorperiode
  windowLabel: string // 'Letzte 8 Wochen'
  regionalerBestand: number // zugel. Fahrzeuge des Modells in Region (B5)
  umschlagsrate: number // = Umschreibungen ÷ Bestand · 100 (B5 — hervorgehoben)
}

export interface SegmentSignal {
  segment: string
  kraftstoffart: Kraftstoffart
  segmentTrendLabel: string // z.B. 'Diesel −12 % · Hybrid +18 % (Quartal)'
  segmentTrendDirection: TrendDirection
  caution: boolean // true => Vorsicht-Flag an der Empfehlung (B6)
  neuzulassungsTrendPercent?: number // B7 (optional, v.a. Transporter)
  neuzulassungsHinweis?: string // B7 Warnhinweis
}

// D1/D2: Trade-Republic-Stil-Trendserie. Kombiniertes Mock-Signal aus Standtage,
// Regionalpreis und Besitzumschreibungen.
export interface TrendPoint {
  week: string
  value: number
}
export interface TrendSignal {
  points: TrendPoint[] // 8 Wochenpunkte
  direction: TrendDirection
  changePercent: number // %-Veränderung über das Fenster
  drivers: string // welche Mock-Inputs das Signal speisen (D2)
}

// E1/E2/E3: Kaufempfehlung, Begründungstyp, Paket-Rolle.
export type BuyRecommendation = 'kaufen' | 'pruefen' | 'ablehnen'
export type ReasoningType = 'preis_marge' | 'verkaufsgeschwindigkeit'
export type PackageRole = 'treiber' | 'mitnahme'

export interface BuyDecision {
  recommendation: BuyRecommendation
  reasoningType: ReasoningType
  rationale: string
}

// G1–G5/B7: Transporter-Modus (~20 %, nachfragegetriebene Nischenlogik).
export type VehicleType = 'pkw' | 'transporter'

export interface SeasonalTrend {
  region: string
  summerIndex: number // relativer Nachfrage-/Preisindex Sommer (100 = Jahresschnitt)
  winterIndex: number
  points: { month: string; value: number }[] // 12 Monate für den Saison-Chart
  note: string
}
export interface EquipmentCoverage {
  feature: string // z.B. 'Kühlkoffer'
  comparableInRegion: number // vergleichbare Fahrzeuge mit diesem Merkmal im Umkreis
  rarity: 'einzigartig' | 'selten' | 'verbreitet'
}
export interface DealerBuyingSignal {
  model: string
  dealersBuying: number // Anzahl Händler, die das Modell aktuell EINKAUFEN (Nachfrage-Frühindikator)
  trend: TrendDirection
  note: string
}

export interface EinkaufPricingResult {
  recommendedMin: number
  recommendedMax: number
  sweetSpot: number
  confidence: number

  historical: {
    averageSalePrice: number
    averagePurchasePrice: number
    averageMargin: number
    averageMarginPercent: number
    averageDaysOnLot: number
    sales: HistoricalSale[]
  }

  dat: DATValuation

  mobileDe: {
    medianPrice: number
    averagePrice: number
    lowestPrice: number
    highestPrice: number
    count: number
    comparables: MobileDeComparable[]
  }

  marketPosition: {
    percentile: number
    label: string
  }

  // Verwertungskanal — fehlt bei Bestandsdaten => 'endkunde'. Der `auction`-Block
  // trägt die B2B-Kennzahlen; mobileDe/historical/dat tragen im Auktionsfall
  // B2B-kohärente Werte (gleiche Render-Komponenten, kanal-bewusste Labels).
  channel?: VerwertungChannel
  auction?: AuctionResult

  // Regionale & KBA-/Nachfrage-Signale (8-Wochen-Fenster) — alle optional, damit
  // Bestands-Render nicht bricht. region = 50-km-Basis; regionalMarketFor() skaliert.
  region?: RegionalMarket
  kbaDemand?: KbaDemand
  segmentSignal?: SegmentSignal
  trend?: TrendSignal // D1/D2: 8-Wochen-Trendserie (kombiniertes Signal)
  buyDecision?: BuyDecision // E1/E2: Kaufempfehlung + Begründungstyp
  packageRole?: PackageRole // E3: nur im Paket-Kontext gesetzt

  // Transporter-Modus (G1–G5) — nur bei vehicleType==='transporter' gesetzt.
  vehicleType?: VehicleType // G1
  seasonalTrend?: SeasonalTrend // G2
  equipmentCoverage?: EquipmentCoverage[] // G3
  vorratskauf?: { recommended: boolean; note: string } // G4
  dealerBuyingSignals?: DealerBuyingSignal[] // G5
}

// ─── Helper für regionale Marktsicht & KBA-Signale ───────────────────────────

// B1: Radius-Änderung skaliert die regionalen Mock-Aggregate sichtbar. Die in
// `result.region` gespeicherte Basis gilt als 50-km-Wert; 100 km wird hochskaliert
// (mehr Angebot → leicht niedrigerer Ø-Preis, etwas trägere Standtage).
// TODO[real-backend]: mobile.de Umkreissuche (PLZ + Radius).
export function regionalMarketFor(result: EinkaufPricingResult, radiusKm: SearchRadiusKm): RegionalMarket {
  const base = result.region
  if (!base) {
    return {
      location: DEFAULT_REGION_LOCATION,
      radiusKm,
      avgOfferPrice: result.mobileDe.averagePrice,
      priceRange: { min: result.mobileDe.lowestPrice, max: result.mobileDe.highestPrice },
      countSameModelInRegion: radiusKm === 100 ? 18 : 8,
      avgStandtage: radiusKm === 100 ? 41 : 34,
    }
  }
  if (radiusKm === base.radiusKm) return base
  const grow = radiusKm === 100 ? 2.2 : 1 / 2.2
  return {
    ...base,
    radiusKm,
    countSameModelInRegion: Math.round(base.countSameModelInRegion * grow),
    avgOfferPrice: base.avgOfferPrice + (radiusKm === 100 ? -300 : 300),
    avgStandtage: radiusKm === 100 ? base.avgStandtage + 7 : Math.max(18, base.avgStandtage - 7),
  }
}

// B3/B5: KBA-Nachfrage-Signal inkl. abgeleiteter Umschlagsrate.
// TODO[real-backend]: KBA-Signale via Marktdaten-Anbieter (nicht roh vom KBA).
export function buildKbaDemand(o: {
  besitzumschreibungen: number
  bestand: number
  trend: TrendDirection
  changePercent: number
}): KbaDemand {
  return {
    besitzumschreibungenLast8Weeks: o.besitzumschreibungen,
    trendDirection: o.trend,
    changePercent: o.changePercent,
    windowLabel: DATA_WINDOW_LABEL,
    regionalerBestand: o.bestand,
    umschlagsrate: o.bestand ? Math.round((o.besitzumschreibungen / o.bestand) * 1000) / 10 : 0,
  }
}

// B6/B7: Segment-/Kraftstoff-Makrotrend. Diesel kippt → Vorsicht-Flag, auch wenn
// die Einzelwerte gut aussehen. neuzulassungs* optional (B7, v.a. Transporter).
// TODO[real-backend]: KBA-Signale via Marktdaten-Anbieter (nicht roh vom KBA).
export function buildSegmentSignal(
  kraftstoffart: Kraftstoffart,
  opts?: { segment?: string; neuzulassungsTrendPercent?: number },
): SegmentSignal {
  const map: Record<Kraftstoffart, { dir: TrendDirection; caution: boolean; label: string }> = {
    diesel: { dir: 'down', caution: true, label: 'Diesel −12 % · Hybrid +18 % · Benzin +4 % (Quartal)' },
    benzin: { dir: 'up', caution: false, label: 'Benziner +4 % · Hybrid +18 % · Diesel −12 % (Quartal)' },
    hybrid: { dir: 'up', caution: false, label: 'Hybrid +18 % · Benzin +4 % · Diesel −12 % (Quartal)' },
    bev: { dir: 'up', caution: false, label: 'BEV +24 % · Hybrid +18 % · Diesel −12 % (Quartal)' },
  }
  const m = map[kraftstoffart]
  const nz = opts?.neuzulassungsTrendPercent
  return {
    segment: opts?.segment ?? 'Premium-SUV (kompakt)',
    kraftstoffart,
    segmentTrendLabel: m.label,
    segmentTrendDirection: m.dir,
    caution: m.caution,
    neuzulassungsTrendPercent: nz,
    neuzulassungsHinweis:
      nz != null && nz > 15
        ? `Neuzulassungen aktuell +${nz} % — künftig mehr Gebrauchtangebot, Preisdruck möglich.`
        : undefined,
  }
}

// C1/C2: empfohlener EK = regionaler VK − Zielmarge (Marge auf VK, App-Konvention).
export const DEFAULT_TARGET_MARGIN_PCT = 9 // Default-Zielmarge (8–10 %)
export function recommendedEk(regionalVk: number, targetMarginPct: number): number {
  return Math.round(regionalVk * (1 - targetMarginPct / 100))
}

// D1/D2: 8-Wochen-Trendserie als kombiniertes Mock-Signal (Standtage + Regionalpreis
// + Besitzumschreibungen). Richtung: KBA-Trend dominiert, hohe Umschlagsrate /
// niedrige Standtage stützen „up". Serie endet beim baseValue (heutiger Wert).
// TODO[real-backend]: Signal aus realen Zeitreihen (mobile.de Preisindex + KBA-Reihe).
export function computeTrendSignal(o: {
  baseValue: number
  kbaTrend: TrendDirection
  kbaChangePercent: number
  umschlagsrate: number
  avgStandtage: number
}): TrendSignal {
  const speedBonus =
    (o.umschlagsrate >= 8 ? 1 : o.umschlagsrate >= 4 ? 0 : -1) +
    (o.avgStandtage <= 30 ? 1 : o.avgStandtage >= 45 ? -1 : 0)
  const dirScore = (o.kbaTrend === 'up' ? 1 : o.kbaTrend === 'down' ? -1 : 0) + speedBonus
  const direction: TrendDirection = dirScore > 0 ? 'up' : dirScore < 0 ? 'down' : 'flat'
  const changePercent = Math.round((o.kbaChangePercent + speedBonus * 1.5) * 10) / 10
  const weeks = 8
  const points: TrendPoint[] = Array.from({ length: weeks }, (_, i) => {
    const t = i / (weeks - 1)
    const drift = (changePercent / 100) * o.baseValue * (t - 1) // endet bei baseValue (t=1)
    const wobble = ((i % 3) - 1) * o.baseValue * 0.006 // kleines deterministisches Rauschen
    return { week: `KW ${i + 1}`, value: Math.round(o.baseValue + drift + wobble) }
  })
  const drivers = `Standtage ${o.avgStandtage} T · Umschlagsrate ${o.umschlagsrate} % · KBA ${o.kbaChangePercent >= 0 ? '+' : ''}${o.kbaChangePercent} %`
  return { points, direction, changePercent, drivers }
}

// E1/E2: Kauf-/Nicht-Kauf-Empfehlung + Begründungstyp aus den Mock-Signalen (§4.1):
// hohe Umschlagsrate → „dreht schnell" (Verkaufsgeschwindigkeit); unter Markt + gute
// Marge → Preis/Marge. Negativer Segment-Trend stuft trotz guter Werte ab (B6-Kopplung).
// TODO[real-backend]: KI/Scoring statt Heuristik.
export function buildRecommendation(o: {
  channel: VerwertungChannel
  marginPercent: number
  umschlagsrate: number
  marketPercentile: number // niedrig = unter Markt (günstig im Einkauf)
  segmentCaution: boolean
}): BuyDecision {
  const fast = o.umschlagsrate >= 8
  const underMarket = o.marketPercentile <= 45
  const marginKaufen = o.channel === 'auktion' ? 6 : 12
  const marginPruefen = o.channel === 'auktion' ? 4 : 8

  const reasoningType: ReasoningType =
    underMarket && o.marginPercent >= marginKaufen
      ? 'preis_marge'
      : fast
        ? 'verkaufsgeschwindigkeit'
        : 'preis_marge'

  let recommendation: BuyRecommendation =
    o.marginPercent >= marginKaufen && (fast || underMarket)
      ? 'kaufen'
      : o.marginPercent >= marginPruefen
        ? 'pruefen'
        : 'ablehnen'
  // §4.1: rückläufiger Segment-/Kraftstoff-Trend stuft „kaufen" auf „prüfen" ab.
  if (o.segmentCaution && recommendation === 'kaufen') recommendation = 'pruefen'

  const rationale =
    recommendation === 'ablehnen'
      ? 'Marge zu dünn / Nachfrage schwach — nur als Paket-Mitnahme vertretbar.'
      : reasoningType === 'verkaufsgeschwindigkeit'
        ? `Dreht schnell (Umschlagsrate ${o.umschlagsrate} %) — kurze Standzeit, schneller Kapitalrücklauf.`
        : `${o.marginPercent.toFixed(1)} % erwartete Marge bei ${underMarket ? 'Preis unter Markt' : 'marktüblichem Preis'}.`
  return { recommendation, reasoningType, rationale }
}

export function classifyRole(o: { channel: VerwertungChannel; marginPercent: number }): PackageRole {
  return o.channel === 'endkunde' && o.marginPercent >= 12 ? 'treiber' : 'mitnahme'
}

// UI-Konfiguration (Ampel) für die Kaufempfehlung.
export const buyRecommendationConfig: Record<BuyRecommendation, { label: string; tone: string; dot: string; badge: string }> = {
  kaufen: {
    label: 'Kaufen',
    tone: 'text-emerald-700 dark:text-emerald-400',
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400',
  },
  pruefen: {
    label: 'Prüfen',
    tone: 'text-amber-700 dark:text-amber-400',
    dot: 'bg-amber-500',
    badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
  },
  ablehnen: {
    label: 'Nicht kaufen',
    tone: 'text-red-700 dark:text-red-400',
    dot: 'bg-red-500',
    badge: 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400',
  },
}
export const reasoningTypeLabel: Record<ReasoningType, string> = {
  preis_marge: 'Preis/Marge',
  verkaufsgeschwindigkeit: 'Verkaufsgeschwindigkeit',
}
export const packageRoleConfig: Record<PackageRole, { label: string; badge: string }> = {
  treiber: { label: 'Treiber', badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' },
  mitnahme: { label: 'Mitnahme', badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300' },
}

// Kraftstoffart aus Modell-/Antriebsstring ableiten (Demo-Heuristik).
export function kraftstoffartFromModel(model: string, fuelType?: string): Kraftstoffart {
  const s = `${model} ${fuelType ?? ''}`.toLowerCase()
  if (/\beq|\bbev|elektro/.test(s)) return 'bev'
  if (/hybrid|\d+\s*e\b|plug/.test(s)) return 'hybrid'
  if (/\bd\b|diesel|220\s*d|300\s*d/.test(s)) return 'diesel'
  return 'benzin'
}

// ─── Mock: VIN-Decode ────────────────────────────────────────────────────────

export const einkaufVinMock: EinkaufVehicleData = {
  vin: 'W1N2546021F789012',
  make: 'Mercedes-Benz',
  model: 'GLC 300 4MATIC',
  modelYear: 2023,
  firstRegistration: '05/2023',
  color: 'Spektralblau metallic',
  fuelType: 'Benzin',
  transmission: '9G-TRONIC',
  power: 258,
  displacement: 1999,
  mileage: 32400,
  serienausstattung: [
    'LED High Performance Scheinwerfer',
    'Klimaautomatik THERMATIC',
    'Rückfahrkamera',
    'Park-Assistent mit PARKTRONIC',
    'Sitzheizung vorne',
    'DAB+ Digitalradio',
    'Apple CarPlay / Android Auto',
    'Tempomat mit Limiter',
    'Spurhalte-Assistent',
    'Müdigkeitserkennung ATTENTION ASSIST',
  ],
  sonderausstattung: [
    'AMG Line Exterieur',
    'AMG Line Interieur',
    'Night-Paket',
    'Panorama-Schiebedach',
    'Burmester 3D-Surround-Soundsystem',
    'Head-up-Display',
    '360-Grad-Kamera',
    'Memory-Paket',
    'AIRMATIC Luftfederung',
    'Fahrassistenz-Paket Plus',
    'Anhängerkupplung schwenkbar',
    'Keyless-Go Komfort-Paket',
    'MBUX Navigation Premium',
    'Lederausstattung ARTICO/Dinamica',
  ],
  imageUrl: mercedesMedia.glcExterior,
}

// ─── Mock: Historische Verkäufe ──────────────────────────────────────────────

export const einkaufHistoricalSales: HistoricalSale[] = [
  {
    id: 'hist-1',
    date: '2026-01-18',
    vehicleDescription: 'GLC 300 4MATIC AMG Line, EZ 05/2023, Spektralblau',
    mileageAtSale: 19800,
    salePrice: 54200,
    purchasePrice: 44800,
    daysOnLot: 14,
    margin: 9400,
    marginPercent: 17.3,
  },
  {
    id: 'hist-2',
    date: '2025-11-15',
    vehicleDescription: 'GLC 300 4MATIC AMG Line, EZ 03/2022, Obsidianschwarz',
    mileageAtSale: 38200,
    salePrice: 48900,
    purchasePrice: 39800,
    daysOnLot: 23,
    margin: 9100,
    marginPercent: 18.6,
  },
  {
    id: 'hist-3',
    date: '2025-09-03',
    vehicleDescription: 'GLC 300 4MATIC, EZ 06/2023, Selenitgrau',
    mileageAtSale: 24500,
    salePrice: 52400,
    purchasePrice: 43200,
    daysOnLot: 18,
    margin: 9200,
    marginPercent: 17.6,
  },
  {
    id: 'hist-4',
    date: '2025-06-22',
    vehicleDescription: 'GLC 300 4MATIC AMG Line Night, EZ 01/2023, Graphitgrau',
    mileageAtSale: 29800,
    salePrice: 51200,
    purchasePrice: 42100,
    daysOnLot: 31,
    margin: 9100,
    marginPercent: 17.8,
  },
  {
    id: 'hist-5',
    date: '2025-03-10',
    vehicleDescription: 'GLC 300 4MATIC, EZ 09/2022, Polarweiß',
    mileageAtSale: 41600,
    salePrice: 46800,
    purchasePrice: 38400,
    daysOnLot: 27,
    margin: 8400,
    marginPercent: 17.9,
  },
]

// ─── Mock: DAT/Schwacke ─────────────────────────────────────────────────────

export const einkaufDATValuation: DATValuation = {
  baseValue: 47200,
  adjustments: [
    { label: 'Kilometerlaufleistung', amount: -1800, reason: '32.400 km vs. 30.000 km Durchschnitt' },
    { label: 'AMG Line + Night-Paket', amount: 3200, reason: 'Hochwertige Ausstattungslinie' },
    { label: 'Panorama-Schiebedach', amount: 1100, reason: 'Wertstabiles Extra' },
    { label: 'Burmester Sound + Head-up', amount: 900, reason: 'Premium Infotainment' },
    { label: 'AIRMATIC Luftfederung', amount: 800, reason: 'Komfort-Sonderausstattung' },
    { label: 'Fahrassistenz-Paket Plus', amount: 600, reason: 'Sicherheitspaket' },
    { label: 'Allgemeiner Zustand', amount: -400, reason: 'Gut, leichte Gebrauchsspuren' },
  ],
  totalAdjustment: 4400,
  adjustedValue: 51600,
  valuationDate: '2026-03-11',
  condition: 'Gut (Note 2)',
  schwackeId: 'MB-GLC-300-4M-X254-2023',
}

// ─── Mock: mobile.de Vergleichsangebote ─────────────────────────────────────

export const einkaufMobileDeComparables: MobileDeComparable[] = [
  {
    id: 'mde-1',
    title: 'Mercedes-Benz GLC 300 4MATIC AMG Line Night-Paket',
    price: 53900,
    mileage: 28400,
    year: 2023,
    firstRegistration: '03/2023',
    location: 'Stuttgart',
    dealerName: 'Stern Center Stuttgart',
    daysListed: 12,
    priceCategory: 'gut',
  },
  {
    id: 'mde-2',
    title: 'Mercedes-Benz GLC 300 4MATIC',
    price: 48500,
    mileage: 42100,
    year: 2023,
    firstRegistration: '01/2023',
    location: 'München',
    dealerName: 'AutoNova GmbH',
    daysListed: 34,
    priceCategory: 'zufriedenstellend',
  },
  {
    id: 'mde-3',
    title: 'Mercedes-Benz GLC 300 4MATIC AMG Line Pano Burmester',
    price: 55200,
    mileage: 19800,
    year: 2023,
    firstRegistration: '06/2023',
    location: 'Hamburg',
    dealerName: 'Hanse Automobile',
    daysListed: 8,
    priceCategory: 'gut',
  },
  {
    id: 'mde-4',
    title: 'Mercedes-Benz GLC 300 4MATIC',
    price: 46900,
    mileage: 51200,
    year: 2022,
    firstRegistration: '11/2022',
    location: 'Frankfurt',
    dealerName: 'Main Auto Center',
    daysListed: 45,
    priceCategory: 'sehr_gut',
  },
  {
    id: 'mde-5',
    title: 'Mercedes-Benz GLC 300 4MATIC AMG Night',
    price: 52400,
    mileage: 31600,
    year: 2023,
    firstRegistration: '04/2023',
    location: 'Düsseldorf',
    dealerName: 'Rhein-Ruhr Sterne',
    daysListed: 19,
    priceCategory: 'gut',
  },
  {
    id: 'mde-6',
    title: 'Mercedes-Benz GLC 300 4MATIC AMG Line HUD Pano',
    price: 57800,
    mileage: 15200,
    year: 2023,
    firstRegistration: '08/2023',
    location: 'Berlin',
    dealerName: 'Stern Berlin',
    daysListed: 6,
    priceCategory: 'erhoht',
  },
  {
    id: 'mde-7',
    title: 'Mercedes-Benz GLC 300 4MATIC AMG',
    price: 51200,
    mileage: 35800,
    year: 2023,
    firstRegistration: '02/2023',
    location: 'Köln',
    dealerName: 'Kölner Stern',
    daysListed: 22,
    priceCategory: 'gut',
  },
]

// ─── Mock: Aggregiertes Ergebnis ─────────────────────────────────────────────

export const einkaufPricingResult: EinkaufPricingResult = {
  recommendedMin: 41500,
  recommendedMax: 44800,
  sweetSpot: 43200,
  confidence: 91,

  historical: {
    averageSalePrice: 50700,
    averagePurchasePrice: 41660,
    averageMargin: 9040,
    averageMarginPercent: 17.8,
    averageDaysOnLot: 22.6,
    sales: einkaufHistoricalSales,
  },

  dat: einkaufDATValuation,

  mobileDe: {
    medianPrice: 52400,
    averagePrice: 52271,
    lowestPrice: 46900,
    highestPrice: 57800,
    count: 7,
    comparables: einkaufMobileDeComparables,
  },

  marketPosition: {
    percentile: 35,
    label: 'Unter Markt',
  },

  channel: 'endkunde',

  // Regionale Marktsicht (50-km-Basis) + heiße KBA-Nachfrage (junger, gefragter GLC).
  region: {
    location: DEFAULT_REGION_LOCATION,
    radiusKm: 50,
    avgOfferPrice: 52271,
    priceRange: { min: 46900, max: 57800 },
    countSameModelInRegion: 9,
    avgStandtage: 34,
  },
  kbaDemand: buildKbaDemand({ besitzumschreibungen: 142, bestand: 980, trend: 'up', changePercent: 9 }),
  segmentSignal: buildSegmentSignal('benzin'),
  trend: computeTrendSignal({ baseValue: 52400, kbaTrend: 'up', kbaChangePercent: 9, umschlagsrate: 14.5, avgStandtage: 34 }),
  buyDecision: buildRecommendation({ channel: 'endkunde', marginPercent: 17.8, umschlagsrate: 14.5, marketPercentile: 35, segmentCaution: false }),
}

// ─── Kanal-Labels (eine Quelle für alle kanal-bewussten Texte) ───────────────

export const channelLabels = {
  endkunde: {
    tag: 'Endkundenfahrzeug',
    accent: 'emerald' as const,
    sellLabel: 'Erwart. Verkaufspreis',
    spreadLabel: 'Erwart. Marge',
    standzeitLabel: 'Ø Standzeit',
    histTitle: 'Eigene Verkaufshistorie',
    source3Title: 'mobile.de',
    source3Sub: 'Median-Preis',
    datTitle: 'DAT / Schwacke',
    datSub: 'Bereinigter Marktwert',
    cta: 'Inserat erstellen',
    nextLabel: 'Verkauf',
  },
  auktion: {
    tag: 'Auktions-/Remarketing-Fahrzeug',
    accent: 'slate' as const,
    sellLabel: 'Erwart. Auktionserlös',
    spreadLabel: 'Erwart. Spread',
    standzeitLabel: 'Ø Tage bis Zuschlag',
    histTitle: 'Eigene Auktions-Einlieferungen',
    source3Title: 'B2B-Remarketing',
    source3Sub: 'Ø Zuschlag',
    datTitle: 'Händler-Einkaufswert',
    datSub: 'Bereinigter Händler-EK',
    cta: 'Auktion einliefern',
    nextLabel: 'Zuschlag',
  },
} as const

// ─── Routing-Engine (deterministisch; liest live mileage + condition) ────────

const ROUTING_REFERENCE_YEAR = 2026 // Demo-Bezugsjahr (entspricht currentDate)

export function evaluateChannel(
  v: EinkaufVehicleData,
  mileage: number,
  condition: EinkaufCondition,
  vorhalter: number,
): ChannelDecision {
  const ezYear = Number(v.firstRegistration.split('/')[1]) || v.modelYear
  const age = ROUTING_REFERENCE_YEAR - ezYear

  const rules: RoutingRule[] = [
    {
      id: 'R1',
      label: 'Alter > 5 Jahre',
      severity: 'hard',
      triggered: age > 5,
      actualText: `${age} Jahre (EZ ${v.firstRegistration})`,
      routesTo: 'auktion',
    },
    {
      id: 'R2',
      label: 'Laufleistung > 120.000 km',
      severity: 'hard',
      triggered: mileage > 120000,
      actualText: `${mileage.toLocaleString('de-DE')} km`,
      routesTo: 'auktion',
    },
    {
      id: 'R3',
      label: 'Unfallschaden',
      severity: 'hard',
      triggered: condition === 'unfallschaden',
      actualText: condition === 'unfallschaden' ? 'gemeldet' : 'keiner',
      routesTo: 'auktion',
    },
    {
      id: 'R4',
      label: 'Mängel vorhanden',
      severity: 'soft',
      triggered: condition === 'maengel',
      actualText: condition === 'maengel' ? 'Steinschlag, Hagel' : '—',
      routesTo: null,
    },
    {
      id: 'R5',
      label: '> 3 Vorhalter',
      severity: 'soft',
      triggered: vorhalter > 3,
      actualText: `${vorhalter} Vorhalter`,
      routesTo: null,
    },
    {
      id: 'R6',
      label: 'Alter × km-Kombi (> 3 J. & > 90.000 km)',
      severity: 'soft',
      triggered: age > 3 && mileage > 90000,
      actualText: `${age} J. · ${mileage.toLocaleString('de-DE')} km`,
      routesTo: null,
    },
  ]

  const hard = rules.some((r) => r.severity === 'hard' && r.triggered)
  const score = rules.filter((r) => r.severity === 'soft' && r.triggered).length
  const channel: VerwertungChannel = hard || score >= 2 ? 'auktion' : 'endkunde'
  const confidence = hard ? 96 : score >= 2 ? 81 : 92
  const rationale =
    channel === 'auktion'
      ? 'Alter und Laufleistung liegen außerhalb des Endkunden-Profils — Verwertung über B2B-Händlerauktion empfohlen.'
      : 'Junges, marktgängiges Fahrzeug — Endkundengeschäft mit voller Handelsmarge empfohlen.'

  return { channel, recommendedChannel: channel, confidence, score, rationale, triggeredRules: rules }
}

// ─── Mock: Auktions-GLC (Demo-VIN B) ─────────────────────────────────────────

export const einkaufVinMockAuktion: EinkaufVehicleData = {
  vin: 'W1N2530841A442178',
  make: 'Mercedes-Benz',
  model: 'GLC 250 4MATIC',
  modelYear: 2017,
  firstRegistration: '06/2017',
  color: 'Obsidianschwarz metallic',
  fuelType: 'Benzin',
  transmission: '9G-TRONIC',
  power: 211,
  displacement: 1991,
  mileage: 145800,
  serienausstattung: [
    'LED High Performance Scheinwerfer',
    'Klimaautomatik THERMATIC',
    'Rückfahrkamera',
    'Park-Assistent mit PARKTRONIC',
    'Sitzheizung vorne',
    'Tempomat mit Limiter',
  ],
  sonderausstattung: [
    'Navigation Garmin MAP PILOT',
    'Spiegel-Paket',
    'Anhängerkupplung',
    'Sitzkomfort-Paket',
  ],
  imageUrl: mercedesMedia.glcExterior,
}

// ─── Mock: Auktions-Historie (B2B-Einlieferungen) ────────────────────────────

export const einkaufAuktionHistoricalSales: HistoricalSale[] = [
  {
    id: 'auk-1',
    date: '2026-05-12',
    vehicleDescription: 'GLC 220 d 4MATIC, EZ 04/2016, 158.000 km · BCA Hamburg',
    mileageAtSale: 158000,
    salePrice: 11800,
    purchasePrice: 11000,
    daysOnLot: 4,
    margin: 800,
    marginPercent: 6.8,
  },
  {
    id: 'auk-2',
    date: '2026-04-03',
    vehicleDescription: 'GLC 250 4MATIC, EZ 02/2017, 142.000 km · Autobid.de',
    mileageAtSale: 142000,
    salePrice: 13100,
    purchasePrice: 12300,
    daysOnLot: 6,
    margin: 800,
    marginPercent: 6.1,
  },
  {
    id: 'auk-3',
    date: '2026-02-18',
    vehicleDescription: 'GLC 220 d 4MATIC, EZ 03/2015, 172.000 km · BCA München',
    mileageAtSale: 172000,
    salePrice: 11400,
    purchasePrice: 10700,
    daysOnLot: 3,
    margin: 700,
    marginPercent: 6.1,
  },
  {
    id: 'auk-4',
    date: '2025-12-09',
    vehicleDescription: 'GLC 250 4MATIC, EZ 01/2018, 128.000 km · MB Remarketing',
    mileageAtSale: 128000,
    salePrice: 13600,
    purchasePrice: 12600,
    daysOnLot: 8,
    margin: 1000,
    marginPercent: 7.4,
  },
  {
    id: 'auk-5',
    date: '2025-10-21',
    vehicleDescription: 'GLC 300 4MATIC, EZ 09/2017, 135.000 km · Autobid.de',
    mileageAtSale: 135000,
    salePrice: 12800,
    purchasePrice: 11900,
    daysOnLot: 5,
    margin: 900,
    marginPercent: 7.0,
  },
]

// ─── Mock: DAT-Händler-Einkaufswert (Auktion) ────────────────────────────────

export const einkaufAuktionDATValuation: DATValuation = {
  baseValue: 14900,
  adjustments: [
    { label: 'Kilometerlaufleistung', amount: -2100, reason: '145.800 km — deutlich über Klassenschnitt' },
    { label: 'Fahrzeugalter (9,0 Jahre)', amount: -900, reason: 'Wertverfall X253-Generation' },
    { label: 'Hagelschaden (leicht)', amount: -500, reason: 'Dach/Motorhaube, behebbar' },
    { label: 'Steinschlag Windschutzscheibe', amount: -300, reason: 'Austausch erforderlich' },
    { label: '4 Vorhalter', amount: -300, reason: 'Vermarktungsrisiko Endkunde' },
    { label: 'Basis-Ausstattung', amount: -200, reason: 'Wenig werthaltige Extras' },
    { label: 'Allgemeiner Zustand', amount: 400, reason: 'Technik einwandfrei, Scheckheft gepflegt' },
  ],
  totalAdjustment: -3900,
  adjustedValue: 11000,
  valuationDate: '2026-06-15',
  condition: 'Befriedigend (Note 3)',
  schwackeId: 'MB-GLC-250-4M-X253-2017',
}

// ─── Mock: B2B-Auktionsreferenzen ────────────────────────────────────────────

export const einkaufAuctionBenchmarks: AuctionBenchmark[] = [
  { platform: 'BCA', medianHammer: 12900, lowest: 10900, highest: 14200, count: 6, note: 'Hammer-Median der letzten 6 Auktionen' },
  { platform: 'Autobid.de', medianHammer: 12400, lowest: 11100, highest: 13700, count: 23, note: 'Median aus 23 Online-Geboten' },
  { platform: 'MB Remarketing', medianHammer: 13100, lowest: 12200, highest: 13900, count: 1, note: 'Werks-Rücknahme-Indikation, abzgl. Logistik 350 €' },
]

const einkaufAuktionComparables: MobileDeComparable[] = [
  { id: 'auk-c1', title: 'GLC 220 d 4MATIC · BCA Hamburg', price: 10900, mileage: 172000, year: 2015, firstRegistration: '03/2015', location: 'BCA Hamburg', dealerName: 'BCA', daysListed: 2, priceCategory: 'zufriedenstellend' },
  { id: 'auk-c2', title: 'GLC 220 d 4MATIC · Autobid.de', price: 11400, mileage: 158000, year: 2016, firstRegistration: '04/2016', location: 'Autobid.de', dealerName: 'Autobid.de', daysListed: 1, priceCategory: 'gut' },
  { id: 'auk-c3', title: 'GLC 250 4MATIC · BCA München', price: 12700, mileage: 141000, year: 2017, firstRegistration: '02/2017', location: 'BCA München', dealerName: 'BCA', daysListed: 3, priceCategory: 'gut' },
  { id: 'auk-c4', title: 'GLC 300 4MATIC · MB Remarketing', price: 13100, mileage: 135000, year: 2017, firstRegistration: '09/2017', location: 'MB Remarketing', dealerName: 'Mercedes-Benz Remarketing', daysListed: 1, priceCategory: 'gut' },
  { id: 'auk-c5', title: 'GLC 250 4MATIC · Autobid.de', price: 13600, mileage: 128000, year: 2018, firstRegistration: '01/2018', location: 'Autobid.de', dealerName: 'Autobid.de', daysListed: 2, priceCategory: 'sehr_gut' },
  { id: 'auk-c6', title: 'GLC 300 4MATIC · BCA Frankfurt', price: 14200, mileage: 121000, year: 2018, firstRegistration: '05/2018', location: 'BCA Frankfurt', dealerName: 'BCA', daysListed: 2, priceCategory: 'sehr_gut' },
]

// ─── Mock: Aggregiertes Auktions-Ergebnis ────────────────────────────────────

export const einkaufAuktionPricingResult: EinkaufPricingResult = {
  recommendedMin: 11200,
  recommendedMax: 12400,
  sweetSpot: 11800,
  confidence: 88,

  historical: {
    averageSalePrice: 12540,
    averagePurchasePrice: 11700,
    averageMargin: 840,
    averageMarginPercent: 6.7,
    averageDaysOnLot: 5.2,
    sales: einkaufAuktionHistoricalSales,
  },

  dat: einkaufAuktionDATValuation,

  mobileDe: {
    medianPrice: 12700,
    averagePrice: 12650,
    lowestPrice: 10900,
    highestPrice: 14200,
    count: 6,
    comparables: einkaufAuktionComparables,
  },

  marketPosition: {
    percentile: 55,
    label: 'Im Markt (B2B)',
  },

  channel: 'auktion',
  auction: {
    expectedHammerPrice: 12700,
    spread: 900,
    spreadPercent: 7.1,
    avgDaysToHammer: 5,
    benchmarks: einkaufAuctionBenchmarks,
  },

  // Regionale Marktsicht + kalte KBA-Nachfrage (alter, hochlaufiger GLC 250).
  region: {
    location: DEFAULT_REGION_LOCATION,
    radiusKm: 50,
    avgOfferPrice: 12650,
    priceRange: { min: 10900, max: 14200 },
    countSameModelInRegion: 14,
    avgStandtage: 52,
  },
  kbaDemand: buildKbaDemand({ besitzumschreibungen: 41, bestand: 1720, trend: 'down', changePercent: -7 }),
  segmentSignal: buildSegmentSignal('benzin'),
  trend: computeTrendSignal({ baseValue: 12700, kbaTrend: 'down', kbaChangePercent: -7, umschlagsrate: 2.4, avgStandtage: 52 }),
  buyDecision: buildRecommendation({ channel: 'auktion', marginPercent: 7.1, umschlagsrate: 2.4, marketPercentile: 55, segmentCaution: false }),
}
