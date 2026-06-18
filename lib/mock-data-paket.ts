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
  type EinkaufPricingResult,
  type HistoricalSale,
  type DATAdjustment,
  type MobileDeComparable,
  type VerwertungChannel,
} from './mock-data-einkauf'
import { mercedesMedia } from './mercedes-inventory'

export type EinkaufCondition = 'sehr_gut' | 'gut' | 'maengel' | 'unfallschaden'

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

  return result
}

// ─── Die vier erkannten Fahrzeuge des Demo-Pakets ────────────────────────────

export const einkaufPackageVehicles: EinkaufPackageVehicle[] = [
  {
    id: 'pkg-1',
    model: 'GLC 200 4MATIC',
    modelYear: 2023,
    firstRegistration: '04/2023',
    fuelType: 'Benzin',
    mileage: 38000,
    condition: 'sehr_gut',
    equipmentSummary: 'AMG Line · LED · Kamera',
    imageUrl: mercedesMedia.glcFrontLeftLot,
    sweetSpot: 35000,
    expectedSalePrice: 41400,
    margin: 6400,
    marginPercent: pct(6400, 41400), // 15,5 %
    channel: 'endkunde',
    channelReason: 'Jung (2023) & 38.000 km — volle Handelsmarge im Endkundengeschäft.',
    daysOnLot: 21,
    simplified: true,
    detail: makeQuickDetail({ model: 'GLC 200 4MATIC', ez: '04/2023', year: 2023, mileage: 38000, sweetSpot: 35000, vk: 41400, confidence: 89, channel: 'endkunde', condition: 'sehr_gut' }),
  },
  {
    id: 'pkg-2',
    model: 'GLC 220 d 4MATIC',
    modelYear: 2022,
    firstRegistration: '09/2022',
    fuelType: 'Diesel',
    mileage: 64000,
    condition: 'gut',
    equipmentSummary: 'Night-Paket · AHK · Navi Premium',
    imageUrl: mercedesMedia.glcFrontRightLot,
    sweetSpot: 38000,
    expectedSalePrice: 45000,
    margin: 7000,
    marginPercent: pct(7000, 45000), // 15,6 %
    channel: 'endkunde',
    channelReason: 'EZ 2022 & 64.000 km — innerhalb des Endkunden-Profils.',
    daysOnLot: 25,
    simplified: true,
    detail: makeQuickDetail({ model: 'GLC 220 d 4MATIC', ez: '09/2022', year: 2022, mileage: 64000, sweetSpot: 38000, vk: 45000, confidence: 88, channel: 'endkunde', condition: 'gut' }),
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
    imageUrl: mercedesMedia.glcRearLeftLot,
    sweetSpot: 43200,
    expectedSalePrice: 52400,
    margin: 9200,
    marginPercent: pct(9200, 52400), // 17,6 %
    channel: 'endkunde',
    channelReason: 'Jung (2023), 32.400 km, Top-Ausstattung — beste Endkundenmarge.',
    daysOnLot: 23,
    simplified: false, // volle Bewertung = der Hero-GLC aus Feature 1/2
    detail: einkaufPricingResult,
  },
  {
    id: 'pkg-4',
    model: 'GLC 220 d 4MATIC',
    modelYear: 2019,
    firstRegistration: '03/2019',
    fuelType: 'Diesel',
    mileage: 138000,
    condition: 'maengel',
    equipmentSummary: 'Basis · Navi · AHK',
    imageUrl: mercedesMedia.glcRearRightLot,
    sweetSpot: 17000,
    expectedSalePrice: 18300, // erwarteter Auktionserlös (Zuschlag)
    margin: 1300,
    marginPercent: pct(1300, 18300), // 7,1 %
    channel: 'auktion',
    channelReason: 'Alter 7 J. (EZ 2019) & 138.000 km → Pflicht-Routing Auktion (R1 + R2).',
    daysOnLot: 6,
    simplified: true,
    detail: makeQuickDetail({ model: 'GLC 220 d 4MATIC', ez: '03/2019', year: 2019, mileage: 138000, sweetSpot: 17000, vk: 18300, confidence: 84, channel: 'auktion', condition: 'maengel' }),
  },
]

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
    defaultBundlePrice: 134900,
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
