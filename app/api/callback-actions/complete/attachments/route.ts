import { NextRequest, NextResponse } from 'next/server'
import {
  CALLBACK_PERSISTENCE_UNAVAILABLE_MESSAGE,
  isCallbackPersistenceConfigured,
} from '@/lib/server/callback-persistence-config'
import {
  CALLBACK_ATTACHMENT_ALLOWED_MIME,
  CALLBACK_ATTACHMENT_MAX_BYTES,
} from '@/lib/server/callback-attachments'

export async function POST(req: NextRequest) {
  if (!isCallbackPersistenceConfigured()) {
    return NextResponse.json(
      { error: CALLBACK_PERSISTENCE_UNAVAILABLE_MESSAGE },
      { status: 503 },
    )
  }

  try {
    const formData = await req.formData()
    const token = String(formData.get('token') ?? '').trim()
    const file = formData.get('file')

    if (!token) {
      return NextResponse.json({ error: 'Token fehlt.' }, { status: 400 })
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Keine Datei erhalten.' }, { status: 400 })
    }

    if (!CALLBACK_ATTACHMENT_ALLOWED_MIME.includes(file.type)) {
      return NextResponse.json(
        { error: `Dateityp ${file.type || 'unbekannt'} ist nicht erlaubt.` },
        { status: 400 },
      )
    }

    if (file.size > CALLBACK_ATTACHMENT_MAX_BYTES) {
      return NextResponse.json(
        { error: 'Datei überschreitet die maximale Größe von 10 MB.' },
        { status: 400 },
      )
    }

    const { resolveActiveCompletionActionForUpload } = await import(
      '@/lib/server/callback-records'
    )
    const resolved = await resolveActiveCompletionActionForUpload(token)
    if (!resolved.ok) {
      const errorByReason = {
        invalid: { status: 404, error: 'Dieser Link ist nicht gültig.' },
        used: { status: 409, error: 'Dieser Link wurde bereits verwendet.' },
        expired: { status: 410, error: 'Dieser Link ist abgelaufen.' },
        already_completed: { status: 409, error: 'Dieser Rückruf ist bereits erledigt.' },
      } as const
      const config = errorByReason[resolved.reason]
      return NextResponse.json({ error: config.error }, { status: config.status })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const { saveAttachment } = await import('@/lib/server/callback-attachments')
    const attachment = await saveAttachment({
      callbackId: resolved.callbackId,
      fileName: file.name,
      mimeType: file.type,
      stage: 'completion',
      uploadedByName: resolved.recipientName || resolved.recipientEmail,
      uploadedByRole: 'advisor',
      buffer,
    })

    return NextResponse.json({ attachment }, { status: 201 })
  } catch (error) {
    console.error(error)
    const message = error instanceof Error ? error.message : 'Anhang konnte nicht gespeichert werden.'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
