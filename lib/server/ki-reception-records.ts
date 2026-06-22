import 'server-only'

import { Prisma, type KiReceptionCallRecord } from '@prisma/client'
import { getPrismaClient } from '@/lib/db/prisma'
import type {
  KiReceptionCallDto,
  KiReceptionCategory,
  KiReceptionStatus,
} from '@/lib/ki-rezeptionist/types'

export interface UpsertKiCallInput {
  externalCallId?: string | null
  customerName: string
  customerPhone: string
  category: KiReceptionCategory
  summary: string
  vehicle?: string | null
  desiredAppt?: string | null
  transcript?: string | null
  recordingUrl?: string | null
  callDurationSec?: number | null
  /** Tatsächlicher Anrufzeitpunkt (ISO) — nur beim Anlegen gesetzt. */
  receivedAt?: string | null
  rawPayload?: unknown
}

export interface UpdateKiCallInput {
  status?: KiReceptionStatus
  assignedTo?: string | null
  completionNotes?: string | null
  completedBy?: string | null
}

function mapRecordToDto(record: KiReceptionCallRecord): KiReceptionCallDto {
  return {
    id: record.id,
    externalCallId: record.externalCallId ?? undefined,
    customerName: record.customerName,
    customerPhone: record.customerPhone,
    category: record.category as KiReceptionCategory,
    summary: record.summary,
    vehicle: record.vehicle ?? undefined,
    desiredAppt: record.desiredAppt ?? undefined,
    transcript: record.transcript ?? undefined,
    recordingUrl: record.recordingUrl ?? undefined,
    callDurationSec: record.callDurationSec ?? undefined,
    status: record.status as KiReceptionStatus,
    assignedTo: record.assignedTo ?? undefined,
    completionNotes: record.completionNotes ?? undefined,
    completedAt: record.completedAt?.toISOString(),
    completedBy: record.completedBy ?? undefined,
    receivedAt: record.receivedAt.toISOString(),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  }
}

function toJsonInput(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined || value === null) return undefined
  return value as Prisma.InputJsonValue
}

/**
 * Idempotenter Upsert auf externalCallId (Famulor-Retries erzeugen keine
 * Duplikate). Beim Update werden NUR Anruf-Inhalte aktualisiert — Status,
 * Zuweisung und Abschluss-Felder bleiben unangetastet, damit manuelle
 * Bearbeitung nicht überschrieben wird.
 */
export async function upsertKiReceptionCallFromWebhook(
  input: UpsertKiCallInput,
): Promise<KiReceptionCallDto> {
  const prisma = getPrismaClient()
  const rawPayload = toJsonInput(input.rawPayload)

  const content = {
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    category: input.category,
    summary: input.summary,
    vehicle: input.vehicle ?? null,
    desiredAppt: input.desiredAppt ?? null,
    transcript: input.transcript ?? null,
    recordingUrl: input.recordingUrl ?? null,
    callDurationSec: input.callDurationSec ?? null,
    ...(rawPayload !== undefined ? { rawPayload } : {}),
  }

  // Anrufzeitpunkt nur beim ANLEGEN setzen — ein Webhook-Retry (Update) darf
  // die Zeitleiste (Eingegangen / Live-Wartezeit) nicht verschieben.
  const createdAtField =
    input.receivedAt && !Number.isNaN(new Date(input.receivedAt).getTime())
      ? { receivedAt: new Date(input.receivedAt) }
      : {}

  if (input.externalCallId) {
    const record = await prisma.kiReceptionCallRecord.upsert({
      where: { externalCallId: input.externalCallId },
      update: content,
      create: { externalCallId: input.externalCallId, ...content, ...createdAtField },
    })
    return mapRecordToDto(record)
  }

  const record = await prisma.kiReceptionCallRecord.create({ data: { ...content, ...createdAtField } })
  return mapRecordToDto(record)
}

export async function listKiReceptionCalls(filter?: {
  status?: KiReceptionStatus
  category?: KiReceptionCategory
}): Promise<KiReceptionCallDto[]> {
  const prisma = getPrismaClient()
  const records = await prisma.kiReceptionCallRecord.findMany({
    where: {
      ...(filter?.status ? { status: filter.status } : {}),
      ...(filter?.category ? { category: filter.category } : {}),
    },
    orderBy: { receivedAt: 'desc' },
  })
  return records.map(mapRecordToDto)
}

export async function getKiReceptionCallById(id: string): Promise<KiReceptionCallDto | null> {
  const prisma = getPrismaClient()
  const record = await prisma.kiReceptionCallRecord.findUnique({ where: { id } })
  return record ? mapRecordToDto(record) : null
}

export async function updateKiReceptionCall(
  id: string,
  patch: UpdateKiCallInput,
): Promise<KiReceptionCallDto | null> {
  const prisma = getPrismaClient()
  const existing = await prisma.kiReceptionCallRecord.findUnique({ where: { id } })
  if (!existing) return null

  // Abschluss-Felder werden ausschließlich kohärent über den Status gesetzt —
  // niemals completedBy ohne status='erledigt' (sonst halb-erledigte Zeilen).
  const data: Prisma.KiReceptionCallRecordUpdateInput = {}
  if (patch.assignedTo !== undefined) data.assignedTo = patch.assignedTo
  if (patch.completionNotes !== undefined) data.completionNotes = patch.completionNotes
  if (patch.status) {
    data.status = patch.status
    if (patch.status === 'erledigt') {
      if (existing.status !== 'erledigt') data.completedAt = new Date()
      data.completedBy = patch.completedBy ?? existing.completedBy ?? 'Dashboard'
    } else {
      // Wieder geöffnet → Abschluss-Felder zurücksetzen.
      data.completedAt = null
      data.completedBy = null
    }
  }

  const record = await prisma.kiReceptionCallRecord.update({ where: { id }, data })
  return mapRecordToDto(record)
}

/**
 * Löscht einen erfassten Anruf endgültig. Gibt `false` zurück, wenn kein
 * Datensatz mit dieser ID existiert (z. B. bereits gelöscht) — der Aufrufer
 * kann das als idempotenten Erfolg behandeln.
 */
export async function deleteKiReceptionCall(id: string): Promise<boolean> {
  const prisma = getPrismaClient()
  try {
    await prisma.kiReceptionCallRecord.delete({ where: { id } })
    return true
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025' // "Record to delete does not exist."
    ) {
      return false
    }
    throw error
  }
}
