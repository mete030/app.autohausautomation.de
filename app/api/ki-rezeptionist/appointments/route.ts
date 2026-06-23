import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  CALLBACK_PERSISTENCE_UNAVAILABLE_MESSAGE,
  isCallbackPersistenceConfigured,
} from '@/lib/server/callback-persistence-config'
import { createAppointment, listAppointments } from '@/lib/server/ki-appointments'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const CATEGORIES = [
  'neuwagen',
  'gebrauchtwagen',
  'probefahrt',
  'finanzierung_leasing',
  'inzahlungnahme',
  'werkstatt_service',
  'beschwerde',
  'sonstiges',
] as const

const createSchema = z.object({
  customerName: z.string().min(1),
  customerPhone: z.string().optional().nullable(),
  category: z.enum(CATEGORIES).optional().nullable(),
  service: z.string().min(1),
  location: z.string().optional(),
  staff: z.string().optional().nullable(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  priceCents: z.number().int().nonnegative().optional().nullable(),
  notesPublic: z.string().optional().nullable(),
  notesInternal: z.string().optional().nullable(),
  sourceCallId: z.string().optional().nullable(),
  createdBy: z.string().optional().nullable(),
})

export async function GET(req: NextRequest) {
  if (!isCallbackPersistenceConfigured()) {
    return NextResponse.json(
      { available: false, appointments: [], error: CALLBACK_PERSISTENCE_UNAVAILABLE_MESSAGE },
      { status: 503 },
    )
  }
  try {
    const sp = req.nextUrl.searchParams
    const appointments = await listAppointments({
      from: sp.get('from') ?? undefined,
      to: sp.get('to') ?? undefined,
      location: sp.get('location') ?? undefined,
    })
    return NextResponse.json({ available: true, appointments })
  } catch (error) {
    console.error('[ki-appointments] list failed:', error instanceof Error ? error.message : 'unbekannt')
    return NextResponse.json(
      { available: false, appointments: [], error: CALLBACK_PERSISTENCE_UNAVAILABLE_MESSAGE },
      { status: 503 },
    )
  }
}

export async function POST(req: NextRequest) {
  if (!isCallbackPersistenceConfigured()) {
    return NextResponse.json({ error: CALLBACK_PERSISTENCE_UNAVAILABLE_MESSAGE }, { status: 503 })
  }
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Ungültiges JSON.' }, { status: 400 })
  }
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ungültige Termindaten.' }, { status: 400 })
  }
  try {
    const appointment = await createAppointment({ ...parsed.data, source: 'manuell' })
    return NextResponse.json({ appointment }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Termin konnte nicht erstellt werden.' },
      { status: 400 },
    )
  }
}
