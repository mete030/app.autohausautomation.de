import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  CALLBACK_PERSISTENCE_UNAVAILABLE_MESSAGE,
  isCallbackPersistenceConfigured,
} from '@/lib/server/callback-persistence-config'

const requestSchema = z.object({
  token: z.string().min(1),
  completionNotes: z.string().optional(),
})

function getRequestIp(req: NextRequest) {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? req.headers.get('x-real-ip')
    ?? undefined
}

export async function POST(req: NextRequest) {
  if (!isCallbackPersistenceConfigured()) {
    return NextResponse.json(
      { error: CALLBACK_PERSISTENCE_UNAVAILABLE_MESSAGE },
      { status: 503 },
    )
  }

  try {
    const payload = requestSchema.parse(await req.json())
    const { completeCallbackFromEmailAction } = await import('@/lib/server/callback-records')
    const result = await completeCallbackFromEmailAction({
      token: payload.token,
      completionNotes: payload.completionNotes,
      usedByIp: getRequestIp(req),
    })

    if (!result.ok) {
      const errorByReason: Record<typeof result.reason, { status: number; error: string }> = {
        invalid: { status: 404, error: 'Dieser Link ist nicht gültig.' },
        used: { status: 409, error: 'Dieser Link wurde bereits verwendet.' },
        expired: { status: 410, error: 'Dieser Link ist abgelaufen.' },
        already_completed: { status: 409, error: 'Dieser Rückruf ist bereits erledigt.' },
      }

      const config = errorByReason[result.reason]
      return NextResponse.json({ error: config.error }, { status: config.status })
    }

    return NextResponse.json({
      ok: true,
      callback: result.callback,
      activity: result.activity,
    })
  } catch (error) {
    console.error(error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ungültige Abschlussdaten.' },
        { status: 400 },
      )
    }

    return NextResponse.json(
      { error: 'Rückruf konnte nicht per E-Mail-CTA abgeschlossen werden.' },
      { status: 500 },
    )
  }
}
