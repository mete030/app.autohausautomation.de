import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  CALLBACK_NOTIFICATION_EMAIL_UNAVAILABLE_MESSAGE,
  CALLBACK_NOTIFICATION_RECIPIENT_EMAIL,
  CALLBACK_NOTIFICATION_RECIPIENT_NAME,
  VERENA_SCHWAB_EMPLOYEE_ID,
  VERENA_SCHWAB_NAME,
} from '@/lib/email/callback-email-config'
import { getCallbackNotificationEmailServerConfig } from '@/lib/email/callback-email-server-config'
import { renderCallbackNotificationEmail } from '@/lib/email/render-callback-notification-email'

const callbackPrioritySchema = z.enum(['niedrig', 'mittel', 'hoch', 'dringend'])
const callbackStatusSchema = z.enum(['offen', 'in_bearbeitung', 'erledigt', 'ueberfaellig'])

const requestSchema = z.object({
  assignedEmployeeId: z.string().min(1),
  assignedAdvisor: z.string().min(1),
  sentBy: z.string().min(1),
  callback: z.object({
    id: z.string().min(1),
    customerName: z.string().min(1),
    customerPhone: z.string().min(1),
    reason: z.string().min(1),
    notes: z.string().optional(),
    priority: callbackPrioritySchema,
    status: callbackStatusSchema,
    dueAt: z.string().min(1),
    slaDeadline: z.string().min(1),
    takenByName: z.string().min(1),
  }),
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
  try {
    const payload = requestSchema.parse(await req.json())

    if (
      payload.assignedEmployeeId !== VERENA_SCHWAB_EMPLOYEE_ID
      || payload.assignedAdvisor !== VERENA_SCHWAB_NAME
    ) {
      return NextResponse.json(
        { error: 'Benachrichtigungs-E-Mails können nur für Verena Schwab ausgelöst werden.' },
        { status: 400 },
      )
    }

    const emailConfig = getCallbackNotificationEmailServerConfig()
    const recipientEmail = CALLBACK_NOTIFICATION_RECIPIENT_EMAIL
    const recipientName = CALLBACK_NOTIFICATION_RECIPIENT_NAME

    if (!emailConfig.isConfigured) {
      console.error('Callback notification email is not fully configured.', {
        missing: emailConfig.missing,
      })

      return NextResponse.json(
        { error: CALLBACK_NOTIFICATION_EMAIL_UNAVAILABLE_MESSAGE },
        { status: 503 },
      )
    }

    const email = renderCallbackNotificationEmail({
      recipientName,
      salespersonName: payload.assignedAdvisor,
      customerName: payload.callback.customerName,
      customerPhone: payload.callback.customerPhone,
      reason: payload.callback.reason,
      notes: payload.callback.notes,
      priority: payload.callback.priority,
      status: payload.callback.status,
      dueAt: payload.callback.dueAt,
      slaDeadline: payload.callback.slaDeadline,
      takenByName: payload.callback.takenByName,
      sentBy: payload.sentBy,
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

    return NextResponse.json({
      ok: true,
      recipientEmail,
      recipientName,
      provider: 'brevo',
      providerMessageId: typeof responseJson?.messageId === 'string' ? responseJson.messageId : undefined,
    })
  } catch (error) {
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
