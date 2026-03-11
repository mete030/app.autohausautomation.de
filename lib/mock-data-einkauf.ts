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
}
