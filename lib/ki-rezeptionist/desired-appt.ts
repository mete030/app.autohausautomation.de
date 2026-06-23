// Best-effort-Parser für Famulors Freitext-`desiredAppt` (z. B. „Montag 17:30 Uhr",
// „morgen 9 Uhr", „Freitag 14:00"). Liefert einen tentativen Termin-Vorschlag.
// Bewusst konservativ: nur klare Treffer, sonst null. Ergebnisse sind als
// UNBESTÄTIGT zu kennzeichnen (KI-Hinweis, keine Buchung).

const WEEKDAYS: Record<string, number> = {
  sonntag: 0,
  montag: 1,
  dienstag: 2,
  mittwoch: 3,
  donnerstag: 4,
  freitag: 5,
  samstag: 6,
  sonnabend: 6,
}

export interface ParsedDesiredAppt {
  /** Vorgeschlagener Start (lokale Zeit). */
  start: Date
  /** Hatte der Text eine konkrete Uhrzeit? (sonst Default 10:00) */
  hadTime: boolean
}

/** Parst einen Freitext-Wunschtermin relativ zu `now` (Default: jetzt). */
export function parseDesiredAppt(text: string | null | undefined, now: Date = new Date()): ParsedDesiredAppt | null {
  if (!text) return null
  const t = text.toLowerCase()

  // --- Uhrzeit ---
  let hour: number | null = null
  let minute = 0
  let hadTime = false
  const hm = t.match(/(\d{1,2})[:.](\d{2})/)
  if (hm) {
    hour = Number(hm[1])
    minute = Number(hm[2])
    hadTime = true
  } else {
    const hOnly = t.match(/(?:um\s*)?(\d{1,2})\s*uhr/)
    if (hOnly) {
      hour = Number(hOnly[1])
      hadTime = true
    }
  }
  if (hour !== null && (hour < 0 || hour > 23 || minute > 59)) return null

  // --- Tag ---
  const base = new Date(now)
  base.setSeconds(0, 0)
  let target: Date | null = null

  if (/\bübermorgen\b/.test(t)) {
    target = addDays(base, 2)
  } else if (/\bmorgen\b/.test(t)) {
    target = addDays(base, 1)
  } else if (/\bheute\b/.test(t)) {
    target = new Date(base)
  } else {
    for (const [name, wd] of Object.entries(WEEKDAYS)) {
      if (t.includes(name)) {
        target = nextWeekday(base, wd)
        break
      }
    }
  }

  // Nur Uhrzeit, kein Tag → heute (oder morgen, falls schon vorbei)
  if (!target && hadTime && hour !== null) {
    const todayAt = atTime(base, hour, minute)
    target = todayAt.getTime() > now.getTime() ? todayAt : addDays(todayAt, 1)
    return { start: target, hadTime }
  }

  if (!target) return null

  const start = atTime(target, hour ?? 10, hour !== null ? minute : 0)
  return { start, hadTime }
}

function addDays(d: Date, days: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + days)
  return r
}

function atTime(d: Date, hour: number, minute: number): Date {
  const r = new Date(d)
  r.setHours(hour, minute, 0, 0)
  return r
}

/** Nächstes Datum (≥ heute) mit dem gegebenen Wochentag. */
function nextWeekday(from: Date, weekday: number): Date {
  const r = new Date(from)
  const diff = (weekday - r.getDay() + 7) % 7
  r.setDate(r.getDate() + diff)
  return r
}
