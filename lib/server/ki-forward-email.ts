import 'server-only'

import { renderKiForwardEmail, type KiForwardEmailPayload } from '@/lib/ki-rezeptionist/render-forward-email'

// Eigenständiger Brevo-Versand für die KI-Rückruf-Weiterleitung.
//
// Teilt sich mit dem Callcenter NUR die rohen Provider-Zugangsdaten
// (BREVO_API_KEY / BREVO_SENDER_EMAIL) — KEINEN Code, KEINE Empfänger-/
// Activity-Logik. Der Absendername ist bewusst KI-spezifisch, damit die Mails
// nicht als „Wackenhut Callcenter" erscheinen.

interface KiForwardEmailConfig {
  apiKey: string
  senderEmail: string
  senderName: string
  missing: string[]
  isConfigured: boolean
}

function readTrimmedEnv(key: string): string {
  return process.env[key]?.trim() ?? ''
}

export function getKiForwardEmailConfig(): KiForwardEmailConfig {
  const apiKey = readTrimmedEnv('BREVO_API_KEY')
  const senderEmail = readTrimmedEnv('BREVO_SENDER_EMAIL')
  // Eigener Absendername für den KI-Assistenten — fällt nicht auf den
  // Callcenter-Default zurück.
  const senderName =
    readTrimmedEnv('BREVO_KI_SENDER_NAME') || 'Wackenhut KI-Vertriebsassistent'

  const missing: string[] = []
  if (!apiKey) missing.push('BREVO_API_KEY')
  if (!senderEmail) missing.push('BREVO_SENDER_EMAIL')

  return { apiKey, senderEmail, senderName, missing, isConfigured: missing.length === 0 }
}

export interface SendKiForwardEmailResult {
  ok: true
  providerMessageId?: string
}

export interface SendKiBrevoEmailInput {
  recipientEmail: string
  recipientName: string
  subject: string
  html: string
  text: string
}

/**
 * Low-Level-Versand einer fertig gerenderten Mail über die Brevo-REST-API.
 * Wird sowohl von der manuellen Weiterleitung als auch von der automatischen
 * Lead-Weiterleitung genutzt. Wirft bei fehlender Konfiguration/Provider-Fehler.
 */
export async function sendKiBrevoEmail(
  input: SendKiBrevoEmailInput,
): Promise<SendKiForwardEmailResult> {
  const config = getKiForwardEmailConfig()
  if (!config.isConfigured) {
    throw new Error(`E-Mail-Versand nicht konfiguriert (${config.missing.join(', ')}).`)
  }

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'api-key': config.apiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: config.senderName, email: config.senderEmail },
      to: [{ email: input.recipientEmail, name: input.recipientName }],
      subject: input.subject,
      htmlContent: input.html,
      textContent: input.text,
      // Tracking aus — Datenminimierung + weniger Spam-/Blocker-Risiko.
      headers: { 'X-Mailin-Track': '0', 'X-Mailin-Track-Links': '0' },
    }),
  })

  if (!response.ok) {
    // Provider-Antwort nur als Statuscode protokollieren — kein PII/Inhalt.
    let providerHint = ''
    try {
      const data = (await response.json()) as { message?: string; code?: string }
      providerHint = data.code ? ` (${data.code})` : ''
    } catch {
      /* ignore non-JSON */
    }
    throw new Error(`E-Mail-Provider antwortete mit ${response.status}${providerHint}.`)
  }

  let providerMessageId: string | undefined
  try {
    const data = (await response.json()) as { messageId?: string }
    providerMessageId = data.messageId
  } catch {
    /* messageId optional */
  }

  return { ok: true, providerMessageId }
}

export interface SendKiForwardEmailInput extends KiForwardEmailPayload {
  recipientEmail: string
}

/** Rendert + verschickt die manuelle Berater-Weiterleitungs-Mail. */
export async function sendKiForwardEmail(
  input: SendKiForwardEmailInput,
): Promise<SendKiForwardEmailResult> {
  const email = renderKiForwardEmail(input)
  return sendKiBrevoEmail({
    recipientEmail: input.recipientEmail,
    recipientName: input.recipientName,
    subject: email.subject,
    html: email.html,
    text: email.text,
  })
}
