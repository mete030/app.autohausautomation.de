import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  CALLBACK_PERSISTENCE_UNAVAILABLE_MESSAGE,
  isCallbackPersistenceConfigured,
} from '@/lib/server/callback-persistence-config'

const callbackPrioritySchema = z.enum(['niedrig', 'mittel', 'hoch', 'dringend'])
const callSourceSchema = z.enum(['telefon', 'website', 'whatsapp', 'ki_agent', 'manuell'])
const takenBySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(['mensch', 'ki']),
})

const createCallbackSchema = z.object({
  customerName: z.string().min(1),
  customerPhone: z.string().min(1),
  reason: z.string().min(1),
  notes: z.string().default(''),
  assignedAdvisor: z.string().min(1),
  assignedEmployeeId: z.string().optional(),
  priority: callbackPrioritySchema,
  source: callSourceSchema,
  takenBy: takenBySchema,
  callTranscript: z.string().optional(),
  slaDurationMinutes: z.number().int().positive(),
})

export async function GET() {
  if (!isCallbackPersistenceConfigured()) {
    return NextResponse.json({
      available: false,
      callbacks: [],
    })
  }

  try {
    const { listPersistedCallbacks } = await import('@/lib/server/callback-records')
    const callbacks = await listPersistedCallbacks()
    return NextResponse.json({
      available: true,
      callbacks,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      {
        available: false,
        callbacks: [],
        error: CALLBACK_PERSISTENCE_UNAVAILABLE_MESSAGE,
      },
    )
  }
}

export async function POST(req: NextRequest) {
  if (!isCallbackPersistenceConfigured()) {
    return NextResponse.json(
      { error: CALLBACK_PERSISTENCE_UNAVAILABLE_MESSAGE },
      { status: 503 },
    )
  }

  try {
    const { createPersistedCallback } = await import('@/lib/server/callback-records')
    const payload = createCallbackSchema.parse(await req.json())
    const callback = await createPersistedCallback(payload)

    return NextResponse.json({ callback }, { status: 201 })
  } catch (error) {
    console.error(error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ungültige Rückrufdaten.' },
        { status: 400 },
      )
    }

    return NextResponse.json(
      { error: 'Rückruf konnte nicht erstellt werden.' },
      { status: 500 },
    )
  }
}
