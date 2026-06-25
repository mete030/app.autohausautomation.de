// ─────────────────────────────────────────────────────────────────────────────
// Transporter-Modus (Epic G, ~20 % des Einkaufs) — eigene, nachfragegetriebene
// Nischenlogik. Bewusst PARALLEL zum PKW-Mock gehalten (kein Eingriff in die GLC-
// Daten). Demo-Fahrzeug: Mercedes Sprinter 317 CDI Kühlkoffer.
//
// Kernunterschiede zum PKW (G1–G5):
//  • Saisonale Nachfrage (Sommer/Winter) statt reiner Tagesaktualität (G2)
//  • Nischen-/Ausstattungsabdeckung — „einer von wenigen?" (G3)
//  • Lange Standzeit wird NICHT abgestraft; Vorratskauf ist eine Option (G4)
//  • Auktions-Insight = was andere Händler EINKAUFEN (Frühindikator), kein Bieten (G5)
//  • B7: Neuzulassungs-Frühindikator (eSprinter-Schwemme → künftiger Preisdruck)
// ─────────────────────────────────────────────────────────────────────────────

import { mercedesMedia } from './mercedes-inventory'
import {
  computeTrendSignal,
  DEFAULT_REGION_LOCATION,
  type EinkaufVehicleData,
  type EinkaufPricingResult,
  type HistoricalSale,
} from './mock-data-einkauf'

// TODO[real-backend]: Transporter-VIN-Decode (KBA) liefert diese Stammdaten real.
export const einkaufTransporterVinMock: EinkaufVehicleData = {
  vin: 'W1V9076331P123456',
  make: 'Mercedes-Benz',
  model: 'Sprinter 317 CDI Kühlkoffer',
  modelYear: 2021,
  firstRegistration: '06/2021',
  color: 'Arktikweiß',
  fuelType: 'Diesel',
  transmission: '9G-TRONIC',
  power: 170,
  displacement: 1950,
  mileage: 78000,
  serienausstattung: [
    'Klimaautomatik',
    'Rückfahrkamera',
    'Tempomat',
    'Holzboden Laderaum',
    'Trennwand mit Fenster',
  ],
  sonderausstattung: [
    'Kühlkoffer 0–8 °C (FRC)',
    'Standkühlung 230 V',
    'Luftfederung Hinterachse',
    'Standheizung',
    'MBUX 10,25"',
    'Anhängerkupplung 3,5 t',
  ],
  // TODO[real-backend]: Transporter-Bilder; Demo nutzt vorhandenes Asset als Platzhalter.
  imageUrl: mercedesMedia.glcExterior,
}

const transporterSales: HistoricalSale[] = [
  {
    id: 'tr-h1',
    date: '2026-05-28',
    vehicleDescription: 'Sprinter 314 CDI Kühlkoffer, EZ 03/2020, 96.000 km',
    mileageAtSale: 96000,
    salePrice: 39900,
    purchasePrice: 33800,
    daysOnLot: 71,
    margin: 6100,
    marginPercent: 15.3,
  },
  {
    id: 'tr-h2',
    date: '2026-03-14',
    vehicleDescription: 'Sprinter 317 CDI Kühlkoffer, EZ 09/2021, 64.000 km',
    mileageAtSale: 64000,
    salePrice: 44500,
    purchasePrice: 37600,
    daysOnLot: 58,
    margin: 6900,
    marginPercent: 15.5,
  },
  {
    id: 'tr-h3',
    date: '2025-11-09',
    vehicleDescription: 'Sprinter 316 CDI Kühlkoffer, EZ 05/2020, 108.000 km',
    mileageAtSale: 108000,
    salePrice: 37800,
    purchasePrice: 32100,
    daysOnLot: 94,
    margin: 5700,
    marginPercent: 15.1,
  },
]

export const einkaufTransporterPricingResult: EinkaufPricingResult = {
  recommendedMin: 34500,
  recommendedMax: 37200,
  sweetSpot: 35900,
  confidence: 86,

  historical: {
    averageSalePrice: 40733,
    averagePurchasePrice: 34500,
    averageMargin: 6233,
    averageMarginPercent: 15.3,
    averageDaysOnLot: 74.3, // lang — im Transporter-Modus NICHT negativ (G4)
    sales: transporterSales,
  },

  dat: {
    baseValue: 41200,
    adjustments: [
      { label: 'Kilometerlaufleistung', amount: -1400, reason: '78.000 km' },
      { label: 'Kühlkoffer FRC + Standkühlung', amount: 3200, reason: 'Werthaltige Nischenausstattung' },
      { label: 'Luftfederung Hinterachse', amount: 700, reason: 'Komfort/Ladung' },
      { label: 'Allgemeiner Zustand', amount: -300, reason: 'Gepflegt, leichte Gebrauchsspuren' },
    ],
    totalAdjustment: 2200,
    adjustedValue: 43400,
    valuationDate: '2026-06-15',
    condition: 'Gut (Note 2)',
    schwackeId: 'MB-SPR-317-KUEHL-2021',
  },

  mobileDe: {
    medianPrice: 42900,
    averagePrice: 42950,
    lowestPrice: 39900,
    highestPrice: 46500,
    count: 4, // wenige Vergleichsangebote — Nische
    comparables: [
      { id: 'tr-c1', title: 'Sprinter 317 CDI Kühlkoffer FRC', price: 42900, mileage: 71000, year: 2021, firstRegistration: '04/2021', location: 'Stuttgart', dealerName: 'Nutzfahrzeugzentrum', daysListed: 62, priceCategory: 'gut' },
      { id: 'tr-c2', title: 'Sprinter 316 CDI Kühlkoffer', price: 39900, mileage: 104000, year: 2020, firstRegistration: '08/2020', location: 'Karlsruhe', dealerName: 'Süd-Nutzfahrzeuge', daysListed: 88, priceCategory: 'sehr_gut' },
      { id: 'tr-c3', title: 'Sprinter 317 CDI Kühlkoffer Standkühlung', price: 46500, mileage: 52000, year: 2022, firstRegistration: '02/2022', location: 'Reutlingen', dealerName: 'Star Trucks', daysListed: 41, priceCategory: 'erhoht' },
      { id: 'tr-c4', title: 'Sprinter 314 CDI Kühlkoffer', price: 41400, mileage: 119000, year: 2019, firstRegistration: '11/2019', location: 'Pforzheim', dealerName: 'Auto Center West', daysListed: 73, priceCategory: 'gut' },
    ],
  },

  marketPosition: {
    percentile: 30,
    label: 'Unter Markt',
  },

  channel: 'endkunde',

  region: {
    location: DEFAULT_REGION_LOCATION,
    radiusKm: 50,
    avgOfferPrice: 42900,
    priceRange: { min: 39900, max: 46500 },
    countSameModelInRegion: 4, // Nische — wenige im Umkreis
    avgStandtage: 78, // lang, aber im Transporter-Modus unkritisch (G4)
  },

  // Nische: niedrige absolute Umschreibungszahl, aber auch kleiner Bestand → solide Rate.
  // TODO[real-backend]: KBA-Signale via Marktdaten-Anbieter (nicht roh vom KBA).
  kbaDemand: {
    besitzumschreibungenLast8Weeks: 28,
    trendDirection: 'up',
    changePercent: 12,
    windowLabel: 'Letzte 8 Wochen',
    regionalerBestand: 240,
    umschlagsrate: 11.7,
  },

  // Gewerbe-Diesel stabil; Kühl-Nische saisonal gefragt. B7-Hinweis trotz „grün".
  segmentSignal: {
    segment: 'Transporter / Kühlfahrzeug',
    kraftstoffart: 'diesel',
    segmentTrendLabel: 'Gewerbe-Diesel stabil · Kühl-Nische +14 % (Saison)',
    segmentTrendDirection: 'up',
    caution: false,
    neuzulassungsTrendPercent: 19,
    neuzulassungsHinweis:
      'eSprinter-Neuzulassungen +19 % — mittelfristig mehr gebrauchte Stromer am Markt; die Diesel-Kühl-Nische bleibt vorerst knapp.',
  },

  trend: computeTrendSignal({ baseValue: 42900, kbaTrend: 'up', kbaChangePercent: 12, umschlagsrate: 11.7, avgStandtage: 78 }),

  // Im Transporter-Modus zählt die Nische, nicht die Tagesgeschwindigkeit (G4).
  buyDecision: {
    recommendation: 'kaufen',
    reasoningType: 'preis_marge',
    rationale:
      'Knappe Kühl-Nische unter Markt, Marge > 15 % — lange Standzeit unkritisch, Vorratskauf vor der Sommersaison sinnvoll.',
  },

  vehicleType: 'transporter',

  // G2: saisonaler Nachfrage-/Preisindex (Sommer-Peak für Kühlfahrzeuge).
  seasonalTrend: {
    region: DEFAULT_REGION_LOCATION,
    summerIndex: 118,
    winterIndex: 88,
    note: 'Kühl-Sprinter drehen im Sommer deutlich besser — antizyklisch im Winter günstig einkaufen.',
    points: [
      { month: 'Jan', value: 88 },
      { month: 'Feb', value: 90 },
      { month: 'Mär', value: 96 },
      { month: 'Apr', value: 104 },
      { month: 'Mai', value: 112 },
      { month: 'Jun', value: 118 },
      { month: 'Jul', value: 120 },
      { month: 'Aug', value: 116 },
      { month: 'Sep', value: 106 },
      { month: 'Okt', value: 98 },
      { month: 'Nov', value: 90 },
      { month: 'Dez', value: 86 },
    ],
  },

  // G3: Nischen-/Ausstattungsabdeckung im Umkreis.
  // TODO[real-backend]: mobile.de Ausstattungsfilter im Umkreis.
  equipmentCoverage: [
    { feature: 'Kühlkoffer FRC (0–8 °C)', comparableInRegion: 2, rarity: 'selten' },
    { feature: 'Standkühlung 230 V', comparableInRegion: 1, rarity: 'einzigartig' },
    { feature: 'Luftfederung Hinterachse', comparableInRegion: 3, rarity: 'selten' },
    { feature: 'Klimaautomatik', comparableInRegion: 22, rarity: 'verbreitet' },
  ],

  // G4: Vorratskauf statt Schnelldreher-Logik.
  vorratskauf: {
    recommended: true,
    note: 'Antizyklischer Vorratskauf im Winter: bis zur Sommersaison einlagern, dann mit Nischenaufschlag verkaufen. Lange Standzeit ist hier kalkuliert, kein Nachteil.',
  },

  // G5: Was kaufen andere MB-Händler aktuell ein? (Nachfrage-Frühindikator, nur Beobachtung)
  // TODO[real-backend]: Auktions-/Großhandels-Einkaufssignale (BCA/Autobid/MB Remarketing) — nur Beobachtung, kein Bieten.
  dealerBuyingSignals: [
    { model: 'Sprinter 317 CDI Kühlkoffer', dealersBuying: 6, trend: 'up', note: 'Sechs MB-Händler im 100-km-Umkreis kaufen aktuell Kühl-Sprinter ein — Nachfrage zieht vor der Saison an.' },
    { model: 'Vito 116 CDI Kühlkasten', dealersBuying: 3, trend: 'flat', note: 'Stabile Nachfrage im kompakten Kühlsegment.' },
    { model: 'Sprinter 319 CDI Tiefkühl', dealersBuying: 4, trend: 'up', note: 'Tiefkühl-Aufbauten zunehmend gesucht (Lebensmittel-Logistik).' },
  ],
}
