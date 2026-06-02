import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { CALLBACK_NOTIFICATION_EMAIL_UNAVAILABLE_MESSAGE } from '@/lib/email/callback-email-config'
import { getCallbackNotificationEmailServerConfig } from '@/lib/email/callback-email-server-config'
import { renderEscalationNotificationEmail } from '@/lib/email/render-escalation-notification-email'
import { resolveAppBaseUrl } from '@/lib/server/app-base-url'
import {
  CALLBACK_PERSISTENCE_UNAVAILABLE_MESSAGE,
  isCallbackPersistenceConfigured,
} from '@/lib/server/callback-persistence-config'

const escalationLevelLabels: Record<number, string> = {
  1: 'Stufe 1 — Person (Berater/Verkäufer)',
  2: 'Stufe 2 — LKD/Verkaufsleiter',
  3: 'Stufe 3 — Standortverantwortlicher',
}

const requestSchema = z.object({
  ruleId: z.string().min(1),
  ruleName: z.string().min(1),
  fromLevel: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  toLevel: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  triggerSeconds: z.number().int().positive(),
  recipientEmail: z.string().trim().email(),
  recipientName: z.string().trim().min(1),
  performedBy: z.string().min(1),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isCallbackPersistenceConfigured()) {
    return NextResponse.json(
      { error: CALLBACK_PERSISTENCE_UNAVAILABLE_MESSAGE },
      { status: 503 },
    )
  }

  try {
    const { id } = await params
    const payload = requestSchema.parse(await req.json())

    const {
      appendPersistedCallbackActivity,
      createCallbackCompletionAction,
      getPersistedCallbackById,
    } = await import('@/lib/server/callback-records')

    const callback = await getPersistedCallbackById(id)
    if (!callback) {
      return NextResponse.json(
        { error: 'Persistierter Rückruf nicht gefunden.' },
        { status: 404 },
      )
    }

    // Already completed → nothing to escalate.
    if (callback.status === 'erledigt') {
      return NextResponse.json({ ok: true, skipped: true, reason: 'erledigt' })
    }

    // De-dupe across reloads: if an escalation e-mail to this target level was
    // already recorded for this callback, do not send again.
    const alreadyEscalated = callback.activityLog.some(
      (activity) =>
        activity.metadata?.emailKind === 'eskalation' &&
        activity.metadata?.escalationToLevel === String(payload.toLevel),
    )
    if (alreadyEscalated) {
      return NextResponse.json({ ok: true, skipped: true, reason: 'bereits_eskaliert' })
    }

    const emailConfig = getCallbackNotificationEmailServerConfig()
    if (!emailConfig.isConfigured) {
      console.error('Escalation notification email is not fully configured.', {
        missing: emailConfig.missing,
      })
      return NextResponse.json(
        { error: CALLBACK_NOTIFICATION_EMAIL_UNAVAILABLE_MESSAGE },
        { status: 503 },
      )
    }

    const now = Date.now()
    const createdAtMs = new Date(callback.createdAt).getTime()
    const dueAtMs = new Date(callback.dueAt).getTime()
    const elapsedSeconds = Math.max(0, (now - createdAtMs) / 1000)
    const overdueSeconds = Math.max(0, (now - dueAtMs) / 1000)

    // Completion CTA so the recipient can close the callback straight from the mail.
    const { action, token } = await createCallbackCompletionAction({
      callbackId: callback.id,
      recipientEmail: payload.recipientEmail,
      recipientName: payload.recipientName,
    })
    const completionUrl = new URL('/callback-actions/complete', resolveAppBaseUrl(req))
    completionUrl.searchParams.set('token', token)

    const email = renderEscalationNotificationEmail({
      recipientName: payload.recipientName,
      stageLabel: escalationLevelLabels[payload.toLevel] ?? `Stufe ${payload.toLevel}`,
      ruleName: payload.ruleName,
      fromLevel: payload.fromLevel,
      toLevel: payload.toLevel,
      assignedAdvisor: callback.assignedAdvisor,
      takenByName: callback.takenBy.name,
      customerName: callback.customerName,
      customerPhone: callback.customerPhone,
      reason: callback.reason,
      notes: callback.notes || undefined,
      priority: callback.priority,
      createdAt: callback.createdAt,
      dueAt: callback.dueAt,
      slaDurationMinutes: callback.slaDurationMinutes,
      triggerSeconds: payload.triggerSeconds,
      elapsedSeconds,
      overdueSeconds,
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
        to: [{ email: payload.recipientEmail, name: payload.recipientName }],
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
        { error: responseJson?.message ?? `Brevo API Fehler: ${response.status}` },
        { status: 502 },
      )
    }

    const activity = await appendPersistedCallbackActivity({
      callbackId: callback.id,
      type: 'eskaliert',
      description: `Automatisch eskaliert (${payload.ruleName}) → ${
        escalationLevelLabels[payload.toLevel] ?? `Stufe ${payload.toLevel}`
      }: E-Mail an ${payload.recipientName} (${payload.recipientEmail})`,
      performedBy: payload.performedBy,
      metadata: {
        emailKind: 'eskalation',
        escalationFromLevel: String(payload.fromLevel),
        escalationToLevel: String(payload.toLevel),
        ruleId: payload.ruleId,
        ruleName: payload.ruleName,
        recipientEmail: payload.recipientEmail,
        recipientName: payload.recipientName,
        provider: 'brevo',
        actionId: action.id,
        providerMessageId:
          typeof responseJson?.messageId === 'string' ? responseJson.messageId : '',
      },
    })

    return NextResponse.json({
      ok: true,
      recipientEmail: payload.recipientEmail,
      recipientName: payload.recipientName,
      provider: 'brevo',
      providerMessageId:
        typeof responseJson?.messageId === 'string' ? responseJson.messageId : undefined,
      activity,
    })
  } catch (error) {
    console.error(error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ungültige Eskalationsdaten.' },
        { status: 400 },
      )
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Interner Serverfehler' },
      { status: 500 },
    )
  }
}
