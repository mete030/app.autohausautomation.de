// ─────────────────────────────────────────────────────────────────────────────
// Paket-/Konvolut-Bewertung (Mercedes "Drehscheibe") — Feature 3.
//
// Additives Mock + reine Helper. Ein Paket = Bündel von Fahrzeugen, das nur
// gemeinsam gekauft werden kann. Jedes Fahrzeug wird einzeln bewertet (EK / VK /
// Marge / Verwertungskanal) plus aggregiert. Der Kanal folgt DERSELBEN Alter/
// km-Logik wie Feature 2 (evaluateChannel): das 4. Fahrzeug ist älter + hat hohe
// Laufleistung und wird daher zur Auktion geroutet. Marge in % = Marge / VK.
// ─────────────────────────────────────────────────────────────────────────────

import {
  einkaufPricingResult,
  einkaufVinMock,
  einkaufVinMockAuktion,
  buildKbaDemand,
  buildSegmentSignal,
  computeTrendSignal,
  buildRecommendation,
  buildKiSummary,
  classifyRole,
  kraftstoffartFromModel,
  einkaufDemoImage,
  DEFAULT_REGION_LOCATION,
  DEFAULT_RADIUS_KM,
  type EinkaufPricingResult,
  type HistoricalSale,
  type DATAdjustment,
  type MobileDeComparable,
  type VerwertungChannel,
  type PackageRole,
} from './mock-data-einkauf'

export type EinkaufCondition = 'sehr_gut' | 'gut' | 'maengel' | 'unfallschaden'

// Woher ein Paket-Fahrzeug erkannt wurde (für das "aus Paket identifiziert"-Label, A2).
export type PaketVehicleOrigin = 'screenshot' | 'voice' | 'text' | 'demo'

export interface EinkaufPackageVehicle {
  id: string
  model: string
  modelYear: number
  firstRegistration: string // 'MM/YYYY'
  fuelType: string
  mileage: number
  condition: EinkaufCondition
  equipmentSummary: string
  imageUrl: string
  sweetSpot: number // EK-Empfehlung
  expectedSalePrice: number // erwarteter VK (bzw. Auktionserlös)
  margin: number // expectedSalePrice − sweetSpot
  marginPercent: number // auf VK bezogen (App-Konvention)
  channel: VerwertungChannel
  channelReason: string // Tooltip (Feature-2-Logik: Alter/km)
  daysOnLot: number
  simplified: boolean // true => vereinfachte Schnellbewertung im Drill-down
  detail: EinkaufPricingResult // vollständiges Einzelfahrzeug-Ergebnis
  origin?: PaketVehicleOrigin // aus welchem Eingabeweg erkannt (A2)
  role: PackageRole // E3: Treiber (trägt das Paket) vs. Mitnahme (schwächer)
}

export interface EinkaufPackageTotals {
  ekRecommendation: number
  ekMin: number
  ekMax: number
  expectedSaleTotal: number
  expectedMarginTotal: number
  expectedMarginPercent: number // auf Gesamt-VK
  confidence: number
  averageDaysOnLot: number
  channelSplit: { endkunde: number; auktion: number }
  roleSplit: { treiber: number; mitnahme: number } // F3: Arbitrage-Sicht
  defaultBundlePrice: number
}

export interface EinkaufPackageResult {
  vehicles: EinkaufPackageVehicle[]
  totals: EinkaufPackageTotals
}

export type PaketVerdict = 'lohnt' | 'grenzwertig' | 'lohnt_nicht'

// Verdict-Schwellen — Marge auf Paketpreis (Rendite auf das eingesetzte Kapital).
export const PAKET_LOHNT_PCT = 15
export const PAKET_GRENZWERTIG_PCT = 10

const round = (n: number) => Math.round(n)
const pct = (margin: number, vk: number) => (vk ? Math.round((margin / vk) * 1000) / 10 : 0)

// Zustand (subjektiv) → DAT-Notenstufe — eine Quelle, damit Liste und
// Detailbewertung denselben Zustand zeigen.
export const CONDITION_DAT_LABEL: Record<EinkaufCondition, string> = {
  sehr_gut: 'Sehr gut (Note 1)',
  gut: 'Gut (Note 2)',
  maengel: 'Befriedigend (Note 3)',
  unfallschaden: 'Mangelhaft (Note 4)',
}

// ─── Generator für vereinfachte Einzelfahrzeug-Detailergebnisse ──────────────

function makeQuickDetail(o: {
  model: string
  ez: string
  year: number
  mileage: number
  sweetSpot: number
  vk: number
  confidence: number
  channel: VerwertungChannel
  condition: EinkaufCondition
}): EinkaufPricingResult {
  const { model, ez, year, mileage, sweetSpot, vk, confidence, channel, condition } = o
  const isAuction = channel === 'auktion'

  const sales: HistoricalSale[] = [0, 1, 2].map((i) => {
    const sp = vk + (i - 1) * 700
    const pp = sweetSpot + (i - 1) * 500
    return {
      id: `${o.model}-h${i + 1}`,
      date: ['2026-04-08', '2026-01-22', '2025-11-04'][i],
      vehicleDescription: `${model}, EZ ${ez}, ${(mileage + (i - 1) * 5000).toLocaleString('de-DE')} km`,
      mileageAtSale: mileage + (i - 1) * 5000,
      salePrice: sp,
      purchasePrice: pp,
      daysOnLot: isAuction ? 4 + i * 2 : 18 + i * 4,
      margin: sp - pp,
      marginPercent: pct(sp - pp, sp),
    }
  })

  const datBase = round(vk * (isAuction ? 0.92 : 1.0))
  const datAdjustments: DATAdjustment[] = isAuction
    ? [
        { label: 'Kilometerlaufleistung', amount: -round(vk * 0.11), reason: `${mileage.toLocaleString('de-DE')} km — über Klassenschnitt` },
        { label: `Fahrzeugalter (${2026 - year} Jahre)`, amount: -round(vk * 0.06), reason: 'Wertverfall Vorgänger-Generation' },
        { label: 'Basis-Ausstattung', amount: -round(vk * 0.02), reason: 'Wenig werthaltige Extras' },
        { label: 'Allgemeiner Zustand', amount: round(vk * 0.02), reason: 'Technik einwandfrei' },
      ]
    : [
        { label: 'Kilometerlaufleistung', amount: -round(vk * 0.025), reason: `${mileage.toLocaleString('de-DE')} km` },
        { label: 'Ausstattungslinie', amount: round(vk * 0.05), reason: 'Werthaltige Sonderausstattung' },
        { label: 'Infotainment / Komfort', amount: round(vk * 0.015), reason: 'Premium-Extras' },
        { label: 'Allgemeiner Zustand', amount: -round(vk * 0.008), reason: 'Leichte Gebrauchsspuren' },
      ]
  const totalAdjustment = datAdjustments.reduce((s, a) => s + a.amount, 0)

  const compPrices = isAuction
    ? [vk - 1400, vk - 600, vk + 500, vk + 1500]
    : [vk - 3200, vk - 1100, vk + 1400, vk + 4200]
  const categories: MobileDeComparable['priceCategory'][] = ['sehr_gut', 'gut', 'gut', 'erhoht']
  const comparables: MobileDeComparable[] = compPrices.map((price, i) => ({
    id: `${o.model}-c${i + 1}`,
    title: isAuction ? `${model} · ${['BCA', 'Autobid.de', 'BCA', 'MB Remarketing'][i]}` : `Mercedes-Benz ${model}`,
    price,
    mileage: mileage + (i - 1) * 6000,
    year,
    firstRegistration: ez,
    location: isAuction ? ['BCA Hamburg', 'Autobid.de', 'BCA München', 'MB Remarketing'][i] : ['Stuttgart', 'München', 'Hamburg', 'Berlin'][i],
    dealerName: isAuction ? ['BCA', 'Autobid.de', 'BCA', 'Mercedes-Benz Remarketing'][i] : ['Stern Center', 'AutoNova', 'Hanse Automobile', 'Stern Berlin'][i],
    daysListed: isAuction ? 1 + i : 8 + i * 6,
    priceCategory: categories[i],
  }))

  const result: EinkaufPricingResult = {
    recommendedMin: round(sweetSpot * 0.97),
    recommendedMax: round(sweetSpot * 1.03),
    sweetSpot,
    confidence,
    historical: {
      averageSalePrice: round(sales.reduce((s, x) => s + x.salePrice, 0) / sales.length),
      averagePurchasePrice: round(sales.reduce((s, x) => s + x.purchasePrice, 0) / sales.length),
      averageMargin: round(sales.reduce((s, x) => s + x.margin, 0) / sales.length),
      averageMarginPercent: pct(vk - sweetSpot, vk),
      averageDaysOnLot: round((sales.reduce((s, x) => s + x.daysOnLot, 0) / sales.length) * 10) / 10,
      sales,
    },
    dat: {
      baseValue: datBase,
      adjustments: datAdjustments,
      totalAdjustment,
      adjustedValue: datBase + totalAdjustment,
      valuationDate: '2026-06-15',
      condition: CONDITION_DAT_LABEL[condition],
      schwackeId: `MB-${model.replace(/\s+/g, '-')}-${year}`,
    },
    mobileDe: {
      medianPrice: vk,
      averagePrice: round(compPrices.reduce((s, x) => s + x, 0) / compPrices.length),
      lowestPrice: Math.min(...compPrices),
      highestPrice: Math.max(...compPrices),
      count: compPrices.length,
      comparables,
    },
    marketPosition: {
      percentile: isAuction ? 55 : 38,
      label: isAuction ? 'Im Markt (B2B)' : 'Unter Markt',
    },
    channel,
  }

  if (isAuction) {
    const spread = vk - sweetSpot
    result.auction = {
      expectedHammerPrice: vk,
      spread,
      spreadPercent: pct(spread, vk),
      avgDaysToHammer: 6,
      benchmarks: [
        { platform: 'BCA', medianHammer: vk + 200, lowest: vk - 1400, highest: vk + 1500, count: 5, note: 'Hammer-Median der letzten 5 Auktionen' },
        { platform: 'Autobid.de', medianHammer: vk - 300, lowest: vk - 1200, highest: vk + 900, count: 14, note: 'Median aus 14 Online-Geboten' },
        { platform: 'MB Remarketing', medianHammer: vk + 600, lowest: vk - 200, highest: vk + 1200, count: 1, note: 'Werks-Rücknahme-Indikation' },
      ],
    }
  }

  // Regionale Marktsicht + KBA-/Segment-Signale (B1–B6) — je Fahrzeug abgeleitet,
  // damit Paket- und geparste Fahrzeuge dieselben Nachfrage-Signale tragen.
  const kraftstoffart = kraftstoffartFromModel(model)
  result.region = {
    location: DEFAULT_REGION_LOCATION,
    radiusKm: DEFAULT_RADIUS_KM,
    avgOfferPrice: result.mobileDe.averagePrice,
    priceRange: { min: result.mobileDe.lowestPrice, max: result.mobileDe.highestPrice },
    countSameModelInRegion: isAuction ? 13 : 7 + (year % 4),
    avgStandtage: isAuction ? 49 : 30 + (mileage > 80000 ? 9 : 0),
  }
  result.kbaDemand = isAuction
    ? buildKbaDemand({ besitzumschreibungen: 38 + (year % 6), bestand: 1700, trend: 'down', changePercent: -(5 + (year % 4)) })
    : buildKbaDemand({ besitzumschreibungen: 124 + (year % 5) * 6, bestand: 960, trend: 'up', changePercent: 6 + (year % 4) })
  result.segmentSignal = buildSegmentSignal(kraftstoffart)
  result.trend = computeTrendSignal({
    baseValue: result.mobileDe.medianPrice,
    kbaTrend: result.kbaDemand.trendDirection,
    kbaChangePercent: result.kbaDemand.changePercent,
    umschlagsrate: result.kbaDemand.umschlagsrate,
    avgStandtage: result.region.avgStandtage,
  })
  result.buyDecision = buildRecommendation({
    channel,
    marginPercent: result.historical.averageMarginPercent,
    umschlagsrate: result.kbaDemand.umschlagsrate,
    marketPercentile: result.marketPosition.percentile,
    segmentCaution: result.segmentSignal.caution,
  })
  result.kiSummary = buildKiSummary(result) // H1

  return result
}

// ─── Die vier erkannten Fahrzeuge des Demo-Pakets ────────────────────────────

export const einkaufPackageVehicles: EinkaufPackageVehicle[] = [
  {
    id: 'pkg-1',
    model: 'C 220 d',
    modelYear: 2021,
    firstRegistration: '03/2021',
    fuelType: 'Diesel',
    mileage: 58000,
    condition: 'gut',
    equipmentSummary: 'AMG Line · LED · Kamera',
    imageUrl: einkaufDemoImage('mb_c_klasse'),
    sweetSpot: 30000,
    expectedSalePrice: 35500,
    margin: 5500,
    marginPercent: pct(5500, 35500), // 15,5 %
    channel: 'endkunde',
    channelReason: 'EZ 2021 & 58.000 km — volle Handelsmarge im Endkundengeschäft.',
    daysOnLot: 22,
    simplified: true,
    detail: makeQuickDetail({ model: 'C 220 d', ez: '03/2021', year: 2021, mileage: 58000, sweetSpot: 30000, vk: 35500, confidence: 89, channel: 'endkunde', condition: 'gut' }),
    role: 'treiber',
  },
  {
    id: 'pkg-2',
    model: 'CLA 200',
    modelYear: 2021,
    firstRegistration: '06/2021',
    fuelType: 'Benzin',
    mileage: 49000,
    condition: 'sehr_gut',
    equipmentSummary: 'AMG Line · Ambientebeleuchtung',
    imageUrl: einkaufDemoImage('mb_cla'),
    sweetSpot: 25500,
    expectedSalePrice: 30200,
    margin: 4700,
    marginPercent: pct(4700, 30200), // 15,6 %
    channel: 'endkunde',
    channelReason: 'EZ 2021 & 49.000 km — gängiges Coupé, gute Endkundenmarge.',
    daysOnLot: 26,
    simplified: true,
    detail: makeQuickDetail({ model: 'CLA 200', ez: '06/2021', year: 2021, mileage: 49000, sweetSpot: 25500, vk: 30200, confidence: 88, channel: 'endkunde', condition: 'sehr_gut' }),
    role: 'treiber',
  },
  {
    id: 'pkg-3',
    model: 'GLC 300 4MATIC',
    modelYear: 2023,
    firstRegistration: '05/2023',
    fuelType: 'Benzin',
    mileage: 32400,
    condition: 'gut',
    equipmentSummary: 'AMG Line · Burmester · Panorama · HUD',
    imageUrl: einkaufDemoImage('glc_300_spektralblau'),
    sweetSpot: 43200,
    expectedSalePrice: 52400,
    margin: 9200,
    marginPercent: pct(9200, 52400), // 17,6 %
    channel: 'endkunde',
    channelReason: 'Jung (2023), 32.400 km, Top-Ausstattung — beste Endkundenmarge.',
    daysOnLot: 23,
    simplified: false, // volle Bewertung = der Hero-GLC aus Feature 1/2
    detail: einkaufPricingResult,
    role: 'treiber',
  },
  {
    id: 'pkg-4',
    model: 'E 220 d',
    modelYear: 2017,
    firstRegistration: '05/2017',
    fuelType: 'Diesel',
    mileage: 168000,
    condition: 'maengel',
    equipmentSummary: 'Avantgarde · Distronic · AHK',
    imageUrl: einkaufDemoImage('mb_e_klasse'),
    sweetSpot: 13500,
    expectedSalePrice: 14500, // erwarteter Auktionserlös (Zuschlag)
    margin: 1000,
    marginPercent: pct(1000, 14500), // 6,9 %
    channel: 'auktion',
    channelReason: 'Alter 9 J. (EZ 2017) & 168.000 km → Pflicht-Routing Auktion (R1 + R2).',
    daysOnLot: 6,
    simplified: true,
    detail: makeQuickDetail({ model: 'E 220 d', ez: '05/2017', year: 2017, mileage: 168000, sweetSpot: 13500, vk: 14500, confidence: 84, channel: 'auktion', condition: 'maengel' }),
    role: 'mitnahme',
  },
]

// ─── A1/A2: Transcript-Parser (VINs / Beschreibungen / OCR-Zeilen → Fahrzeuge) ──
// Wandelt die in VehicleIdentify erfassten Zeilen (eine pro Fahrzeug/VIN) in bewertete
// Paket-Fahrzeuge um. 1–16 Einträge. Glaubwürdige Demo-Heuristik; keine echte Quelle.
// TODO[real-backend]: OCR (Paket-Screenshot) + VIN-/HSN-Decode (KBA) liefern diese
// Stammdaten real; hier werden Modell/EZ/km/Ausstattung aus Freitext geschätzt.

export const MAX_PAKET_VEHICLES = 16

// Häufig an Endkunden verkaufte MB-Baureihen (nicht nur GLC). Pro Modell:
// Referenz-VK (junges Fahrzeug ~2023, ~30.000 km), Kraftstoff und Demo-Bild.
// Reihenfolge: spezifischere Muster (e-/d-Varianten, mehrbuchstabige Präfixe)
// zuerst — matchModel nimmt den ersten Treffer.
interface MbModelSpec {
  name: string
  re: RegExp
  baseVk: number
  fuel: string
  image: string // Key in public/einkauf-demo/
}
const MB_MODELS: MbModelSpec[] = [
  // SUVs (mehrbuchstabige Präfixe zuerst, e-Varianten vor Basis)
  { name: 'GLC 300 e 4MATIC', re: /\bGLC\s?300\s?e\b/i, baseVk: 55000, fuel: 'Plug-in-Hybrid', image: 'glc_300_spektralblau' },
  { name: 'GLC 300 4MATIC', re: /\bGLC\s?300\b/i, baseVk: 52000, fuel: 'Benzin', image: 'glc_300_spektralblau' },
  { name: 'GLC 220 d 4MATIC', re: /\bGLC\s?220\s?d\b/i, baseVk: 44000, fuel: 'Diesel', image: 'glc_220d_selenitgrau_2022' },
  { name: 'GLC 200 4MATIC', re: /\bGLC\s?200\b/i, baseVk: 42000, fuel: 'Benzin', image: 'glc_200_polarweiss' },
  { name: 'GLE 400 d 4MATIC', re: /\bGLE\s?400\s?d\b/i, baseVk: 70000, fuel: 'Diesel', image: 'mb_gle' },
  { name: 'GLE 350 d 4MATIC', re: /\bGLE\s?350\s?d\b/i, baseVk: 62000, fuel: 'Diesel', image: 'mb_gle' },
  { name: 'GLA 250 e', re: /\bGLA\s?250\s?e\b/i, baseVk: 35000, fuel: 'Plug-in-Hybrid', image: 'mb_gla' },
  { name: 'GLA 200', re: /\bGLA\s?200\b/i, baseVk: 32000, fuel: 'Benzin', image: 'mb_gla' },
  { name: 'GLB 220 d 4MATIC', re: /\bGLB\s?220\s?d\b/i, baseVk: 39000, fuel: 'Diesel', image: 'mb_glb' },
  { name: 'GLB 200', re: /\bGLB\s?200\b/i, baseVk: 36000, fuel: 'Benzin', image: 'mb_glb' },
  // Coupé
  { name: 'CLA 220 d', re: /\bCLA\s?220\s?d\b/i, baseVk: 33000, fuel: 'Diesel', image: 'mb_cla' },
  { name: 'CLA 200', re: /\bCLA\s?200\b/i, baseVk: 30000, fuel: 'Benzin', image: 'mb_cla' },
  // Limousinen / Kompakt (einbuchstabige Präfixe zuletzt)
  { name: 'A 250 e', re: /\bA\s?250\s?e\b/i, baseVk: 31000, fuel: 'Plug-in-Hybrid', image: 'mb_a_klasse' },
  { name: 'A 200', re: /\bA\s?200\b/i, baseVk: 28000, fuel: 'Benzin', image: 'mb_a_klasse' },
  { name: 'A 180', re: /\bA\s?180\b/i, baseVk: 25000, fuel: 'Benzin', image: 'mb_a_klasse' },
  { name: 'B 200', re: /\bB\s?200\b/i, baseVk: 27000, fuel: 'Benzin', image: 'mb_b_klasse' },
  { name: 'B 180', re: /\bB\s?180\b/i, baseVk: 24000, fuel: 'Benzin', image: 'mb_b_klasse' },
  { name: 'C 300 e', re: /\bC\s?300\s?e\b/i, baseVk: 40000, fuel: 'Plug-in-Hybrid', image: 'mb_c_klasse' },
  { name: 'C 220 d', re: /\bC\s?220\s?d\b/i, baseVk: 35000, fuel: 'Diesel', image: 'mb_c_klasse' },
  { name: 'C 200', re: /\bC\s?200\b/i, baseVk: 34000, fuel: 'Benzin', image: 'mb_c_klasse' },
  { name: 'E 300 e', re: /\bE\s?300\s?e\b/i, baseVk: 48000, fuel: 'Plug-in-Hybrid', image: 'mb_e_klasse' },
  { name: 'E 220 d', re: /\bE\s?220\s?d\b/i, baseVk: 42000, fuel: 'Diesel', image: 'mb_e_klasse' },
]
const DEFAULT_MODEL: MbModelSpec = { name: 'C 220 d', re: /(?!)/, baseVk: 35000, fuel: 'Diesel', image: 'mb_c_klasse' }

// Alle Modellnamen für Auswahl-Dropdowns — bleibt automatisch in Sync mit dem Parser/der Registry.
export const MB_MODEL_NAMES = MB_MODELS.map((m) => m.name)
const VIN_RE = /^[A-HJ-NPR-Z0-9]{17}$/i

function matchModel(line: string): MbModelSpec {
  return MB_MODELS.find((m) => m.re.test(line)) ?? DEFAULT_MODEL
}

// Beispiel-VINs für das Demo-Paket (8 Fahrzeuge): bunte Modell-Mischung. Jede VIN
// bildet auf eine beschreibende Demo-Zeile ab, damit ein eingegebener/gescannter
// VIN-Block dieselben Fahrzeuge ergibt wie das kuratierte Demo.
const PAKET_DEMO_ENTRIES: { vin: string; line: string }[] = [
  { vin: 'WDD2060041R200001', line: 'C 220 d 4MATIC, 2021, 58.000 km, AMG Line · LED' },
  { vin: 'W1K1770871J200002', line: 'A 200, 2022, 41.000 km, Progressive · MBUX' },
  { vin: einkaufVinMock.vin, line: 'GLC 300 4MATIC, 2023, 32.400 km, AMG Line · Burmester · Panorama' },
  { vin: 'W1K1183451N200004', line: 'CLA 200, 2021, 63.000 km, AMG Line · Ambientebeleuchtung' },
  { vin: 'W1N2477871J200005', line: 'GLA 200, 2022, 48.000 km, Progressive · Kamera' },
  { vin: 'WDD2130041A200006', line: 'E 220 d, 2018, 138.000 km, Avantgarde · AHK' },
  { vin: 'W1N2476871J200007', line: 'GLB 200, 2021, 71.000 km, Style · 7-Sitzer' },
  { vin: 'W1K2470871J200008', line: 'B 180, 2016, 152.000 km, Style · Navi' },
]
export const PAKET_DEMO_VINS = PAKET_DEMO_ENTRIES.map((e) => e.vin)

const DEMO_VIN_TO_LINE: Record<string, string> = {
  ...Object.fromEntries(PAKET_DEMO_ENTRIES.map((e) => [e.vin.toUpperCase(), e.line])),
  [einkaufVinMockAuktion.vin.toUpperCase()]: 'GLC 250 4MATIC, 2017, 145.800 km, Basis · Navi',
}

// Unbekannte VIN → deterministisch ein plausibles Modell/Jahr/km ableiten (Demo).
// TODO[real-backend]: VIN-Decode (KBA) liefert die echten Stammdaten.
const SYNTH_POOL = ['C 220 d', 'A 200', 'GLC 300 4MATIC', 'CLA 200', 'GLA 200', 'E 220 d', 'B 200', 'GLB 200']
function vinToSyntheticLine(vin: string): string {
  const h = [...vin].reduce((a, c) => a + c.charCodeAt(0), 0)
  const model = SYNTH_POOL[h % SYNTH_POOL.length]
  const year = 2016 + (h % 8)
  const km = 30000 + ((h * 137) % 130000)
  return `${model}, ${year}, ${km.toLocaleString('de-DE')} km`
}

function parseYear(text: string): number {
  const m = text.match(/\b(20[0-2]\d)\b/)
  const y = m ? Number(m[1]) : 2022
  return Math.min(2026, Math.max(2014, y))
}

function parseMileage(text: string): number {
  const km = text.match(/([\d.\s]{2,})\s*km/i)
  const raw = km ? km[1] : (text.match(/\b(\d{2,3}[.\s]?\d{3})\b/)?.[1] ?? '')
  const n = Number(raw.replace(/[^\d]/g, ''))
  return n > 0 ? n : 60000
}

// Modell-Token am Zeilenanfang (z.B. "C 220 d", "GLC 300") herausfiltern, Rest = Ausstattung.
const MODEL_TOKEN_RE = /^(?:A|B|C|E|S|CLA|CLS|GLA|GLB|GLC|GLE|GLS|EQA|EQB|EQC|EQE|EQS)\s?\d{2,3}/i
function parseEquipment(line: string): string {
  const parts = line.split(/[,·]/).map((s) => s.trim()).filter(Boolean)
  const extras = parts.filter(
    (p) => !/^\s*20[0-2]\d\s*$/.test(p) && !/km/i.test(p) && !VIN_RE.test(p) && !/^\d/.test(p) && !MODEL_TOKEN_RE.test(p),
  )
  return extras.length ? extras.join(' · ') : 'Serienausstattung'
}

function makePackageVehicleFromLine(line: string, index: number, origin: PaketVehicleOrigin): EinkaufPackageVehicle {
  // VIN → beschreibende Zeile auflösen (bekannte Demo-VIN oder synthetisch),
  // sonst die getippte Beschreibung direkt verwenden.
  const trimmed = line.trim()
  const isVin = VIN_RE.test(trimmed)
  const effectiveLine = isVin ? (DEMO_VIN_TO_LINE[trimmed.toUpperCase()] ?? vinToSyntheticLine(trimmed)) : line

  const spec = matchModel(effectiveLine)
  const model = spec.name
  const year = parseYear(effectiveLine)
  const mileage = parseMileage(effectiveLine)
  const ageYears = 2026 - year

  // VK rückwärts: Referenz minus Alters- (~5 %/Jahr) und Mehr-km-Abschreibung.
  const depAge = (year - 2023) * Math.round(spec.baseVk * 0.05)
  const depKm = -Math.round(Math.max(0, mileage - 30000) * (spec.baseVk > 45000 ? 0.1 : 0.07))
  const vk = Math.max(9000, Math.round((spec.baseVk + depAge + depKm) / 100) * 100)

  // Kanal nach derselben Alter/km-Logik wie evaluateChannel (Feature 2).
  const channel: VerwertungChannel = ageYears >= 6 || mileage >= 120000 ? 'auktion' : 'endkunde'
  const isAuction = channel === 'auktion'
  const marginPct = isAuction ? 0.07 : 0.16
  const sweetSpot = Math.round((vk * (1 - marginPct)) / 100) * 100
  const margin = vk - sweetSpot

  const condition: EinkaufCondition =
    mileage >= 120000 || ageYears >= 7 ? 'maengel' : mileage >= 80000 || ageYears >= 4 ? 'gut' : 'sehr_gut'
  const ez = effectiveLine.match(/\b(0?[1-9]|1[0-2])\/(20[0-2]\d)\b/)?.[0] ?? `0${1 + (index % 9)}/${year}`
  const equipmentSummary = parseEquipment(effectiveLine)

  // Hero-GLC (volle Bewertung aus Feature 1/2) wiederverwenden, wenn die Zeile passt —
  // so bleibt im Demo-Drill-down die ausführliche Einzelanalyse erhalten.
  const isHero = model === 'GLC 300 4MATIC' && year === 2023 && Math.abs(mileage - 32400) <= 1500
  const detail = isHero
    ? einkaufPricingResult
    : makeQuickDetail({ model, ez, year, mileage, sweetSpot, vk, confidence: isAuction ? 84 : 88, channel, condition })

  return {
    id: `pkg-${origin}-${index + 1}`,
    model,
    modelYear: year,
    firstRegistration: ez,
    fuelType: spec.fuel,
    mileage,
    condition,
    equipmentSummary,
    imageUrl: einkaufDemoImage(spec.image),
    sweetSpot,
    expectedSalePrice: vk,
    margin,
    marginPercent: pct(margin, vk),
    channel,
    channelReason: isAuction
      ? `Alter ${ageYears} J. (EZ ${year}) & ${mileage.toLocaleString('de-DE')} km → Pflicht-Routing Auktion.`
      : `EZ ${year} & ${mileage.toLocaleString('de-DE')} km — innerhalb des Endkunden-Profils.`,
    daysOnLot: isAuction ? 5 + (index % 3) : 20 + (index % 6),
    simplified: !isHero,
    detail,
    origin,
    role: classifyRole({ channel, marginPercent: pct(margin, vk) }),
  }
}

// 1–16 Zeilen → bewertete Paket-Fahrzeuge. Leerer Text => leeres Array (Aufrufer
// fällt dann auf das kuratierte Demo-Paket zurück).
export function parsePaketTranscript(text: string, origin: PaketVehicleOrigin = 'text'): EinkaufPackageVehicle[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, MAX_PAKET_VEHICLES)
  return lines.map((line, i) => makePackageVehicleFromLine(line, i, origin))
}

export function buildPackageTotals(vehicles: EinkaufPackageVehicle[]): EinkaufPackageTotals {
  const ekRecommendation = vehicles.reduce((s, v) => s + v.sweetSpot, 0)
  const expectedSaleTotal = vehicles.reduce((s, v) => s + v.expectedSalePrice, 0)
  const expectedMarginTotal = expectedSaleTotal - ekRecommendation
  return {
    ekRecommendation,
    ekMin: vehicles.reduce((s, v) => s + v.detail.recommendedMin, 0),
    ekMax: vehicles.reduce((s, v) => s + v.detail.recommendedMax, 0),
    expectedSaleTotal,
    expectedMarginTotal,
    expectedMarginPercent: pct(expectedMarginTotal, expectedSaleTotal),
    confidence: 89,
    averageDaysOnLot: Math.round(vehicles.reduce((s, v) => s + v.daysOnLot, 0) / vehicles.length),
    channelSplit: {
      endkunde: vehicles.filter((v) => v.channel === 'endkunde').length,
      auktion: vehicles.filter((v) => v.channel === 'auktion').length,
    },
    roleSplit: {
      treiber: vehicles.filter((v) => v.role === 'treiber').length,
      mitnahme: vehicles.filter((v) => v.role === 'mitnahme').length,
    },
    // Drehscheiben-Paketpreis ≈ Summe Einzel-EK + kleiner Paket-Aufschlag (~1,3 %).
    // Auf 100 € gerundet; für das 4er-Demo ergibt das die bisherigen 134.900 €.
    defaultBundlePrice: Math.round((ekRecommendation * 1.013) / 100) * 100,
  }
}

export const einkaufPackageResult: EinkaufPackageResult = {
  vehicles: einkaufPackageVehicles,
  totals: buildPackageTotals(einkaufPackageVehicles),
}

// Verdict-Farben/Label für die UI.
export const paketVerdictConfig: Record<PaketVerdict, { label: string; tone: string; dot: string }> = {
  lohnt: { label: 'Lohnt sich', tone: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' },
  grenzwertig: { label: 'Grenzwertig', tone: 'text-amber-600 dark:text-amber-400', dot: 'bg-amber-500' },
  lohnt_nicht: { label: 'Lohnt nicht', tone: 'text-red-600 dark:text-red-400', dot: 'bg-red-500' },
}

// ─── Reine Helper für die "Lohnt sich das Paket?"-Logik ──────────────────────

export function evaluatePackageBundle(result: EinkaufPackageResult, bundlePrice: number) {
  const { expectedSaleTotal, ekRecommendation } = result.totals
  const blendedMargin = expectedSaleTotal - bundlePrice
  const blendedMarginPercent = bundlePrice ? (blendedMargin / bundlePrice) * 100 : 0
  const premiumVsSingleEk = ekRecommendation ? ((bundlePrice - ekRecommendation) / ekRecommendation) * 100 : 0
  const verdict: PaketVerdict =
    blendedMarginPercent >= PAKET_LOHNT_PCT
      ? 'lohnt'
      : blendedMarginPercent >= PAKET_GRENZWERTIG_PCT
        ? 'grenzwertig'
        : 'lohnt_nicht'
  // Referenzpreise für den Break-even-Hinweis:
  const breakEven = expectedSaleTotal // Marge = 0
  const grenzwertigAbove = expectedSaleTotal / (1 + PAKET_LOHNT_PCT / 100) // darüber: nicht mehr "lohnt"
  return { blendedMargin, blendedMarginPercent, premiumVsSingleEk, verdict, breakEven, grenzwertigAbove }
}

// H2: KI-Gesamteinschätzung des Pakets (Mock) — formuliert die Arbitrage-Logik in
// einem Satz, reagiert auf den eingegebenen Paketpreis.
// TODO[real-backend]: KI — echtes Modell bewertet das Paket gesamthaft.
export function buildPackageVerdictText(result: EinkaufPackageResult, bundlePrice: number): string {
  const { totals } = result
  const bundle = evaluatePackageBundle(result, bundlePrice)
  const { treiber, mitnahme } = totals.roleSplit
  const eur = (n: number) => `${Math.round(n).toLocaleString('de-DE')} €`
  const verdictWord = bundle.verdict === 'lohnt' ? 'lohnt sich' : bundle.verdict === 'grenzwertig' ? 'ist grenzwertig' : 'lohnt sich nicht'
  const driverNote =
    treiber >= mitnahme
      ? `Die ${treiber} Treiber tragen die ${mitnahme} schwächeren Mitnahme-Fahrzeug${mitnahme === 1 ? '' : 'e'}`
      : `Achtung: nur ${treiber} Treiber für ${mitnahme} Mitnahme-Fahrzeuge — dünne Arbitrage-Basis`
  return (
    `KI-Gesamteinschätzung: Das Paket ${verdictWord}. ${driverNote}. ` +
    `Bei ${eur(bundlePrice)} Paketpreis ergibt sich eine Blended-Marge von ${eur(bundle.blendedMargin)} (${bundle.blendedMarginPercent.toFixed(1)} %), Break-even bei ${eur(bundle.breakEven)}. ` +
    `Die starken Fahrzeuge subventionieren die schwachen, solange die Gesamtmarge über ${PAKET_LOHNT_PCT} % bleibt.`
  )
}

// Aufteilung des Paketpreises ∝ Einzel-EK; Σ === bundlePrice exakt (letzte Zeile
// absorbiert die Rundung).
export function allocateBundle(vehicles: EinkaufPackageVehicle[], bundlePrice: number, totalEk: number) {
  let running = 0
  return vehicles.map((v, i) => {
    const alloc =
      i < vehicles.length - 1 ? Math.round((bundlePrice * v.sweetSpot) / totalEk) : bundlePrice - running
    running += alloc
    const margin = v.expectedSalePrice - alloc
    return {
      id: v.id,
      model: v.model,
      channel: v.channel,
      alloc,
      margin,
      marginPercent: alloc ? (margin / alloc) * 100 : 0,
    }
  })
}
