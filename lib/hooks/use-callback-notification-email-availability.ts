'use client'

import { useEffect, useState } from 'react'
import { CALLBACK_NOTIFICATION_EMAIL_UNAVAILABLE_MESSAGE } from '@/lib/email/callback-email-config'

interface CallbackNotificationEmailAvailabilityResponse {
  available?: boolean
}

export function useCallbackNotificationEmailAvailability(enabled: boolean) {
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)

  useEffect(() => {
    if (!enabled || isAvailable !== null) {
      return
    }

    let cancelled = false

    const loadAvailability = async () => {
      try {
        const response = await fetch('/api/email/send-callback-notification', {
          method: 'GET',
          cache: 'no-store',
        })

        const data = await response.json() as CallbackNotificationEmailAvailabilityResponse

        if (cancelled) {
          return
        }

        setIsAvailable(Boolean(response.ok && data.available))
      } catch {
        if (!cancelled) {
          setIsAvailable(false)
        }
      }
    }

    void loadAvailability()

    return () => {
      cancelled = true
    }
  }, [enabled, isAvailable])

  return {
    isAvailable: enabled ? isAvailable : null,
    isLoading: enabled && isAvailable === null,
    unavailableMessage: enabled && isAvailable === false
      ? CALLBACK_NOTIFICATION_EMAIL_UNAVAILABLE_MESSAGE
      : '',
  }
}
