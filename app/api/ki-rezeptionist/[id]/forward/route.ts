import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  CALLBACK_PERSISTENCE_UNAVAILABLE_MESSAGE,
  isCallbackPersistenceConfigured,
} from '@/lib/server/callback-persistence-config'
import {
  getKiReceptionCallById,
  updateKiReceptionCall,
} from '@/lib/server/ki-reception-records'
import { sendKiForwardEmail } from '@/lib/server/ki-forward-email'
import { kiCategoryConfig, kiMarkeConfig } from '@/lib/ki-rezeptionist/ki-reception-config'
import { formatDuration } from '@/lib/ki-rezeptionist/format'
import { isAllowedForwardEmail } from '@/lib/ki-rezeptionist/forward-recipients'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const forwardSchema = z.object({
  recipientEmail: z.string().trim().email(),
  recipientName: z.string().trim().min(1).max(160),
  message: z.string().trim().max(2_000).optional().nullable(),
  /** Anruf beim Weiterleiten auf „In Bearbeitung" setzen + zuweisen (Default: true). */
  markInProgress: z.boolean().optional(),
  forwardedBy: z.string().trim().max(120).optional().nullable(),
})

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isCallbackPersistenceConfigured()) {
    return NextResponse.json({ error: CALLBACK_PERSISTENCE_UNAVAILABLE_MESSAGE }, { status: 503 })
  }

  const { id } = await params

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Ungültiges JSON.' }, { status: 400 })
  }

  const parsed = forwardSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ungültige Weiterleitungs-Daten.' }, { status: 400 })
  }

  const { recipientEmail, recipientName, message, forwardedBy } = parsed.data
  const markInProgress = parsed.data.markInProgress ?? true

  // Empfänger-Domain hart begrenzen — die Route hat (noch) keine Auth-Schicht
  // und darf nicht als offener Mail-Relay missbraucht werden.
  if (!isAllowedForwardEmail(recipientEmail)) {
    return NextResponse.json(
      { error: 'Diese E-Mail-Domain ist für die Weiterleitung nicht freigegeben.' },
      { status: 400 },
    )
  }

  const call = await getKiReceptionCallById(id)
  if (!call) {
    return NextResponse.json({ error: 'Konversation nicht gefunden.' }, { status: 404 })
  }

  // 1) E-Mail verschicken — schlägt das fehl, ändern wir den Status NICHT.
  try {
    await sendKiForwardEmail({
      recipientEmail,
      recipientName,
      forwardedBy: forwardedBy?.trim() || 'Dashboard',
      customerName: call.customerName,
      customerPhone: call.customerPhone,
      categoryLabel: kiCategoryConfig[call.category].label,
      summary: call.summary,
      markeLabel: call.marke ? kiMarkeConfig[call.marke].label : null,
      vehicle: call.vehicle,
      desiredAppt: call.desiredAppt,
      durationLabel: formatDuration(call.callDurationSec),
      receivedAt: call.receivedAt,
      message,
    })
  } catch (error) {
    console.error(
      '[ki-rezeptionist] forward email failed:',
      error instanceof Error ? error.message : 'unbekannt',
    )
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'E-Mail konnte nicht versendet werden.' },
      { status: 502 },
    )
  }

  // 2) Optional: Status → „In Bearbeitung" + zuweisen (offene Anrufe nur).
  //    Erledigte Anrufe werden durch eine Weiterleitung NICHT wieder geöffnet.
  let updatedCall = call
  if (markInProgress) {
    try {
      const patch =
        call.status === 'offen'
          ? { status: 'in_bearbeitung' as const, assignedTo: recipientName }
          : { assignedTo: recipientName }
      updatedCall = (await updateKiReceptionCall(id, patch)) ?? call
    } catch (error) {
      // E-Mail ist raus — Status-Update ist „best effort", kein harter Fehler.
      console.error(
        '[ki-rezeptionist] forward status update failed:',
        error instanceof Error ? error.message : 'unbekannt',
      )
    }
  }

  return NextResponse.json({ ok: true, recipientEmail, recipientName, call: updatedCall })
}
