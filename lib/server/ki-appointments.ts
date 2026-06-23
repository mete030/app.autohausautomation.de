import 'server-only'

import { Prisma, type KiAppointment } from '@prisma/client'
import { getPrismaClient } from '@/lib/db/prisma'
import type {
  KiAppointmentDto,
  KiAppointmentSource,
  KiAppointmentStatus,
} from '@/lib/ki-rezeptionist/appointment-types'
import type { KiReceptionCategory } from '@/lib/ki-rezeptionist/types'

function mapToDto(r: KiAppointment): KiAppointmentDto {
  return {
    id: r.id,
    externalId: r.externalId ?? undefined,
    customerName: r.customerName,
    customerPhone: r.customerPhone ?? undefined,
    category: (r.category as KiReceptionCategory | null) ?? undefined,
    service: r.service,
    location: r.location,
    staff: r.staff ?? undefined,
    startTime: r.startTime.toISOString(),
    endTime: r.endTime.toISOString(),
    priceCents: r.priceCents ?? undefined,
    notesPublic: r.notesPublic ?? undefined,
    notesInternal: r.notesInternal ?? undefined,
    status: r.status as KiAppointmentStatus,
    source: r.source as KiAppointmentSource,
    sourceCallId: r.sourceCallId ?? undefined,
    createdBy: r.createdBy ?? undefined,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }
}

export interface CreateAppointmentInput {
  customerName: string
  customerPhone?: string | null
  category?: KiReceptionCategory | null
  service: string
  location?: string
  staff?: string | null
  startTime: string
  endTime: string
  priceCents?: number | null
  notesPublic?: string | null
  notesInternal?: string | null
  status?: KiAppointmentStatus
  source?: KiAppointmentSource
  sourceCallId?: string | null
  externalId?: string | null
  createdBy?: string | null
  rawPayload?: unknown
}

export interface UpdateAppointmentInput {
  customerName?: string
  customerPhone?: string | null
  service?: string
  staff?: string | null
  startTime?: string
  endTime?: string
  priceCents?: number | null
  notesPublic?: string | null
  notesInternal?: string | null
  status?: KiAppointmentStatus
}

function ensureValidRange(startIso: string, endIso: string): { start: Date; end: Date } {
  const start = new Date(startIso)
  const end = new Date(endIso)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error('Ungültiges Datum.')
  }
  if (end.getTime() <= start.getTime()) {
    throw new Error('Das Ende muss nach dem Start liegen.')
  }
  return { start, end }
}

export async function listAppointments(range?: {
  from?: string
  to?: string
  location?: string
}): Promise<KiAppointmentDto[]> {
  const prisma = getPrismaClient()
  const where: Prisma.KiAppointmentWhereInput = { status: { not: 'abgesagt' } }
  if (range?.location) where.location = range.location
  if (range?.from || range?.to) {
    where.startTime = {
      ...(range.from ? { gte: new Date(range.from) } : {}),
      ...(range.to ? { lte: new Date(range.to) } : {}),
    }
  }
  const rows = await prisma.kiAppointment.findMany({ where, orderBy: { startTime: 'asc' } })
  return rows.map(mapToDto)
}

export async function getAppointmentById(id: string): Promise<KiAppointmentDto | null> {
  const prisma = getPrismaClient()
  const row = await prisma.kiAppointment.findUnique({ where: { id } })
  return row ? mapToDto(row) : null
}

export async function createAppointment(input: CreateAppointmentInput): Promise<KiAppointmentDto> {
  const prisma = getPrismaClient()
  const { start, end } = ensureValidRange(input.startTime, input.endTime)
  const row = await prisma.kiAppointment.create({
    data: {
      externalId: input.externalId ?? null,
      customerName: input.customerName.trim() || 'Unbekannt',
      customerPhone: input.customerPhone ?? null,
      category: input.category ?? null,
      service: input.service,
      location: input.location ?? 'Nagold',
      staff: input.staff ?? null,
      startTime: start,
      endTime: end,
      priceCents: input.priceCents ?? null,
      notesPublic: input.notesPublic ?? null,
      notesInternal: input.notesInternal ?? null,
      status: input.status ?? 'geplant',
      source: input.source ?? 'manuell',
      sourceCallId: input.sourceCallId ?? null,
      createdBy: input.createdBy ?? null,
      ...(input.rawPayload !== undefined && input.rawPayload !== null
        ? { rawPayload: input.rawPayload as Prisma.InputJsonValue }
        : {}),
    },
  })
  return mapToDto(row)
}

export async function updateAppointment(
  id: string,
  patch: UpdateAppointmentInput,
): Promise<KiAppointmentDto | null> {
  const prisma = getPrismaClient()
  const existing = await prisma.kiAppointment.findUnique({ where: { id } })
  if (!existing) return null

  const data: Prisma.KiAppointmentUpdateInput = {}
  if (patch.customerName !== undefined) data.customerName = patch.customerName.trim() || 'Unbekannt'
  if (patch.customerPhone !== undefined) data.customerPhone = patch.customerPhone
  if (patch.service !== undefined) data.service = patch.service
  if (patch.staff !== undefined) data.staff = patch.staff
  if (patch.priceCents !== undefined) data.priceCents = patch.priceCents
  if (patch.notesPublic !== undefined) data.notesPublic = patch.notesPublic
  if (patch.notesInternal !== undefined) data.notesInternal = patch.notesInternal
  if (patch.status !== undefined) data.status = patch.status

  if (patch.startTime !== undefined || patch.endTime !== undefined) {
    const { start, end } = ensureValidRange(
      patch.startTime ?? existing.startTime.toISOString(),
      patch.endTime ?? existing.endTime.toISOString(),
    )
    data.startTime = start
    data.endTime = end
  }

  const row = await prisma.kiAppointment.update({ where: { id }, data })
  return mapToDto(row)
}

export async function deleteAppointment(id: string): Promise<boolean> {
  const prisma = getPrismaClient()
  try {
    await prisma.kiAppointment.delete({ where: { id } })
    return true
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return false
    }
    throw error
  }
}

/** Idempotenter Upsert für den Buchungs-Webhook (auf externalId). */
export async function upsertAppointmentFromWebhook(
  input: CreateAppointmentInput & { externalId: string },
): Promise<KiAppointmentDto> {
  const prisma = getPrismaClient()
  const { start, end } = ensureValidRange(input.startTime, input.endTime)
  const content = {
    customerName: input.customerName.trim() || 'Unbekannt',
    customerPhone: input.customerPhone ?? null,
    category: input.category ?? null,
    service: input.service,
    location: input.location ?? 'Nagold',
    staff: input.staff ?? null,
    startTime: start,
    endTime: end,
    priceCents: input.priceCents ?? null,
    notesPublic: input.notesPublic ?? null,
    notesInternal: input.notesInternal ?? null,
    source: input.source ?? 'ki_gebucht',
    sourceCallId: input.sourceCallId ?? null,
    ...(input.rawPayload !== undefined && input.rawPayload !== null
      ? { rawPayload: input.rawPayload as Prisma.InputJsonValue }
      : {}),
  }
  const row = await prisma.kiAppointment.upsert({
    where: { externalId: input.externalId },
    update: content,
    create: { externalId: input.externalId, status: input.status ?? 'bestaetigt', ...content },
  })
  return mapToDto(row)
}
