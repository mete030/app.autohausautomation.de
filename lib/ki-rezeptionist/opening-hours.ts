// Öffnungszeiten des Autohaus-Standorts (für die „außerhalb der Öffnungszeiten"-
// Metrik). Vom Kunden bestätigt für Nagold. Zeitzone fest auf Europe/Berlin —
// die Auswertung ist damit unabhängig von der Zeitzone des Betrachters und
// DST-sicher (via Intl.DateTimeFormat).
//
// Minuten ab Mitternacht (07:00 = 420). Wochentag-Index = JS getDay():
// 0 = Sonntag, 1 = Montag … 6 = Samstag.

interface DayHours {
  open: number
  close: number
}

const H = (hour: number) => hour * 60

export const OPENING_HOURS: Record<number, DayHours | null> = {
  0: null, // Sonntag — geschlossen
  1: { open: H(7), close: H(18) }, // Montag
  2: { open: H(7), close: H(18) }, // Dienstag
  3: { open: H(7), close: H(18) }, // Mittwoch
  4: { open: H(7), close: H(18) }, // Donnerstag
  5: { open: H(7), close: H(18) }, // Freitag
  6: { open: H(7), close: H(14) }, // Samstag
}

export const OPENING_HOURS_LABEL = 'Mo–Fr 7–18 Uhr · Sa 7–14 Uhr · So geschlossen'
export const OPENING_HOURS_TZ = 'Europe/Berlin'

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
}

/** Wochentag (0–6) + Minute des Tages in Europe/Berlin aus einem ISO-Zeitstempel. */
function berlinWeekdayAndMinute(iso: string): { weekday: number; minute: number } | null {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: OPENING_HOURS_TZ,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date)

  const weekdayLabel = parts.find((p) => p.type === 'weekday')?.value ?? 'Sun'
  const rawHour = Number(parts.find((p) => p.type === 'hour')?.value ?? '0')
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? '0')
  const hour = rawHour === 24 ? 0 : rawHour // manche Umgebungen liefern '24' für Mitternacht

  return { weekday: WEEKDAY_INDEX[weekdayLabel] ?? 0, minute: hour * 60 + minute }
}

/**
 * War der gegebene Zeitpunkt AUSSERHALB der Öffnungszeiten (geschlossener Tag
 * oder vor Öffnung / ab Schließung)? Bei unparsbarem Datum: false.
 */
export function isOutsideOpeningHours(iso: string): boolean {
  const parsed = berlinWeekdayAndMinute(iso)
  if (!parsed) return false
  const hours = OPENING_HOURS[parsed.weekday]
  if (!hours) return true // geschlossener Tag
  return parsed.minute < hours.open || parsed.minute >= hours.close
}
