import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  CALLBACK_PERSISTENCE_UNAVAILABLE_MESSAGE,
  isCallbackPersistenceConfigured,
} from '@/lib/server/callback-persistence-config'
import {
  deleteKiReceptionCall,
  getKiReceptionCallById,
  updateKiReceptionCall,
} from '@/lib/server/ki-reception-records'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const patchSchema = z.object({
  status: z.enum(['offen', 'in_bearbeitung', 'erledigt']).optional(),
  assignedTo: z.string().nullable().optional(),
  completionNotes: z.string().nullable().optional(),
  completedBy: z.string().nullable().optional(),
})

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isCallbackPersistenceConfigured()) {
    return NextResponse.json({ error: CALLBACK_PERSISTENCE_UNAVAILABLE_MESSAGE }, { status: 503 })
  }
  const { id } = await params
  const call = await getKiReceptionCallById(id)
  if (!call) return NextResponse.json({ error: 'Nicht gefunden.' }, { status: 404 })
  return NextResponse.json({ call })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ungültige Daten.' }, { status: 400 })
  }

  try {
    const call = await updateKiReceptionCall(id, parsed.data)
    if (!call) return NextResponse.json({ error: 'Nicht gefunden.' }, { status: 404 })
    return NextResponse.json({ call })
  } catch (error) {
    console.error(
      '[ki-rezeptionist] update failed:',
      error instanceof Error ? error.message : 'unbekannt',
    )
    return NextResponse.json({ error: 'Aktualisierung fehlgeschlagen.' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isCallbackPersistenceConfigured()) {
    return NextResponse.json({ error: CALLBACK_PERSISTENCE_UNAVAILABLE_MESSAGE }, { status: 503 })
  }

  const { id } = await params

  try {
    // `false` = bereits weg → idempotent als Erfolg quittieren.
    await deleteKiReceptionCall(id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error(
      '[ki-rezeptionist] delete failed:',
      error instanceof Error ? error.message : 'unbekannt',
    )
    return NextResponse.json({ error: 'Löschen fehlgeschlagen.' }, { status: 500 })
  }
}
