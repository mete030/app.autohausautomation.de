import type { Listing, Vehicle } from './types'
import { mockVehicles } from './mock-data'

// AI-generated demo images via fal.ai (Nano Banana 2). Stored in
// public/inserate-demo/ — see scripts/generate-demo-images.mjs.
const demo = (name: string) => `/inserate-demo/${name}.png`

export const mercedesMedia = {
  // GLC 300 — five perspectives, two backdrops each. The "lot" version is the
  // raw dealership-yard photo (default). The "studio" version is the same
  // vehicle on the uniform Wackenhut studio backdrop ("freigestellt").
  glcFrontLeftLot: demo('glc_front_left_lot'),
  glcFrontLeftStudio: demo('glc_front_left_studio'),
  glcFrontRightLot: demo('glc_front_right_lot'),
  glcFrontRightStudio: demo('glc_front_right_studio'),
  glcRearLeftLot: demo('glc_rear_left_lot'),
  glcRearLeftStudio: demo('glc_rear_left_studio'),
  glcRearRightLot: demo('glc_rear_right_lot'),
  glcRearRightStudio: demo('glc_rear_right_studio'),
  glcKofferraumLot: demo('glc_kofferraum_lot'),
  glcKofferraumStudio: demo('glc_kofferraum_studio'),

  // CLA — 5 perspectives.
  claFrontLeft: demo('thumb_l1_cla_250e'),
  claFrontRight: demo('cla_front_right_lot'),
  claRearLeft: demo('cla_rear_left_lot'),
  claRearRight: demo('cla_rear_right_lot'),
  claKofferraum: demo('cla_kofferraum_lot'),
  // EQE — 5 perspectives.
  eqeFrontLeft: demo('thumb_l2_eqe_350'),
  eqeFrontRight: demo('eqe_front_right_lot'),
  eqeRearLeft: demo('eqe_rear_left_lot'),
  eqeRearRight: demo('eqe_rear_right_lot'),
  eqeKofferraum: demo('eqe_kofferraum_lot'),
  // E-Klasse T-Modell — 5 perspectives.
  eclassFrontLeft: demo('thumb_l4_e220d_estate'),
  eclassFrontRight: demo('eclass_front_right_lot'),
  eclassRearLeft: demo('eclass_rear_left_lot'),
  eclassRearRight: demo('eclass_rear_right_lot'),
  eclassKofferraum: demo('eclass_kofferraum_lot'),
  // Backwards-compat for old direct uses (point at front-left).
  claThumb: demo('thumb_l1_cla_250e'),
  eqeThumb: demo('thumb_l2_eqe_350'),
  eClassEstateThumb: demo('thumb_l4_e220d_estate'),

  // Backwards-compatible aliases — old keys map to the new GLC front-left.
  cClassStudio: demo('thumb_l1_cla_250e'),
  claStudio: demo('thumb_l1_cla_250e'),
  eClassEstateStudio: demo('thumb_l4_e220d_estate'),
  glcStudio: demo('glc_front_left_studio'),
  glcExterior: demo('glc_front_left_lot'),
  gleStudio: demo('glc_front_right_studio'),
  gleExterior: demo('glc_front_right_lot'),
  glaExterior: demo('thumb_l1_cla_250e'),
  eqeStudio: demo('thumb_l2_eqe_350'),
  eqeExterior: demo('thumb_l2_eqe_350'),
} as const

type InventoryVehicleOverride = Pick<
  Vehicle,
  'make' | 'model' | 'year' | 'vin' | 'color' | 'mileage' | 'fuelType' | 'transmission' | 'power' | 'price' | 'purchasePrice' | 'imageUrl' | 'notes'
> & {
  historyNotes?: Array<string | undefined>
}

const inventoryVehicleOverrides: Record<string, InventoryVehicleOverride> = {
  v1: {
    make: 'Mercedes-Benz',
    model: 'C 220 d T-Modell',
    year: 2022,
    vin: 'W1K2062041F123456',
    color: 'Graphitgrau metallic',
    mileage: 45200,
    fuelType: 'Diesel',
    transmission: 'Automatik',
    power: 200,
    price: 34900,
    purchasePrice: 28500,
    imageUrl: mercedesMedia.cClassStudio,
    notes: 'Bremsen hinten erneuern, Service B inklusive AdBlue-Check einplanen',
  },
  v2: {
    make: 'Mercedes-Benz',
    model: 'C 200 Limousine',
    year: 2023,
    vin: 'W1K2060421A234567',
    color: 'Obsidianschwarz metallic',
    mileage: 22100,
    fuelType: 'Benzin',
    transmission: 'Automatik',
    power: 204,
    price: 38500,
    purchasePrice: 31200,
    imageUrl: mercedesMedia.cClassStudio,
    notes: 'Aufbereitung: Politur, Lederpflege und Stern-Haube nacharbeiten',
  },
  v3: {
    make: 'Mercedes-Benz',
    model: 'CLA 250 e Coupé',
    year: 2023,
    vin: 'W1K1183841N345678',
    color: 'Kosmosschwarz metallic',
    mileage: 37700,
    fuelType: 'Plug-in-Hybrid',
    transmission: 'Automatik',
    power: 218,
    price: 32900,
    purchasePrice: 25800,
    imageUrl: mercedesMedia.claStudio,
    notes: 'AMG Line und Night-Paket im Exposé hervorheben',
  },
  v4: {
    make: 'Mercedes-Benz',
    model: 'A 200 Limousine',
    year: 2023,
    vin: 'W1K1770871J456789',
    color: 'Polarweiß',
    mileage: 18500,
    fuelType: 'Benzin',
    transmission: 'Automatik',
    power: 163,
    price: 31500,
    purchasePrice: 25900,
    imageUrl: mercedesMedia.claStudio,
    notes: 'Junger Stern aus Inzahlungnahme, Eingangscheck noch offen',
    historyNotes: ['Inzahlungnahme aus Flottenrücklauf'],
  },
  v5: {
    make: 'Mercedes-Benz',
    model: 'GLE 350 de 4MATIC',
    year: 2022,
    vin: 'W1N1671171A567890',
    color: 'Sodalithblau metallic',
    mileage: 35200,
    fuelType: 'Plug-in-Hybrid',
    transmission: 'Automatik',
    power: 333,
    price: 72900,
    purchasePrice: 59800,
    imageUrl: mercedesMedia.gleExterior,
    notes: 'Hochvolt-Systemcheck und Ladeeinheit vor Freigabe prüfen',
  },
  v6: {
    make: 'Mercedes-Benz',
    model: 'EQE 350+',
    year: 2023,
    vin: 'W1KEV2DB8PF567890',
    color: 'Obsidian Black',
    mileage: 28400,
    fuelType: 'Elektro',
    transmission: 'Automatik',
    power: 292,
    price: 57900,
    purchasePrice: 48200,
    imageUrl: mercedesMedia.eqeExterior,
    notes: 'Burmester und MBUX Superscreen in der Anzeige prominent platzieren',
  },
  v7: {
    make: 'Mercedes-Benz',
    model: 'GLE 450 d 4MATIC',
    year: 2023,
    vin: 'W1N1671331A678901',
    color: 'Selenitgrau metallic',
    mileage: 58700,
    fuelType: 'Diesel',
    transmission: 'Automatik',
    power: 367,
    price: 78900,
    purchasePrice: 65200,
    imageUrl: mercedesMedia.gleStudio,
    notes: 'Luftfederung kalibrieren und Chromleiste rechts prüfen',
  },
  v8: {
    make: 'Mercedes-Benz',
    model: 'GLC 300 4MATIC',
    year: 2023,
    vin: 'W1N2546021F789012',
    color: 'Spektralblau metallic',
    mileage: 19800,
    fuelType: 'Benzin',
    transmission: 'Automatik',
    power: 258,
    price: 52900,
    purchasePrice: 44200,
    imageUrl: mercedesMedia.glcExterior,
    notes: 'AMG Line mit Night-Paket, sofort foto- und inseratsbereit',
  },
  v9: {
    make: 'Mercedes-Benz',
    model: 'EQE SUV 350 4MATIC',
    year: 2024,
    vin: 'W1N2946991D890123',
    color: 'Graphitgrau metallic',
    mileage: 12300,
    fuelType: 'Elektro',
    transmission: 'Automatik',
    power: 292,
    price: 71900,
    purchasePrice: 61800,
    imageUrl: mercedesMedia.eqeStudio,
    notes: 'Leasingrückläufer mit MBUX Hyperscreen, First Check offen',
  },
  v10: {
    make: 'Mercedes-Benz',
    model: 'GLA 220 d 4MATIC',
    year: 2022,
    vin: 'W1N2477121J012345',
    color: 'Manufaktur Opalithweiß',
    mileage: 42100,
    fuelType: 'Diesel',
    transmission: 'Automatik',
    power: 190,
    price: 37900,
    purchasePrice: 31100,
    imageUrl: mercedesMedia.glaExterior,
    notes: 'Service A und Reifencheck, danach Fotos für mobile.de',
  },
  v11: {
    make: 'Mercedes-Benz',
    model: 'CLA 250 e Shooting Brake',
    year: 2023,
    vin: 'W1K1186861N123456',
    color: 'Digitalweiß metallic',
    mileage: 31500,
    fuelType: 'Plug-in-Hybrid',
    transmission: 'Automatik',
    power: 218,
    price: 36900,
    purchasePrice: 29800,
    imageUrl: mercedesMedia.claStudio,
    notes: 'Keramikpflege und Innenraum-Finish für AMG Line ausführen',
  },
  v12: {
    make: 'Mercedes-Benz',
    model: 'E 220 d T-Modell',
    year: 2024,
    vin: 'W1K2142031A234567',
    color: 'Verde Silber metallic',
    mileage: 15600,
    fuelType: 'Diesel',
    transmission: 'Automatik',
    power: 197,
    price: 63900,
    purchasePrice: 53800,
    imageUrl: mercedesMedia.eClassEstateStudio,
    notes: 'Digital Light, Burmester und Avantgarde Advanced Plus im Exposé ergänzen',
  },
  v13: {
    make: 'Mercedes-Benz',
    model: 'GLC 220 d 4MATIC Coupé',
    year: 2023,
    vin: 'W1N2539151F345678',
    color: 'Graphitgrau metallic',
    mileage: 40200,
    fuelType: 'Diesel',
    transmission: 'Automatik',
    power: 197,
    price: 48900,
    purchasePrice: 40600,
    imageUrl: mercedesMedia.glcStudio,
    notes: 'Bremsflüssigkeit wechseln und 4MATIC-Check dokumentieren',
  },
  v14: {
    make: 'Mercedes-Benz',
    model: 'A 250 e',
    year: 2023,
    vin: 'W1K1770841J234567',
    color: 'Kosmosschwarz metallic',
    mileage: 26800,
    fuelType: 'Plug-in-Hybrid',
    transmission: 'Automatik',
    power: 218,
    price: 33900,
    purchasePrice: 27900,
    imageUrl: mercedesMedia.claStudio,
    notes: 'Innenreinigung, Ladekabel prüfen und AMG Styling fotografieren',
  },
  v15: {
    make: 'Mercedes-Benz',
    model: 'GLE 400 e 4MATIC',
    year: 2023,
    vin: 'W1N1671491A456789',
    color: 'Graphitgrau',
    mileage: 61200,
    fuelType: 'Plug-in-Hybrid',
    transmission: 'Automatik',
    power: 381,
    price: 68400,
    purchasePrice: 54800,
    imageUrl: mercedesMedia.gleExterior,
    notes: 'Lackaufbereitung Heckklappe und Sensorik hinten prüfen',
  },
  v16: {
    make: 'Mercedes-Benz',
    model: 'GLA 200',
    year: 2023,
    vin: 'W1N2477131J567890',
    color: 'Mountaingrau metallic',
    mileage: 18900,
    fuelType: 'Benzin',
    transmission: 'Automatik',
    power: 163,
    price: 38900,
    purchasePrice: 32900,
    imageUrl: mercedesMedia.glaExterior,
    notes: 'Neu im Bestand, First Check und Preislabel noch offen',
    historyNotes: ['Junger Stern Zugang'],
  },
  v17: {
    make: 'Mercedes-Benz',
    model: 'EQE 300',
    year: 2023,
    vin: 'W1KEV2AA1PF678901',
    color: 'Hightechsilber metallic',
    mileage: 24100,
    fuelType: 'Elektro',
    transmission: 'Automatik',
    power: 245,
    price: 54900,
    purchasePrice: 44900,
    imageUrl: mercedesMedia.eqeExterior,
    notes: 'DC-Ladekabel, Wallbox-Hinweis und Fahrassistenzpaket kommunizieren',
  },
  v18: {
    make: 'Mercedes-Benz',
    model: 'C 300 e Limousine',
    year: 2022,
    vin: 'W1K2060531F890123',
    color: 'Polarweiß',
    mileage: 34400,
    fuelType: 'Plug-in-Hybrid',
    transmission: 'Automatik',
    power: 313,
    price: 41900,
    purchasePrice: 33800,
    imageUrl: mercedesMedia.cClassStudio,
    notes: 'Bereits mit Kaufvertrag reserviert',
  },
  v19: {
    make: 'Mercedes-Benz',
    model: 'GLE 450 4MATIC',
    year: 2022,
    vin: 'W1N1671591A901234',
    color: 'Vulkangrau metallic',
    mileage: 32800,
    fuelType: 'Hybrid',
    transmission: 'Automatik',
    power: 381,
    price: 68900,
    purchasePrice: 57200,
    imageUrl: mercedesMedia.gleStudio,
    notes: 'Bremsen vorne erneuern und Night-Paket im Showroom hervorheben',
  },
  v20: {
    make: 'Mercedes-Benz',
    model: 'GLA 220 4MATIC',
    year: 2023,
    vin: 'W1N2477841J012346',
    color: 'Polarweiß',
    mileage: 17400,
    fuelType: 'Benzin',
    transmission: 'Automatik',
    power: 190,
    price: 44900,
    purchasePrice: 37900,
    imageUrl: mercedesMedia.glaExterior,
    notes: 'Winterräder und Rückfahrkamera im B2B-Angebot ergänzen',
  },
  v21: {
    make: 'Mercedes-Benz',
    model: 'GLC 300 e 4MATIC',
    year: 2023,
    vin: 'W1N2546201F345679',
    color: 'Selenitgrau metallic',
    mileage: 39200,
    fuelType: 'Plug-in-Hybrid',
    transmission: 'Automatik',
    power: 313,
    price: 49800,
    purchasePrice: 40900,
    imageUrl: mercedesMedia.glcExterior,
    notes: 'HU-Termin vorbereiten und Ladezustand dokumentieren',
  },
  v22: {
    make: 'Mercedes-Benz',
    model: 'CLA 200 Coupé',
    year: 2022,
    vin: 'W1K1183121N456789',
    color: 'Manufaktur Patagonienrot metallic',
    mileage: 54800,
    fuelType: 'Benzin',
    transmission: 'Automatik',
    power: 163,
    price: 28900,
    purchasePrice: 22400,
    imageUrl: mercedesMedia.claStudio,
    notes: 'Inzahlungnahme von Stammkundin, Handoff an Service fehlt noch',
  },
}

export const mercedesInventoryVehicles: Vehicle[] = mockVehicles.map((vehicle) => {
  const override = inventoryVehicleOverrides[vehicle.id]
  if (!override) return vehicle

  return {
    ...vehicle,
    ...override,
    history: vehicle.history.map((entry, index) => ({
      ...entry,
      note: override.historyNotes?.[index] ?? entry.note,
    })),
  }
})

export const mercedesInventoryListings: Listing[] = [
  {
    id: 'l1',
    vehicleId: 'v3',
    title: 'Mercedes-Benz CLA 250 e Coupé AMG Line - Night-Paket, MBUX, Kamera',
    // Kundenstil (mobile.de-Hausformat): Ausstattungspakete → Sonderausstattungen
    // → JUNGER STERN → Serienausstattungen → Disclaimer. Listen = Datenblatt.
    description: `Ausstattungspakete:
Design- und Ausstattungslinie AMG Line: AMG Bodystyling, Sportsitze, Multifunktions-Sportlenkrad in Leder, 18″ AMG Leichtmetallräder schwarz
Night-Paket: Außenspiegelgehäuse in Schwarz, Fensterrahmen hochglanzschwarz, Seitenscheiben hinten und Heckscheibe abgedunkelt
Spiegel-Paket: Außenspiegel elektr. anklappbar, Außen-/Innenspiegel mit Abblendautomatik
Infotainment-Paket: MBUX Navigation Premium, MBUX Augmented Reality für Navigation, Smartphone-Integration (Apple CarPlay & Android Auto)
Park-Paket: Aktiver Park-Assistent mit PARKTRONIC, Rückfahrkamera


Sonderausstattungen
18″ AMG Leichtmetallräder schwarz
Aktiver Park-Assistent mit PARKTRONIC
AMG Line Exterieur
AMG Line Interieur
LED High Performance Scheinwerfer
MBUX Augmented Reality für Navigation
MBUX Navigation Premium
Night-Paket
Plug-in-Hybrid mit AC-Schnellladung
Rückfahrkamera
Sitzheizung vorne
Smartphone-Integration (Apple CarPlay & Android Auto)
Spiegel-Paket

JUNGER STERN


Serienausstattungen
ABS
Airbags vorne und seitlich
Aktiver Brems-Assistent
ASR
Berganfahrhilfe
Bordcomputer
Elektr. Außenspiegel beheizt
Elektr. Fensterheber
ESP
ISOFIX
Klimaautomatik THERMATIC
Knie-Airbag
Multifunktionslenkrad
Reifendruck-Kontrollsystem
Spurhalte-Assistent
Start-Stopp-Automatik
Tempomat
Zentralverriegelung mit Funk
... Änderungen, Zwischenverkauf und Irrtümer vorbehalten. Das Fahrzeug verfügt über ein Batterie Zertifikat. Für weitere Informationen nehmen Sie bitte direkten Kontakt auf. #03,#04`,
    price: 32900,
    status: 'live',
    platform: ['mobile.de', 'autoscout24'],
    images: [
      mercedesMedia.claFrontLeft,
      mercedesMedia.claFrontRight,
      mercedesMedia.claRearLeft,
      mercedesMedia.claRearRight,
      mercedesMedia.claKofferraum,
    ],
    priceCategory: 'gut',
    marketPrice: 34200,
    aiGenerated: true,
    aiConfidence: 93,
    createdAt: '2026-02-20',
    updatedAt: '2026-03-05',
    views: 376,
    inquiries: 11,
    dataSheet: {
      fahrzeugdaten: {
        fahrzeugzustand: 'Gebraucht',
        kategorie: 'Coupé',
        erstzulassung: '03/2023',
        kilometerstand: 38420,
        huBis: '03/2026',
        vorbesitzer: 1,
        fahrzeugnummer: 'WH-CLA-2403',
        tueren: 4,
        sitze: 5,
        aussenfarbe: 'Kosmosschwarz metallic',
        innenausstattung: 'Stoff/MICROCUT-Microfaser schwarz',
        schadstoffklasse: 'Euro 6d',
        umweltplakette: 'Grün (4)',
        kraftstoff: 'Plug-in-Hybrid',
        hubraum: 1332,
        leistungKW: 160,
        leistungPS: 218,
        getriebe: 'Automatik',
        antrieb: 'Frontantrieb',
        verbrauchKombiniert: 1.4,
        verbrauchEinheit: 'l/100km',
        co2Emission: 31,
        energieeffizienzklasse: 'A+',
        elektroReichweite: 71,
        batteriekapazitaet: 11.2,
        leergewicht: 1735,
      },
      serienausstattung: [
        'ABS', 'ESP', 'ASR', 'Airbags vorne und seitlich', 'Knie-Airbag',
        'Spurhalte-Assistent', 'Aktiver Brems-Assistent', 'Tempomat',
        'Berganfahrhilfe', 'Reifendruck-Kontrollsystem',
        'Elektr. Fensterheber', 'Elektr. Außenspiegel beheizt',
        'Zentralverriegelung mit Funk', 'Multifunktionslenkrad',
        'Klimaautomatik THERMATIC', 'Bordcomputer', 'Start-Stopp-Automatik', 'ISOFIX',
      ],
      sonderausstattung: [
        'AMG Line Exterieur', 'AMG Line Interieur', 'Night-Paket',
        'MBUX Navigation Premium', 'MBUX Augmented Reality für Navigation',
        'LED High Performance Scheinwerfer', 'Rückfahrkamera',
        'Sitzheizung vorne', 'Aktiver Park-Assistent mit PARKTRONIC',
        'Spiegel-Paket', 'Smartphone-Integration (Apple CarPlay & Android Auto)',
        '18″ AMG Leichtmetallräder schwarz', 'Plug-in-Hybrid mit AC-Schnellladung',
      ],
      schaeden: {
        unfallfrei: true,
        nichtraucher: true,
        scheckheftgepflegt: true,
        notes: [
          'Leichte Gebrauchsspuren an Lenkrad und Fahrersitz',
          'Felgen ohne Bordsteinkontakt',
        ],
      },
      zusatzinfo: [
        'Junge-Sterne-Garantie 24 Monate möglich (gegen Aufpreis)',
        'Lückenlose Servicehistorie bei Mercedes-Benz',
        'Letzter Service A inkl. Bremsflüssigkeit (12/2025)',
        'Probefahrt jederzeit nach Vereinbarung möglich',
        'Inzahlungnahme Ihres Fahrzeugs möglich',
      ],
    },
  },
  {
    id: 'l2',
    vehicleId: 'v6',
    title: 'Mercedes-Benz EQE 350+ - Burmester, Superscreen, AIRMATIC',
    description: `Ausstattungspakete:
Fahrassistenz-Paket Plus: Aktiver Abstands-Assistent DISTRONIC, Aktiver Lenk-Assistent, Aktiver Spurwechsel-Assistent, PRE-SAFE PLUS
Memory-Paket: Sitze vorn elektrisch verstellbar mit Memory, Lenksäule elektrisch verstellbar, Außenspiegel mit Memory-Funktion
Park-Paket mit 360°-Kamera: Aktiver Park-Assistent mit PARKTRONIC, 360°-Kamera
Mercedes me Connect Pakete: Navigations-Dienste, Live Traffic, Remote & Charging Services


Sonderausstattungen
20″ AMG Leichtmetallräder
360°-Kamera
AIRMATIC-Luftfederung mit ADS+
Burmester 3D-Surround-Soundsystem
DIGITAL LIGHT mit Projektionsfunktion
Energizing Komfortsteuerung
Fahrassistenz-Paket Plus
Head-up-Display
Hinterachslenkung 10°
MBUX Hyperscreen / Superscreen
Memory-Paket für Sitze und Lenkrad
Mercedes me Connect Pakete (Navigation, Live Traffic, Charging)
Panorama-Schiebedach
Sitzbelüftung und -heizung vorn

JUNGER STERN


Serienausstattungen
ABS
AC-Laden bis 11 kW
Airbag-Paket (Front, Seite, Knie, Window)
Aktiver Brems-Assistent mit Querverkehrsfunktion
ASR
Berganfahrhilfe
Bordcomputer
Combined Charging System bis 170 kW DC
DISTRONIC adaptiver Tempomat
Elektr. Fensterheber rundum
Elektr. Heckklappe
ESP
Klimaautomatik THERMOTRONIC
Multifunktions-Sportlenkrad
Reifendruck-Kontrollsystem
Spurhalte-Assistent
Wärmepumpe
... Änderungen, Zwischenverkauf und Irrtümer vorbehalten. Das Fahrzeug verfügt über ein Batterie Zertifikat. Für weitere Informationen nehmen Sie bitte direkten Kontakt auf. #03,#04`,
    price: 57900,
    status: 'live',
    platform: ['mobile.de'],
    images: [
      mercedesMedia.eqeFrontLeft,
      mercedesMedia.eqeFrontRight,
      mercedesMedia.eqeRearLeft,
      mercedesMedia.eqeRearRight,
      mercedesMedia.eqeKofferraum,
    ],
    priceCategory: 'sehr_gut',
    marketPrice: 59800,
    aiGenerated: true,
    aiConfidence: 95,
    createdAt: '2026-02-21',
    updatedAt: '2026-03-06',
    views: 614,
    inquiries: 17,
    dataSheet: {
      fahrzeugdaten: {
        fahrzeugzustand: 'Gebraucht',
        kategorie: 'Limousine',
        erstzulassung: '06/2023',
        kilometerstand: 24580,
        huBis: '06/2026',
        vorbesitzer: 1,
        fahrzeugnummer: 'WH-EQE-2306',
        tueren: 4,
        sitze: 5,
        aussenfarbe: 'Hightech-Silber metallic',
        innenausstattung: 'Leder Nappa schwarz mit Komfort-Kontrastnaht',
        schadstoffklasse: 'Elektro',
        umweltplakette: 'Grün (4) — E-Kennzeichen',
        kraftstoff: 'Elektro',
        leistungKW: 215,
        leistungPS: 292,
        getriebe: 'Automatik',
        antrieb: 'Heckantrieb',
        verbrauchKombiniert: 18.7,
        verbrauchEinheit: 'kWh/100km',
        co2Emission: 0,
        energieeffizienzklasse: 'A+',
        elektroReichweite: 638,
        batteriekapazitaet: 90.6,
        leergewicht: 2355,
      },
      serienausstattung: [
        'ABS', 'ESP', 'ASR', 'Airbag-Paket (Front, Seite, Knie, Window)',
        'Aktiver Brems-Assistent mit Querverkehrsfunktion', 'Spurhalte-Assistent',
        'DISTRONIC adaptiver Tempomat', 'Reifendruck-Kontrollsystem',
        'Elektr. Heckklappe', 'Elektr. Fensterheber rundum',
        'Klimaautomatik THERMOTRONIC', 'Multifunktions-Sportlenkrad',
        'Berganfahrhilfe', 'Wärmepumpe',
        'Combined Charging System bis 170 kW DC',
        'AC-Laden bis 11 kW', 'Bordcomputer',
      ],
      sonderausstattung: [
        'Burmester 3D-Surround-Soundsystem',
        'MBUX Hyperscreen / Superscreen',
        'AIRMATIC-Luftfederung mit ADS+',
        'Fahrassistenz-Paket Plus',
        'DIGITAL LIGHT mit Projektionsfunktion',
        'Memory-Paket für Sitze und Lenkrad',
        'Sitzbelüftung und -heizung vorn',
        'Head-up-Display',
        '360°-Kamera',
        'Panorama-Schiebedach',
        'Hinterachslenkung 10°',
        'Energizing Komfortsteuerung',
        'Mercedes me Connect Pakete (Navigation, Live Traffic, Charging)',
        '20″ AMG Leichtmetallräder',
      ],
      schaeden: {
        unfallfrei: true,
        nichtraucher: true,
        scheckheftgepflegt: true,
        notes: ['Hochvolt-Akku Gesundheitscheck 96% (zertifiziert 02/2026)'],
      },
      zusatzinfo: [
        'Junge-Sterne-Garantie 24 Monate inklusive',
        'Wallbox-Förderung bei Kauf möglich',
        'Probefahrt mit Schnelllade-Stop jederzeit möglich',
        'Lieferung deutschlandweit gegen Aufpreis',
        'Inzahlungnahme Ihres Fahrzeugs möglich',
      ],
    },
  },
  {
    id: 'l3',
    vehicleId: 'v8',
    title: 'Mercedes-Benz GLC 300 4MATIC AMG Line - Panorama, 360°, Night-Paket',
    description: '',
    price: 52900,
    status: 'entwurf',
    platform: [],
    images: [
      mercedesMedia.glcFrontLeftLot,
      mercedesMedia.glcFrontRightLot,
      mercedesMedia.glcRearLeftLot,
      mercedesMedia.glcRearRightLot,
      mercedesMedia.glcKofferraumLot,
    ],
    priceCategory: 'zufriedenstellend',
    marketPrice: 51500,
    aiGenerated: false,
    aiConfidence: 0,
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
    views: 0,
    inquiries: 0,
    dataSheet: {
      fahrzeugdaten: {
        fahrzeugzustand: 'Gebraucht',
        kategorie: 'SUV / Geländewagen',
        erstzulassung: '09/2023',
        kilometerstand: 21950,
        huBis: '09/2026',
        vorbesitzer: 1,
        fahrzeugnummer: 'WH-GLC-2309',
        tueren: 5,
        sitze: 5,
        aussenfarbe: 'Spektralblau metallic',
        innenausstattung: 'Leder ARTICO/MICROCUT schwarz mit roter Kontrastnaht',
        schadstoffklasse: 'Euro 6d (Mild-Hybrid)',
        umweltplakette: 'Grün (4)',
        kraftstoff: 'Benzin',
        hubraum: 1999,
        leistungKW: 190,
        leistungPS: 258,
        getriebe: 'Automatik',
        antrieb: 'Allrad (4MATIC)',
        verbrauchKombiniert: 8.0,
        verbrauchEinheit: 'l/100km',
        co2Emission: 181,
        energieeffizienzklasse: 'B',
        leergewicht: 2055,
        anhaengelastGebremst: 2400,
      },
      serienausstattung: [
        'ABS', 'ESP', 'ASR', 'Aktiver Brems-Assistent', 'Knie-Airbag',
        'Spurhalte-Assistent', 'Spurwechsel-Warner',
        'Tempomat mit Limiter', 'Reifendruck-Kontrollsystem',
        'Elektr. Heckklappe', 'Klimaautomatik THERMATIC 2-Zonen',
        'Multifunktions-Sportlenkrad in Leder', 'Berganfahrhilfe',
        'Bordcomputer', 'ISOFIX und i-Size hinten',
      ],
      sonderausstattung: [
        'AMG Line Exterieur', 'AMG Line Interieur', 'Night-Paket',
        'Panorama-Schiebedach elektrisch',
        'Burmester 3D-Surround-Soundsystem',
        '360°-Kamera mit Park-Paket',
        'Memory-Paket Sitze und Lenkrad',
        'Sitzheizung vorn und hinten', 'Sitzbelüftung vorn',
        'MBUX Navigation Premium mit Augmented Reality',
        'DIGITAL LIGHT', 'Head-up-Display', 'Keyless-Go',
        'Fahrassistenz-Paket Plus mit DISTRONIC',
        'Anhängerkupplung elektrisch ausklappbar',
        '20″ AMG Leichtmetallräder schwarz',
      ],
      schaeden: {
        unfallfrei: true,
        nichtraucher: true,
        scheckheftgepflegt: true,
        notes: ['Frontscheibe Steinschlag oben rechts (4 mm) — Reparatur kostenlos vor Übergabe'],
      },
      zusatzinfo: [
        'Erstinspektion erfolgt — Fahrzeug verkaufsbereit nach Foto-Set',
        'Junge-Sterne-Garantie 24 Monate möglich',
        'Allwetterreifen-Set (Sommer + Winter) im Preis enthalten',
        'Probefahrt jederzeit möglich',
      ],
    },
  },
  {
    id: 'l4',
    vehicleId: 'v12',
    title: 'Mercedes-Benz E 220 d T-Modell Avantgarde - DIGITAL LIGHT, Burmester',
    description: `Ausstattungspakete:
Design- und Ausstattungslinie Avantgarde: Avantgarde Exterieur, Avantgarde Interieur, Dachreling silbern
Fahrassistenz-Paket Plus: Aktiver Abstands-Assistent DISTRONIC, Aktiver Lenk-Assistent, Aktiver Spurwechsel-Assistent, PRE-SAFE PLUS
Park-Paket mit 360°-Kamera: Aktiver Park-Assistent mit PARKTRONIC, 360°-Kamera, Rückfahrkamera
Memory-Paket: Sitze vorn elektrisch verstellbar mit Memory, Lenksäule elektrisch verstellbar, Außenspiegel mit Memory-Funktion
Anhängerkupplung (elektrisch ausklappbar):


Sonderausstattungen
19″ AMG Leichtmetallräder
Anhängerkupplung elektrisch ausklappbar
Avantgarde Exterieur
Avantgarde Interieur
Burmester-Soundsystem
Dachreling silbern
DIGITAL LIGHT mit Projektion
Fahrassistenz-Paket Plus mit DISTRONIC
Head-up-Display
MBUX Navigation Premium mit Superscreen
Memory-Paket Sitze und Lenkrad
Park-Paket mit 360°-Kamera
Sitzheizung vorne und hinten
Smartphone-Integration kabellos

JUNGER STERN


Serienausstattungen
ABS
Aktiver Brems-Assistent
ASR
Berganfahrhilfe
Bordcomputer
Elektr. Heckklappe EASY-PACK
ESP
ISOFIX und i-Size hinten
Klimaautomatik THERMATIC 2-Zonen
Knie-Airbag
Mild-Hybrid mit Rekuperation
Multifunktionslenkrad in Leder
Reifendruck-Kontrollsystem
Spurhalte-Assistent
Spurwechsel-Warner
Tempomat mit Limiter
... Änderungen, Zwischenverkauf und Irrtümer vorbehalten. #03,#04`,
    price: 63900,
    status: 'live',
    platform: ['mobile.de', 'autoscout24'],
    images: [
      mercedesMedia.eclassFrontLeft,
      mercedesMedia.eclassFrontRight,
      mercedesMedia.eclassRearLeft,
      mercedesMedia.eclassRearRight,
      mercedesMedia.eclassKofferraum,
    ],
    priceCategory: 'gut',
    marketPrice: 66200,
    aiGenerated: true,
    aiConfidence: 91,
    createdAt: '2026-02-14',
    updatedAt: '2026-03-04',
    views: 428,
    inquiries: 9,
    dataSheet: {
      fahrzeugdaten: {
        fahrzeugzustand: 'Gebraucht',
        kategorie: 'Kombi',
        erstzulassung: '11/2023',
        kilometerstand: 31480,
        huBis: '11/2026',
        vorbesitzer: 1,
        fahrzeugnummer: 'WH-EKL-2311',
        tueren: 5,
        sitze: 5,
        aussenfarbe: 'Cavansitblau metallic',
        innenausstattung: 'Leder ARTICO/MICROCUT schwarz mit Avantgarde-Trim',
        schadstoffklasse: 'Euro 6d (Mild-Hybrid)',
        umweltplakette: 'Grün (4)',
        kraftstoff: 'Diesel',
        hubraum: 1993,
        leistungKW: 145,
        leistungPS: 197,
        getriebe: 'Automatik',
        antrieb: 'Heckantrieb',
        verbrauchKombiniert: 5.0,
        verbrauchEinheit: 'l/100km',
        co2Emission: 132,
        energieeffizienzklasse: 'A',
        leergewicht: 1955,
        anhaengelastGebremst: 2100,
      },
      serienausstattung: [
        'ABS', 'ESP', 'ASR', 'Aktiver Brems-Assistent', 'Knie-Airbag',
        'Spurhalte-Assistent', 'Spurwechsel-Warner',
        'Tempomat mit Limiter', 'Reifendruck-Kontrollsystem',
        'Elektr. Heckklappe EASY-PACK',
        'Klimaautomatik THERMATIC 2-Zonen',
        'Multifunktionslenkrad in Leder', 'Berganfahrhilfe',
        'Bordcomputer', 'ISOFIX und i-Size hinten',
        'Mild-Hybrid mit Rekuperation',
      ],
      sonderausstattung: [
        'Avantgarde Exterieur', 'Avantgarde Interieur',
        'DIGITAL LIGHT mit Projektion',
        'Burmester-Soundsystem',
        'MBUX Navigation Premium mit Superscreen',
        'Sitzheizung vorne und hinten',
        'Memory-Paket Sitze und Lenkrad',
        'Park-Paket mit 360°-Kamera',
        'Fahrassistenz-Paket Plus mit DISTRONIC',
        'Head-up-Display',
        'Anhängerkupplung elektrisch ausklappbar',
        'Dachreling silbern',
        'Smartphone-Integration kabellos',
        '19″ AMG Leichtmetallräder',
      ],
      schaeden: {
        unfallfrei: true,
        nichtraucher: true,
        scheckheftgepflegt: true,
        notes: [
          'Heckklappenkante minimaler Lackabrieb — wird vor Übergabe nachgearbeitet',
          'Kratzer Stoßstange hinten links (ca. 4 cm) — Smart-Repair vor Übergabe',
        ],
      },
      zusatzinfo: [
        'Lückenlose Servicehistorie bei Mercedes-Benz',
        'Letzter Service B inkl. Bremsflüssigkeit (01/2026)',
        'Junge-Sterne-Garantie 24 Monate möglich',
        'Großer Kombi mit 1.820 l Ladevolumen — ideal für Vielfahrer',
        'Probefahrt und Inzahlungnahme jederzeit möglich',
      ],
    },
  },
]

export const mercedesListingCreationVinMock = {
  vin: 'W1N2546021F789012',
  make: 'Mercedes-Benz',
  model: 'GLC 300 4MATIC AMG Line',
  year: '2023',
  mileage: '19.800',
  power: '258',
  displacement: '1.999',
  fuelType: 'benzin',
  transmission: 'automatik',
  color: 'Spektralblau Metallic',
  doors: '5',
  seats: '5',
  firstRegistration: '05.2023',
  hu: '05.2026',
  price: '52.900',
  serienausstattung: [
    'LED High Performance',
    'Klimaautomatik THERMATIC',
    'Rückfahrkamera',
    'Park-Assistent mit PARKTRONIC',
    'Sitzheizung vorne',
    'DAB+ Radio',
    'Bluetooth Freisprecheinrichtung',
    'Tempomat',
    'Lichtsensor',
    'Regensensor',
    'Isofix',
    'Start-Stop-System',
    'Bordcomputer',
    'Elektr. Fensterheber',
    'Elektr. Außenspiegel',
    'Zentralverriegelung',
    'ABS / ASR / ESP',
    'Spurhalte-Assistent',
    'Apple CarPlay',
    'Android Auto',
  ],
  sonderausstattung: [
    'AMG Line Exterieur',
    'Night-Paket',
    'Panorama-Schiebedach',
    'Burmester 3D-Surround-Soundsystem',
    'Head-up-Display',
    '360°-Kamera',
    'Memory-Paket',
    'AIRMATIC',
    'Fahrassistenz-Paket Plus',
    'Anhängerkupplung schwenkbar',
  ],
} as const

export const mercedesSeriesOptions = [
  'LED High Performance',
  'MULTIBEAM LED',
  'Tagfahrlicht',
  'Klimaautomatik THERMATIC',
  'Klimaanlage',
  'Rückfahrkamera',
  'Park-Assistent mit PARKTRONIC',
  'Einparkhilfe',
  'Sitzheizung vorne',
  'DAB+ Radio',
  'Bluetooth',
  'Apple CarPlay',
  'Android Auto',
  'Tempomat',
  'Lichtsensor',
  'Regensensor',
  'Isofix',
  'Start-Stop-System',
  'Bordcomputer',
  'Elektr. Fensterheber',
  'Elektr. Außenspiegel',
  'Zentralverriegelung',
  'ABS',
  'ASR',
  'ESP',
  'Airbags vorne',
  'Airbags seitlich',
  'Spurhalte-Assistent',
  'Totwinkel-Assistent',
  'Multifunktionslenkrad',
  'Ambientebeleuchtung',
] as const

export const mercedesExtraOptions = [
  'MBUX Navigation Premium',
  'MBUX Augmented Reality',
  'AMG Line',
  'Night-Paket',
  'Panorama-Schiebedach',
  'Head-up-Display',
  'Burmester 3D-Surround-Soundsystem',
  'AIRMATIC',
  'Memory-Paket',
  'Keyless-Go',
  'Fahrassistenz-Paket Plus',
  'Standheizung',
  'Anhängerkupplung',
  'Lederausstattung',
  '360°-Kamera',
  'DIGITAL LIGHT',
  'Massagesitze',
  'Belüftete Sitze',
  'DISTRONIC',
  'Ladepaket AC/DC',
] as const

export const mercedesListingCreationAiMock = {
  title: 'Mercedes-Benz GLC 300 4MATIC AMG Line - Night-Paket, Pano, Burmester',
  // Deterministic, 1:1 the customer's own mobile.de house style: starts directly
  // with "Ausstattungspakete" (package → contents), then "Sonderausstattungen",
  // "JUNGER STERN", "Serienausstattungen" and the standard closing disclaimer.
  // Hardcoded verbatim from a real Wackenhut GLC listing (demo data) — no
  // AI-invented intro paragraph, always identical output.
  description: `Ausstattungspakete:
Chrom-Paket: Dachreling (Aluminium), Unterfahrschutz (Chrom)
Fahrassistenz-Paket High-End: Außenspiegel elektr. anklappbar, Außen-/Innenspiegel mit Abblendautomatik, Außenspiegel mit aktivem Totwinkel-Assistent, Fahrassistenz-System: aktiver Spurhalteassistent, Tempomat mit Abstandsregelung / Distronic Plus, PRE-SAFE-System Plus, Fahrassistenz-System: Bremsassistent Plus (BAS) mit Kreuzungs-Assistent, Abstandsregeltempomat Distronic Plus mit Lenk-Assistent, Spiegel-Paket, Fahrassistenz-Paket Plus
Licht-Paket High-End: Intelligent Light System LED
Exclusive Interieur: Lenkrad (Leder), Sitzbezug / Polsterung: Stoff / Ledernachbildung Artico, Armaturentafel in Ledernachbildung Artico, Innenhimmel Stoff, Innenausstattung: Holz Linde
Komfort-Paket Advanced: Sitzheizung vorn, Sitz vorn links elektr. verstellbar (mit Memory), Sitz vorn rechts elektr. verstellbar (mit Memory)
Ausstattungs-Paket: Business: Sitzheizung vorn, Lendenwirbelstützen vorn, Kraftstofftank: vergrößert, Fahrassistenz-System: aktiver Park-Assistent, sitz-komfort-paket, Smartphone integriert, Media-Display, Komfort-Paket, Infotainment-Paket Advanced, Konnektivität-Paket, Park-Paket mit Sensoren
Infotainment-Paket High-End: Fahrassistenz-System: Verkehrszeichenerkennung, Smartphone integriert, Media-Display, Service-System: MBUX Augmented Reality für Navigation, Konnektivität-Paket
Park-Paket High-End: Fahrassistenz-System: aktiver Park-Assistent, Kamerasystem 360 Grad, Park-Paket mit 360° Kamera, Park-Paket mit Sensoren
Ablage-Paket: USB-Anschluss im Fond
Off-Road-Styling-Paket: LM-Felgen, Federung für grosse Bodenfreiheit (Off-Road Fahrwerk)


Sonderausstattungen
Ablage-Paket
Ausstattungs-Paket: Business
EXCLUSIVE Interieur
Fahrassistenz-Paket High-End
Heckklappe mit automatischem Öffnungs- und Schließsystem
Infotainment-Paket High-End
Komfort-Paket Advanced
Licht-Paket High-End
Off-Road-Styling-Paket
Panorama-Schiebedach
Park-Paket High-End
Scheibenwaschanlage beheizt
Sitzbezug / Polsterung: Leder
Wendematte und Ladekantenschutz

JUNGER STERN


Serienausstattungen
Adaptives Bremslicht
Airbag Beifahrerseite abschaltbar
Airbag Fahrer-/Beifahrerseite
Aktive Motorhaube
Anti-Blockier-System (ABS)
Antriebsart: Allradantrieb
Außenspiegel Wagenfarbe
Außenspiegel elektr. verstell- und heizbar, beide
BREMSASSISTENT
Beckenairbag vorn (Pelvisbag)
Blinkleuchte in Außenspiegel integriert
Chrom-Paket
Direktlenkung mit variabler Lenkkraft-Unterstützung
Einschaltautomatik für Fahrlicht
Elektromotor 10 kW (Hybridantrieb)
Elektron. Stabilitäts-Programm (ESP)
Fahrassistenz-System: Agility Select / Dynamic Select (Fahrmodusschalter)
Fahrassistenz-System: Attention-Assist (Müdigkeitserkennungs-Sensor)
Fahrassistenz-System: Auffahrwarnsystem mit Bremsfunktion (Collision Prevention Assist)
Fahrassistenz-System: Berganfahrhilfe
Fahrassistenz-System: Verkehrs-Informations-System Live Traffic
Fahrzeug-Monitoring (Fahrzeugortungssystem)
Fensterheber elektrisch vorn + hinten
Feststellbremse elektrisch
Gepäckraumabdeckung / Rollo
Getriebe Automatik - (9-Stufen)
Getränkehalter vorn
Heckleuchten LED
Innenraumlicht-Paket
Isofix-Aufnahmen für Kindersitz an Rücksitz
Keyless Go Startanlage
Klimaautomatik (Thermatic 2-Zonen)
Knieairbag Fahrerseite
Kommunikationsmodul (LTE) Vorbereitung Mercedes me connect
Kopf-Airbag-System (Windowbag)
Lenkrad (Sport) mit Multifunktion
Mercedes-Benz Notrufsystem
Multimedia-Infotainment-System MBUX (Connect 20 High)
Radstand 2873 mm
Reifendruck-Kontrollsystem
Reiserechner
Rücksitzlehne geteilt / klappbar
Schadstoffarm nach Abgasnorm Euro 6d-TEMP
Scheibenwischer mit Regensensor
Seitenairbag (Sidebag) vorn
Sprachbediensystem Erweiterte Funktionen (MBUX)
Start/Stop-Anlage
Stoßfänger Wagenfarbe
Touchpad (Mittelkonsole)
Warnanlage / Statusanzeige für Sicherheitsgurte im Fond
Wegfahrsperre
Wärmeschutzverglasung
Zentralverriegelung mit Fernbedienung
... Änderungen, Zwischenverkauf und Irrtümer vorbehalten. #03,#04`,
  // "Verbessern" swaps to the second real customer GLC example (also verbatim).
  improvedDescription: `Ausstattungspakete:
Spiegel-Paket: Außenspiegel elektr. anklappbar, Außen-/Innenspiegel mit Abblendautomatik
Design- und Ausstattungslinie AMG Line: Seitenscheiben hinten und Heckscheibe abgedunkelt, LM-Felgen, Dachreling (Aluminium)
Fahrassistenz-Paket Plus: PRE-SAFE-System, Tempomat mit Abstandsregelung / Distronic Plus, PRE-SAFE-System Impuls Seite
Anhängerkupplung (Kugelkopf schwenkbar):
Winter-Paket: Sitzheizung vorn, Lenkrad heizbar, Scheibenwaschanlage beheizt
Technik-Paket: Airmatic DC / Air Body Control (Luftfederung)
Ausstattungs-Paket: Premium Plus: Sitz vorn links elektr. verstellbar, Sitz vorn rechts elektr. verstellbar, Fahrassistenz-System: Verkehrszeichenerkennung, Sitz vorn links elektr. verstellbar (mit Memory), Sitz vorn rechts elektr. verstellbar (mit Memory), Fahrassistenz-System: aktiver Park-Assistent, Einstiegsleisten beleuchtet, Keyless-Go Startanlage und Zentralverriegelung, Edelstahlpedale Sportdesign, Armaturentafel in Ledernachbildung Artico, Zentralverriegelung mit Infrarot - / Komfortbedienung, Außenspiegel mit Totwinkel-Assistent, Fahrassistenz-System: Fernlichtassistent Adaptive plus, Sitzbezug / Polsterung: Ledernachbildung Artico / Dinamica, Park-Paket mit 360° Kamera, Panorama-Schiebedach, Surround-System Burmester, Frontscheibe und Verbundsicherheitsglas (VSG) mit Akustikfolie, KEYLESS-Go-Paket, Memory-Paket, AMG-Line Interieur, Klimaautomatik (Thermotronik), Bremsanlage mit großen Bremsscheiben (Hochleistungs-Bremssystem), Service-System: MBUX Augmented Reality für Navigation, Head-up-Display (Frontsichtanzeige), Lenkrad (Leder Nappa, unten abgeflacht), Innenausstattung: Zierteile Metall Struktur, Digital Light, Digital Light mit Projektionsfunktion, Ambiente-Beleuchtung (Plus) mit direkter Lichtlinie


Sonderausstattungen
Armaturentafel Oberteil in Nappaoptik
Ausstattungs-Paket: Premium Plus
Fahrassistenz-Paket Plus
Metallic-Lackierung
Multimediasystem MBUX Entertainment
Sound-System mit Soundpersonalisierung
Technik-Paket
Winter-Paket

JUNGER STERN


Serienausstattungen
Ablage-Paket
Airbag Fahrer-/Beifahrerseite
Anhängerkupplung (Kugelkopf schwenkbar)
Antriebsart: Allradantrieb
Ausstattungs-Paket USB
Design- und Ausstattungslinie AMG Line
Digitales Instrumenten-Display
Fahrassistenz-System: Verkehrs-Informations-System Live Traffic
Fahrassistenz-System: aktiver Spurhalteassistent
Gepäckraumabdeckung / Rollo
Getriebe Automatik - (9-Stufen)
Getränkehalter vorn (doppelt)
Heckklappe mit automatischem Öffnungs- und Schließsystem
Hybrid 245 kW (Motor 2,0 Ltr. - 145 kW Diesel)
Induktionsladeschale für Smartphone
Infotainment-System: Remote & Charging Services Plus
Infotainment-System: Remote Service (Plus)
Innenraumlicht-Paket
Interieur-Paket Chrom
Knieairbag Fahrerseite
Kommunikationsmodul (LTE) Vorbereitung Mercedes me connect
Kopf-Airbag-System (Windowbag)
Ladekabel für öffentliche Ladesäulen
Ladekabel mit Schukostecker
Laderaum-Paket
Lenkrad (Sport) mit Multifunktion
Mercedes-Benz Notrufsystem
Mittelkonsole schwarz hochglänzend
Multimediasystem MBUX (Connect 20 MID)
Navigationssystem: Festplattennavigation
Niveauregulierung
Radstand Standard
Reifen-Reparaturset (Tirefit)
Reifendruck-Kontrollsystem
Rußpartikelfilter
Schadstoffarm nach Abgasnorm Euro 6d
Scheibenwischer mit Regensensor
Seitenairbag (Sidebag) vorn
Service-System: Fingerabdruck-Scanner für MBUX
Service-System: MBUX Navigation Premium
Sitzkomfortpaket
Smartphone integriert
Spiegel-Paket
Sprachbediensystem Erweiterte Funktionen (MBUX)
Vorrüstung car sharing
... Änderungen, Zwischenverkauf und Irrtümer vorbehalten. Das Fahrzeug verfügt über ein Batterie Zertifikat. Für weitere Informationen nehmen Sie bitte direkten Kontakt auf. #03,#04`,
  kycScore: 78,
  improvedKycScore: 97,
  confidence: 94,
  priceAnalysis: {
    marketPrice: 54800,
    suggestion: 52900,
    category: 'gut' as const,
    thresholds: [
      { label: 'Sehr gut', max: 49900 },
      { label: 'Gut', max: 53500 },
      { label: 'Zufriedenstellend', max: 55900 },
      { label: 'Erhöht', max: 58900 },
    ],
  },
  plausibilityCheck: {
    score: 92,
    summary: 'Angaben sind insgesamt plausibel und konsistent mit Bild- und Marktdaten.',
    checks: [
      {
        id: 'damages',
        category: 'Schäden',
        label: 'Schadensfreiheit',
        status: 'pass' as const,
        detail: 'Keine Hinweise auf Vorschäden in den Bildern erkennbar.',
      },
      {
        id: 'paint',
        category: 'Schäden',
        label: 'Lackzustand',
        status: 'pass' as const,
        detail: 'Lackbild auf allen 6 Aufnahmen konsistent – keine Steinschläge, Kratzer oder Nachlackierungen erkannt.',
      },
      {
        id: 'wheels',
        category: 'Schäden',
        label: 'Felgen & Räder',
        status: 'warning' as const,
        detail: 'Leichte Bordsteinkontakte am vorderen rechten Felgenhorn erkennbar – Hinweis in Beschreibung empfohlen.',
      },
      {
        id: 'interior',
        category: 'Schäden',
        label: 'Innenraum-Zustand',
        status: 'pass' as const,
        detail: 'Sitze, Lenkrad und Armaturen zeigen keine ungewöhnlichen Gebrauchsspuren für 19.800 km.',
      },
      {
        id: 'mileage',
        category: 'Plausibilität',
        label: 'Kilometerstand',
        status: 'pass' as const,
        detail: '19.800 km für Baujahr 2023 plausibel (Ø 12.500 km/Jahr).',
      },
      {
        id: 'registration',
        category: 'Plausibilität',
        label: 'Erstzulassung vs. Baujahr',
        status: 'pass' as const,
        detail: '05/2023 stimmt mit Baujahr 2023 überein.',
      },
      {
        id: 'features',
        category: 'Plausibilität',
        label: 'Ausstattungsangaben',
        status: 'pass' as const,
        detail: 'Alle 10 Sonderausstattungen mit VIN-Datensatz abgeglichen.',
      },
      {
        id: 'price',
        category: 'Plausibilität',
        label: 'Preis im Markt-Korridor',
        status: 'pass' as const,
        detail: '52.900 € liegt im Bereich „Gut" (49.900 – 53.500 €).',
      },
      {
        id: 'service',
        category: 'Hinweise',
        label: 'Servicehistorie',
        status: 'info' as const,
        detail: '„Scheckheftgepflegt" angegeben – Nachweise (Service-Stempel) für Veröffentlichung empfohlen.',
      },
    ],
  },
} as const

export const mercedesListingCreationImageSlots = [
  {
    id: 0,
    label: 'Vorne links',
    original: mercedesMedia.glcFrontLeftLot,
    cutout: mercedesMedia.glcFrontLeftStudio,
    quality: mercedesMedia.glcFrontLeftLot,
  },
  {
    id: 1,
    label: 'Vorne rechts',
    original: mercedesMedia.glcFrontRightLot,
    cutout: mercedesMedia.glcFrontRightStudio,
    quality: mercedesMedia.glcFrontRightLot,
  },
  {
    id: 2,
    label: 'Hinten links',
    original: mercedesMedia.glcRearLeftLot,
    cutout: mercedesMedia.glcRearLeftStudio,
    quality: mercedesMedia.glcRearLeftLot,
  },
  {
    id: 3,
    label: 'Hinten rechts',
    original: mercedesMedia.glcRearRightLot,
    cutout: mercedesMedia.glcRearRightStudio,
    quality: mercedesMedia.glcRearRightLot,
  },
  {
    id: 4,
    label: 'Kofferraum',
    original: mercedesMedia.glcKofferraumLot,
    cutout: mercedesMedia.glcKofferraumStudio,
    quality: mercedesMedia.glcKofferraumLot,
  },
] as const
