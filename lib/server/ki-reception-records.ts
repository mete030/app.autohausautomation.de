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

  if (input.externalCallId) {
    const record = await prisma.kiReceptionCallRecord.upsert({
      where: { externalCallId: input.externalCallId },
      update: content,
      create: { externalCallId: input.externalCallId, ...content },
    })
    return mapRecordToDto(record)
  }

  const record = await prisma.kiReceptionCallRecord.create({ data: content })
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

  const markingDone = patch.status === 'erledigt' && existing.status !== 'erledigt'

  const record = await prisma.kiReceptionCallRecord.update({
    where: { id },
    data: {
      ...(patch.status ? { status: patch.status } : {}),
      ...(patch.assignedTo !== undefined ? { assignedTo: patch.assignedTo } : {}),
      ...(patch.completionNotes !== undefined ? { completionNotes: patch.completionNotes } : {}),
      ...(patch.completedBy !== undefined ? { completedBy: patch.completedBy } : {}),
      ...(markingDone ? { completedAt: new Date() } : {}),
    },
  })
  return mapRecordToDto(record)
}
