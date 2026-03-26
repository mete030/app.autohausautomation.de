import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  CALLBACK_NOTIFICATION_EMAIL_UNAVAILABLE_MESSAGE,
  VERENA_SCHWAB_EMPLOYEE_ID,
  VERENA_SCHWAB_NAME,
} from '@/lib/email/callback-email-config'
import { getCallbackNotificationEmailServerConfig } from '@/lib/email/callback-email-server-config'
import { renderCallbackNotificationEmail } from '@/lib/email/render-callback-notification-email'
import {
  CALLBACK_PERSISTENCE_UNAVAILABLE_MESSAGE,
  isCallbackPersistenceConfigured,
} from '@/lib/server/callback-persistence-config'

const requestSchema = z.object({
  callbackId: z.string().min(1),
  sentBy: z.string().min(1),
  recipientEmail: z.string().trim().email().optional(),
})

export async function GET() {
  const config = getCallbackNotificationEmailServerConfig()

  return NextResponse.json({
    available: config.isConfigured,
    recipientEmail: config.recipientEmail,
    recipientName: config.recipientName,
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

    if (
      callback.assignedEmployeeId !== VERENA_SCHWAB_EMPLOYEE_ID
      || callback.assignedAdvisor !== VERENA_SCHWAB_NAME
    ) {
      return NextResponse.json(
        { error: 'Benachrichtigungs-E-Mails können nur für Verena Schwab ausgelöst werden.' },
        { status: 400 },
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

    const recipientEmail = payload.recipientEmail || emailConfig.recipientEmail
    const recipientName = emailConfig.recipientName

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
      },
    })

    return NextResponse.json({
      ok: true,
      recipientEmail,
      recipientName,
      provider: 'brevo',
      providerMessageId: typeof responseJson?.messageId === 'string' ? responseJson.messageId : undefined,
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
