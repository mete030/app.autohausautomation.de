'use client'

import { useEffect } from 'react'
import { useCallbackStore } from '@/lib/stores/callback-store'

// Ticks frequently enough that a 30-second escalation rule fires close to its
// threshold. Only persisted (database) callbacks are evaluated, and an e-mail
// is only sent for active rules that have a configured recipient.
const ESCALATION_TICK_MS = 10_000

export function CallcenterAutoEscalationProvider() {
  const processEscalations = useCallbackStore((s) => s.processEscalations)

  useEffect(() => {
    let running = false
    const tick = () => {
      if (running) return
      running = true
      void processEscalations().finally(() => {
        running = false
      })
    }

    const interval = setInterval(tick, ESCALATION_TICK_MS)
    tick()

    return () => clearInterval(interval)
  }, [processEscalations])

  return null
}
