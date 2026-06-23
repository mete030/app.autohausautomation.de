import 'server-only'

import { Prisma, type KiLocationClosure } from '@prisma/client'
import { getPrismaClient } from '@/lib/db/prisma'
import type { KiClosureDto, KiClosureType } from '@/lib/ki-rezeptionist/appointment-types'

function mapToDto(r: KiLocationClosure): KiClosureDto {
  return {
    id: r.id,
    location: r.location,
    type: r.type as KiClosureType,
    name: r.name,
    allDay: r.allDay,
    startDate: r.startDate.toISOString(),
    endDate: r.endDate.toISOString(),
    reason: r.reason ?? undefined,
    createdBy: r.createdBy ?? undefined,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }
}

export interface CreateClosureInput {
  location?: string
  type?: KiClosureType
  name: string
  allDay?: boolean
  startDate: string
  endDate: string
  reason?: string | null
  createdBy?: string | null
}

export async function listClosures(range?: {
  from?: string
  to?: string
  location?: string
}): Promise<KiClosureDto[]> {
  const prisma = getPrismaClient()
  const where: Prisma.KiLocationClosureWhereInput = {}
  if (range?.location) where.location = range.location
  // Schließzeiten, die das Fenster überlappen: endDate >= from UND startDate <= to.
  if (range?.from) where.endDate = { gte: new Date(range.from) }
  if (range?.to) where.startDate = { lte: new Date(range.to) }
  const rows = await prisma.kiLocationClosure.findMany({ where, orderBy: { startDate: 'asc' } })
  return rows.map(mapToDto)
}

export async function createClosure(input: CreateClosureInput): Promise<KiClosureDto> {
  const prisma = getPrismaClient()
  const start = new Date(input.startDate)
  const end = new Date(input.endDate)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error('Ungültiges Datum.')
  }
  if (end.getTime() < start.getTime()) {
    throw new Error('Das Enddatum darf nicht vor dem Startdatum liegen.')
  }
  const row = await prisma.kiLocationClosure.create({
    data: {
      location: input.location ?? 'Nagold',
      type: input.type ?? 'betriebsschliessung',
      name: input.name.trim() || 'Schließzeit',
      allDay: input.allDay ?? true,
      startDate: start,
      endDate: end,
      reason: input.reason ?? null,
      createdBy: input.createdBy ?? null,
    },
  })
  return mapToDto(row)
}

export async function deleteClosure(id: string): Promise<boolean> {
  const prisma = getPrismaClient()
  try {
    await prisma.kiLocationClosure.delete({ where: { id } })
    return true
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return false
    }
    throw error
  }
}
