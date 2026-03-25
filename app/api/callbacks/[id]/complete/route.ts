import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  CALLBACK_PERSISTENCE_UNAVAILABLE_MESSAGE,
  isCallbackPersistenceConfigured,
} from '@/lib/server/callback-persistence-config'

const requestSchema = z.object({
  completionNotes: z.string().optional(),
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
    const { completePersistedCallbackDirect } = await import('@/lib/server/callback-records')
    const callback = await completePersistedCallbackDirect({
      callbackId: id,
      completionNotes: payload.completionNotes,
      performedBy: payload.performedBy,
    })

    if (!callback) {
      return NextResponse.json(
        { error: 'Persistierter Rückruf nicht gefunden.' },
        { status: 404 },
      )
    }

    return NextResponse.json({ callback })
  } catch (error) {
    console.error(error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ungültige Abschlussdaten.' },
        { status: 400 },
      )
    }

    return NextResponse.json(
      { error: 'Persistierter Rückruf konnte nicht abgeschlossen werden.' },
      { status: 500 },
    )
  }
}
