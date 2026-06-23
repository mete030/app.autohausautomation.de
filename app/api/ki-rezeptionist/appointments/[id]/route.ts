import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  CALLBACK_PERSISTENCE_UNAVAILABLE_MESSAGE,
  isCallbackPersistenceConfigured,
} from '@/lib/server/callback-persistence-config'
import {
  deleteAppointment,
  getAppointmentById,
  updateAppointment,
} from '@/lib/server/ki-appointments'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const patchSchema = z.object({
  customerName: z.string().min(1).optional(),
  customerPhone: z.string().nullable().optional(),
  service: z.string().min(1).optional(),
  staff: z.string().nullable().optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  priceCents: z.number().int().nonnegative().nullable().optional(),
  notesPublic: z.string().nullable().optional(),
  notesInternal: z.string().nullable().optional(),
  status: z.enum(['geplant', 'bestaetigt', 'abgesagt', 'erledigt']).optional(),
})

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isCallbackPersistenceConfigured()) {
    return NextResponse.json({ error: CALLBACK_PERSISTENCE_UNAVAILABLE_MESSAGE }, { status: 503 })
  }
  const { id } = await params
  const appointment = await getAppointmentById(id)
  if (!appointment) return NextResponse.json({ error: 'Nicht gefunden.' }, { status: 404 })
  return NextResponse.json({ appointment })
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
    const appointment = await updateAppointment(id, parsed.data)
    if (!appointment) return NextResponse.json({ error: 'Nicht gefunden.' }, { status: 404 })
    return NextResponse.json({ appointment })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Aktualisierung fehlgeschlagen.' },
      { status: 400 },
    )
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isCallbackPersistenceConfigured()) {
    return NextResponse.json({ error: CALLBACK_PERSISTENCE_UNAVAILABLE_MESSAGE }, { status: 503 })
  }
  const { id } = await params
  try {
    await deleteAppointment(id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[ki-appointments] delete failed:', error instanceof Error ? error.message : 'unbekannt')
    return NextResponse.json({ error: 'Löschen fehlgeschlagen.' }, { status: 500 })
  }
}
