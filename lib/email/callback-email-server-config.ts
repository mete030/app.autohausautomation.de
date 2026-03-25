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

export function getCallbackNotificationEmailServerConfig(): CallbackNotificationEmailServerConfig {
  const apiKey = process.env.BREVO_API_KEY?.trim() ?? ''
  const senderEmail = process.env.BREVO_SENDER_EMAIL?.trim() ?? ''
  const senderName = process.env.BREVO_SENDER_NAME?.trim() || 'Wackenhut Callcenter'
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
    recipientEmail: CALLBACK_NOTIFICATION_RECIPIENT_EMAIL,
    recipientName: CALLBACK_NOTIFICATION_RECIPIENT_NAME,
    missing,
    isConfigured: missing.length === 0,
  }
}
