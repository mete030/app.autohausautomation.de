import { format } from 'date-fns'
import { de } from 'date-fns/locale'

/** Anrufdauer als „m:ss min" — oder null, wenn keine/0 Dauer. */
export function formatDuration(sec?: number): string | null {
  if (!sec || sec <= 0) return null
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s.toString().padStart(2, '0')} min`
}

/** Exakter Zeitstempel, sekundengenau: „22.06.2026, 20:36:01". */
export function formatExact(iso: string): string {
  return format(new Date(iso), 'dd.MM.yyyy, HH:mm:ss', { locale: de })
}
