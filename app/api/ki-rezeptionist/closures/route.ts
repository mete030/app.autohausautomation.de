import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  CALLBACK_PERSISTENCE_UNAVAILABLE_MESSAGE,
  isCallbackPersistenceConfigured,
} from '@/lib/server/callback-persistence-config'
import { createClosure, listClosures } from '@/lib/server/ki-closures'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const createSchema = z.object({
  location: z.string().optional(),
  type: z.enum(['betriebsschliessung', 'urlaub', 'wartung', 'feiertag']).optional(),
  name: z.string().min(1),
  allDay: z.boolean().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  reason: z.string().nullable().optional(),
  createdBy: z.string().nullable().optional(),
})

export async function GET(req: NextRequest) {
  if (!isCallbackPersistenceConfigured()) {
    return NextResponse.json(
      { available: false, closures: [], error: CALLBACK_PERSISTENCE_UNAVAILABLE_MESSAGE },
      { status: 503 },
    )
  }
  try {
    const sp = req.nextUrl.searchParams
    const closures = await listClosures({
      from: sp.get('from') ?? undefined,
      to: sp.get('to') ?? undefined,
      location: sp.get('location') ?? undefined,
    })
    return NextResponse.json({ available: true, closures })
  } catch (error) {
    console.error('[ki-closures] list failed:', error instanceof Error ? error.message : 'unbekannt')
    return NextResponse.json(
      { available: false, closures: [], error: CALLBACK_PERSISTENCE_UNAVAILABLE_MESSAGE },
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
    return NextResponse.json({ error: 'Ungültige Daten.' }, { status: 400 })
  }
  try {
    const closure = await createClosure(parsed.data)
    return NextResponse.json({ closure }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Schließzeit konnte nicht erstellt werden.' },
      { status: 400 },
    )
  }
}
