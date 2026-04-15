'use client'

import type { CallbackActivity } from '@/lib/types'

const SEEN_CALLBACK_NOTIFICATION_ACTIVITY_IDS_KEY =
  'callcenter:seen-callback-notification-activity-ids'

interface SendCallbackNotificationEmailResponse {
  error?: string
  provider?: string
  providerMessageId?: string
  recipientEmail?: string
  recipientName?: string
  activity?: CallbackActivity
}

export interface SendCallbackNotificationEmailInput {
  callbackId: string
  sentBy: string
  recipientEmail?: string
  recipientName?: string
}

export interface SendCallbackNotificationEmailResult {
  recipientEmail: string
  recipientName: string
  provider: string
  providerMessageId?: string
  activity?: CallbackActivity
}

function isBrowser() {
  return typeof window !== 'undefined'
}

function readSeenActivityIdsFromSessionStorage() {
  if (!isBrowser()) return new Set<string>()

  const raw = window.sessionStorage.getItem(SEEN_CALLBACK_NOTIFICATION_ACTIVITY_IDS_KEY)
  if (!raw) return new Set<string>()

  try {
    const values = JSON.parse(raw) as string[]
    return new Set(values.filter((value) => typeof value === 'string' && value.length > 0))
  } catch {
    return new Set<string>()
  }
}

function writeSeenActivityIdsToSessionStorage(activityIds: Set<string>) {
  if (!isBrowser()) return

  window.sessionStorage.setItem(
    SEEN_CALLBACK_NOTIFICATION_ACTIVITY_IDS_KEY,
    JSON.stringify([...activityIds]),
  )
}

export function getSeenCallbackNotificationActivityIds() {
  return readSeenActivityIdsFromSessionStorage()
}

export function markCallbackNotificationActivitySeen(activityId?: string) {
  if (!activityId) return

  const seenActivityIds = readSeenActivityIdsFromSessionStorage()
  if (seenActivityIds.has(activityId)) return

  seenActivityIds.add(activityId)
  writeSeenActivityIdsToSessionStorage(seenActivityIds)
}

export async function sendCallbackNotificationEmail({
  callbackId,
  sentBy,
  recipientEmail,
  recipientName,
}: SendCallbackNotificationEmailInput): Promise<SendCallbackNotificationEmailResult> {
  const response = await fetch('/api/email/send-callback-notification', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      callbackId,
      sentBy,
      recipientEmail,
      recipientName,
    }),
  })

  const data = await response.json() as SendCallbackNotificationEmailResponse

  if (!response.ok) {
    throw new Error(data.error ?? 'Benachrichtigungs-E-Mail konnte nicht gesendet werden.')
  }

  return {
    recipientEmail: data.recipientEmail ?? recipientEmail ?? '',
    recipientName: data.recipientName ?? recipientName ?? '',
    provider: data.provider ?? 'brevo',
    providerMessageId: data.providerMessageId,
    activity: data.activity,
  }
}
