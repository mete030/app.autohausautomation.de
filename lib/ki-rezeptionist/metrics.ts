// Anruf-Metriken für die Top-Leiste des KI-Dashboards. Reine Funktionen,
// clientseitig auswertbar aus den bereits geladenen Anrufen.

import type { KiReceptionCallDto } from './types'
import { isOutsideOpeningHours } from './opening-hours'

export type MetricsPeriod = 'tag' | 'woche' | 'monat'

export const METRICS_PERIODS: {
  value: MetricsPeriod
  label: string
  sub: string
  days: number
}[] = [
  { value: 'tag', label: 'Tag', sub: 'letzte 24 Std', days: 1 },
  { value: 'woche', label: 'Woche', sub: 'letzte 7 Tage', days: 7 },
  { value: 'monat', label: 'Monat', sub: 'letzte 30 Tage', days: 30 },
]

export interface KiMetrics {
  /** Alle Anrufe im gewählten Zeitraum. */
  allCalls: number
  /** Außerhalb der Öffnungszeiten in den letzten 24 Std (fest). */
  oohLast24h: number
  /** Außerhalb der Öffnungszeiten im gewählten Zeitraum. */
  oohInPeriod: number
  /** Anteil außerhalb der Öffnungszeiten am Zeitraum (0–1). */
  oohSharePeriod: number
}

const DAY_MS = 86_400_000

export function computeKiMetrics(
  calls: KiReceptionCallDto[],
  period: MetricsPeriod,
  nowMs: number,
): KiMetrics {
  const days = METRICS_PERIODS.find((p) => p.value === period)?.days ?? 7
  const periodStart = nowMs - days * DAY_MS
  const last24Start = nowMs - DAY_MS

  let allCalls = 0
  let oohInPeriod = 0
  let oohLast24h = 0

  for (const call of calls) {
    const t = new Date(call.receivedAt).getTime()
    if (Number.isNaN(t) || t > nowMs) continue
    const outside = isOutsideOpeningHours(call.receivedAt)

    if (t >= periodStart) {
      allCalls++
      if (outside) oohInPeriod++
    }
    if (t >= last24Start && outside) oohLast24h++
  }

  return {
    allCalls,
    oohLast24h,
    oohInPeriod,
    oohSharePeriod: allCalls > 0 ? oohInPeriod / allCalls : 0,
  }
}
