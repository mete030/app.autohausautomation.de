// Anliegen-Taxonomie des KI-Rezeptionisten: Label, Farbe, Icon, Dringlichkeit
// und Default-SLA pro Kategorie. Treibt Badges + To-Do-Priorisierung.
// Standalone — teilt sich KEINE Config mit dem Callcenter.

import {
  Car,
  CarFront,
  KeyRound,
  Landmark,
  Banknote,
  Wrench,
  AlertTriangle,
  HelpCircle,
  type LucideIcon,
} from 'lucide-react'
import type { KiReceptionCategory, KiReceptionStatus, KiMarke } from './types'

export type KiUrgency = 'niedrig' | 'mittel' | 'hoch'

export interface KiCategoryConfig {
  label: string
  /** Tailwind-Badge-Klassen (Light + Dark). */
  color: string
  icon: LucideIcon
  urgency: KiUrgency
  /** Default-Bearbeitungsfenster in Minuten (für SLA-Anzeige). */
  slaMinutes: number
}

export const kiCategoryConfig: Record<KiReceptionCategory, KiCategoryConfig> = {
  neuwagen: {
    label: 'Neuwagen',
    color: 'bg-sky-100 text-sky-700 dark:bg-sky-950/30 dark:text-sky-400',
    icon: Car,
    urgency: 'mittel',
    slaMinutes: 240,
  },
  gebrauchtwagen: {
    label: 'Gebrauchtwagen',
    color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-400',
    icon: CarFront,
    urgency: 'mittel',
    slaMinutes: 240,
  },
  probefahrt: {
    label: 'Probefahrt / Besichtigung',
    color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400',
    icon: KeyRound,
    urgency: 'mittel',
    slaMinutes: 180,
  },
  finanzierung_leasing: {
    label: 'Finanzierung / Leasing',
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400',
    icon: Landmark,
    urgency: 'mittel',
    slaMinutes: 240,
  },
  inzahlungnahme: {
    label: 'Inzahlungnahme / Ankauf',
    color: 'bg-teal-100 text-teal-700 dark:bg-teal-950/30 dark:text-teal-400',
    icon: Banknote,
    urgency: 'mittel',
    slaMinutes: 240,
  },
  werkstatt_service: {
    label: 'Werkstatt / Service',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
    icon: Wrench,
    urgency: 'mittel',
    slaMinutes: 240,
  },
  beschwerde: {
    label: 'Beschwerde / Reklamation',
    color: 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400',
    icon: AlertTriangle,
    urgency: 'hoch',
    slaMinutes: 60,
  },
  sonstiges: {
    label: 'Sonstiges / Unklar',
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-800/40 dark:text-gray-400',
    icon: HelpCircle,
    urgency: 'niedrig',
    slaMinutes: 480,
  },
}

export const kiStatusConfig: Record<KiReceptionStatus, { label: string; color: string }> = {
  offen: {
    label: 'Offen',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400',
  },
  in_bearbeitung: {
    label: 'In Bearbeitung',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
  },
  erledigt: {
    label: 'Erledigt',
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400',
  },
}

const VALID_CATEGORIES = new Set<KiReceptionCategory>(
  Object.keys(kiCategoryConfig) as KiReceptionCategory[],
)

/**
 * Loose-Strings von Famulor (z. B. "Neuwagen", "test drive", "service")
 * robust auf unsere Enum-Werte abbilden. Unbekanntes → 'sonstiges'.
 * Wird nach Eintreffen des echten Payloads weiter geschärft.
 */
const CATEGORY_ALIASES: Record<string, KiReceptionCategory> = {
  neuwagen: 'neuwagen',
  neuwagenkauf: 'neuwagen',
  neufahrzeug: 'neuwagen',
  newcar: 'neuwagen',
  gebrauchtwagen: 'gebrauchtwagen',
  gebraucht: 'gebrauchtwagen',
  usedcar: 'gebrauchtwagen',
  probefahrt: 'probefahrt',
  besichtigung: 'probefahrt',
  testdrive: 'probefahrt',
  termin: 'probefahrt',
  finanzierung: 'finanzierung_leasing',
  leasing: 'finanzierung_leasing',
  finanzierung_leasing: 'finanzierung_leasing',
  financing: 'finanzierung_leasing',
  anzahlung: 'finanzierung_leasing',
  inzahlungnahme: 'inzahlungnahme',
  inzahlung: 'inzahlungnahme',
  ankauf: 'inzahlungnahme',
  tradein: 'inzahlungnahme',
  werkstatt: 'werkstatt_service',
  service: 'werkstatt_service',
  werkstatt_service: 'werkstatt_service',
  reparatur: 'werkstatt_service',
  inspektion: 'werkstatt_service',
  workshop: 'werkstatt_service',
  beschwerde: 'beschwerde',
  reklamation: 'beschwerde',
  complaint: 'beschwerde',
  sonstiges: 'sonstiges',
  sonstige: 'sonstiges',
  unklar: 'sonstiges',
  other: 'sonstiges',
}

export function normalizeCategory(raw?: string | null): KiReceptionCategory {
  if (!raw) return 'sonstiges'
  const key = raw.toLowerCase().trim().replace(/[\s/\-.]+/g, '_')
  if (VALID_CATEGORIES.has(key as KiReceptionCategory)) return key as KiReceptionCategory
  if (CATEGORY_ALIASES[key]) return CATEGORY_ALIASES[key]
  // letzter Versuch: ohne Unterstriche matchen (z. B. "test_drive" → "testdrive")
  const compact = key.replace(/_/g, '')
  return CATEGORY_ALIASES[compact] ?? 'sonstiges'
}

export const KI_RECEPTION_CATEGORIES = Object.keys(kiCategoryConfig) as KiReceptionCategory[]

// ===== Fahrzeug-Marke — Badge + Filter (Wackenhut-Marken) =====
// Eigene, vom Anliegen entkoppelte Taxonomie. „andere" = Fremdmarke (z. B. bei
// Inzahlungnahme), „null"/fehlend wird in der UI als „Ohne Angabe" geführt.
export const kiMarkeConfig: Record<KiMarke, { label: string; color: string }> = {
  mercedes: { label: 'Mercedes-Benz', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800/40 dark:text-slate-300' },
  smart:    { label: 'smart',         color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400' },
  lucid:    { label: 'Lucid Motors',  color: 'bg-violet-100 text-violet-700 dark:bg-violet-950/30 dark:text-violet-400' },
  skoda:    { label: 'Škoda',         color: 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400' },
  byd:      { label: 'BYD',           color: 'bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400' },
  fuso:     { label: 'Fuso',          color: 'bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400' },
  andere:   { label: 'Andere Marke',  color: 'bg-gray-100 text-gray-700 dark:bg-gray-800/40 dark:text-gray-400' },
}

export const KI_MARKEN = Object.keys(kiMarkeConfig) as KiMarke[]

/**
 * Erkennt die Marke aus einem freien String (Famulor-`marke` oder Fahrzeug-Feld)
 * inkl. typischer Modell-Hinweise. Liefert null, wenn nichts Eindeutiges passt.
 */
export function detectMarke(raw?: string | null): KiMarke | null {
  if (!raw) return null
  const r = raw.toLowerCase()
  if (/\bbyd\b|atto\s?3|\bdolphin\b|\bseal\b|\bhan\b|\btang\b/.test(r)) return 'byd'
  if (/\bfuso\b|\bcanter\b|ecanter/.test(r)) return 'fuso'
  if (/\blucid\b|lucid\s?(air|gravity)/.test(r)) return 'lucid'
  if (/mercedes|mercedes-benz|\bbenz\b|\bmb\b|[abcesgv]-klasse|\bgl[abcse]\b|\bcla\b|\bcle\b|\beq[abcesv]\b|\bvito\b|\bsprinter\b|\bcitan\b/.test(r)) return 'mercedes'
  if (/(škoda|skoda|octavia|fabia|superb|kodiaq|karoq|kamiq|enyaq|scala|elroq|kushaq)/.test(r)) return 'skoda'
  if (/\bsmart\b|fortwo|forfour/.test(r)) return 'smart'
  return null
}

/**
 * Bestimmt die Marke aus dem expliziten Famulor-Feld; fällt sonst auf die
 * Ableitung aus dem Fahrzeug-Text zurück. Ein gesetztes, aber unbekanntes
 * Marken-Feld (z. B. „Audi") wird zu 'andere', nicht null.
 */
export function resolveMarke(rawMarke?: string | null, vehicle?: string | null): KiMarke | null {
  const m = rawMarke?.trim()
  if (m && !/^(unklar|keine?|kein|none|n\/?a|-+|unbekannt)$/i.test(m)) {
    return detectMarke(m) ?? 'andere'
  }
  return vehicle ? detectMarke(vehicle) : null
}
