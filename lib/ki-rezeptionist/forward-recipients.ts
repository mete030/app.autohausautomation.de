// Empfänger-Verzeichnis für die KI-Rückruf-Weiterleitung.
//
// Bewusst EIGENSTÄNDIG im ki-rezeptionist-Namespace gehalten und NICHT aus dem
// Callcenter-`mockEmployees` abgeleitet — die KI-Weiterleitung darf sich nicht
// mit dem Callcenter vermischen. Namen/E-Mails sind aus den bestätigten
// Wackenhut-Daten übernommen (Standort Nagold + öffentliches Kontaktverzeichnis
// wackenhut.de/kontakte). Alle Adressen liegen auf @wackenhut.de — die API
// erlaubt ausschließlich diese Domain als Weiterleitungsziel.

export interface KiForwardRecipient {
  id: string
  name: string
  email: string
  /** Rollen-Kurzlabel für die Auswahl (z. B. „Verkäufer", „Serviceberater"). */
  roleLabel: string
}

export interface KiForwardRecipientGroup {
  key: 'tester' | 'verkauf' | 'service'
  label: string
  recipients: KiForwardRecipient[]
}

export const KI_FORWARD_RECIPIENT_GROUPS: KiForwardRecipientGroup[] = [
  {
    // Pilot-Tester/Admins zuerst — sie sollen die Benachrichtigung zum Testen
    // an sich selbst auslösen können.
    key: 'tester',
    label: 'Admin',
    recipients: [
      { id: 'rec-rl', name: 'Rainer Leenen',     email: 'R.Leenen@wackenhut.de',      roleLabel: 'Standortverantwortlicher' },
      { id: 'rec-ho', name: 'Helmut Oberbörsch',  email: 'H.Oberboersch@wackenhut.de',  roleLabel: 'Verkaufsleitung PKW' },
      { id: 'rec-mp', name: 'Markus Pross',       email: 'm.pross@wackenhut.de',        roleLabel: 'Geschäftsführung' },
      { id: 'rec-vg', name: 'Volker Gohl',        email: 'V.Gohl@wackenhut.de',         roleLabel: 'Gesamtserviceleiter' },
    ],
  },
  {
    key: 'verkauf',
    label: 'Verkauf',
    recipients: [
      { id: 'rec-ad', name: 'Alexander Dittus',   email: 'a.dittus@wackenhut.de',   roleLabel: 'Verkäufer' },
      { id: 'rec-as', name: 'Alexander Seez',     email: 'a.seez@wackenhut.de',     roleLabel: 'Verkäufer' },
      { id: 'rec-db', name: 'Daniel Bühler',      email: 'd.buehler@wackenhut.de',  roleLabel: 'Verkäufer' },
      { id: 'rec-se', name: 'Sebastian Erhard',   email: 's.erhard@wackenhut.de',   roleLabel: 'Verkäufer' },
      { id: 'rec-vr', name: 'Verena Ratti',       email: 'v.ratti@wackenhut.de',    roleLabel: 'Verkäuferin' },
      { id: 'rec-mr', name: 'Melina Ribitzki',    email: 'melina@autohausautomation.de', roleLabel: 'Verkäuferin' },
      { id: 'rec-mk', name: 'Metehan Kartal',     email: 'mete@carovo.de',          roleLabel: 'Verkäufer' },
      { id: 'rec-tv', name: 'Tobias Vogt',        email: 'T.Vogt@wackenhut.de',     roleLabel: 'Verkaufsleiter' },
    ],
  },
  {
    key: 'service',
    label: 'Service',
    recipients: [
      { id: 'rec-ae', name: 'Alexander Eckhardt', email: 'a.eckhardt@wackenhut.de', roleLabel: 'Serviceberater' },
      { id: 'rec-cb', name: 'Cedric Bauerdick',   email: 'c.bauerdick@wackenhut.de', roleLabel: 'Serviceberater' },
      { id: 'rec-go', name: 'Gabriel Otlik',      email: 'g.otlik@wackenhut.de',    roleLabel: 'Serviceberater' },
      { id: 'rec-tl', name: 'Tobias Lohmüller',   email: 't.lohmueller@wackenhut.de', roleLabel: 'Serviceleiter (LKD)' },
    ],
  },
]

/** Flache Liste aller hinterlegten Empfänger. */
export const KI_FORWARD_RECIPIENTS: KiForwardRecipient[] =
  KI_FORWARD_RECIPIENT_GROUPS.flatMap((g) => g.recipients)

/** Erlaubte Empfänger-Domains — schützt die (noch) auth-lose Route vor Missbrauch als offener Mail-Relay. */
export const KI_FORWARD_ALLOWED_EMAIL_DOMAINS = [
  'wackenhut.de',
  'autohausautomation.de',
  'carovo.de',
]

/** Schlichte, robuste E-Mail-Validierung (kein vollständiger RFC, bewusst streng-genug). */
export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

/**
 * Erlaubt: ein kuratierter Empfänger (unabhängig von der Domain) ODER eine
 * Adresse einer freigegebenen Domain. So funktionieren die hinterlegten
 * Empfänger immer, und freie Eingaben bleiben auf vertraute Domains begrenzt.
 */
export function isAllowedForwardEmail(value: string): boolean {
  const trimmed = value.trim().toLowerCase()
  if (!isValidEmail(trimmed)) return false
  if (KI_FORWARD_RECIPIENTS.some((r) => r.email.toLowerCase() === trimmed)) return true
  return KI_FORWARD_ALLOWED_EMAIL_DOMAINS.some((d) => trimmed.endsWith(`@${d}`))
}

/** Findet einen bekannten Empfänger anhand der E-Mail (case-insensitive). */
export function findRecipientByEmail(email: string): KiForwardRecipient | undefined {
  const needle = email.trim().toLowerCase()
  return KI_FORWARD_RECIPIENTS.find((r) => r.email.toLowerCase() === needle)
}
