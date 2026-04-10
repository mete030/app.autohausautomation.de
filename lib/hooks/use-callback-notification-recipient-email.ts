'use client'

import { useEffect, useMemo, useState } from 'react'
import { CALLBACK_NOTIFICATION_EMAIL_UNAVAILABLE_MESSAGE } from '@/lib/email/callback-email-config'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface CallbackNotificationEmailAvailabilityResponse {
  available?: boolean
  defaultRecipientEmail?: string
  recipientEmail?: string
  recipientName?: string
}

function normalizeRecipientEmail(value: string) {
  return value.trim()
}

export function isValidCallbackNotificationRecipientEmail(value: string) {
  return EMAIL_PATTERN.test(normalizeRecipientEmail(value))
}

export interface UseCallbackNotificationRecipientEmailOptions {
  /**
   * Whether the hook should perform work (fetch availability, manage state).
   */
  enabled: boolean
  /**
   * The preferred default recipient email — typically the assigned advisor's
   * email. When supplied, it takes precedence over the server fallback.
   */
  advisorDefaultEmail?: string | null
  /**
   * The advisor's name (used as the recipient name in the mail header if
   * nothing else is available).
   */
  advisorName?: string | null
}

export function useCallbackNotificationRecipientEmail({
  enabled,
  advisorDefaultEmail,
  advisorName,
}: UseCallbackNotificationRecipientEmailOptions) {
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const [serverDefaultEmail, setServerDefaultEmail] = useState('')
  const [serverRecipientName, setServerRecipientName] = useState('')
  // `null` means "user has not edited the field" → render the default; once
  // they type something it becomes a string (possibly empty).
  const [draftOverride, setDraftOverride] = useState<string | null>(null)

  const normalizedAdvisorDefault = normalizeRecipientEmail(advisorDefaultEmail ?? '')

  useEffect(() => {
    if (!enabled) return

    let cancelled = false

    const loadAvailability = async () => {
      try {
        const response = await fetch('/api/email/send-callback-notification', {
          method: 'GET',
          cache: 'no-store',
        })

        const data = (await response.json()) as CallbackNotificationEmailAvailabilityResponse

        if (cancelled) return

        setIsAvailable(Boolean(response.ok && data.available))
        setServerDefaultEmail(
          normalizeRecipientEmail(data.defaultRecipientEmail ?? data.recipientEmail ?? ''),
        )
        setServerRecipientName(data.recipientName ?? '')
      } catch {
        if (!cancelled) {
          setIsAvailable(false)
          setServerDefaultEmail('')
          setServerRecipientName('')
        }
      }
    }

    void loadAvailability()

    return () => {
      cancelled = true
    }
  }, [enabled])

  // The effective default is the advisor's email (if any), otherwise the
  // server-configured fallback.
  const defaultRecipientEmail = normalizedAdvisorDefault || serverDefaultEmail

  // Until the user edits the field, the draft mirrors the default.
  const draftRecipientEmail = draftOverride ?? defaultRecipientEmail
  const setDraftRecipientEmail = (value: string) => setDraftOverride(value)

  const normalizedDraftRecipientEmail = normalizeRecipientEmail(draftRecipientEmail)

  const isDraftRecipientEmailValid = useMemo(
    () =>
      normalizedDraftRecipientEmail.length > 0 &&
      isValidCallbackNotificationRecipientEmail(normalizedDraftRecipientEmail),
    [normalizedDraftRecipientEmail],
  )

  const hasUnsavedRecipientEmailChanges = useMemo(() => {
    if (!enabled) return false
    return (
      normalizedDraftRecipientEmail.toLowerCase() !== defaultRecipientEmail.toLowerCase()
    )
  }, [defaultRecipientEmail, enabled, normalizedDraftRecipientEmail])

  const recipientName = advisorName?.trim() || serverRecipientName || ''

  return {
    isAvailable: enabled ? isAvailable : null,
    isLoading: enabled && isAvailable === null,
    recipientName,
    defaultRecipientEmail: enabled ? defaultRecipientEmail : '',
    draftRecipientEmail: enabled ? draftRecipientEmail : '',
    normalizedDraftRecipientEmail,
    hasUnsavedRecipientEmailChanges,
    isDraftRecipientEmailValid,
    setDraftRecipientEmail,
    unavailableMessage:
      enabled && isAvailable === false
        ? CALLBACK_NOTIFICATION_EMAIL_UNAVAILABLE_MESSAGE
        : '',
  }
}
