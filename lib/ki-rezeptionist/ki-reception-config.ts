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
import type { KiReceptionCategory, KiReceptionStatus } from './types'

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
