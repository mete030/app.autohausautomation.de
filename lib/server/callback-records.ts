import 'server-only'

import { createHash, randomBytes } from 'crypto'
import {
  type CallbackActivityRecord,
  type CallbackRecord,
  type Prisma,
  type CallbackPriority as PrismaCallbackPriority,
  type CallSource as PrismaCallSource,
  type AgentType as PrismaAgentType,
} from '@prisma/client'
import { getPrismaClient } from '@/lib/db/prisma'
import type {
  CallbackActivity,
  CallbackActivityType,
  CallAgent,
  CallbackPriority,
  CallbackStatus,
  CallSource,
  PersistedCallbackDto,
  CallbackCompletionLinkViewModel,
} from '@/lib/types'

const persistedCallbackInclude = {
  activities: {
    orderBy: {
      performedAt: 'asc',
    },
  },
} satisfies Prisma.CallbackRecordInclude

type CallbackRecordWithRelations = Prisma.CallbackRecordGetPayload<{
  include: typeof persistedCallbackInclude
}>

type CallbackEmailActionWithCallback = Prisma.CallbackEmailActionRecordGetPayload<{
  include: {
    callback: {
      include: typeof persistedCallbackInclude
    }
  }
}>

export interface CreatePersistedCallbackInput {
  customerName: string
  customerPhone: string
  reason: string
  notes: string
  assignedAdvisor: string
  assignedEmployeeId?: string
  priority: CallbackPriority
  source: CallSource
  takenBy: CallAgent
  callTranscript?: string
  slaDurationMinutes: number
}

export interface CreateCallbackActivityInput {
  callbackId: string
  type: CallbackActivityType
  description: string
  performedBy: string
  metadata?: Record<string, string>
}

function toInputJson(metadata?: Record<string, string>): Prisma.InputJsonValue | undefined {
  return metadata ? (metadata satisfies Prisma.InputJsonValue) : undefined
}

function mapActivityRecord(record: CallbackActivityRecord): CallbackActivity {
  return {
    id: record.id,
    type: record.type as CallbackActivityType,
    description: record.description,
    performedBy: record.performedBy,
    performedAt: record.performedAt.toISOString(),
    metadata: (record.metadata as Record<string, string> | null) ?? undefined,
  }
}

function mapPersistedEnum<T extends string>(value: string): T {
  return value as T
}

function mapCallAgent(record: CallbackRecord): CallAgent {
  return {
    id: record.takenById,
    name: record.takenByName,
    type: mapPersistedEnum<CallAgent['type']>(record.takenByType),
  }
}

export function mapCallbackRecordToDto(record: CallbackRecordWithRelations): PersistedCallbackDto {
  return {
    id: record.id,
    customerName: record.customerName,
    customerPhone: record.customerPhone,
    reason: record.reason,
    notes: record.notes,
    assignedAdvisor: record.assignedAdvisor,
    assignedEmployeeId: record.assignedEmployeeId ?? undefined,
    status: mapPersistedEnum<CallbackStatus>(record.status),
    priority: mapPersistedEnum<CallbackPriority>(record.priority),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    completedAt: record.completedAt?.toISOString(),
    completionNotes: record.completionNotes ?? undefined,
    slaDeadline: record.slaDeadline.toISOString(),
    slaDurationMinutes: record.slaDurationMinutes,
    dueAt: record.dueAt.toISOString(),
    takenBy: mapCallAgent(record),
    callTranscript: record.callTranscript ?? undefined,
    callDuration: record.callDuration ?? undefined,
    source: mapPersistedEnum<CallSource>(record.source),
    escalationLevel: 1,
    escalationHistory: [],
    reminders: [],
    activityLog: record.activities.map(mapActivityRecord),
    dataOrigin: 'persisted',
    isPersisted: true,
  }
}

export async function listPersistedCallbacks(): Promise<PersistedCallbackDto[]> {
  const prisma = getPrismaClient()
  const records = await prisma.callbackRecord.findMany({
    include: persistedCallbackInclude,
    orderBy: {
      createdAt: 'desc',
    },
  })

  return records.map(mapCallbackRecordToDto)
}

export async function getPersistedCallbackById(id: string): Promise<PersistedCallbackDto | null> {
  const prisma = getPrismaClient()
  const record = await prisma.callbackRecord.findUnique({
    where: { id },
    include: persistedCallbackInclude,
  })

  return record ? mapCallbackRecordToDto(record) : null
}

export async function createPersistedCallback(input: CreatePersistedCallbackInput): Promise<PersistedCallbackDto> {
  const prisma = getPrismaClient()
  const now = new Date()
  const dueDate = new Date(now.getTime() + input.slaDurationMinutes * 60 * 1000)

  const record = await prisma.callbackRecord.create({
    data: {
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      reason: input.reason,
      notes: input.notes,
      assignedAdvisor: input.assignedAdvisor,
      assignedEmployeeId: input.assignedEmployeeId,
      priority: input.priority as PrismaCallbackPriority,
      source: input.source as PrismaCallSource,
      takenById: input.takenBy.id,
      takenByName: input.takenBy.name,
      takenByType: input.takenBy.type as PrismaAgentType,
      callTranscript: input.callTranscript,
      slaDurationMinutes: input.slaDurationMinutes,
      dueAt: dueDate,
      slaDeadline: dueDate,
      activities: {
        create: {
          type: 'erstellt',
          description: `Rückruf erstellt — zugewiesen an ${input.assignedAdvisor}`,
          performedBy: input.takenBy.name,
          metadata: toInputJson({
            source: input.source,
            assignedEmployeeId: input.assignedEmployeeId ?? '',
          }),
        },
      },
    },
    include: persistedCallbackInclude,
  })

  return mapCallbackRecordToDto(record)
}

export async function appendPersistedCallbackActivity(input: CreateCallbackActivityInput): Promise<CallbackActivity> {
  const prisma = getPrismaClient()
  const record = await prisma.callbackActivityRecord.create({
    data: {
      callbackId: input.callbackId,
      type: input.type,
      description: input.description,
      performedBy: input.performedBy,
      metadata: toInputJson(input.metadata),
    },
  })

  return mapActivityRecord(record)
}

export async function createCallbackCompletionAction(input: {
  callbackId: string
  recipientEmail: string
  recipientName: string
  expiresInDays?: number
}) {
  const prisma = getPrismaClient()
  const token = randomBytes(32).toString('hex')
  const tokenHash = hashCallbackActionToken(token)
  const expiresAt = new Date(Date.now() + (input.expiresInDays ?? 14) * 24 * 60 * 60 * 1000)

  const action = await prisma.callbackEmailActionRecord.create({
    data: {
      callbackId: input.callbackId,
      actionType: 'complete_callback',
      recipientEmail: input.recipientEmail,
      recipientName: input.recipientName,
      tokenHash,
      expiresAt,
    },
  })

  return {
    action,
    token,
  }
}

export function hashCallbackActionToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export async function getCallbackCompletionLinkModel(token: string): Promise<CallbackCompletionLinkViewModel | null> {
  const prisma = getPrismaClient()
  const action = await prisma.callbackEmailActionRecord.findUnique({
    where: { tokenHash: hashCallbackActionToken(token) },
    include: {
      callback: {
        include: persistedCallbackInclude,
      },
    },
  })

  if (!action) {
    return null
  }

  return mapCompletionActionToViewModel(action)
}

function mapCompletionActionToViewModel(action: CallbackEmailActionWithCallback): CallbackCompletionLinkViewModel {
  const now = Date.now()
  const isLinkExpired = action.expiresAt.getTime() < now
  const isLinkUsed = Boolean(action.usedAt || action.invalidatedAt)
  const isAlreadyCompleted = action.callback.status === 'erledigt'

  return {
    callbackId: action.callbackId,
    customerName: action.callback.customerName,
    reason: action.callback.reason,
    assignedAdvisor: action.callback.assignedAdvisor,
    status: mapPersistedEnum<CallbackStatus>(action.callback.status),
    expiresAt: action.expiresAt.toISOString(),
    completionNotes: action.callback.completionNotes ?? undefined,
    isAlreadyCompleted,
    isLinkExpired,
    isLinkUsed,
    isInvalid: false,
  }
}

export async function completeCallbackFromEmailAction(input: {
  token: string
  completionNotes?: string
  usedByIp?: string
}) {
  const prisma = getPrismaClient()
  const tokenHash = hashCallbackActionToken(input.token)
  const now = new Date()

  return prisma.$transaction(async (tx) => {
    const action = await tx.callbackEmailActionRecord.findUnique({
      where: { tokenHash },
      include: {
        callback: {
          include: persistedCallbackInclude,
        },
      },
    })

    if (!action) {
      return { ok: false as const, reason: 'invalid' as const }
    }

    if (action.invalidatedAt || action.usedAt) {
      return { ok: false as const, reason: 'used' as const }
    }

    if (action.expiresAt.getTime() < now.getTime()) {
      return { ok: false as const, reason: 'expired' as const }
    }

    if (action.callback.status === 'erledigt') {
      return { ok: false as const, reason: 'already_completed' as const }
    }

    const trimmedCompletionNotes = input.completionNotes?.trim() || null

    const callback = await tx.callbackRecord.update({
      where: { id: action.callbackId },
      data: {
        status: 'erledigt',
        completedAt: now,
        completionNotes: trimmedCompletionNotes ?? action.callback.completionNotes,
      },
      include: persistedCallbackInclude,
    })

    await tx.callbackEmailActionRecord.update({
      where: { id: action.id },
      data: {
        usedAt: now,
        usedByIp: input.usedByIp ?? null,
      },
    })

    const activity = await tx.callbackActivityRecord.create({
      data: {
        callbackId: action.callbackId,
        type: 'abgeschlossen',
        description: trimmedCompletionNotes
          ? 'Per E-Mail-CTA als erledigt markiert — Abschlussnotiz hinterlegt'
          : 'Per E-Mail-CTA als erledigt markiert',
        performedBy: action.recipientName || action.recipientEmail,
        metadata: toInputJson({
          completionSource: 'email_cta',
          completionNoteProvided: trimmedCompletionNotes ? 'true' : 'false',
          completionNotes: trimmedCompletionNotes ?? '',
          recipientEmail: action.recipientEmail,
          recipientName: action.recipientName,
        }),
      },
    })

    return {
      ok: true as const,
      callback: mapCallbackRecordToDto(callback),
      activity: mapActivityRecord(activity),
    }
  })
}

export async function completePersistedCallbackDirect(input: {
  callbackId: string
  completionNotes?: string
  performedBy: string
}) {
  const prisma = getPrismaClient()
  const existing = await prisma.callbackRecord.findUnique({
    where: { id: input.callbackId },
  })

  if (!existing) {
    return null
  }

  const now = new Date()
  const trimmedCompletionNotes = input.completionNotes?.trim() || null

  const callback = await prisma.callbackRecord.update({
    where: { id: input.callbackId },
    data: {
      status: 'erledigt',
      completedAt: now,
      completionNotes: trimmedCompletionNotes ?? existing.completionNotes,
    },
    include: persistedCallbackInclude,
  })

  await prisma.callbackActivityRecord.create({
    data: {
      callbackId: input.callbackId,
      type: 'abgeschlossen',
      description: trimmedCompletionNotes
        ? `Rückruf abgeschlossen: ${trimmedCompletionNotes}`
        : 'Rückruf abgeschlossen',
      performedBy: input.performedBy,
      metadata: toInputJson({
        completionSource: 'dashboard',
        completionNoteProvided: trimmedCompletionNotes ? 'true' : 'false',
        completionNotes: trimmedCompletionNotes ?? '',
      }),
    },
  })

  const refreshed = await prisma.callbackRecord.findUnique({
    where: { id: input.callbackId },
    include: persistedCallbackInclude,
  })

  return refreshed ? mapCallbackRecordToDto(refreshed) : mapCallbackRecordToDto(callback)
}
