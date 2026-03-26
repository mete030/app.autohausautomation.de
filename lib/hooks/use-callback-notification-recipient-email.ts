'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  CALLBACK_NOTIFICATION_EMAIL_UNAVAILABLE_MESSAGE,
  CALLBACK_NOTIFICATION_RECIPIENT_EMAIL,
  CALLBACK_NOTIFICATION_RECIPIENT_EMAIL_STORAGE_KEY,
  CALLBACK_NOTIFICATION_RECIPIENT_NAME,
} from '@/lib/email/callback-email-config'

const CALLBACK_NOTIFICATION_RECIPIENT_EMAIL_STORAGE_EVENT =
  'callback-notification-recipient-email-updated'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface CallbackNotificationEmailAvailabilityResponse {
  available?: boolean
  recipientEmail?: string
  recipientName?: string
}

interface SaveRecipientEmailResult {
  ok: boolean
  error?: string
  recipientEmail?: string
}

function normalizeRecipientEmail(value: string) {
  return value.trim()
}

function readStoredRecipientEmail() {
  if (typeof window === 'undefined') {
    return ''
  }

  return normalizeRecipientEmail(
    window.localStorage.getItem(CALLBACK_NOTIFICATION_RECIPIENT_EMAIL_STORAGE_KEY) ?? '',
  )
}

export function isValidCallbackNotificationRecipientEmail(value: string) {
  return EMAIL_PATTERN.test(normalizeRecipientEmail(value))
}

export function useCallbackNotificationRecipientEmail(enabled: boolean) {
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const [serverRecipientEmail, setServerRecipientEmail] = useState('')
  const [serverRecipientName, setServerRecipientName] = useState('')
  const [storedRecipientEmail, setStoredRecipientEmail] = useState('')
  const [draftRecipientEmail, setDraftRecipientEmail] = useState('')
  const lastSyncedRecipientEmailRef = useRef('')

  useEffect(() => {
    if (!enabled) {
      return
    }

    const syncStoredRecipientEmail = () => {
      setStoredRecipientEmail(readStoredRecipientEmail())
    }

    syncStoredRecipientEmail()

    const handleStorage = (event: StorageEvent) => {
      if (
        event.key
        && event.key !== CALLBACK_NOTIFICATION_RECIPIENT_EMAIL_STORAGE_KEY
      ) {
        return
      }

      syncStoredRecipientEmail()
    }

    const handleLocalUpdate = () => {
      syncStoredRecipientEmail()
    }

    window.addEventListener('storage', handleStorage)
    window.addEventListener(
      CALLBACK_NOTIFICATION_RECIPIENT_EMAIL_STORAGE_EVENT,
      handleLocalUpdate,
    )

    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener(
        CALLBACK_NOTIFICATION_RECIPIENT_EMAIL_STORAGE_EVENT,
        handleLocalUpdate,
      )
    }
  }, [enabled])

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
        setServerRecipientEmail(data.recipientEmail ?? '')
        setServerRecipientName(data.recipientName ?? '')
      } catch {
        if (!cancelled) {
          setIsAvailable(false)
          setServerRecipientEmail('')
          setServerRecipientName('')
        }
      }
    }

    void loadAvailability()

    return () => {
      cancelled = true
    }
  }, [enabled])

  const defaultRecipientEmail =
    serverRecipientEmail || CALLBACK_NOTIFICATION_RECIPIENT_EMAIL
  const recipientName =
    serverRecipientName || CALLBACK_NOTIFICATION_RECIPIENT_NAME
  const activeRecipientEmail = useMemo(() => {
    if (!enabled) {
      return ''
    }

    return storedRecipientEmail || defaultRecipientEmail
  }, [defaultRecipientEmail, enabled, storedRecipientEmail])

  useEffect(() => {
    if (!enabled) {
      return
    }

    setDraftRecipientEmail((current) => {
      if (
        current === ''
        || current === lastSyncedRecipientEmailRef.current
      ) {
        return activeRecipientEmail
      }

      return current
    })

    lastSyncedRecipientEmailRef.current = activeRecipientEmail
  }, [activeRecipientEmail, enabled])

  const normalizedDraftRecipientEmail = normalizeRecipientEmail(draftRecipientEmail)
  const normalizedActiveRecipientEmail = normalizeRecipientEmail(activeRecipientEmail)
  const hasUnsavedRecipientEmailChanges =
    enabled
    && normalizedDraftRecipientEmail !== normalizedActiveRecipientEmail
  const isDraftRecipientEmailValid =
    normalizedDraftRecipientEmail.length > 0
    && isValidCallbackNotificationRecipientEmail(normalizedDraftRecipientEmail)
  const isActiveRecipientEmailValid =
    normalizedActiveRecipientEmail.length > 0
    && isValidCallbackNotificationRecipientEmail(normalizedActiveRecipientEmail)

  const saveRecipientEmail = (): SaveRecipientEmailResult => {
    if (!enabled || typeof window === 'undefined') {
      return {
        ok: false,
        error: 'Empfänger-E-Mail konnte nicht gespeichert werden.',
      }
    }

    if (!isDraftRecipientEmailValid) {
      return {
        ok: false,
        error: 'Bitte eine gültige E-Mail-Adresse eingeben.',
      }
    }

    const nextRecipientEmail = normalizedDraftRecipientEmail

    if (nextRecipientEmail === defaultRecipientEmail) {
      window.localStorage.removeItem(
        CALLBACK_NOTIFICATION_RECIPIENT_EMAIL_STORAGE_KEY,
      )
      setStoredRecipientEmail('')
      lastSyncedRecipientEmailRef.current = defaultRecipientEmail
    } else {
      window.localStorage.setItem(
        CALLBACK_NOTIFICATION_RECIPIENT_EMAIL_STORAGE_KEY,
        nextRecipientEmail,
      )
      setStoredRecipientEmail(nextRecipientEmail)
      lastSyncedRecipientEmailRef.current = nextRecipientEmail
    }

    window.dispatchEvent(
      new Event(CALLBACK_NOTIFICATION_RECIPIENT_EMAIL_STORAGE_EVENT),
    )

    return {
      ok: true,
      recipientEmail:
        nextRecipientEmail === defaultRecipientEmail
          ? defaultRecipientEmail
          : nextRecipientEmail,
    }
  }

  return {
    isAvailable: enabled ? isAvailable : null,
    isLoading: enabled && isAvailable === null,
    recipientName: enabled ? recipientName : '',
    defaultRecipientEmail: enabled ? defaultRecipientEmail : '',
    activeRecipientEmail: enabled ? activeRecipientEmail : '',
    draftRecipientEmail: enabled ? draftRecipientEmail : '',
    hasUnsavedRecipientEmailChanges,
    isDraftRecipientEmailValid,
    isActiveRecipientEmailValid,
    setDraftRecipientEmail,
    saveRecipientEmail,
    unavailableMessage:
      enabled && isAvailable === false
        ? CALLBACK_NOTIFICATION_EMAIL_UNAVAILABLE_MESSAGE
        : '',
  }
}
