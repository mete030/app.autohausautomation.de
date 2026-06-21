import { NextRequest, NextResponse } from 'next/server'
import { isCallbackPersistenceConfigured } from '@/lib/server/callback-persistence-config'
import { parseFamulorPayload } from '@/lib/server/famulor-webhook'
import { upsertKiReceptionCallFromWebhook } from '@/lib/server/ki-reception-records'

// Prisma braucht die Node-Runtime (kein Edge).
export const runtime = 'nodejs'
// Webhook-Daten dürfen nicht gecacht werden.
export const dynamic = 'force-dynamic'

/**
 * Famulor → KI-Rezeptionist Webhook.
 *
 * Auth: gemeinsamer Schlüssel als `?key=<SECRET>` (oder Header
 * `x-webhook-secret`), abgeglichen mit FAMULOR_WEBHOOK_SECRET.
 *
 * Verhalten: Der rohe Payload wird IMMER geloggt und (bei Erfolg) als
 * rawPayload gespeichert — so ist der Endpoint selbst-dokumentierend und wir
 * sehen nach dem ersten echten Anruf die exakte Famulor-Struktur.
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
    req.nextUrl.searchParams.get('key') ?? req.headers.get('x-webhook-secret')
  if (providedSecret !== expectedSecret) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Ungültiges JSON.' }, { status: 400 })
  }

  // Roh-Payload immer loggen (in Vercel-Logs sichtbar), auch wenn das Mapping
  // noch nicht perfekt ist.
  console.log('[famulor-webhook] payload:', JSON.stringify(raw))

  if (!isCallbackPersistenceConfigured()) {
    // Kein DB-Zugang: Anfrage trotzdem als empfangen quittieren, damit Famulor
    // nicht endlos retry't. Der Payload steht im Log.
    console.warn('[famulor-webhook] DATABASE_URL fehlt — Payload nur geloggt, nicht gespeichert.')
    return NextResponse.json({ ok: true, persisted: false }, { status: 200 })
  }

  try {
    const parsed = parseFamulorPayload(raw)
    const call = await upsertKiReceptionCallFromWebhook({ ...parsed, rawPayload: raw })
    return NextResponse.json({ ok: true, persisted: true, id: call.id }, { status: 200 })
  } catch (error) {
    console.error('[famulor-webhook] Speichern fehlgeschlagen:', error)
    return NextResponse.json(
      { ok: false, error: 'Verarbeitung fehlgeschlagen.' },
      { status: 500 },
    )
  }
}

export function GET() {
  return NextResponse.json(
    { ok: false, error: 'Diesen Endpoint nur per POST (Famulor-Webhook) aufrufen.' },
    { status: 405 },
  )
}
