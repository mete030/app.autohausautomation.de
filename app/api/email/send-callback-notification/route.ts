import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { CALLBACK_NOTIFICATION_EMAIL_UNAVAILABLE_MESSAGE } from '@/lib/email/callback-email-config'
import { getCallbackNotificationEmailServerConfig } from '@/lib/email/callback-email-server-config'
import { renderCallbackNotificationEmail } from '@/lib/email/render-callback-notification-email'
import {
  CALLBACK_PERSISTENCE_UNAVAILABLE_MESSAGE,
  isCallbackPersistenceConfigured,
} from '@/lib/server/callback-persistence-config'
import { mockEmployees } from '@/lib/constants'
import type { Callback } from '@/lib/types'

/**
 * Fixed recipient for every callback reminder email. All reminders are routed to
 * this single tester address, no matter which advisor the callback is assigned
 * to and regardless of any recipient address provided by the client.
 */
const FIXED_NOTIFICATION_RECIPIENT_EMAIL = 'v.ratti@wackenhut.de'

const requestSchema = z.object({
  callbackId: z.string().min(1),
  sentBy: z.string().min(1),
  recipientEmail: z.string().trim().email().optional(),
  recipientName: z.string().trim().optional(),
})

function resolveRecipient(
  callback: Callback,
  overrideEmail: string | undefined,
  overrideName: string | undefined,
  fallbackEmail: string,
  fallbackName: string,
) {
  const assignedEmployee = callback.assignedEmployeeId
    ? mockEmployees.find((e) => e.id === callback.assignedEmployeeId)
    : undefined

  const recipientEmail =
    overrideEmail?.trim() || assignedEmployee?.email?.trim() || fallbackEmail.trim()

  const recipientName =
    overrideName?.trim() ||
    assignedEmployee?.name?.trim() ||
    callback.assignedAdvisor?.trim() ||
    fallbackName.trim()

  return { recipientEmail, recipientName }
}

export async function GET() {
  const config = getCallbackNotificationEmailServerConfig()

  return NextResponse.json({
    available: config.isConfigured,
    defaultRecipientEmail: config.fallbackRecipientEmail,
    recipientEmail: config.fallbackRecipientEmail,
    recipientName: config.fallbackRecipientName,
  })
}

export async function POST(req: NextRequest) {
  if (!isCallbackPersistenceConfigured()) {
    return NextResponse.json(
      { error: CALLBACK_PERSISTENCE_UNAVAILABLE_MESSAGE },
      { status: 503 },
    )
  }

  try {
    const payload = requestSchema.parse(await req.json())
    const {
      appendPersistedCallbackActivity,
      createCallbackCompletionAction,
      getPersistedCallbackById,
    } = await import('@/lib/server/callback-records')
    const callback = await getPersistedCallbackById(payload.callbackId)

    if (!callback) {
      return NextResponse.json(
        { error: 'Persistierter Rückruf nicht gefunden.' },
        { status: 404 },
      )
    }

    const emailConfig = getCallbackNotificationEmailServerConfig()
    if (!emailConfig.isConfigured) {
      console.error('Callback notification email is not fully configured.', {
        missing: emailConfig.missing,
      })

      return NextResponse.json(
        { error: CALLBACK_NOTIFICATION_EMAIL_UNAVAILABLE_MESSAGE },
        { status: 503 },
      )
    }

    // The recipient name still tracks the assigned advisor (used for the email
    // greeting), but the recipient address is always forced to the fixed tester
    // address — any client-provided override is intentionally ignored.
    const { recipientName } = resolveRecipient(
      callback,
      payload.recipientEmail,
      payload.recipientName,
      emailConfig.fallbackRecipientEmail,
      emailConfig.fallbackRecipientName,
    )
    const recipientEmail = FIXED_NOTIFICATION_RECIPIENT_EMAIL

    if (!recipientEmail) {
      return NextResponse.json(
        { error: 'Keine Empfänger-E-Mail gefunden. Bitte Adresse eintragen.' },
        { status: 400 },
      )
    }

    const { action, token } = await createCallbackCompletionAction({
      callbackId: callback.id,
      recipientEmail,
      recipientName,
    })

    const completionUrl = new URL('/callback-actions/complete', req.nextUrl.origin)
    completionUrl.searchParams.set('token', token)

    const email = renderCallbackNotificationEmail({
      recipientName,
      salespersonName: callback.assignedAdvisor,
      customerName: callback.customerName,
      customerPhone: callback.customerPhone,
      reason: callback.reason,
      notes: callback.notes || undefined,
      priority: callback.priority,
      status: callback.status,
      dueAt: callback.dueAt,
      slaDeadline: callback.slaDeadline,
      takenByName: callback.takenBy.name,
      sentBy: payload.sentBy,
      completionUrl: completionUrl.toString(),
    })

    // Build Brevo attachment list from all creation-stage attachments.
    const { listCreationAttachmentsAsBase64 } = await import(
      '@/lib/server/callback-attachments'
    )
    const brevoAttachments = await listCreationAttachmentsAsBase64(callback.id)

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': emailConfig.apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: emailConfig.senderName,
          email: emailConfig.senderEmail,
        },
        to: [
          {
            email: recipientEmail,
            name: recipientName,
          },
        ],
        subject: email.subject,
        htmlContent: email.html,
        textContent: email.text,
        ...(brevoAttachments.length > 0 ? { attachment: brevoAttachments } : {}),
        headers: {
          'X-Mailin-Track': '0',
          'X-Mailin-Track-Links': '0',
        },
      }),
    })

    const responseText = await response.text()
    let responseJson: Record<string, unknown> | null = null

    if (responseText) {
      try {
        responseJson = JSON.parse(responseText) as Record<string, unknown>
      } catch {
        responseJson = null
      }
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          error: responseJson?.message ?? `Brevo API Fehler: ${response.status}`,
        },
        { status: 502 },
      )
    }

    const activity = await appendPersistedCallbackActivity({
      callbackId: callback.id,
      type: 'email_gesendet',
      description: `Callback-Benachrichtigung gesendet an ${recipientName} (${recipientEmail})`,
      performedBy: payload.sentBy,
      metadata: {
        recipientEmail,
        recipientName,
        provider: 'brevo',
        emailKind: 'callback_benachrichtigung',
        actionId: action.id,
        providerMessageId: typeof responseJson?.messageId === 'string' ? responseJson.messageId : '',
        attachmentCount: String(brevoAttachments.length),
      },
    })

    return NextResponse.json({
      ok: true,
      recipientEmail,
      recipientName,
      provider: 'brevo',
      providerMessageId:
        typeof responseJson?.messageId === 'string' ? responseJson.messageId : undefined,
      activity,
    })
  } catch (error) {
    console.error(error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ungültige Callback-Benachrichtigungsdaten.' },
        { status: 400 },
      )
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Interner Serverfehler' },
      { status: 500 },
    )
  }
}
