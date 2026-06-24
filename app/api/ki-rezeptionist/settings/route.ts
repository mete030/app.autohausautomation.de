import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  CALLBACK_PERSISTENCE_UNAVAILABLE_MESSAGE,
  isCallbackPersistenceConfigured,
} from '@/lib/server/callback-persistence-config'
import {
  getKiAutoForwardLeadEnabled,
  setKiAutoForwardLeadEnabled,
} from '@/lib/server/ki-settings'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const putSchema = z.object({
  autoForwardLeadEnabled: z.boolean(),
})

export async function GET() {
  if (!isCallbackPersistenceConfigured()) {
    return NextResponse.json(
      { available: false, autoForwardLeadEnabled: false, error: CALLBACK_PERSISTENCE_UNAVAILABLE_MESSAGE },
      { status: 503 },
    )
  }
  try {
    const autoForwardLeadEnabled = await getKiAutoForwardLeadEnabled()
    return NextResponse.json({ available: true, autoForwardLeadEnabled })
  } catch (error) {
    console.error('[ki-settings] read failed:', error instanceof Error ? error.message : 'unbekannt')
    return NextResponse.json(
      { available: false, autoForwardLeadEnabled: false, error: CALLBACK_PERSISTENCE_UNAVAILABLE_MESSAGE },
      { status: 503 },
    )
  }
}

export async function PUT(req: NextRequest) {
  if (!isCallbackPersistenceConfigured()) {
    return NextResponse.json({ error: CALLBACK_PERSISTENCE_UNAVAILABLE_MESSAGE }, { status: 503 })
  }
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Ungültiges JSON.' }, { status: 400 })
  }
  const parsed = putSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ungültige Daten.' }, { status: 400 })
  }
  try {
    const autoForwardLeadEnabled = await setKiAutoForwardLeadEnabled(parsed.data.autoForwardLeadEnabled)
    return NextResponse.json({ available: true, autoForwardLeadEnabled })
  } catch (error) {
    console.error('[ki-settings] write failed:', error instanceof Error ? error.message : 'unbekannt')
    return NextResponse.json({ error: 'Speichern fehlgeschlagen.' }, { status: 500 })
  }
}
