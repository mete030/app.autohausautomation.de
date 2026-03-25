import { NextRequest, NextResponse } from 'next/server'
import {
  CALLBACK_PERSISTENCE_UNAVAILABLE_MESSAGE,
  isCallbackPersistenceConfigured,
} from '@/lib/server/callback-persistence-config'

export async function DELETE(
  _req: NextRequest,
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
    const { deletePersistedCallback } = await import('@/lib/server/callback-records')
    const deleted = await deletePersistedCallback(id)

    if (!deleted) {
      return NextResponse.json(
        { error: 'Persistierter Rückruf nicht gefunden.' },
        { status: 404 },
      )
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      { error: 'Persistierter Rückruf konnte nicht gelöscht werden.' },
      { status: 500 },
    )
  }
}
