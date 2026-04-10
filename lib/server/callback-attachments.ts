import 'server-only'

import { mkdir, readFile, unlink, writeFile } from 'fs/promises'
import path from 'path'
import { randomBytes } from 'crypto'
import { getPrismaClient } from '@/lib/db/prisma'
import type {
  CallbackAttachment,
  CallbackAttachmentStage,
  CallbackAttachmentUploaderRole,
} from '@/lib/types'

export const CALLBACK_ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024 // 10 MB
export const CALLBACK_ATTACHMENT_MAX_PER_STAGE = 5

export const CALLBACK_ATTACHMENT_ALLOWED_MIME: readonly string[] = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
] as const

const STORAGE_ROOT = path.join(process.cwd(), 'storage', 'callback-attachments')

function sanitizeFileName(name: string): string {
  const base = name.replace(/[\\/]/g, '').trim() || 'datei'
  return base.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 180)
}

function buildRelativePath(callbackId: string, fileName: string): string {
  const token = randomBytes(8).toString('hex')
  const safeName = sanitizeFileName(fileName)
  return path.posix.join(callbackId, `${token}__${safeName}`)
}

function resolveAbsolutePath(relativePath: string): string {
  const normalized = path.normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, '')
  const absolute = path.join(STORAGE_ROOT, normalized)
  if (!absolute.startsWith(STORAGE_ROOT)) {
    throw new Error('Ungültiger Dateipfad')
  }
  return absolute
}

export interface SaveAttachmentInput {
  callbackId: string
  fileName: string
  mimeType: string
  stage: CallbackAttachmentStage
  uploadedByName: string
  uploadedByRole: CallbackAttachmentUploaderRole
  buffer: Buffer
}

export async function countAttachmentsForStage(callbackId: string, stage: CallbackAttachmentStage) {
  const prisma = getPrismaClient()
  return prisma.callbackAttachmentRecord.count({
    where: { callbackId, stage },
  })
}

export async function saveAttachment(input: SaveAttachmentInput): Promise<CallbackAttachment> {
  if (!CALLBACK_ATTACHMENT_ALLOWED_MIME.includes(input.mimeType)) {
    throw new Error(`Dateityp ${input.mimeType} ist nicht erlaubt.`)
  }
  if (input.buffer.byteLength === 0) {
    throw new Error('Leere Datei.')
  }
  if (input.buffer.byteLength > CALLBACK_ATTACHMENT_MAX_BYTES) {
    throw new Error('Datei überschreitet die maximale Größe von 10 MB.')
  }

  const existingCount = await countAttachmentsForStage(input.callbackId, input.stage)
  if (existingCount >= CALLBACK_ATTACHMENT_MAX_PER_STAGE) {
    throw new Error(
      `Maximale Anzahl von ${CALLBACK_ATTACHMENT_MAX_PER_STAGE} Anhängen pro Phase erreicht.`
    )
  }

  const relativePath = buildRelativePath(input.callbackId, input.fileName)
  const absolutePath = resolveAbsolutePath(relativePath)

  await mkdir(path.dirname(absolutePath), { recursive: true })
  await writeFile(absolutePath, input.buffer)

  const prisma = getPrismaClient()
  const record = await prisma.callbackAttachmentRecord.create({
    data: {
      callbackId: input.callbackId,
      fileName: input.fileName,
      mimeType: input.mimeType,
      fileSizeBytes: input.buffer.byteLength,
      storagePath: relativePath,
      stage: input.stage,
      uploadedByName: input.uploadedByName,
      uploadedByRole: input.uploadedByRole,
    },
  })

  await prisma.callbackActivityRecord.create({
    data: {
      callbackId: input.callbackId,
      type: 'notiz_hinzugefuegt',
      description:
        input.stage === 'creation'
          ? `Anhang bei Erstellung hinzugefügt: ${input.fileName}`
          : `Anhang bei Abschluss hochgeladen: ${input.fileName}`,
      performedBy: input.uploadedByName,
      metadata: {
        kind: 'attachment_added',
        fileName: input.fileName,
        mimeType: input.mimeType,
        stage: input.stage,
        attachmentId: record.id,
      } satisfies Record<string, string>,
    },
  })

  return mapAttachmentRecord(record)
}

export async function listAttachmentsForCallback(callbackId: string): Promise<CallbackAttachment[]> {
  const prisma = getPrismaClient()
  const records = await prisma.callbackAttachmentRecord.findMany({
    where: { callbackId },
    orderBy: { createdAt: 'asc' },
  })
  return records.map(mapAttachmentRecord)
}

export async function getAttachmentById(id: string) {
  const prisma = getPrismaClient()
  return prisma.callbackAttachmentRecord.findUnique({ where: { id } })
}

export async function readAttachmentBuffer(storagePath: string): Promise<Buffer> {
  const absolute = resolveAbsolutePath(storagePath)
  return readFile(absolute)
}

export async function deleteAttachment(id: string): Promise<boolean> {
  const prisma = getPrismaClient()
  const existing = await prisma.callbackAttachmentRecord.findUnique({ where: { id } })
  if (!existing) return false

  try {
    const absolute = resolveAbsolutePath(existing.storagePath)
    await unlink(absolute)
  } catch {
    // ignore missing file
  }

  await prisma.callbackAttachmentRecord.delete({ where: { id } })
  return true
}

type AttachmentRecordShape = {
  id: string
  callbackId: string
  fileName: string
  mimeType: string
  fileSizeBytes: number
  stage: string
  uploadedByName: string
  uploadedByRole: string
  createdAt: Date
}

export function mapAttachmentRecord(record: AttachmentRecordShape): CallbackAttachment {
  return {
    id: record.id,
    callbackId: record.callbackId,
    fileName: record.fileName,
    mimeType: record.mimeType,
    fileSizeBytes: record.fileSizeBytes,
    stage: (record.stage as CallbackAttachmentStage) ?? 'creation',
    uploadedByName: record.uploadedByName,
    uploadedByRole: (record.uploadedByRole as CallbackAttachmentUploaderRole) ?? 'callcenter',
    createdAt: record.createdAt.toISOString(),
    downloadUrl: `/api/callback-attachments/${record.id}`,
  }
}

export async function listCreationAttachmentsAsBase64(callbackId: string) {
  const prisma = getPrismaClient()
  const records = await prisma.callbackAttachmentRecord.findMany({
    where: { callbackId, stage: 'creation' },
    orderBy: { createdAt: 'asc' },
  })

  const result: { name: string; content: string }[] = []
  for (const record of records) {
    try {
      const buffer = await readAttachmentBuffer(record.storagePath)
      result.push({
        name: record.fileName,
        content: buffer.toString('base64'),
      })
    } catch {
      // skip unreadable files silently
    }
  }
  return result
}
