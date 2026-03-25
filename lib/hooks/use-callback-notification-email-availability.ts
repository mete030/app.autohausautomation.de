'use client'

import { useEffect, useState } from 'react'
import { CALLBACK_NOTIFICATION_EMAIL_UNAVAILABLE_MESSAGE } from '@/lib/email/callback-email-config'

interface CallbackNotificationEmailAvailabilityResponse {
  available?: boolean
  recipientEmail?: string
  recipientName?: string
}

export function useCallbackNotificationEmailAvailability(enabled: boolean) {
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const [recipientEmail, setRecipientEmail] = useState('')
  const [recipientName, setRecipientName] = useState('')

  useEffect(() => {
    if (!enabled) {
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
        setRecipientEmail(data.recipientEmail ?? '')
        setRecipientName(data.recipientName ?? '')
      } catch {
        if (!cancelled) {
          setIsAvailable(false)
          setRecipientEmail('')
          setRecipientName('')
        }
      }
    }

    void loadAvailability()

    return () => {
      cancelled = true
    }
  }, [enabled])

  return {
    isAvailable: enabled ? isAvailable : null,
    isLoading: enabled && isAvailable === null,
    recipientEmail: enabled ? recipientEmail : '',
    recipientName: enabled ? recipientName : '',
    unavailableMessage: enabled && isAvailable === false
      ? CALLBACK_NOTIFICATION_EMAIL_UNAVAILABLE_MESSAGE
      : '',
  }
}
