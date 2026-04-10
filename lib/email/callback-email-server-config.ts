import 'server-only'

interface CallbackNotificationEmailServerConfig {
  apiKey: string
  senderEmail: string
  senderName: string
  /** Fallback recipient when neither the assigned advisor nor an override has an email. */
  fallbackRecipientEmail: string
  /** Fallback recipient name matching the fallback email. */
  fallbackRecipientName: string
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

  const fallbackRecipientEmail =
    readTrimmedEnv('CALLBACK_NOTIFICATION_RECIPIENT_EMAIL')
    || readTrimmedEnv('NEXT_PUBLIC_CALLBACK_NOTIFICATION_RECIPIENT_EMAIL')
    || senderEmail

  const fallbackRecipientName =
    readTrimmedEnv('CALLBACK_NOTIFICATION_RECIPIENT_NAME')
    || readTrimmedEnv('NEXT_PUBLIC_CALLBACK_NOTIFICATION_RECIPIENT_NAME')
    || senderName

  const missing: string[] = []

  if (!apiKey) missing.push('BREVO_API_KEY')
  if (!senderEmail) missing.push('BREVO_SENDER_EMAIL')

  return {
    apiKey,
    senderEmail,
    senderName,
    fallbackRecipientEmail,
    fallbackRecipientName,
    missing,
    isConfigured: missing.length === 0,
  }
}
