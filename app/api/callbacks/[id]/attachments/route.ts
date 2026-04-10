import { NextRequest, NextResponse } from 'next/server'
import {
  CALLBACK_PERSISTENCE_UNAVAILABLE_MESSAGE,
  isCallbackPersistenceConfigured,
} from '@/lib/server/callback-persistence-config'
import {
  CALLBACK_ATTACHMENT_ALLOWED_MIME,
  CALLBACK_ATTACHMENT_MAX_BYTES,
} from '@/lib/server/callback-attachments'
import type { CallbackAttachmentStage, CallbackAttachmentUploaderRole } from '@/lib/types'

const ALLOWED_STAGES: CallbackAttachmentStage[] = ['creation', 'completion']
const ALLOWED_ROLES: CallbackAttachmentUploaderRole[] = ['callcenter', 'admin', 'advisor']

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
    const { listAttachmentsForCallback } = await import('@/lib/server/callback-attachments')
    const attachments = await listAttachmentsForCallback(id)
    return NextResponse.json({ attachments })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Anhänge konnten nicht geladen werden.' },
      { status: 500 },
    )
  }
}

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
    const { getPersistedCallbackById } = await import('@/lib/server/callback-records')
    const callback = await getPersistedCallbackById(id)
    if (!callback) {
      return NextResponse.json(
        { error: 'Rückruf nicht gefunden.' },
        { status: 404 },
      )
    }

    const formData = await req.formData()
    const file = formData.get('file')
    const stageRaw = String(formData.get('stage') ?? 'creation')
    const uploadedByName = String(formData.get('uploadedByName') ?? '').trim()
    const uploadedByRoleRaw = String(formData.get('uploadedByRole') ?? 'callcenter')

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: 'Keine Datei erhalten.' },
        { status: 400 },
      )
    }

    if (!ALLOWED_STAGES.includes(stageRaw as CallbackAttachmentStage)) {
      return NextResponse.json(
        { error: 'Ungültige Phase (stage).' },
        { status: 400 },
      )
    }

    if (!ALLOWED_ROLES.includes(uploadedByRoleRaw as CallbackAttachmentUploaderRole)) {
      return NextResponse.json(
        { error: 'Ungültige Uploader-Rolle.' },
        { status: 400 },
      )
    }

    if (!uploadedByName) {
      return NextResponse.json(
        { error: 'uploadedByName fehlt.' },
        { status: 400 },
      )
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

    const buffer = Buffer.from(await file.arrayBuffer())
    const { saveAttachment } = await import('@/lib/server/callback-attachments')
    const attachment = await saveAttachment({
      callbackId: id,
      fileName: file.name,
      mimeType: file.type,
      stage: stageRaw as CallbackAttachmentStage,
      uploadedByName,
      uploadedByRole: uploadedByRoleRaw as CallbackAttachmentUploaderRole,
      buffer,
    })

    return NextResponse.json({ attachment }, { status: 201 })
  } catch (error) {
    console.error(error)
    const message = error instanceof Error ? error.message : 'Anhang konnte nicht gespeichert werden.'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
