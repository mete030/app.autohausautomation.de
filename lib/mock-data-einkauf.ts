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
}
