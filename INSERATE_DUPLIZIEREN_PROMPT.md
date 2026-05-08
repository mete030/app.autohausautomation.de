# PROMPT — Inserate-Tab 1:1 in Ziel-App nachbauen

Kopiere den gesamten Inhalt **unterhalb der Trennlinie** und gib ihn dem Ziel-LLM als Aufgabe.

---

# Aufgabe

Baue den kompletten **„Inserate"-Tab** aus einer bestehenden Next.js-App **1:1** in die aktuelle Ziel-App nach. Es soll alles **exakt genauso** funktionieren wie in der Vorlage — inklusive Dummy-Daten, klickbaren Karten, KI-Mock-Animationen, Bild-Galerie, Plattform-Export-Dialog usw. Es ist eine reine UI/Mock-Implementierung — **kein Backend** notwendig.

## Tech-Stack-Voraussetzungen der Ziel-App

Die Ziel-App muss bereits mit folgendem Stack laufen (Next.js App Router + Tailwind + shadcn/ui). Falls nicht vorhanden, vorab installieren:

```bash
npm install zustand lucide-react date-fns clsx tailwind-merge class-variance-authority
```

shadcn/ui-Komponenten, die verwendet werden (per `npx shadcn@latest add <name>` ergänzen, falls nicht vorhanden):
`card`, `button`, `badge`, `tabs`, `dialog`, `separator`, `input`, `label`, `select`, `progress`

Zusätzliche Erwartungen ans Setup:
- Pfad-Alias `@/*` zeigt auf das Projekt-Root (siehe `tsconfig.json` `paths`).
- Tailwind v4 mit den shadcn-Tokens (`bg-card`, `text-muted-foreground`, `border-border`, `bg-primary`, `text-primary`, `text-primary-foreground`, `bg-muted`, `bg-muted/30` etc.).

## Routen-Struktur (1:1)

Lege exakt diese drei Routen unter `app/(dashboard)/inserate/` an. Falls die Ziel-App keine `(dashboard)`-Group hat, kann sie unter `app/inserate/` liegen — Route-Pfade `/inserate`, `/inserate/[id]`, `/inserate/neu` müssen aber identisch sein.

- `app/(dashboard)/inserate/page.tsx` — Übersicht mit Tabs (Alle / Live / Entwürfe / Archiviert)
- `app/(dashboard)/inserate/[id]/page.tsx` — Detailseite eines Inserats (Bilder-Galerie, Datenblatt, Plattform-Export)
- `app/(dashboard)/inserate/neu/page.tsx` — Wizard für neues Inserat (VIN-Modus + Manuell-Modus, KI-Assistent, Bild-Enhancement, Plausibilitätsprüfung, Export-Dialog)

## Sidebar / Navigation

Falls die Ziel-App eine Sidebar hat, einen Eintrag „Inserate" hinzufügen:

```ts
{
  title: 'Inserate',
  href: '/inserate',
  icon: FileText, // aus 'lucide-react'
  children: [
    { title: 'Übersicht', href: '/inserate' },
    { title: 'Neues Inserat', href: '/inserate/neu' },
  ],
}
```

## Demo-Bilder

Im Quell-Repo liegen **26 PNG-Dateien** unter `public/inserate-demo/`. Diese sind essenziell — die Inventory-Mock-Daten referenzieren sie über exakt diese Dateinamen. Lege in der Ziel-App den Ordner `public/inserate-demo/` an und kopiere die folgenden Dateien hinein (Dateinamen NICHT ändern):

```
cla_front_right_lot.png
cla_kofferraum_lot.png
cla_rear_left_lot.png
cla_rear_right_lot.png
eclass_front_right_lot.png
eclass_kofferraum_lot.png
eclass_rear_left_lot.png
eclass_rear_right_lot.png
eqe_front_right_lot.png
eqe_kofferraum_lot.png
eqe_rear_left_lot.png
eqe_rear_right_lot.png
glc_front_left_lot.png
glc_front_left_studio.png
glc_front_right_lot.png
glc_front_right_studio.png
glc_kofferraum_lot.png
glc_kofferraum_studio.png
glc_rear_left_lot.png
glc_rear_left_studio.png
glc_rear_right_lot.png
glc_rear_right_studio.png
thumb_l1_cla_250e.png
thumb_l2_eqe_350.png
thumb_l4_e220d_estate.png
wackenhut_backdrop.png
```

> **Hinweis an den Bearbeiter:** Du kannst diese Dateien vom Quell-Repo selbst nicht erzeugen. Bitte den Nutzer, sie aus `public/inserate-demo/` der Quell-App in die Ziel-App zu kopieren (z. B. via `cp -r`). Falls Bilder vorübergehend fehlen, nutzt der Code den Fallback `mercedesMedia.glcExterior` — die UI bleibt funktional.

---

## Dateien anlegen

Lege **genau** die folgenden Dateien mit dem **exakten Inhalt** an. Wenn eine Datei (z. B. `lib/utils.ts`) in der Ziel-App bereits existiert, dann **erweitere** sie um die fehlenden Exports — überschreibe sie nicht.

---

### `lib/utils.ts` (sicherstellen, dass `cn` und `formatCurrency` existieren)

```ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}
```

---

### `lib/types.ts` (nur die für Inserate relevanten Typen — falls Datei existiert, ergänzen)

```ts
export type FuelType = 'Benzin' | 'Diesel' | 'Elektro' | 'Hybrid' | 'Plug-in-Hybrid'

export type ListingStatus = 'entwurf' | 'live' | 'archiviert'
export type PriceCategory = 'sehr_gut' | 'gut' | 'zufriedenstellend' | 'erhoht' | 'stark_erhoht'

// Mirrors the structure mobile.de uses on a listing detail page.
export interface ListingDataSheet {
  fahrzeugdaten: {
    fahrzeugzustand: string
    kategorie: string
    erstzulassung: string
    kilometerstand: number
    huBis?: string
    vorbesitzer: number
    fahrzeugnummer?: string
    tueren: number
    sitze: number
    aussenfarbe: string
    innenausstattung: string
    schadstoffklasse?: string
    umweltplakette?: string
    kraftstoff: FuelType
    hubraum?: number
    leistungKW: number
    leistungPS: number
    getriebe: 'Automatik' | 'Schaltung'
    antrieb: string
    verbrauchInnerorts?: number
    verbrauchAusserorts?: number
    verbrauchKombiniert?: number
    verbrauchEinheit?: 'l/100km' | 'kWh/100km'
    co2Emission?: number
    energieeffizienzklasse?: string
    leergewicht?: number
    anhaengelastGebremst?: number
    elektroReichweite?: number
    batteriekapazitaet?: number
  }
  serienausstattung: string[]
  sonderausstattung: string[]
  schaeden: {
    unfallfrei: boolean
    nichtraucher: boolean
    scheckheftgepflegt: boolean
    notes?: string[]
  }
  zusatzinfo?: string[]
}

export interface Listing {
  id: string
  vehicleId: string
  title: string
  description: string
  price: number
  status: ListingStatus
  platform: string[]
  images: string[]
  priceCategory: PriceCategory
  marketPrice: number
  aiGenerated: boolean
  aiConfidence: number
  createdAt: string
  updatedAt: string
  views: number
  inquiries: number
  dataSheet?: ListingDataSheet
}
```

---

### `lib/constants.ts` (Preiskategorie-Konfiguration — falls Datei existiert, nur diesen Export ergänzen)

```ts
export const priceCategoryConfig = {
  sehr_gut: { label: 'Sehr gut', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  gut: { label: 'Gut', color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
  zufriedenstellend: { label: 'Zufriedenstellend', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  erhoht: { label: 'Erhöht', color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20' },
  stark_erhoht: { label: 'Stark erhöht', color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
} as const
```

---

### `lib/mercedes-inventory.ts` (Mock-Daten — komplette Datei)

```ts
import type { Listing } from './types'

const demo = (name: string) => `/inserate-demo/${name}.png`

export const mercedesMedia = {
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

  claFrontLeft: demo('thumb_l1_cla_250e'),
  claFrontRight: demo('cla_front_right_lot'),
  claRearLeft: demo('cla_rear_left_lot'),
  claRearRight: demo('cla_rear_right_lot'),
  claKofferraum: demo('cla_kofferraum_lot'),

  eqeFrontLeft: demo('thumb_l2_eqe_350'),
  eqeFrontRight: demo('eqe_front_right_lot'),
  eqeRearLeft: demo('eqe_rear_left_lot'),
  eqeRearRight: demo('eqe_rear_right_lot'),
  eqeKofferraum: demo('eqe_kofferraum_lot'),

  eclassFrontLeft: demo('thumb_l4_e220d_estate'),
  eclassFrontRight: demo('eclass_front_right_lot'),
  eclassRearLeft: demo('eclass_rear_left_lot'),
  eclassRearRight: demo('eclass_rear_right_lot'),
  eclassKofferraum: demo('eclass_kofferraum_lot'),

  claThumb: demo('thumb_l1_cla_250e'),
  eqeThumb: demo('thumb_l2_eqe_350'),
  eClassEstateThumb: demo('thumb_l4_e220d_estate'),

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

export const mercedesInventoryListings: Listing[] = [
  {
    id: 'l1',
    vehicleId: 'v3',
    title: 'Mercedes-Benz CLA 250 e Coupé AMG Line - Night-Paket, MBUX, Kamera',
    description: 'Sportlich gezeichnetes Mercedes-Benz CLA 250 e Coupé in Kosmosschwarz metallic mit AMG Line und Night-Paket. Das Plug-in-Hybrid-System mit 218 PS verbindet souveräne Fahrleistungen mit elektrischer Kurzstreckentauglichkeit. MBUX Navigation Premium, Rückfahrkamera, Sitzheizung vorne und LED High Performance sind bereits an Bord. Scheckheftgepflegt und aus erster Hand.',
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
    description: 'Vollelektrische Business-Limousine mit starker Ausstattung und effizientem 350+ Antrieb. Das Fahrzeug kombiniert Burmester 3D-Surround-Sound, MBUX Superscreen, AIRMATIC und umfangreiche Fahrassistenz für ein sehr hochwertiges Fahrerlebnis. Ladehistorie dokumentiert, sehr gepflegter Zustand, Junger Stern Garantie möglich.',
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
    description: 'Modernes Mercedes-Benz E 220 d T-Modell mit Avantgarde Line, DIGITAL LIGHT und hochwertigem Burmester-Soundsystem. Der effiziente Diesel mit 9G-TRONIC eignet sich ideal für Vielfahrer, während das neue MBUX und das große Kofferraumvolumen echten Langstreckenkomfort liefern. Gepflegter Erstbesitz, vollständige Servicehistorie vorhanden.',
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
  description: 'Gepflegter Mercedes-Benz GLC 300 4MATIC in Spektralblau metallic mit AMG Line und Night-Paket. Ausgestattet mit Panorama-Schiebedach, Burmester Soundsystem und 360°-Kamera. Der 258 PS starke Benziner bietet souveräne Fahrleistungen und hohen Langstreckenkomfort.\n\n✓ AMG Line\n✓ MBUX Navigation Premium\n✓ Panorama-Schiebedach\n✓ Burmester 3D-Surround-Sound\n✓ 360°-Kamera\n✓ Memory-Paket\n✓ Scheckheftgepflegt',
  improvedDescription: 'Dieser Mercedes-Benz GLC 300 4MATIC AMG Line verbindet elegantes SUV-Design mit hochwertiger Technik und überzeugendem Alltagskomfort. Die Spektralblau-Metallic-Lackierung harmoniert perfekt mit dem Night-Paket, während das Panorama-Schiebedach und das Burmester 3D-Surround-Soundsystem den Premium-Charakter zusätzlich unterstreichen.\n\nDer kultivierte 258-PS-Benziner arbeitet souverän mit der 9G-TRONIC zusammen und macht den GLC sowohl in der Stadt als auch auf langen Strecken zu einem sehr ausgewogenen Begleiter.\n\n✓ AMG Line mit Night-Paket\n✓ Panorama-Schiebedach elektrisch\n✓ Burmester 3D-Surround-Soundsystem\n✓ 360°-Kamera und Park-Assistent\n✓ Memory-Paket und Sitzheizung vorne\n✓ 1 Vorbesitzer - lückenlos scheckheftgepflegt',
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
```

---

### `lib/stores/listing-store.ts`

```ts
'use client'

import { create } from 'zustand'
import { mercedesInventoryListings } from '@/lib/mercedes-inventory'
import type { Listing, ListingStatus } from '@/lib/types'

const initialListings = mercedesInventoryListings.map((listing) => ({ ...listing, images: [...listing.images] }))

interface ListingStoreState {
  listings: Listing[]
  updateListingStatus: (listingId: string, status: ListingStatus) => void
}

export const useListingStore = create<ListingStoreState>((set) => ({
  listings: initialListings,

  updateListingStatus: (listingId, status) => {
    set((state) => ({
      listings: state.listings.map((listing) =>
        listing.id === listingId
          ? { ...listing, status, updatedAt: new Date().toISOString() }
          : listing
      ),
    }))
  },
}))
```

---

### `app/(dashboard)/inserate/page.tsx` — Inserate-Übersicht

```tsx
'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useListingStore } from '@/lib/stores/listing-store'
import { formatCurrency } from '@/lib/utils'
import { priceCategoryConfig } from '@/lib/constants'
import { Plus, Eye, MessageSquare, Star } from 'lucide-react'
import Link from 'next/link'
import type { ListingStatus } from '@/lib/types'

const statusLabels: Record<ListingStatus, string> = {
  entwurf: 'Entwurf',
  live: 'Live',
  archiviert: 'Archiviert',
}

const statusColors: Record<ListingStatus, string> = {
  entwurf: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  live: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  archiviert: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
}

const listingTabs = ['alle', 'live', 'entwurf', 'archiviert'] as const
type ListingTab = (typeof listingTabs)[number]
const tabsDomIdPrefix = 'inserate-tabs'

function triggerDomId(tab: ListingTab) {
  return `${tabsDomIdPrefix}-trigger-${tab}`
}

function contentDomId(tab: ListingTab) {
  return `${tabsDomIdPrefix}-content-${tab}`
}

export default function InseratePage() {
  const listings = useListingStore((state) => state.listings)

  const filterListings = (status: ListingTab) => {
    if (status === 'alle') return listings
    return listings.filter(l => l.status === status)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Inserate</h1>
          <p className="text-muted-foreground">{listings.length} Inserate gesamt</p>
        </div>
        <Link href="/inserate/neu">
          <Button className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Neues Inserat
          </Button>
        </Link>
      </div>

      <Tabs id="inserate-tabs-root" defaultValue="alle">
        <TabsList className="w-full justify-start overflow-x-auto whitespace-nowrap">
          <TabsTrigger value="alle" id={triggerDomId('alle')} aria-controls={contentDomId('alle')}>
            Alle ({listings.length})
          </TabsTrigger>
          <TabsTrigger value="live" id={triggerDomId('live')} aria-controls={contentDomId('live')}>
            Live ({filterListings('live').length})
          </TabsTrigger>
          <TabsTrigger value="entwurf" id={triggerDomId('entwurf')} aria-controls={contentDomId('entwurf')}>
            Entwürfe ({filterListings('entwurf').length})
          </TabsTrigger>
          <TabsTrigger value="archiviert" id={triggerDomId('archiviert')} aria-controls={contentDomId('archiviert')}>
            Archiviert ({filterListings('archiviert').length})
          </TabsTrigger>
        </TabsList>

        {listingTabs.map(tab => (
          <TabsContent
            key={tab}
            value={tab}
            id={contentDomId(tab)}
            aria-labelledby={triggerDomId(tab)}
            className="space-y-3 mt-4"
          >
            {filterListings(tab).map(listing => {
              const priceConfig = priceCategoryConfig[listing.priceCategory]
              const previewImage = listing.images[0]
              return (
                <Link key={listing.id} href={`/inserate/${listing.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer mb-3">
                    <CardContent className="p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                        <div className="h-44 w-full rounded-lg overflow-hidden bg-muted shrink-0 sm:h-20 sm:w-32">
                          {previewImage ? (
                            <img
                              src={previewImage}
                              alt={listing.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-muted" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <h3 className="font-semibold text-sm line-clamp-1">{listing.title}</h3>
                            <Badge className={statusColors[listing.status]} variant="secondary">
                              {statusLabels[listing.status]}
                            </Badge>
                          </div>
                          {listing.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2">{listing.description}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            <span className="font-semibold text-sm text-foreground">
                              {formatCurrency(listing.price)}
                            </span>
                            <Badge variant="outline" className={`${priceConfig.bg} ${priceConfig.color} border-0 text-[10px]`}>
                              {priceConfig.label}
                            </Badge>
                            {listing.aiGenerated && (
                              <span className="flex items-center gap-1">
                                <Star className="h-3 w-3 text-amber-500" />
                                KI {listing.aiConfidence}%
                              </span>
                            )}
                            {listing.status === 'live' && (
                              <>
                                <span className="flex items-center gap-1">
                                  <Eye className="h-3 w-3" />
                                  {listing.views}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MessageSquare className="h-3 w-3" />
                                  {listing.inquiries}
                                </span>
                              </>
                            )}
                            {listing.platform.length > 0 && (
                              <span className="truncate">{listing.platform.join(', ')}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
```

---

### `app/(dashboard)/inserate/[id]/page.tsx` — Inserat-Detail

```tsx
'use client'

import { use, useState } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { useListingStore } from '@/lib/stores/listing-store'
import { mercedesMedia } from '@/lib/mercedes-inventory'
import { formatCurrency } from '@/lib/utils'
import { priceCategoryConfig } from '@/lib/constants'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft, Eye, MessageSquare, Star, ExternalLink, Upload, Loader2,
  CheckCircle2, Send, Gauge, Calendar, Fuel, Cog, Settings2,
  ShieldCheck, Info, AlertTriangle, Cigarette, Wrench, FileCheck,
} from 'lucide-react'
import type { Listing, ListingDataSheet, ListingStatus } from '@/lib/types'

const MobileDeIcon = ({ size = 40 }: { size?: number }) => (
  <div className="rounded-2xl flex items-center justify-center shrink-0" style={{ width: size, height: size, background: '#FF6600' }}>
    <svg viewBox="0 0 24 24" style={{ width: size * 0.58, height: size * 0.58 }} fill="white">
      <path d="M18.92 6.01L15 2H9L5.08 6.01C4.4 6.73 4 7.7 4 8.75V19c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8.75c0-1.05-.4-2.02-1.08-2.74zM12 17.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 12.5 12 12.5s2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5zM9.5 7l1.5-3h2l1.5 3h-5z" />
    </svg>
  </div>
)

const AutoScout24Icon = ({ size = 40 }: { size?: number }) => (
  <div className="rounded-2xl flex items-center justify-center shrink-0" style={{ width: size, height: size, background: '#003F87' }}>
    <svg viewBox="0 0 24 24" style={{ width: size * 0.58, height: size * 0.58 }} fill="none">
      <circle cx="10.5" cy="10" r="6" stroke="white" strokeWidth="2" />
      <line x1="15" y1="14.5" x2="21" y2="20.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M7.5 10.5h6M8.5 8.5l.9-1.5h2.2l.9 1.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9.2" cy="11.8" r="0.9" fill="white" />
      <circle cx="12.8" cy="11.8" r="0.9" fill="white" />
    </svg>
  </div>
)

const TruckScout24Icon = ({ size = 40 }: { size?: number }) => (
  <div className="rounded-2xl flex items-center justify-center shrink-0" style={{ width: size, height: size, background: '#009C3B' }}>
    <svg viewBox="0 0 24 24" style={{ width: size * 0.58, height: size * 0.58 }} fill="white">
      <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9 1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
    </svg>
  </div>
)

const EXPORT_PLATFORMS = [
  {
    id: 'mobile_de',
    name: 'mobile.de',
    description: 'Größter deutscher Automarkt',
    icon: <MobileDeIcon size={44} />,
    borderColor: 'border-orange-200 dark:border-orange-800',
    bgColor: 'bg-orange-50 dark:bg-orange-950/30',
    btnStyle: { background: '#FF6600' } as React.CSSProperties,
    viewUrl: 'https://www.mobile.de',
  },
  {
    id: 'autoscout24',
    name: 'AutoScout24',
    description: 'Europäisches Automarktportal',
    icon: <AutoScout24Icon size={44} />,
    borderColor: 'border-blue-200 dark:border-blue-900',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    btnStyle: { background: '#003F87' } as React.CSSProperties,
    viewUrl: 'https://www.autoscout24.de',
  },
  {
    id: 'truckscout24',
    name: 'TruckScout24',
    description: 'Nutzfahrzeuge & Transporter',
    icon: <TruckScout24Icon size={44} />,
    borderColor: 'border-emerald-200 dark:border-emerald-800',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    btnStyle: { background: '#009C3B' } as React.CSSProperties,
    viewUrl: 'https://www.truckscout24.de',
  },
]

const statusLabels: Record<ListingStatus, string> = {
  entwurf: 'Entwurf',
  live: 'Live',
  archiviert: 'Archiviert',
}

const statusColors: Record<ListingStatus, string> = {
  entwurf: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  live: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  archiviert: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
}

const FALLBACK_PHOTOS = [mercedesMedia.glcExterior]

type ExportStatus = 'idle' | 'exporting' | 'done'

const numberFormat = new Intl.NumberFormat('de-DE')

function formatVerbrauch(d: ListingDataSheet['fahrzeugdaten']) {
  if (d.verbrauchKombiniert == null) return null
  const unit = d.verbrauchEinheit ?? 'l/100km'
  return `${d.verbrauchKombiniert.toString().replace('.', ',')} ${unit} (komb.)`
}

function buildFahrzeugdatenRows(d: ListingDataSheet['fahrzeugdaten']) {
  const rows: { label: string; value: string }[] = [
    { label: 'Fahrzeugzustand', value: d.fahrzeugzustand },
    { label: 'Kategorie', value: d.kategorie },
    { label: 'Erstzulassung', value: d.erstzulassung },
    { label: 'Kilometerstand', value: `${numberFormat.format(d.kilometerstand)} km` },
  ]
  if (d.huBis) rows.push({ label: 'HU bis', value: d.huBis })
  rows.push({ label: 'Vorbesitzer', value: String(d.vorbesitzer) })
  if (d.fahrzeugnummer) rows.push({ label: 'Fahrzeugnummer', value: d.fahrzeugnummer })
  rows.push({ label: 'Türen', value: String(d.tueren) })
  rows.push({ label: 'Sitzplätze', value: String(d.sitze) })
  rows.push({ label: 'Außenfarbe', value: d.aussenfarbe })
  rows.push({ label: 'Innenausstattung', value: d.innenausstattung })
  if (d.schadstoffklasse) rows.push({ label: 'Schadstoffklasse', value: d.schadstoffklasse })
  if (d.umweltplakette) rows.push({ label: 'Umweltplakette', value: d.umweltplakette })
  rows.push({ label: 'Kraftstoff', value: d.kraftstoff })
  if (d.hubraum) rows.push({ label: 'Hubraum', value: `${numberFormat.format(d.hubraum)} ccm` })
  rows.push({ label: 'Leistung', value: `${d.leistungKW} kW (${d.leistungPS} PS)` })
  rows.push({ label: 'Getriebe', value: d.getriebe })
  rows.push({ label: 'Antrieb', value: d.antrieb })
  const verbrauch = formatVerbrauch(d)
  if (verbrauch) rows.push({ label: 'Verbrauch', value: verbrauch })
  if (d.co2Emission != null) rows.push({ label: 'CO₂-Emission', value: `${d.co2Emission} g/km (komb.)` })
  if (d.energieeffizienzklasse) rows.push({ label: 'Energieeffizienzklasse', value: d.energieeffizienzklasse })
  if (d.elektroReichweite) rows.push({ label: 'Elektrische Reichweite', value: `${d.elektroReichweite} km (WLTP)` })
  if (d.batteriekapazitaet) rows.push({ label: 'Batteriekapazität', value: `${d.batteriekapazitaet.toString().replace('.', ',')} kWh` })
  if (d.leergewicht) rows.push({ label: 'Leergewicht', value: `${numberFormat.format(d.leergewicht)} kg` })
  if (d.anhaengelastGebremst) rows.push({ label: 'Anhängelast (gebremst)', value: `${numberFormat.format(d.anhaengelastGebremst)} kg` })
  return rows
}

function FahrzeugdatenIcon({ label }: { label: string }) {
  const map: Record<string, React.ElementType> = {
    'Erstzulassung': Calendar,
    'Kilometerstand': Gauge,
    'Kraftstoff': Fuel,
    'Getriebe': Settings2,
    'Antrieb': Cog,
    'Leistung': Gauge,
  }
  const Icon = map[label] ?? Info
  return <Icon className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
}

function ConditionBadge({
  label,
  active,
  icon: Icon,
}: {
  label: string
  active: boolean
  icon: React.ElementType
}) {
  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${
        active
          ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300'
          : 'bg-muted/40 border-border text-muted-foreground'
      }`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="font-medium">{label}</span>
      {active && <CheckCircle2 className="h-3.5 w-3.5 ml-auto shrink-0" />}
    </div>
  )
}

function DatasheetSection({ sheet, listing }: { sheet: ListingDataSheet; listing: Listing }) {
  const fahrzeugRows = buildFahrzeugdatenRows(sheet.fahrzeugdaten)
  const { unfallfrei, nichtraucher, scheckheftgepflegt, notes } = sheet.schaeden
  const hasSchaedenNotes = notes && notes.length > 0

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <FileCheck className="h-5 w-5 text-primary" />
          Datenblatt
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            Fahrzeugdaten
          </h3>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
            {fahrzeugRows.map(row => (
              <div
                key={row.label}
                className="flex items-center justify-between gap-3 py-1.5 border-b border-border/40 last:border-0 sm:[&:nth-last-child(2)]:border-0"
              >
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <FahrzeugdatenIcon label={row.label} />
                  {row.label}
                </span>
                <span className="text-sm font-medium text-right">{row.value}</span>
              </div>
            ))}
          </dl>
        </section>

        {sheet.serienausstattung.length > 0 && (
          <>
            <Separator />
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-1.5">
                <Wrench className="h-3.5 w-3.5" />
                Serienausstattung
              </h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                {sheet.serienausstattung.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-foreground/90">{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}

        {sheet.sonderausstattung.length > 0 && (
          <>
            <Separator />
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-1.5">
                <Star className="h-3.5 w-3.5" />
                Sonderausstattung
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {sheet.sonderausstattung.map((item, i) => (
                  <Badge key={i} variant="secondary" className="font-normal">
                    {item}
                  </Badge>
                ))}
              </div>
            </section>
          </>
        )}

        <Separator />
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" />
            Zustand
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <ConditionBadge label="Unfallfrei" active={unfallfrei} icon={ShieldCheck} />
            <ConditionBadge label="Nichtraucher" active={nichtraucher} icon={Cigarette} />
            <ConditionBadge label="Scheckheftgepflegt" active={scheckheftgepflegt} icon={FileCheck} />
          </div>
          {hasSchaedenNotes && (
            <ul className="mt-3 space-y-1.5">
              {notes!.map((note, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {sheet.zusatzinfo && sheet.zusatzinfo.length > 0 && (
          <>
            <Separator />
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5" />
                Hinweise
              </h3>
              <ul className="space-y-1.5">
                {sheet.zusatzinfo.map((info, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Info className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
                    <span className="text-foreground/90">{info}</span>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}

        {listing.aiGenerated && (
          <p className="text-[11px] text-muted-foreground italic pt-1">
            Datenblatt automatisch aus Fahrzeugdaten generiert ({listing.aiConfidence}% Konfidenz).
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export default function InseratDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const listings = useListingStore((state) => state.listings)
  const { id } = use(params)
  const listing = listings.find(l => l.id === id)

  const [activePhoto, setActivePhoto] = useState(0)
  const [showExport, setShowExport] = useState(false)
  const [exportStatus, setExportStatus] = useState<Record<string, ExportStatus>>({
    mobile_de: 'idle', autoscout24: 'idle', truckscout24: 'idle',
  })

  if (!listing) return notFound()

  const photos = listing.images.length > 0 ? listing.images : FALLBACK_PHOTOS
  const priceConfig = priceCategoryConfig[listing.priceCategory]
  const exportedCount = Object.values(exportStatus).filter(s => s === 'done').length
  const alreadyExported = exportedCount > 0

  const handleExport = (platformId: string) => {
    setExportStatus(prev => ({ ...prev, [platformId]: 'exporting' }))
    setTimeout(() => {
      setExportStatus(prev => ({ ...prev, [platformId]: 'done' }))
    }, 2200)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/inserate">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold">Inserat</h1>
            <p className="text-sm text-muted-foreground truncate">{listing.title}</p>
          </div>
        </div>
        <Badge className={`self-start sm:ml-auto sm:self-auto ${statusColors[listing.status]}`} variant="secondary">
          {statusLabels[listing.status]}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <Card className="overflow-hidden">
            <div className="aspect-video bg-muted relative overflow-hidden">
              <img
                key={activePhoto}
                src={photos[activePhoto]}
                alt={listing.title}
                className="w-full h-full object-cover transition-opacity duration-300"
              />
              <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full backdrop-blur-sm">
                {activePhoto + 1} / {photos.length}
              </div>
            </div>

            {photos.length > 1 && (
              <div className="flex gap-2 p-3 bg-muted/30 overflow-x-auto">
                {photos.map((photo, i) => (
                  <button
                    key={i}
                    onClick={() => setActivePhoto(i)}
                    className={`shrink-0 w-16 h-11 rounded-md overflow-hidden border-2 transition-all ${
                      i === activePhoto
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={photo} alt={`Bild ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            <CardContent className="p-4 space-y-4 sm:p-6">
              <h2 className="text-xl font-bold leading-snug">{listing.title}</h2>
              {listing.description ? (
                <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                  {listing.description}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground italic">Keine Beschreibung vorhanden</p>
              )}
            </CardContent>
          </Card>

          {listing.dataSheet && <DatasheetSection sheet={listing.dataSheet} listing={listing} />}
        </div>

        <div className="space-y-5">
          <Card>
            <CardContent className="pt-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Preis</span>
                <span className="text-2xl font-bold">{formatCurrency(listing.price)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Preiskategorie</span>
                <Badge variant="outline" className={`${priceConfig.bg} ${priceConfig.color} border-0`}>
                  {priceConfig.label}
                </Badge>
              </div>
              {listing.aiGenerated && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">KI-Konfidenz</span>
                  <span className="flex items-center gap-1 text-sm">
                    <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                    {listing.aiConfidence}%
                  </span>
                </div>
              )}
              {listing.status === 'live' && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Aufrufe</span>
                    <span className="flex items-center gap-1.5 text-sm">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      {listing.views}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Anfragen</span>
                    <span className="flex items-center gap-1.5 text-sm">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      {listing.inquiries}
                    </span>
                  </div>
                </>
              )}

              <Separator />
              <div className="space-y-2">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Plattformen</span>
                {EXPORT_PLATFORMS.map(p => {
                  const status = exportStatus[p.id]
                  const alreadyLive = listing.platform.some(pl =>
                    pl.toLowerCase().replace(/\s/g, '').includes(p.id.replace('_', ''))
                  )
                  const isLive = status === 'done' || alreadyLive
                  return (
                    <div key={p.id} className="flex items-center gap-2">
                      <div style={{ width: 20, height: 20 }}>
                        <div
                          className={`rounded-md w-5 h-5 flex items-center justify-center ${!isLive ? 'bg-muted' : ''}`}
                          style={{ background: isLive ? (p.id === 'mobile_de' ? '#FF6600' : p.id === 'autoscout24' ? '#003F87' : '#009C3B') : undefined }}
                        >
                          {isLive ? (
                            <CheckCircle2 className="h-3 w-3 text-white" />
                          ) : (
                            <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                          )}
                        </div>
                      </div>
                      <span className={`text-xs ${isLive ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                        {p.name}
                      </span>
                      {isLive && (
                        <Badge className="ml-auto text-[10px] px-1.5 py-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0">
                          Live
                        </Badge>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5 space-y-2">
              <Button
                className="w-full"
                onClick={() => setShowExport(true)}
              >
                <Upload className="h-4 w-4 mr-2" />
                {alreadyExported
                  ? 'Weitere Plattformen'
                  : listing.status === 'entwurf'
                  ? 'Veröffentlichen'
                  : 'Auf Plattformen exportieren'
                }
              </Button>

              {listing.status === 'live' && (
                <Button variant="outline" className="w-full" asChild>
                  <a href="https://www.mobile.de" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Auf mobile.de ansehen
                  </a>
                </Button>
              )}

              <Button variant="outline" className="w-full">Bearbeiten</Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={showExport} onOpenChange={setShowExport}>
        <DialogContent className="max-w-[calc(100vw-1rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              Inserat exportieren
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground -mt-1">
            Veröffentlichen Sie das Inserat auf Ihren Wunschplattformen.
          </p>

          <div className="space-y-3 mt-1">
            {EXPORT_PLATFORMS.map(platform => {
              const status = exportStatus[platform.id]
              const alreadyLive = listing.platform.some(pl =>
                pl.toLowerCase().replace(/\s/g, '').includes(platform.id.replace('_', ''))
              )
              const isDone = status === 'done' || alreadyLive

              return (
                <div
                  key={platform.id}
                  className={`flex flex-col items-start gap-3 p-3.5 rounded-xl border sm:flex-row sm:items-center ${platform.bgColor} ${platform.borderColor}`}
                >
                  {platform.icon}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground">{platform.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{platform.description}</p>
                  </div>
                  <Button
                    size="sm"
                    style={!isDone && status !== 'exporting' ? platform.btnStyle : undefined}
                    className={`w-full text-white border-0 hover:opacity-90 sm:w-auto sm:shrink-0 ${
                      isDone ? 'bg-emerald-600 hover:bg-emerald-600' : ''
                    }`}
                    onClick={() => !isDone && handleExport(platform.id)}
                    disabled={status === 'exporting' || isDone}
                  >
                    {status === 'exporting'
                      ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Exportiere</>
                      : isDone
                      ? <><CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />Live</>
                      : <><ExternalLink className="h-3.5 w-3.5 mr-1.5" />Exportieren</>
                    }
                  </Button>
                </div>
              )
            })}
          </div>

          {exportedCount > 0 && (
            <div className="mt-1 p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              {exportedCount} von {EXPORT_PLATFORMS.length} Plattformen erfolgreich exportiert
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
```

---

### `app/(dashboard)/inserate/neu/page.tsx` — Neues-Inserat-Wizard

```tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { priceCategoryConfig } from '@/lib/constants'
import {
  mercedesExtraOptions as EXTRA_OPTIONS,
  mercedesListingCreationAiMock as MOCK_AI,
  mercedesListingCreationImageSlots as IMAGE_SLOTS,
  mercedesListingCreationVinMock as VIN_MOCK,
  mercedesSeriesOptions as SERIES_OPTIONS,
} from '@/lib/mercedes-inventory'
import { formatCurrency } from '@/lib/utils'
import {
  ArrowLeft, Sparkles, RefreshCw, Check, Star, Upload, ImagePlus,
  ScanLine, Pencil, Loader2, X, Wand2,
  Scissors, Zap, ExternalLink, CheckCircle2, ChevronRight, Plus,
  Camera, Images, ShieldCheck, AlertTriangle, Info, XCircle,
  ShoppingCart,
} from 'lucide-react'

const MobileDeIcon = ({ size = 40 }: { size?: number }) => (
  <div
    className="rounded-2xl flex items-center justify-center shrink-0"
    style={{ width: size, height: size, background: '#FF6600' }}
  >
    <svg viewBox="0 0 24 24" style={{ width: size * 0.58, height: size * 0.58 }} fill="white">
      <path d="M18.92 6.01L15 2H9L5.08 6.01C4.4 6.73 4 7.7 4 8.75V19c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8.75c0-1.05-.4-2.02-1.08-2.74zM12 17.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 12.5 12 12.5s2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5zM9.5 7l1.5-3h2l1.5 3h-5z" />
    </svg>
  </div>
)

const AutoScout24Icon = ({ size = 40 }: { size?: number }) => (
  <div
    className="rounded-2xl flex items-center justify-center shrink-0"
    style={{ width: size, height: size, background: '#003F87' }}
  >
    <svg viewBox="0 0 24 24" style={{ width: size * 0.58, height: size * 0.58 }} fill="none">
      <circle cx="10.5" cy="10" r="6" stroke="white" strokeWidth="2" />
      <line x1="15" y1="14.5" x2="21" y2="20.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M7.5 10.5h6M8.5 8.5l.9-1.5h2.2l.9 1.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9.2" cy="11.8" r="0.9" fill="white" />
      <circle cx="12.8" cy="11.8" r="0.9" fill="white" />
    </svg>
  </div>
)

const TruckScout24Icon = ({ size = 40 }: { size?: number }) => (
  <div
    className="rounded-2xl flex items-center justify-center shrink-0"
    style={{ width: size, height: size, background: '#009C3B' }}
  >
    <svg viewBox="0 0 24 24" style={{ width: size * 0.58, height: size * 0.58 }} fill="white">
      <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9 1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
    </svg>
  </div>
)

const EXPORT_PLATFORMS = [
  {
    id: 'mobile_de',
    name: 'mobile.de',
    description: 'Größter deutscher Automarkt',
    icon: <MobileDeIcon size={44} />,
    borderColor: 'border-orange-200 dark:border-orange-800',
    bgColor: 'bg-orange-50 dark:bg-orange-950/30',
    btnStyle: { background: '#FF6600' } as React.CSSProperties,
    btnHoverClass: 'hover:opacity-90',
  },
  {
    id: 'autoscout24',
    name: 'AutoScout24',
    description: 'Europäisches Automarktportal',
    icon: <AutoScout24Icon size={44} />,
    borderColor: 'border-blue-200 dark:border-blue-900',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    btnStyle: { background: '#003F87' } as React.CSSProperties,
    btnHoverClass: 'hover:opacity-90',
  },
  {
    id: 'truckscout24',
    name: 'TruckScout24',
    description: 'Nutzfahrzeuge & Transporter',
    icon: <TruckScout24Icon size={44} />,
    borderColor: 'border-emerald-200 dark:border-emerald-800',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    btnStyle: { background: '#009C3B' } as React.CSSProperties,
    btnHoverClass: 'hover:opacity-90',
  },
]

const EXTRA_OPTIONS_LIST: readonly string[] = EXTRA_OPTIONS

type InputMode = 'choose' | 'vin' | 'manual'
type VinStatus = 'idle' | 'loading' | 'found'
type EnhancementType = 'cutout' | 'quality'
type SlotState = 'original' | EnhancementType
type ExportStatus = 'idle' | 'exporting' | 'done'

export default function NeuesInseratPage() {
  const [inputMode, setInputMode] = useState<InputMode>('choose')

  const [vin, setVin] = useState('')
  const [vinStatus, setVinStatus] = useState<VinStatus>('idle')
  const [vinData, setVinData] = useState<typeof VIN_MOCK | null>(null)

  const [formData, setFormData] = useState({
    make: '', model: '', year: '', mileage: '', power: '', displacement: '',
    fuelType: '', transmission: '', color: '', doors: '', seats: '',
    firstRegistration: '', hu: '', licensePlate: '', price: '',
  })
  const [selectedSeries, setSelectedSeries] = useState<string[]>([])
  const [selectedExtras, setSelectedExtras] = useState<string[]>([])
  const [customExtra, setCustomExtra] = useState('')

  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)
  const [activeDescription, setActiveDescription] = useState('')
  const [improvingDesc, setImprovingDesc] = useState(false)
  const [descImproved, setDescImproved] = useState(false)
  const [kycScore, setKycScore] = useState<number>(MOCK_AI.kycScore)
  const [improvingKyc, setImprovingKyc] = useState(false)
  const [kycImproved, setKycImproved] = useState(false)

  const [plausibilityRunning, setPlausibilityRunning] = useState(false)
  const [plausibilityProgress, setPlausibilityProgress] = useState(0)
  const [plausibilityDone, setPlausibilityDone] = useState(false)

  const [slotStates, setSlotStates] = useState<Record<number, SlotState>>(
    Object.fromEntries(IMAGE_SLOTS.map(s => [s.id, 'original' as SlotState]))
  )
  const [processingSlot, setProcessingSlot] = useState<Record<number, EnhancementType | null>>(
    Object.fromEntries(IMAGE_SLOTS.map(s => [s.id, null]))
  )

  const [inseratCreated, setInseratCreated] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [exportStatus, setExportStatus] = useState<Record<string, ExportStatus>>({
    mobile_de: 'idle', autoscout24: 'idle', truckscout24: 'idle',
  })

  const [fromEinkauf, setFromEinkauf] = useState<{
    suggestedPrice?: string
    mileage?: number
  } | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const raw = sessionStorage.getItem('inserat-prefill')
    if (!raw) return
    try {
      const data = JSON.parse(raw) as {
        source?: string
        suggestedPrice?: string
        mileage?: number
        createdAt?: number
      }
      if (data.source !== 'einkauf' || !data.createdAt || Date.now() - data.createdAt > 5 * 60 * 1000) {
        sessionStorage.removeItem('inserat-prefill')
        return
      }
      setFromEinkauf({ suggestedPrice: data.suggestedPrice, mileage: data.mileage })
      setInputMode('vin')
      setVin(VIN_MOCK.vin)
      setVinStatus('found')
      setVinData(VIN_MOCK)
      sessionStorage.removeItem('inserat-prefill')
    } catch {
      sessionStorage.removeItem('inserat-prefill')
    }
  }, [])

  const handleVinLookup = () => {
    setVinStatus('loading')
    setTimeout(() => {
      setVinData(VIN_MOCK)
      setVinStatus('found')
    }, 2200)
  }

  const handleGenerate = () => {
    setGenerating(true)
    setTimeout(() => {
      setGenerating(false)
      setGenerated(true)
      setActiveDescription(MOCK_AI.description)
    }, 2200)
  }

  const handleImproveDescription = () => {
    setImprovingDesc(true)
    setTimeout(() => {
      setImprovingDesc(false)
      setDescImproved(true)
      setActiveDescription(MOCK_AI.improvedDescription)
    }, 1800)
  }

  const handleImproveKyc = () => {
    setImprovingKyc(true)
    setTimeout(() => {
      setImprovingKyc(false)
      setKycImproved(true)
      setKycScore(MOCK_AI.improvedKycScore)
    }, 1500)
  }

  const handleRunPlausibility = () => {
    setPlausibilityRunning(true)
    setPlausibilityDone(false)
    setPlausibilityProgress(0)

    const steps = [18, 38, 56, 74, 88, 100]
    steps.forEach((value, i) => {
      setTimeout(() => setPlausibilityProgress(value), 350 * (i + 1))
    })

    setTimeout(() => {
      setPlausibilityRunning(false)
      setPlausibilityDone(true)
    }, 350 * steps.length + 250)
  }

  const handleEnhance = (imageId: number, type: EnhancementType) => {
    if (processingSlot[imageId] !== null) return
    setProcessingSlot(prev => ({ ...prev, [imageId]: type }))
    setTimeout(() => {
      setSlotStates(prev => ({ ...prev, [imageId]: type }))
      setProcessingSlot(prev => ({ ...prev, [imageId]: null }))
    }, 1600)
  }

  const handleCreateInserat = () => {
    setInseratCreated(true)
    setShowExport(true)
  }

  const handleExport = (platformId: string) => {
    setExportStatus(prev => ({ ...prev, [platformId]: 'exporting' }))
    setTimeout(() => {
      setExportStatus(prev => ({ ...prev, [platformId]: 'done' }))
    }, 2200)
  }

  const toggleSeries = (item: string) =>
    setSelectedSeries(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item])

  const toggleExtra = (item: string) =>
    setSelectedExtras(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item])

  const addCustomExtra = () => {
    const val = customExtra.trim()
    if (val && !selectedExtras.includes(val)) {
      setSelectedExtras(prev => [...prev, val])
      setCustomExtra('')
    }
  }

  const setField = (key: keyof typeof formData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setFormData(prev => ({ ...prev, [key]: e.target.value }))

  const showFormContent = inputMode === 'manual' || (inputMode === 'vin' && vinStatus === 'found')

  return (
    <div className="space-y-6">

      <div className="flex items-center gap-3">
        <Link href="/inserate">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Neues Inserat</h1>
          <p className="text-sm text-muted-foreground">KI-unterstützte Inserat-Erstellung</p>
        </div>
      </div>

      {fromEinkauf && (
        <div className="rounded-xl border border-indigo-200/70 bg-gradient-to-r from-indigo-50 via-card to-violet-50/40 px-4 py-3 dark:border-indigo-900/50 dark:from-indigo-950/30 dark:via-card dark:to-violet-950/20 animate-in fade-in slide-in-from-top-2 duration-500">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-sm shrink-0">
              <ShoppingCart className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium leading-tight">
                Aus der Einkauf-Bewertung übernommen
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Fahrzeugdaten &amp; Ausstattung sind vorausgefüllt &middot; Vorgeschlagener Preis: <span className="font-medium text-foreground">€&nbsp;{fromEinkauf.suggestedPrice ? Number(fromEinkauf.suggestedPrice).toLocaleString('de-DE') : '—'}</span>
              </p>
            </div>
            <Badge variant="secondary" className="text-[10px] font-normal bg-emerald-50 text-emerald-700 border-0 dark:bg-emerald-950/30 dark:text-emerald-400 shrink-0 hidden sm:inline-flex">
              <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
              Vorausgefüllt
            </Badge>
          </div>
        </div>
      )}

      {inputMode === 'choose' && (
        <div className="max-w-xl mx-auto py-10">
          <p className="text-center text-muted-foreground text-sm mb-8">
            Wie möchten Sie die Fahrzeugdaten erfassen?
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <button
              onClick={() => setInputMode('vin')}
              className="group relative p-6 rounded-2xl border-2 border-border bg-card hover:border-primary hover:shadow-lg transition-all text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <ScanLine className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-1.5">VIN-Abfrage</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Fahrzeugdaten automatisch per Fahrgestellnummer abrufen
              </p>
              <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/30 group-hover:text-primary transition-colors" />
            </button>

            <button
              onClick={() => setInputMode('manual')}
              className="group relative p-6 rounded-2xl border-2 border-border bg-card hover:border-primary hover:shadow-lg transition-all text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Pencil className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-1.5">Manuell eingeben</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Fahrzeugdaten, Ausstattung und Details selbst erfassen
              </p>
              <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/30 group-hover:text-primary transition-colors" />
            </button>
          </div>
        </div>
      )}

      {inputMode !== 'choose' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          <div className="lg:col-span-3 space-y-5">

            <div className="flex w-full gap-1 rounded-lg border bg-muted p-1 sm:w-fit">
              <button
                onClick={() => { setInputMode('vin'); setVinStatus('idle'); setVinData(null) }}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all sm:flex-none ${
                  inputMode === 'vin'
                    ? 'bg-card shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <ScanLine className="h-3.5 w-3.5" />
                VIN-Abfrage
              </button>
              <button
                onClick={() => setInputMode('manual')}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all sm:flex-none ${
                  inputMode === 'manual'
                    ? 'bg-card shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Pencil className="h-3.5 w-3.5" />
                Manuell
              </button>
            </div>

            {inputMode === 'vin' && (
              <>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <ScanLine className="h-4 w-4 text-primary" />
                      VIN / Fahrgestellnummer
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Input
                        placeholder="z.B. W1N2546021F789012"
                        value={vin}
                        onChange={e => setVin(e.target.value.toUpperCase())}
                        className="font-mono text-sm tracking-wider"
                        maxLength={17}
                        disabled={vinStatus === 'loading' || vinStatus === 'found'}
                      />
                      <Button
                        onClick={handleVinLookup}
                        disabled={vin.length < 5 || vinStatus === 'loading' || vinStatus === 'found'}
                        className="shrink-0"
                      >
                        {vinStatus === 'loading'
                          ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Abfragen...</>
                          : <><ScanLine className="h-4 w-4 mr-2" />Abfragen</>
                        }
                      </Button>
                    </div>
                    {vinStatus === 'loading' && (
                      <div className="space-y-2 animate-in fade-in">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Fahrzeugdaten werden abgerufen...
                        </div>
                        <Progress value={66} className="h-1" />
                      </div>
                    )}
                    {vinStatus === 'idle' && (
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs text-muted-foreground">
                          Demo: Geben Sie min. 5 Zeichen ein und klicken Sie auf Abfragen.
                        </p>
                        <button
                          type="button"
                          onClick={() => setVin(VIN_MOCK.vin)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline underline-offset-2"
                        >
                          <Sparkles className="h-3 w-3" />
                          Demo-VIN nutzen
                        </button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {vinStatus === 'found' && vinData && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span className="text-sm text-emerald-600 font-medium">
                        Fahrzeug gefunden: {vinData.make} {vinData.model}
                      </span>
                      <button
                        onClick={() => { setVinStatus('idle'); setVinData(null); setVin('') }}
                        className="ml-auto text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
                      >
                        Neue Abfrage
                      </button>
                    </div>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Fahrzeugdaten</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 gap-x-8 gap-y-0 text-sm sm:grid-cols-2">
                          {[
                            ['Marke', vinData.make], ['Modell', vinData.model],
                            ['Baujahr', vinData.year], ['Erstzulassung', vinData.firstRegistration],
                            ['Kilometerstand', `${vinData.mileage} km`], ['HU bis', vinData.hu],
                            ['Kraftstoff', 'Benzin'], ['Getriebe', 'Automatik (9G-TRONIC)'],
                            ['Leistung', `${vinData.power} PS`], ['Hubraum', `${vinData.displacement} ccm`],
                            ['Farbe', vinData.color], ['Türen / Sitze', `${vinData.doors} / ${vinData.seats}`],
                          ].map(([label, value]) => (
                            <div key={label} className="flex justify-between py-2 border-b border-border/40 last:border-0">
                              <span className="text-muted-foreground">{label}</span>
                              <span className="font-medium text-right">{value}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center justify-between">
                          Serienausstattung
                          <Badge variant="secondary" className="text-[10px] font-normal">
                            {vinData.serienausstattung.length} Merkmale
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-1.5">
                          {vinData.serienausstattung.map(item => (
                            <Badge key={item} variant="secondary" className="text-xs font-normal">
                              {item}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center justify-between">
                          Sonderausstattung
                          <Badge className="text-[10px] font-normal bg-primary/10 text-primary border-0">
                            {vinData.sonderausstattung.length} Extras
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-1.5">
                          {vinData.sonderausstattung.map(item => (
                            <Badge key={item} className="text-xs font-normal bg-primary/10 text-primary hover:bg-primary/20 border-0 cursor-default">
                              {item}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Verkaufspreis festlegen</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                          <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">€</span>
                            <Input
                              key={fromEinkauf?.suggestedPrice ?? 'default'}
                              className="pl-7"
                              defaultValue={
                                fromEinkauf?.suggestedPrice
                                  ? Number(fromEinkauf.suggestedPrice).toLocaleString('de-DE')
                                  : vinData.price
                              }
                            />
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {fromEinkauf?.suggestedPrice ? 'Aus Einkauf-Analyse übernommen' : 'Marktpreis ~€ 54.800'}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </>
            )}

            {inputMode === 'manual' && (
              <div className="space-y-4">

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Grunddaten</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Marke</Label>
                        <Input placeholder="z.B. Mercedes-Benz" value={formData.make} onChange={setField('make')} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Modell</Label>
                        <Input placeholder="z.B. GLC 300 4MATIC AMG Line" value={formData.model} onChange={setField('model')} />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Baujahr</Label>
                        <Input placeholder="2021" value={formData.year} onChange={setField('year')} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Erstzulassung</Label>
                        <Input placeholder="03.2021" value={formData.firstRegistration} onChange={setField('firstRegistration')} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">HU bis</Label>
                        <Input placeholder="03.2025" value={formData.hu} onChange={setField('hu')} />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Kilometerstand</Label>
                        <Input placeholder="62.400" value={formData.mileage} onChange={setField('mileage')} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Kennzeichen</Label>
                        <Input placeholder="KA-WH 1234" value={formData.licensePlate} onChange={setField('licensePlate')} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Verkaufspreis (€)</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">€</span>
                        <Input className="pl-7" placeholder="38.900" value={formData.price} onChange={setField('price')} />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Technische Daten</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Kraftstoff</Label>
                        <Select value={formData.fuelType} onValueChange={v => setFormData(prev => ({ ...prev, fuelType: v }))}>
                          <SelectTrigger><SelectValue placeholder="Auswählen" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="benzin">Benzin</SelectItem>
                            <SelectItem value="diesel">Diesel</SelectItem>
                            <SelectItem value="elektro">Elektro</SelectItem>
                            <SelectItem value="hybrid">Hybrid</SelectItem>
                            <SelectItem value="plug_in_hybrid">Plug-in-Hybrid</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Getriebe</Label>
                        <Select value={formData.transmission} onValueChange={v => setFormData(prev => ({ ...prev, transmission: v }))}>
                          <SelectTrigger><SelectValue placeholder="Auswählen" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="automatik">Automatik</SelectItem>
                            <SelectItem value="schaltung">Schaltgetriebe</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Leistung (PS)</Label>
                        <Input placeholder="190" value={formData.power} onChange={setField('power')} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Hubraum (ccm)</Label>
                        <Input placeholder="1.995" value={formData.displacement} onChange={setField('displacement')} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Farbe</Label>
                        <Input placeholder="Silber Metallic" value={formData.color} onChange={setField('color')} />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Türen</Label>
                        <Select value={formData.doors} onValueChange={v => setFormData(prev => ({ ...prev, doors: v }))}>
                          <SelectTrigger><SelectValue placeholder="Auswählen" /></SelectTrigger>
                          <SelectContent>
                            {['2', '3', '4', '5'].map(d => <SelectItem key={d} value={d}>{d} Türen</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Sitzplätze</Label>
                        <Select value={formData.seats} onValueChange={v => setFormData(prev => ({ ...prev, seats: v }))}>
                          <SelectTrigger><SelectValue placeholder="Auswählen" /></SelectTrigger>
                          <SelectContent>
                            {['2', '4', '5', '6', '7', '8', '9'].map(s => <SelectItem key={s} value={s}>{s} Sitze</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center justify-between">
                      Serienausstattung
                      {selectedSeries.length > 0 && (
                        <Badge variant="secondary" className="text-[10px] font-normal">
                          {selectedSeries.length} ausgewählt
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {SERIES_OPTIONS.map(item => {
                        const active = selectedSeries.includes(item)
                        return (
                          <button
                            key={item}
                            onClick={() => toggleSeries(item)}
                            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                              active
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground'
                            }`}
                          >
                            {active && <Check className="inline h-2.5 w-2.5 mr-1 -mt-0.5" />}
                            {item}
                          </button>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center justify-between">
                      Sonderausstattung
                      {selectedExtras.length > 0 && (
                        <Badge className="text-[10px] font-normal bg-primary/10 text-primary border-0">
                          {selectedExtras.length} Extras
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {EXTRA_OPTIONS.map(item => {
                        const active = selectedExtras.includes(item)
                        return (
                          <button
                            key={item}
                            onClick={() => toggleExtra(item)}
                            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                              active
                                ? 'bg-primary/10 text-primary border-primary/40'
                                : 'bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'
                            }`}
                          >
                            {active && <Check className="inline h-2.5 w-2.5 mr-1 -mt-0.5" />}
                            {item}
                          </button>
                        )
                      })}
                    </div>
                    <div className="flex flex-col gap-2 pt-1 sm:flex-row">
                      <Input
                        placeholder="Eigenes Extra hinzufügen..."
                        value={customExtra}
                        onChange={e => setCustomExtra(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addCustomExtra()}
                        className="text-sm h-8"
                      />
                      <Button size="sm" variant="outline" onClick={addCustomExtra} className="h-8 px-3">
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    {selectedExtras.filter(e => !EXTRA_OPTIONS_LIST.includes(e)).length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {selectedExtras.filter(e => !EXTRA_OPTIONS_LIST.includes(e)).map(item => (
                          <span key={item} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                            {item}
                            <button onClick={() => toggleExtra(item)} className="hover:text-destructive transition-colors">
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {showFormContent && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <span>Bilder</span>
                    <Badge variant="outline" className="text-xs font-normal">
                      {IMAGE_SLOTS.length} / 20
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {IMAGE_SLOTS.map(slot => {
                      const state = slotStates[slot.id]
                      const processing = processingSlot[slot.id]
                      const isOriginal = state === 'original'
                      const activeUrl = slot[state]

                      const stateLabel = {
                        original:   slot.label,
                        cutout:     '✓ Freigestellt',
                        quality:    '✓ Qualität',
                      }[state]

                      const stateLabelColor = {
                        original:   'text-muted-foreground',
                        cutout:     'text-blue-600 dark:text-blue-400',
                        quality:    'text-amber-600 dark:text-amber-400',
                      }[state]

                      return (
                        <div key={slot.id}>
                          <div className="aspect-[4/3] rounded-xl overflow-hidden bg-muted relative">
                            <img
                              src={activeUrl}
                              alt={slot.label}
                              className="w-full h-full object-cover transition-all duration-500"
                              style={isOriginal
                                ? { filter: 'brightness(0.58) contrast(0.82) saturate(0.32) blur(0.7px)' }
                                : undefined
                              }
                            />
                            {processing && (
                              <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2">
                                <Loader2 className="h-5 w-5 text-white animate-spin" />
                                <span className="text-white text-[11px] font-medium">KI verarbeitet…</span>
                              </div>
                            )}
                          </div>

                          <p className={`text-[10px] text-center mt-1.5 mb-2 font-medium transition-colors ${stateLabelColor}`}>
                            {stateLabel}
                          </p>

                          <div className="space-y-1">
                            {([
                              {
                                type: 'cutout' as const,
                                icon: Scissors,
                                label: 'Freistellen',
                                activeClass: 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
                              },
                              {
                                type: 'quality' as const,
                                icon: Zap,
                                label: 'Qualität',
                                activeClass: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
                              },
                            ]).map(({ type, icon: Icon, label, activeClass }) => {
                              const isActive = state === type
                              const isProcessing = processing === type
                              return (
                                <button
                                  key={type}
                                  onClick={() => !isActive && !processing && handleEnhance(slot.id, type)}
                                  disabled={!!processing}
                                  className={`w-full flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium border transition-all ${
                                    isActive
                                      ? activeClass
                                      : isProcessing
                                      ? 'bg-primary/5 text-primary border-primary/20 cursor-not-allowed'
                                      : 'bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-foreground cursor-pointer'
                                  }`}
                                >
                                  {isProcessing
                                    ? <Loader2 className="h-3 w-3 animate-spin shrink-0" />
                                    : isActive
                                    ? <CheckCircle2 className="h-3 w-3 shrink-0" />
                                    : <Icon className="h-3 w-3 shrink-0" />
                                  }
                                  {isProcessing ? 'KI verarbeitet…' : label}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div className="hidden sm:block border-2 border-dashed rounded-xl p-5 text-center">
                    <ImagePlus className="h-7 w-7 mx-auto text-muted-foreground/40 mb-2" />
                    <p className="text-xs text-muted-foreground">Weitere Bilder hochladen</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">JPG, PNG bis 10MB, max. 20 Bilder</p>
                    <Button variant="outline" size="sm" className="mt-3 h-7 text-xs" asChild>
                      <label className="cursor-pointer">
                        <Upload className="h-3 w-3 mr-1.5" />
                        Bilder auswählen
                        <input type="file" accept="image/*" multiple className="sr-only" />
                      </label>
                    </Button>
                  </div>

                  <div className="sm:hidden space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <label className="group relative flex flex-col items-center gap-2.5 rounded-2xl border-2 border-dashed border-border bg-muted/30 p-5 cursor-pointer active:scale-[0.97] transition-all duration-150 active:bg-muted/60">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-background shadow-sm ring-1 ring-border/60 group-active:shadow-none transition-shadow">
                          <Camera className="h-5 w-5 text-foreground" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-semibold leading-tight">Aufnehmen</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">Kamera öffnen</p>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="sr-only"
                        />
                      </label>

                      <label className="group relative flex flex-col items-center gap-2.5 rounded-2xl border-2 border-dashed border-border bg-muted/30 p-5 cursor-pointer active:scale-[0.97] transition-all duration-150 active:bg-muted/60">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-background shadow-sm ring-1 ring-border/60 group-active:shadow-none transition-shadow">
                          <Images className="h-5 w-5 text-foreground" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-semibold leading-tight">Galerie</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">Fotos auswählen</p>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="sr-only"
                        />
                      </label>
                    </div>
                    <p className="text-center text-[10px] text-muted-foreground/60">
                      JPG, PNG · max. 10 MB · bis zu 20 Bilder
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="lg:col-span-2 space-y-5">
            {showFormContent && (
              <Card className="border-primary/20 bg-primary/[0.025]">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    KI-Assistent
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">

                  <Button
                    className="w-full"
                    onClick={handleGenerate}
                    disabled={generating || inseratCreated}
                  >
                    {generating
                      ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generiere...</>
                      : generated
                      ? <><RefreshCw className="h-4 w-4 mr-2" />Neu generieren</>
                      : <><Sparkles className="h-4 w-4 mr-2" />KI-Beschreibung generieren</>
                    }
                  </Button>

                  {generated && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2">

                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map(i => (
                            <Star
                              key={i}
                              className={`h-3.5 w-3.5 ${i <= Math.round(MOCK_AI.confidence / 20) ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground/30'}`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">Konfidenz {MOCK_AI.confidence}%</span>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-[10px] text-muted-foreground uppercase tracking-widest">Titel</Label>
                        <div className="p-2.5 bg-card rounded-lg border text-xs font-medium leading-snug">
                          {MOCK_AI.title}
                        </div>
                        <Button size="sm" variant="outline" className="w-full h-7 text-xs">
                          <Check className="h-3 w-3 mr-1" />
                          Titel übernehmen
                        </Button>
                      </div>

                      <Separator />

                      <div className="space-y-1.5">
                        <Label className="text-[10px] text-muted-foreground uppercase tracking-widest">Beschreibung</Label>
                        <div className="p-2.5 bg-card rounded-lg border text-xs whitespace-pre-line max-h-44 overflow-y-auto leading-relaxed">
                          {activeDescription}
                        </div>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <Button size="sm" variant="outline" className="h-7 text-xs">
                            <Check className="h-3 w-3 mr-1" />
                            Übernehmen
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className={`h-7 text-xs ${
                              descImproved
                                ? 'text-emerald-600 border-emerald-300 dark:border-emerald-800'
                                : 'text-primary border-primary/30'
                            }`}
                            onClick={handleImproveDescription}
                            disabled={improvingDesc || inseratCreated}
                          >
                            {improvingDesc
                              ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Verbessere...</>
                              : descImproved
                              ? <><CheckCircle2 className="h-3 w-3 mr-1" />Verbessert</>
                              : <><Wand2 className="h-3 w-3 mr-1" />Verbessern</>
                            }
                          </Button>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-[10px] text-muted-foreground uppercase tracking-widest">
                            Inserat-Qualität
                          </Label>
                          <span className={`text-sm font-bold tabular-nums ${
                            kycScore >= 90 ? 'text-emerald-600' : kycScore >= 70 ? 'text-amber-600' : 'text-red-500'
                          }`}>
                            {kycScore}%
                          </span>
                        </div>
                        <Progress value={kycScore} className="h-1.5" />
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                          <span>
                            {kycScore >= 90 ? 'Ausgezeichnet' : kycScore >= 70 ? 'Gut' : 'Verbesserungspotential'}
                          </span>
                          {!kycImproved && (
                            <span className="text-primary">{MOCK_AI.improvedKycScore}% möglich</span>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className={`w-full h-7 text-xs ${
                            kycImproved
                              ? 'text-emerald-600 border-emerald-300 dark:border-emerald-800'
                              : 'text-primary border-primary/30'
                          }`}
                          onClick={handleImproveKyc}
                          disabled={improvingKyc || kycImproved || inseratCreated}
                        >
                          {improvingKyc
                            ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Optimiere...</>
                            : kycImproved
                            ? <><CheckCircle2 className="h-3 w-3 mr-1" />Qualität optimiert</>
                            : <><Sparkles className="h-3 w-3 mr-1" />KI-Qualität verbessern</>
                          }
                        </Button>
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-[10px] text-muted-foreground uppercase tracking-widest">
                            Plausibilitätsprüfung
                          </Label>
                          {plausibilityDone && (
                            <span className={`text-sm font-bold tabular-nums ${
                              MOCK_AI.plausibilityCheck.score >= 90 ? 'text-emerald-600'
                                : MOCK_AI.plausibilityCheck.score >= 70 ? 'text-amber-600'
                                : 'text-red-500'
                            }`}>
                              {MOCK_AI.plausibilityCheck.score}/100
                            </span>
                          )}
                        </div>

                        {!plausibilityDone && !plausibilityRunning && (
                          <p className="text-[10px] text-muted-foreground leading-relaxed">
                            KI-gestützter Abgleich von Bildern, Fahrzeugdaten und Marktdaten – erkennt Schäden, Inkonsistenzen und unplausible Angaben.
                          </p>
                        )}

                        {plausibilityRunning && (
                          <div className="space-y-1.5 animate-in fade-in">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              <span>
                                {plausibilityProgress < 25 ? 'Bilder werden analysiert…'
                                  : plausibilityProgress < 50 ? 'Schadensprüfung läuft…'
                                  : plausibilityProgress < 75 ? 'Fahrzeugdaten werden abgeglichen…'
                                  : plausibilityProgress < 100 ? 'Marktdaten werden geprüft…'
                                  : 'Auswertung abgeschlossen'}
                              </span>
                            </div>
                            <Progress value={plausibilityProgress} className="h-1" />
                          </div>
                        )}

                        {plausibilityDone && (
                          <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                            <Progress value={MOCK_AI.plausibilityCheck.score} className="h-1.5" />
                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                              {MOCK_AI.plausibilityCheck.summary}
                            </p>

                            <div className="rounded-lg border bg-card divide-y divide-border/60 max-h-56 overflow-y-auto">
                              {MOCK_AI.plausibilityCheck.checks.map(check => {
                                const cfg = {
                                  pass:    { Icon: CheckCircle2,  color: 'text-emerald-600 dark:text-emerald-400' },
                                  warning: { Icon: AlertTriangle, color: 'text-amber-600 dark:text-amber-400' },
                                  fail:    { Icon: XCircle,       color: 'text-red-500 dark:text-red-400' },
                                  info:    { Icon: Info,          color: 'text-sky-600 dark:text-sky-400' },
                                }[check.status]
                                return (
                                  <div key={check.id} className="flex items-start gap-2 p-2">
                                    <cfg.Icon className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${cfg.color}`} />
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center justify-between gap-2">
                                        <span className="text-xs font-medium truncate">{check.label}</span>
                                        <span className="text-[9px] text-muted-foreground uppercase tracking-wider shrink-0">
                                          {check.category}
                                        </span>
                                      </div>
                                      <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                                        {check.detail}
                                      </p>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}

                        <Button
                          size="sm"
                          variant="outline"
                          className={`w-full h-7 text-xs ${
                            plausibilityDone
                              ? 'text-emerald-600 border-emerald-300 dark:border-emerald-800'
                              : 'text-primary border-primary/30'
                          }`}
                          onClick={handleRunPlausibility}
                          disabled={plausibilityRunning || inseratCreated}
                        >
                          {plausibilityRunning
                            ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Prüfe...</>
                            : plausibilityDone
                            ? <><RefreshCw className="h-3 w-3 mr-1" />Erneut prüfen</>
                            : <><ShieldCheck className="h-3 w-3 mr-1" />Plausibilitätsprüfung starten</>
                          }
                        </Button>
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <Label className="text-[10px] text-muted-foreground uppercase tracking-widest">
                          Preisanalyse
                        </Label>
                        <div className="p-3 bg-card rounded-lg border space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground">Ihr Preis</span>
                            <span className="text-sm font-bold">{formatCurrency(MOCK_AI.priceAnalysis.suggestion)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground">Marktpreis (Ø)</span>
                            <span className="text-xs">{formatCurrency(MOCK_AI.priceAnalysis.marketPrice)}</span>
                          </div>
                          <Badge
                            variant="outline"
                            className={`${priceCategoryConfig[MOCK_AI.priceAnalysis.category].bg} ${priceCategoryConfig[MOCK_AI.priceAnalysis.category].color} border-0 text-xs`}
                          >
                            {priceCategoryConfig[MOCK_AI.priceAnalysis.category].label}
                          </Badge>
                          <div className="pt-0.5 space-y-1">
                            {MOCK_AI.priceAnalysis.thresholds.map((t, i) => (
                              <div key={i} className="flex justify-between text-[10px] text-muted-foreground">
                                <span>{t.label}</span>
                                <span>bis {formatCurrency(t.max)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {!inseratCreated ? (
                        <Button className="w-full" onClick={handleCreateInserat}>
                          <Check className="h-4 w-4 mr-2" />
                          Inserat erstellen
                        </Button>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 p-2.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                            <span className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">
                              Inserat erstellt!
                            </span>
                          </div>
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => setShowExport(true)}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Auf Plattformen exportieren
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      <Dialog open={showExport} onOpenChange={setShowExport}>
        <DialogContent className="max-w-[calc(100vw-1rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5 text-primary" />
              Inserat exportieren
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground -mt-1">
            Veröffentlichen Sie das Inserat auf Ihren Wunschplattformen.
          </p>
          <div className="space-y-3 mt-1">
            {EXPORT_PLATFORMS.map(platform => {
              const status = exportStatus[platform.id]
              return (
                <div
                  key={platform.id}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border ${platform.bgColor} ${platform.borderColor}`}
                >
                  {platform.icon}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground">{platform.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{platform.description}</p>
                  </div>
                  <Button
                    size="sm"
                    style={status === 'idle' || status === 'exporting' ? platform.btnStyle : undefined}
                    className={`text-white border-0 shrink-0 ${platform.btnHoverClass} ${
                      status === 'done' ? 'bg-emerald-600 hover:bg-emerald-600' : ''
                    }`}
                    onClick={() => status === 'idle' && handleExport(platform.id)}
                    disabled={status === 'exporting' || status === 'done'}
                  >
                    {status === 'exporting'
                      ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Exportiere</>
                      : status === 'done'
                      ? <><CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />Live</>
                      : <><ExternalLink className="h-3.5 w-3.5 mr-1.5" />Exportieren</>
                    }
                  </Button>
                </div>
              )
            })}
          </div>

          {Object.values(exportStatus).some(s => s === 'done') && (
            <div className="mt-1 p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              {Object.values(exportStatus).filter(s => s === 'done').length} von {EXPORT_PLATFORMS.length} Plattformen erfolgreich exportiert
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
```

---

## Akzeptanz-Kriterien (so soll es funktionieren)

1. `/inserate` zeigt eine Übersicht mit 4 Tabs: **Alle (4) / Live (3) / Entwürfe (1) / Archiviert (0)**, mit zählenden Badges. Initial sind 4 Demo-Inserate sichtbar (l1 CLA 250 e, l2 EQE 350+, l3 GLC 300, l4 E 220 d).
2. Jedes Inserat-Karte ist klickbar und führt zu `/inserate/<id>` (Detailseite).
3. Die Detailseite zeigt:
   - Hero-Bild + klickbare Thumbnail-Strip (mehrere Bilder pro Inserat)
   - Titel + Beschreibung
   - **Datenblatt** mit Fahrzeugdaten-Tabelle, Serien-/Sonderausstattung-Listen, Zustand-Badges (Unfallfrei/Nichtraucher/Scheckheftgepflegt) und Hinweisen
   - Rechte Spalte: Preis, Preiskategorie-Badge, Aufrufe/Anfragen (bei Live), Plattform-Status-Liste, „Auf Plattformen exportieren"-Button
   - Klick auf „Auf Plattformen exportieren" öffnet einen Dialog mit 3 Plattformen (mobile.de / AutoScout24 / TruckScout24). Jeder „Exportieren"-Button macht 2,2 s lang einen Mock-Loader und wechselt dann auf „Live" (grün).
4. „Neues Inserat"-Button auf der Übersicht führt zu `/inserate/neu`.
5. Auf `/inserate/neu`:
   - Erst Auswahl-Screen: **VIN-Abfrage** oder **Manuell eingeben**
   - VIN-Modus: Eingabe ≥5 Zeichen → 2,2 s Loader → Mock-VIN-Daten erscheinen (Mercedes-Benz GLC 300 4MATIC AMG Line, Serien- und Sonderausstattung, Preis-Override)
   - Manuell-Modus: Komplettes Formular mit Grunddaten, Technische Daten, klickbare Serien-/Sonderausstattung-Chips + Custom-Extra-Eingabe
   - Bilder-Sektion: 5 Image-Slots (GLC), Buttons „Freistellen" (Cutout-Studio-Bild) + „Qualität" (Quality-Variante) — mit 1,6 s Mock-Loader und Vorher/Nachher-Wechsel; Original-Bilder sind anfangs visuell abgedunkelt (filter brightness 0.58)
   - KI-Assistent (rechts): „KI-Beschreibung generieren" (2,2 s) → zeigt Titel + Beschreibung + Konfidenz-Sterne. „Verbessern"-Button (1,8 s) tauscht Beschreibung gegen verbesserte Version. „KI-Qualität verbessern" (1,5 s) hebt KYC-Score von 78 % auf 97 %. „Plausibilitätsprüfung starten" zeigt animierte Progress-Bar mit Stufen-Texten und am Ende eine 9-Punkte-Checkliste mit Pass/Warning/Info-Icons.
   - „Inserat erstellen" → öffnet Export-Dialog automatisch
6. Alle Mock-Animationen, Wartezeiten und Status-Übergänge müssen genauso funktionieren wie hier beschrieben (Zahlen sind in den setTimeout-Werten verbaut).

## Was du NICHT tun sollst

- Keine Backend-Endpunkte, keine Datenbank, keine Auth.
- Keine Refactorings oder „Verbesserungen" an der Logik – alles bleibt so wie der Quellcode.
- Keine eigenen Bilder generieren – die 26 PNGs werden vom Nutzer aus dem Quell-Repo kopiert.

## Abschließend

Nachdem alle Dateien angelegt sind:
1. `npm run dev` starten
2. `/inserate` aufrufen → Liste muss erscheinen
3. Auf eine Karte klicken → Detailseite muss erscheinen
4. „Neues Inserat" anklicken → Wizard muss erscheinen, beide Modi (VIN + Manuell) durchspielen
5. Export-Dialog mit den 3 Plattformen testen
