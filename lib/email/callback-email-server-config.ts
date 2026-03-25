import 'server-only'

import {
  CALLBACK_NOTIFICATION_RECIPIENT_EMAIL,
  CALLBACK_NOTIFICATION_RECIPIENT_NAME,
} from '@/lib/email/callback-email-config'

interface CallbackNotificationEmailServerConfig {
  apiKey: string
  senderEmail: string
  senderName: string
  recipientEmail: string
  recipientName: string
  missing: string[]
  isConfigured: boolean
}

function readTrimmedEnv(key: string): string {
  return process.env[key]?.trim() ?? ''
}

export function getCallbackNotificationEmailServerConfig(): CallbackNotificationEmailServerConfig {
  const apiKey = readTrimmedEnv('BREVO_API_KEY')
  const senderEmail = readTrimmedEnv('BREVO_SENDER_EMAIL')
  const senderName = readTrimmedEnv('BREVO_SENDER_NAME') || 'Wackenhut Callcenter'
  const recipientEmail =
    readTrimmedEnv('CALLBACK_NOTIFICATION_RECIPIENT_EMAIL')
    || readTrimmedEnv('NEXT_PUBLIC_CALLBACK_NOTIFICATION_RECIPIENT_EMAIL')
    || senderEmail
    || CALLBACK_NOTIFICATION_RECIPIENT_EMAIL
  const recipientName =
    readTrimmedEnv('CALLBACK_NOTIFICATION_RECIPIENT_NAME')
    || readTrimmedEnv('NEXT_PUBLIC_CALLBACK_NOTIFICATION_RECIPIENT_NAME')
    || senderName
    || CALLBACK_NOTIFICATION_RECIPIENT_NAME
  const missing: string[] = []

  if (!apiKey) {
    missing.push('BREVO_API_KEY')
  }

  if (!senderEmail) {
    missing.push('BREVO_SENDER_EMAIL')
  }

  return {
    apiKey,
    senderEmail,
    senderName,
    recipientEmail,
    recipientName,
    missing,
    isConfigured: missing.length === 0,
  }
}
