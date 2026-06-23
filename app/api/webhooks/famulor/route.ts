import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { Prisma } from '@prisma/client'
import { isCallbackPersistenceConfigured } from '@/lib/server/callback-persistence-config'
import { parseFamulorPayload } from '@/lib/server/famulor-webhook'
import { upsertKiReceptionCallFromWebhook } from '@/lib/server/ki-reception-records'

// Prisma braucht die Node-Runtime (kein Edge).
export const runtime = 'nodejs'
// Webhook-Daten dürfen nicht gecacht werden.
export const dynamic = 'force-dynamic'

// Famulor-Payloads sind klein; größere ablehnen (DoS + Datenminimierung).
const MAX_BODY_BYTES = 1_000_000

/** Konstantzeit-Vergleich des Secrets (Art. 32 DSGVO). */
function secretsMatch(provided: string | null, expected: string): boolean {
  if (!provided) return false
  const a = Buffer.from(provided)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

/**
 * Famulor → KI-Rezeptionist Webhook.
 *
 * Auth: gemeinsamer Schlüssel bevorzugt als Header `x-webhook-secret`,
 * ersatzweise als `?key=` (Famulor erlaubt aktuell nur eine URL).
 *
 * WICHTIG (AVV/DSGVO): Es werden NUR Metadaten geloggt — niemals PII.
 * Der vollständige Roh-Payload liegt ausschließlich in der DB-Spalte
 * `rawPayload` (EU, fra1, im AVV-Geltungsbereich).
 */
export async function POST(req: NextRequest) {
  const expectedSecret = process.env.FAMULOR_WEBHOOK_SECRET?.trim()
  if (!expectedSecret) {
    console.error('[famulor-webhook] FAMULOR_WEBHOOK_SECRET ist nicht gesetzt.')
    return NextResponse.json(
      { ok: false, error: 'Webhook-Secret nicht konfiguriert.' },
      { status: 503 },
    )
  }

  const providedSecret =
    req.headers.get('x-webhook-secret') ?? req.nextUrl.searchParams.get('key')
  if (!secretsMatch(providedSecret, expectedSecret)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  // Body-Größe begrenzen — erst per Content-Length, dann hart nach dem Lesen.
  const declaredLength = Number(req.headers.get('content-length') ?? 0)
  if (declaredLength > MAX_BODY_BYTES) {
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
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return NextResponse.json({ ok: false, error: 'Erwartet JSON-Objekt.' }, { status: 400 })
  }

  if (!isCallbackPersistenceConfigured()) {
    // Ohne DB können wir nicht speichern — quittieren (kein PII-Log).
    console.warn('[famulor-webhook] DATABASE_URL fehlt — Anruf NICHT gespeichert.')
    return NextResponse.json({ ok: true, persisted: false }, { status: 200 })
  }

  try {
    const parsed = parseFamulorPayload(raw)
    const call = await upsertKiReceptionCallFromWebhook({ ...parsed, rawPayload: raw })
    // Nur Metadaten — KEINE PII.
    console.log('[famulor-webhook] empfangen', {
      id: call.id,
      externalCallId: parsed.externalCallId,
      category: parsed.category,
      hasTranscript: Boolean(parsed.transcript),
      hasRecording: Boolean(parsed.recordingUrl),
      bytes: rawText.length,
    })
    // Frühwarnung: Anruf ohne Transkript → meist Plattform-Konfiguration
    // (Transkript im Post-Call-Webhook nicht aktiviert) oder unbekanntes Feld.
    if (!parsed.transcript) {
      console.warn('[famulor-webhook] KEIN Transkript im Payload', {
        id: call.id,
        externalCallId: parsed.externalCallId,
      })
    }
    return NextResponse.json({ ok: true, persisted: true, id: call.id }, { status: 200 })
  } catch (error) {
    // Famulor retry't bei 5xx — daher Fehlerarten unterscheiden.
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        // Unique-Konflikt = Anruf bereits erfasst → idempotent OK.
        return NextResponse.json(
          { ok: true, persisted: true, duplicate: true },
          { status: 200 },
        )
      }
      if (error.code === 'P1001' || error.code === 'P1017') {
        console.error('[famulor-webhook] DB nicht erreichbar:', error.code)
        return NextResponse.json(
          { ok: false, error: 'DB nicht erreichbar.' },
          { status: 503 },
        )
      }
    }
    console.error(
      '[famulor-webhook] Speichern fehlgeschlagen:',
      error instanceof Error ? error.message : 'unbekannt',
    )
    return NextResponse.json(
      { ok: false, error: 'Verarbeitung fehlgeschlagen.' },
      { status: 500 },
    )
  }
}

export function GET() {
  return NextResponse.json(
    {
      ok: false,
      error: 'Diesen Endpoint nur per POST (Famulor-Webhook) aufrufen.',
      build: 'v13-wunsch-prefill',
    },
    { status: 405 },
  )
}
