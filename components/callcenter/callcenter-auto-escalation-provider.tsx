'use client'

import { useEffect } from 'react'
import { useCallbackStore } from '@/lib/stores/callback-store'

export function CallcenterAutoEscalationProvider() {
  const checkAutoEscalations = useCallbackStore((s) => s.checkAutoEscalations)

  useEffect(() => {
    const interval = setInterval(() => {
      checkAutoEscalations()
    }, 60_000)

    return () => clearInterval(interval)
  }, [checkAutoEscalations])

  return null
}
