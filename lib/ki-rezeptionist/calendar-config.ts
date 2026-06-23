// Konfiguration für den KI-Kalender: Standorte, Dienstleistungen, Mitarbeiter,
// Statusfarben. Nagold-only für jetzt; Standortfeld bleibt vorbereitet.

import type { KiAppointmentStatus, KiClosureType } from './appointment-types'

export const KI_LOCATIONS = ['Nagold'] as const
export const KI_DEFAULT_LOCATION = 'Nagold'

export interface KiServiceConfig {
  id: string
  label: string
  durationMin: number
  /** Farb-Akzent für den Terminblock (Tailwind-Klassenpräfix). */
  accent: string
}

export const KI_SERVICES: KiServiceConfig[] = [
  { id: 'probefahrt', label: 'Probefahrt', durationMin: 30, accent: 'indigo' },
  { id: 'beratung_neuwagen', label: 'Beratung Neuwagen', durationMin: 45, accent: 'sky' },
  { id: 'beratung_gebrauchtwagen', label: 'Beratung Gebrauchtwagen', durationMin: 45, accent: 'cyan' },
  { id: 'finanzierung', label: 'Finanzierungsberatung', durationMin: 45, accent: 'emerald' },
  { id: 'inzahlungnahme', label: 'Fahrzeugbewertung / Inzahlungnahme', durationMin: 30, accent: 'teal' },
  { id: 'inspektion', label: 'Inspektion', durationMin: 60, accent: 'amber' },
  { id: 'tuev', label: 'TÜV / Gesetzliche Prüfung', durationMin: 60, accent: 'amber' },
  { id: 'reifenservice', label: 'Räder- & Reifenservice', durationMin: 30, accent: 'amber' },
  { id: 'sonstiges', label: 'Sonstiges', durationMin: 30, accent: 'gray' },
]

/** Mitarbeiter zur Auswahl (frei erweiterbar; freie Eingabe im Modal erlaubt). */
export const KI_STAFF = ['Jürgen Mäckle', 'Alexander Eckhardt', 'Marina Schittenhelm']

/** Akzent → Tailwind-Klassen für Terminblöcke (Light + Dark). */
export const SERVICE_ACCENT: Record<string, { bar: string; bg: string; text: string }> = {
  indigo: { bar: 'bg-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-950/40', text: 'text-indigo-900 dark:text-indigo-200' },
  sky: { bar: 'bg-sky-500', bg: 'bg-sky-50 dark:bg-sky-950/40', text: 'text-sky-900 dark:text-sky-200' },
  cyan: { bar: 'bg-cyan-500', bg: 'bg-cyan-50 dark:bg-cyan-950/40', text: 'text-cyan-900 dark:text-cyan-200' },
  emerald: { bar: 'bg-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-900 dark:text-emerald-200' },
  teal: { bar: 'bg-teal-500', bg: 'bg-teal-50 dark:bg-teal-950/40', text: 'text-teal-900 dark:text-teal-200' },
  amber: { bar: 'bg-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-900 dark:text-amber-200' },
  gray: { bar: 'bg-gray-400', bg: 'bg-gray-50 dark:bg-gray-800/50', text: 'text-gray-900 dark:text-gray-200' },
}

export function serviceAccent(serviceLabel: string): { bar: string; bg: string; text: string } {
  const svc = KI_SERVICES.find((s) => s.label === serviceLabel || s.id === serviceLabel)
  return SERVICE_ACCENT[svc?.accent ?? 'gray'] ?? SERVICE_ACCENT.gray
}

export const KI_APPOINTMENT_STATUS_LABEL: Record<KiAppointmentStatus, string> = {
  geplant: 'Geplant',
  bestaetigt: 'Bestätigt',
  abgesagt: 'Abgesagt',
  erledigt: 'Erledigt',
}

export const KI_CLOSURE_TYPE_LABEL: Record<KiClosureType, string> = {
  betriebsschliessung: 'Betriebsschließung',
  urlaub: 'Urlaub',
  wartung: 'Wartung',
  feiertag: 'Feiertag',
}

/** Kalender-Raster: Stunden, die angezeigt werden. */
export const CALENDAR_START_HOUR = 7
export const CALENDAR_END_HOUR = 22
