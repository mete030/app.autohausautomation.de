/**
 * Mock data + pure logic for the KI-assisted parts of the "Neues Inserat"
 * workflow. Everything here is demo data for the GLC 300 4MATIC (the vehicle the
 * VIN-mock resolves to). Three feature areas:
 *
 *   1. Title meters      — mobile.de-style "Kopfzeilen-Tool" (per-portal limits)
 *   2. Quality optimizer — the editable breakdown behind the Inserat-Qualität
 *                          score (why 78 %, what raises it to 97 %)
 *   3. Confidence        — why the generated description sits at 94 % and what
 *                          would lift it to 100 %
 *   4. DAT-Ausstattung   — the Cargate-style nested "Ausstattung einfügen" menu
 *                          (Kategorie → Bereinigung → Position) + block builder
 *
 * Quality vs. Plausibility are kept strictly MECE:
 *   • Inserat-Qualität     = Vollständigkeit & Attraktivität (Reichweite/Ranking)
 *   • Plausibilitätsprüfung = Korrektheit & Konsistenz (Vertrauen)
 */

import {
  mercedesListingCreationVinMock as VIN_MOCK,
} from './mercedes-inventory'

// ─── 1. Title meters (Kopfzeilen-Tool) ────────────────────────────────────────

export interface PlatformTitleLimit {
  id: string
  name: string
  /** character position in the Modellzusatz where this portal cuts the title off */
  limit: number
  /** true when the real portal measures rendered pixels (limit = practical proxy) */
  pixelBased?: boolean
  /** brand colour for the marker line + label */
  color: string
}

/**
 * The reference "Kopfzeilen-Tool": one Modellzusatz line with a vertical marker
 * per portal that shows where each one truncates the title. mobile.de caps at
 * 48 characters, carzilla.de at 65; AutoScout24 measures pixels (≈ 56 chars is
 * a fair proxy at the portal font).
 */
export const platformTitleLimits: PlatformTitleLimit[] = [
  { id: 'mobile_de', name: 'mobile.de', limit: 48, color: '#FF6600' },
  { id: 'autoscout24', name: 'AutoScout24', limit: 56, pixelBased: true, color: '#003F87' },
  { id: 'carzilla', name: 'carzilla.de', limit: 65, color: '#00A19A' },
]

// ─── 2. Quality optimizer (Inserat-Qualität breakdown) ─────────────────────────

export type QualityStatus = 'done' | 'partial' | 'open'

export interface QualityFactor {
  id: string
  /** grouping shown as the eyebrow label */
  category: string
  label: string
  /** why this factor isn't full yet */
  gap: string
  /** the concrete action the KI proposes */
  aiAction: string
  /** % this action adds to the score when applied */
  points: number
  status: QualityStatus
  /** false → needs a human decision, KI won't apply it automatically */
  autoApplicable: boolean
  /** proposed value the user may edit before applying (e.g. optimized title) */
  editableValue?: string
}

export const QUALITY_BASE_SCORE = 78
export const QUALITY_TARGET_SCORE = 97

/**
 * Six MECE completeness/attractiveness factors. Points sum to
 * 97 − 78 = 19, so applying everything reaches the advertised ceiling.
 * The price factor is intentionally NOT auto-applicable — it needs the
 * seller's call, which is exactly the "I might know something the KI doesn't"
 * lever the user asked for.
 */
export const qualityFactors: QualityFactor[] = [
  {
    id: 'titel',
    category: 'Titel',
    label: 'Titel-Reichweite',
    gap: 'Modellzusatz nutzt 41 von 48 Zeichen – 7 Zeichen ungenutzt für weitere Suchbegriffe wie „360°" oder „Head-up".',
    aiAction: 'Modellzusatz mit weiteren Top-Suchbegriffen auf die volle Länge bringen.',
    points: 3,
    status: 'partial',
    autoApplicable: true,
    editableValue: 'AMG Line Night-Paket Pano Burmester 360°',
  },
  {
    id: 'beschreibung',
    category: 'Beschreibung',
    label: 'Beschreibung erstellen',
    gap: 'Noch keine Beschreibung erfasst – Inserate mit Text erhalten deutlich mehr Anfragen.',
    aiAction: 'Strukturierte Beschreibung im Wackenhut-/mobile.de-Stil generieren.',
    points: 5,
    status: 'open',
    autoApplicable: true,
  },
  {
    id: 'fotos',
    category: 'Fotos',
    label: 'Fotostrecke vervollständigen',
    gap: '9 von 14 empfohlenen Aufnahmen vorhanden – 5 Innenraum-Positionen fehlen.',
    aiAction: 'Fehlende Innenraum-Aufnahmen (Cockpit, Sitze, Rückbank …) anfordern.',
    points: 4,
    status: 'partial',
    autoApplicable: true,
  },
  {
    id: 'ausstattung',
    category: 'Ausstattung',
    label: 'Ausstattung übernehmen',
    gap: '30 Merkmale aktiv – 8 verfügbare DAT-Ausstattungen noch nicht übernommen.',
    aiAction: '8 weitere DAT-Ausstattungen in das Inserat übernehmen.',
    points: 3,
    status: 'partial',
    autoApplicable: true,
  },
  {
    id: 'fahrzeugdaten',
    category: 'Fahrzeugdaten',
    label: 'Fahrzeugdaten anreichern',
    gap: 'Optionale Detailfelder wie Herstellerfarbcode, Polsterfarbe und Innenraum-Zierteile sind noch nicht hinterlegt.',
    aiAction: 'Optionale Detailfelder aus dem DAT-Datensatz ergänzen.',
    points: 2,
    status: 'partial',
    autoApplicable: true,
  },
  {
    id: 'preis',
    category: 'Preis',
    label: 'Preis-Sichtbarkeit',
    gap: 'Preis 52.900 € liegt im Bereich „Gut". Ab 49.900 € greift die Kategorie „Sehr guter Preis".',
    aiAction: 'Preis auf 49.900 € senken – benötigt Ihre Freigabe.',
    points: 2,
    status: 'open',
    autoApplicable: false,
  },
]

// ─── 3. Description confidence (why 94 %, path to 100 %) ───────────────────────

export interface ConfidenceFactor {
  label: string
  detail: string
  /** solid = supports the confidence, limit = caps it */
  kind: 'solid' | 'limit'
  /** for 'limit' factors: the % it currently costs */
  impact?: number
}

export const confidenceBreakdown = {
  score: 94,
  solid: [
    { label: 'Fahrzeugdaten', detail: 'Aus dem VIN-Datensatz übernommen und mit DAT abgeglichen.', kind: 'solid' as const },
    { label: 'Ausstattung', detail: '30 Merkmale mit dem DAT-Katalog verifiziert.', kind: 'solid' as const },
    { label: 'Marktdaten', detail: 'Preis- und Wettbewerbsdaten von heute (mobile.de-Abgleich).', kind: 'solid' as const },
  ],
  limits: [
    { label: 'Individuelle Zustandsdetails', detail: 'Gebrauchsspuren und Historie kann die KI nicht aus den Daten ableiten.', kind: 'limit' as const, impact: 3 },
    { label: 'Persönliche Verkaufsargumente', detail: 'Kundenspezifische Formulierungen basieren auf Standardmustern.', kind: 'limit' as const, impact: 3 },
  ],
  toReach100:
    'Ergänzen Sie individuelle Zustandshinweise und eigene Verkaufsargumente – dann steigt die Konfidenz auf 100 %.',
} as const

// ─── 4. DAT-Ausstattung nested menu (Cargate-style) ────────────────────────────

export interface AusstattungPaket {
  name: string
  inhalt: string[]
}

/** Ausstattungspakete laut DAT — package name + its individual contents. */
export const glcPakete: AusstattungPaket[] = [
  {
    name: 'AMG Line',
    inhalt: [
      'AMG Bodystyling',
      'Sport-Multifunktionslenkrad in Nappaleder',
      'Edelstahl-Sportpedale',
      'Sportsitze in ARTICO/MICROCUT mit roter Kontrastnaht',
      '20″ AMG Leichtmetallräder',
    ],
  },
  {
    name: 'Night-Paket',
    inhalt: [
      'Außenspiegelgehäuse in Schwarz',
      'Seiten- und Heckscheiben abgedunkelt',
      'Kühlergrill mit Chrompins',
      'Fensterrahmen hochglanzschwarz',
    ],
  },
  {
    name: 'Fahrassistenz-Paket Plus',
    inhalt: [
      'Aktiver Abstands-Assistent DISTRONIC',
      'Aktiver Lenk-Assistent',
      'Aktiver Spurwechsel-Assistent',
      'PRE-SAFE PLUS',
      'Ausweich-Lenk-Assistent',
    ],
  },
  {
    name: 'Park-Paket mit 360°-Kamera',
    inhalt: [
      'Aktiver Park-Assistent mit PARKTRONIC',
      '360°-Kamera',
      'Rückfahrkamera',
    ],
  },
  {
    name: 'Memory-Paket',
    inhalt: [
      'Sitze vorn elektrisch verstellbar mit Memory',
      'Lenksäule elektrisch verstellbar',
      'Außenspiegel mit Memory-Funktion',
    ],
  },
]

/** Hersteller-Codes for the "mit Herst.-Code" variant (demo values). */
export const herstellerCodes: Record<string, string> = {
  'AMG Line Exterieur': 'P31',
  'AMG Line': 'P31',
  'Night-Paket': 'P65',
  'Panorama-Schiebedach': '413',
  'Burmester 3D-Surround-Soundsystem': '810',
  'Head-up-Display': '463',
  '360°-Kamera': '501',
  'Memory-Paket': '275',
  AIRMATIC: '489',
  'Fahrassistenz-Paket Plus': '23P',
  'Anhängerkupplung schwenkbar': '550',
}

export type AusstattungCategory = 'serie' | 'sonder' | 'sonder_code' | 'pakete'
export type AusstattungVariant = 'unbereinigt' | 'bereinigt_inhalte' | 'bereinigt_pakete_inhalte'
export type InsertPosition = 'anfang' | 'ende'

export const ausstattungCategories: { key: AusstattungCategory; label: string; hint: string }[] = [
  { key: 'serie', label: 'Serienausstattungen', hint: 'Werksseitige Standardausstattung' },
  { key: 'sonder', label: 'Sonderausstattungen', hint: 'Aufpreispflichtige Extras & Pakete' },
  { key: 'sonder_code', label: 'Sonderausst. mit Herst.-Code', hint: 'Extras inkl. Mercedes-Bestellcode' },
  { key: 'pakete', label: 'Ausstattungspakete laut DAT', hint: 'Pakete inkl. Paketinhalten' },
]

export const ausstattungVariants: { key: AusstattungVariant; label: string; hint: string }[] = [
  { key: 'unbereinigt', label: 'unbereinigt', hint: 'Pakete + alle Paketinhalte + Einzelpositionen' },
  { key: 'bereinigt_inhalte', label: 'bereinigt um Paketinhalte', hint: 'Paketnamen ohne die enthaltenen Einzelpositionen' },
  { key: 'bereinigt_pakete_inhalte', label: 'bereinigt um Pakete und -Inhalte', hint: 'Nur paketfreie Einzelpositionen' },
]

export const ausstattungPositions: { key: InsertPosition; label: string }[] = [
  { key: 'anfang', label: 'Am Anfang einfügen' },
  { key: 'ende', label: 'Am Ende einfügen' },
]

/**
 * Resolve a flat Sonderausstattung entry to its DAT package. Handles the
 * 'AMG Line Exterieur' ↔ 'AMG Line' alias. Undefined → it's a standalone
 * position (no package), used by every variant so the notion of "package"
 * can never diverge between branches.
 */
function resolvePaket(name: string): AusstattungPaket | undefined {
  return glcPakete.find((p) => p.name === name || (name === 'AMG Line Exterieur' && p.name === 'AMG Line'))
}

function withCode(name: string): string {
  const code = herstellerCodes[name]
  return code ? `${name} · Code ${code}` : name
}

/**
 * Build the text block for a (category, variant) combination. Returns the block
 * WITHOUT surrounding blank lines — the caller decides spacing/placement.
 */
export function buildAusstattungBlock(
  category: AusstattungCategory,
  variant: AusstattungVariant,
): string {
  let heading = ''
  let lines: string[] = []

  if (category === 'serie') {
    // Serienausstattung has no packages → the three variants are equivalent.
    heading = 'Serienausstattung'
    lines = [...VIN_MOCK.serienausstattung]
  } else if (category === 'pakete') {
    heading = 'Ausstattungspakete laut DAT'
    if (variant === 'unbereinigt') {
      lines = glcPakete.map((p) => `${p.name}: ${p.inhalt.join(', ')}`)
    } else {
      // Both "bereinigt" variants collapse to package names for the package view.
      lines = glcPakete.map((p) => p.name)
    }
  } else {
    // sonder / sonder_code
    heading = category === 'sonder_code' ? 'Sonderausstattung (mit Herst.-Code)' : 'Sonderausstattung'
    const format = category === 'sonder_code' ? withCode : (n: string) => n
    const sonder = VIN_MOCK.sonderausstattung

    if (variant === 'unbereinigt') {
      // Everything: each package expanded to name + contents, plus standalones.
      lines = sonder.flatMap((name) => {
        const paket = resolvePaket(name)
        if (paket) return [format(name), ...paket.inhalt.map((c) => `  – ${c}`)]
        return [format(name)]
      })
    } else if (variant === 'bereinigt_inhalte') {
      // Package names kept, contents dropped → the flat list as delivered.
      lines = sonder.map(format)
    } else {
      // Remove packages AND their contents → standalone positions only.
      lines = sonder.filter((name) => !resolvePaket(name)).map(format)
    }
  }

  const body = lines.length > 0 ? lines.map((l) => (l.startsWith('  – ') ? l : `• ${l}`)).join('\n') : '• (keine Positionen)'
  return `${heading}:\n${body}`
}

/** Insert a block into an existing description at the requested position. */
export function insertAusstattungBlock(
  current: string,
  block: string,
  position: InsertPosition,
): string {
  const trimmed = current.trimEnd()
  if (position === 'anfang') {
    return trimmed.length > 0 ? `${block}\n\n${current.trimStart()}` : `${block}\n`
  }
  return trimmed.length > 0 ? `${trimmed}\n\n${block}\n` : `${block}\n`
}
