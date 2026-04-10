import { NextRequest, NextResponse } from 'next/server'
import {
  CALLBACK_PERSISTENCE_UNAVAILABLE_MESSAGE,
  isCallbackPersistenceConfigured,
} from '@/lib/server/callback-persistence-config'

export async function GET(
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
    const { getAttachmentById, readAttachmentBuffer } = await import(
      '@/lib/server/callback-attachments'
    )
    const record = await getAttachmentById(id)
    if (!record) {
      return NextResponse.json(
        { error: 'Anhang nicht gefunden.' },
        { status: 404 },
      )
    }

    const buffer = await readAttachmentBuffer(record.storagePath)
    const encodedName = encodeURIComponent(record.fileName)
    // Convert to Uint8Array so the BodyInit type matches
    const body = new Uint8Array(buffer)
    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': record.mimeType || 'application/octet-stream',
        'Content-Length': String(buffer.byteLength),
        'Content-Disposition': `inline; filename*=UTF-8''${encodedName}`,
        'Cache-Control': 'private, max-age=300',
      },
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Anhang konnte nicht geladen werden.' },
      { status: 500 },
    )
  }
}

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
    const { deleteAttachment } = await import('@/lib/server/callback-attachments')
    const ok = await deleteAttachment(id)
    if (!ok) {
      return NextResponse.json(
        { error: 'Anhang nicht gefunden.' },
        { status: 404 },
      )
    }
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Anhang konnte nicht gelöscht werden.' },
      { status: 500 },
    )
  }
}
