import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { Prisma } from '@prisma/client'
import { isCallbackPersistenceConfigured } from '@/lib/server/callback-persistence-config'
import { upsertAppointmentFromWebhook } from '@/lib/server/ki-appointments'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_BODY_BYTES = 1_000_000

function secretsMatch(provided: string | null, expected: string): boolean {
  if (!provided) return false
  const a = Buffer.from(provided)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

type AnyRecord = Record<string, unknown>
function isRecord(v: unknown): v is AnyRecord {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}
function pick(o: AnyRecord, keys: string[]): string | null {
  for (const k of keys) {
    const v = o[k]
    if (typeof v === 'string' && v.trim()) return v.trim()
    if (typeof v === 'number') return String(v)
  }
  return null
}

/**
 * Anbieter-agnostischer Buchungs-Webhook. Schreibt Termine, die ein
 * Buchungs-Agent (z. B. Reception.ai/Retell/Vapi) erstellt, in dieselbe
 * KiAppointment-Tabelle wie manuelle Termine (`source: ki_gebucht`).
 * Auth via eigenen Secret (getrennt vom Famulor-Webhook). Dormant, solange
 * APPOINTMENTS_WEBHOOK_SECRET nicht gesetzt ist.
 */
export async function POST(req: NextRequest) {
  const expected = process.env.APPOINTMENTS_WEBHOOK_SECRET?.trim()
  if (!expected) {
    return NextResponse.json({ ok: false, error: 'Webhook-Secret nicht konfiguriert.' }, { status: 503 })
  }
  const provided = req.headers.get('x-webhook-secret') ?? req.nextUrl.searchParams.get('key')
  if (!secretsMatch(provided, expected)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  if (Number(req.headers.get('content-length') ?? 0) > MAX_BODY_BYTES) {
    return NextResponse.json({ ok: false, error: 'Payload zu groß.' }, { status: 413 })
  }
  const rawText = await req.text()
  if (Buffer.byteLength(rawText) > MAX_BODY_BYTES) {
    return NextResponse.json({ ok: false, error: 'Payload zu groß.' }, { status: 413 })
  }

  let raw: unknown
  try {
    raw = JSON.parse(rawText)
  } catch {
    return NextResponse.json({ ok: false, error: 'Ungültiges JSON.' }, { status: 400 })
  }
  if (!isRecord(raw)) {
    return NextResponse.json({ ok: false, error: 'Erwartet JSON-Objekt.' }, { status: 400 })
  }

  if (!isCallbackPersistenceConfigured()) {
    return NextResponse.json({ ok: true, persisted: false }, { status: 200 })
  }

  const externalId = pick(raw, ['id', 'external_id', 'externalId', 'booking_id', 'appointment_id', 'uuid'])
  const startTime = pick(raw, ['start', 'start_time', 'startTime', 'starts_at', 'from'])
  const endTime = pick(raw, ['end', 'end_time', 'endTime', 'ends_at', 'to'])
  if (!externalId || !startTime || !endTime) {
    return NextResponse.json(
      { ok: false, error: 'externalId, start und end sind erforderlich.' },
      { status: 400 },
    )
  }

  try {
    const appt = await upsertAppointmentFromWebhook({
      externalId,
      customerName: pick(raw, ['name', 'customer_name', 'customerName', 'kunde']) ?? 'Unbekannt',
      customerPhone: pick(raw, ['phone', 'telefon', 'customer_phone', 'phoneNumber']),
      service: pick(raw, ['service', 'dienst', 'service_name']) ?? 'Termin',
      location: pick(raw, ['location', 'standort']) ?? 'Nagold',
      staff: pick(raw, ['staff', 'mitarbeiter', 'employee']),
      startTime,
      endTime,
      notesPublic: pick(raw, ['notes', 'notizen']),
      source: 'ki_gebucht',
      rawPayload: raw,
    })
    console.log('[appointments-webhook] empfangen', { id: appt.id, externalId })
    return NextResponse.json({ ok: true, persisted: true, id: appt.id }, { status: 200 })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ ok: true, persisted: true, duplicate: true }, { status: 200 })
    }
    console.error('[appointments-webhook] Fehler:', error instanceof Error ? error.message : 'unbekannt')
    return NextResponse.json({ ok: false, error: 'Verarbeitung fehlgeschlagen.' }, { status: 500 })
  }
}

export function GET() {
  return NextResponse.json(
    { ok: false, error: 'Nur POST (Buchungs-Webhook).' },
    { status: 405 },
  )
}
