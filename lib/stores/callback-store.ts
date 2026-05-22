'use client'

import { create } from 'zustand'
import { buildMockCallbacks } from '@/lib/mock-data'
import { defaultSlaConfig, mockEmployees, mockEscalationRules } from '@/lib/constants'
import type {
  Callback,
  CallbackStatus,
  CallbackPriority,
  CallSource,
  CallAgent,
  CallbackActivity,
  CallbackActivityType,
  Employee,
  EmployeeRole,
  EscalationLevel,
  EscalationTrigger,
  EscalationEvent,
  EscalationRule,
  Reminder,
  ReminderStatus,
  SlaConfig,
  PersistedCallbackDto,
} from '@/lib/types'

function createActivity(
  type: CallbackActivityType,
  description: string,
  performedBy: string,
  metadata?: Record<string, string>,
): CallbackActivity {
  return {
    id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type,
    description,
    performedBy,
    performedAt: new Date().toISOString(),
    metadata,
  }
}

function normalizeMockCallback(callback: Callback): Callback {
  return {
    ...callback,
    dataOrigin: 'mock',
    isPersisted: false,
  }
}

// Anchor the most recent persisted callback at ~3 minutes ago and add ~4
// minutes between each older one. The user wants the demo to never display
// "vor einem Monat" — every reload should look like the callbacks were taken
// just now. We rebase each callback by a constant delta so all internal
// relationships (createdAt → dueAt, activity log ordering, escalation events,
// completedAt vs createdAt) stay intact.
const FRESHEN_NEWEST_AGE_MIN = 3
const FRESHEN_STEP_MIN = 4

function shiftIso(iso: string | undefined, deltaMs: number): string | undefined {
  if (!iso) return iso
  const time = new Date(iso).getTime()
  if (Number.isNaN(time)) return iso
  return new Date(time + deltaMs).toISOString()
}

function freshenPersistedCallback(
  callback: PersistedCallbackDto,
  indexFromNewest: number,
): PersistedCallbackDto {
  const targetCreatedAtMs =
    Date.now() - (FRESHEN_NEWEST_AGE_MIN + indexFromNewest * FRESHEN_STEP_MIN) * 60_000
  const originalCreatedAtMs = new Date(callback.createdAt).getTime()
  if (Number.isNaN(originalCreatedAtMs)) {
    return callback
  }
  const deltaMs = targetCreatedAtMs - originalCreatedAtMs

  return {
    ...callback,
    createdAt: shiftIso(callback.createdAt, deltaMs) ?? callback.createdAt,
    updatedAt: shiftIso(callback.updatedAt, deltaMs) ?? callback.updatedAt,
    completedAt: shiftIso(callback.completedAt, deltaMs),
    slaDeadline: shiftIso(callback.slaDeadline, deltaMs) ?? callback.slaDeadline,
    dueAt: shiftIso(callback.dueAt, deltaMs) ?? callback.dueAt,
    reassignedAt: shiftIso(callback.reassignedAt, deltaMs),
    escalatedAt: shiftIso(callback.escalatedAt, deltaMs),
    escalationHistory: callback.escalationHistory.map((event) => ({
      ...event,
      escalatedAt: shiftIso(event.escalatedAt, deltaMs) ?? event.escalatedAt,
    })),
    activityLog: callback.activityLog.map((activity) => ({
      ...activity,
      performedAt: shiftIso(activity.performedAt, deltaMs) ?? activity.performedAt,
    })),
    attachments: callback.attachments?.map((attachment) => ({
      ...attachment,
      createdAt: shiftIso(attachment.createdAt, deltaMs) ?? attachment.createdAt,
    })),
  }
}

function freshenPersistedCallbacks(callbacks: PersistedCallbackDto[]): PersistedCallbackDto[] {
  const sortedDesc = [...callbacks].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
  return sortedDesc.map((callback, index) => freshenPersistedCallback(callback, index))
}

function normalizePersistedCallback(callback: PersistedCallbackDto): PersistedCallbackDto {
  return {
    ...callback,
    dataOrigin: 'persisted',
    isPersisted: true,
  }
}

function sortCallbacks(callbacks: Callback[]) {
  return [...callbacks].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}

function mergePersistedCallbacks(currentCallbacks: Callback[], persistedCallbacks: PersistedCallbackDto[]) {
  const localCallbacks = currentCallbacks.filter((callback) => !callback.isPersisted)
  return sortCallbacks([
    ...persistedCallbacks.map(normalizePersistedCallback),
    ...localCallbacks,
  ])
}

function buildFreshMockCallbacks(): Callback[] {
  return sortCallbacks(buildMockCallbacks().map(normalizeMockCallback))
}

const initialCallbacks = buildFreshMockCallbacks()

interface UpdateCallbackPayload {
  callbackId: string
  status: CallbackStatus
  completionNotes?: string
}

interface CreateCallbackPayload {
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
  slaDurationMinutes?: number
  dueAt?: string
}

interface ReassignCallbackPayload {
  callbackId: string
  newAdvisor: string
  newEmployeeId?: string
  reassignedBy: string
}

interface EscalateCallbackPayload {
  callbackId: string
  newPriority: CallbackPriority
  escalatedBy: string
}

interface EscalateToLevelPayload {
  callbackId: string
  toLevel: EscalationLevel
  escalatedBy: string
  escalatedTo: string
  trigger: EscalationTrigger
  note?: string
}

interface AddReminderPayload {
  callbackId: string
  employeeId: string
  reminderAt: string
  message: string
  createdBy: string
}

interface AddEmployeePayload {
  name: string
  role: EmployeeRole
  email?: string
  phone?: string
  isCallAgent: boolean
  isSupervisor: boolean
}

interface RecordCallbackNotificationEmailSentPayload {
  callbackId: string
  recipientEmail: string
  recipientName: string
  sentBy: string
  provider: string
  providerMessageId?: string
  activity?: CallbackActivity
}

interface CallbackStoreState {
  callbacks: Callback[]
  employees: Employee[]
  reminders: Reminder[]
  escalationRules: EscalationRule[]
  slaConfig: SlaConfig

  loadPersistedCallbacks: () => Promise<void>
  hydratePersistedCallbacks: (callbacks: PersistedCallbackDto[]) => void
  refreshDemoCallbacks: () => void

  updateCallbackStatus: (payload: UpdateCallbackPayload) => Promise<void>
  createCallback: (payload: CreateCallbackPayload) => Promise<Callback>
  deleteCallback: (callbackId: string) => Promise<void>
  reassignCallback: (payload: ReassignCallbackPayload) => void
  escalateCallback: (payload: EscalateCallbackPayload) => void
  escalateCallbackToLevel: (payload: EscalateToLevelPayload) => void
  assignToEmployee: (payload: { callbackId: string; employeeId: string; assignedBy: string }) => void

  addEmployee: (payload: AddEmployeePayload) => void
  updateEmployee: (id: string, updates: Partial<Employee>) => void
  removeEmployee: (id: string) => void

  addReminder: (payload: AddReminderPayload) => void
  dismissReminder: (id: string) => void
  completeReminder: (id: string) => void

  addEscalationRule: (rule: Omit<EscalationRule, 'id'>) => void
  updateEscalationRule: (id: string, updates: Partial<EscalationRule>) => void
  removeEscalationRule: (id: string) => void

  updateSlaConfig: (config: Partial<SlaConfig>) => void
  addActivityToCallback: (callbackId: string, activity: CallbackActivity) => void

  sendEmailNotification: (callbackId: string, recipientEmployeeId: string, sentBy: string) => void
  sendMorningSummary: (sentBy: string) => void
  recordCallbackNotificationEmailSent: (payload: RecordCallbackNotificationEmailSentPayload) => void

  checkAutoEscalations: () => void
  processEscalations: () => Promise<void>
}

// Guards against firing the same rule for the same callback twice while a
// request is still in flight (the provider ticks every few seconds).
const inflightEscalations = new Set<string>()

function resolveRuleRecipient(rule: EscalationRule, employees: Employee[]) {
  const fromEmployee = rule.recipientEmployeeId
    ? employees.find((employee) => employee.id === rule.recipientEmployeeId)
    : undefined

  const recipientEmail = rule.recipientEmail?.trim() || fromEmployee?.email?.trim() || ''
  const recipientName = rule.recipientName?.trim() || fromEmployee?.name?.trim() || ''

  return { recipientEmail, recipientName }
}

export const useCallbackStore = create<CallbackStoreState>((set, get) => ({
  callbacks: initialCallbacks,
  employees: mockEmployees.map((employee) => ({ ...employee })),
  reminders: [],
  escalationRules: mockEscalationRules.map((rule) => ({ ...rule })),
  slaConfig: { ...defaultSlaConfig },

  loadPersistedCallbacks: async () => {
    // Refresh demo mock callbacks first so timestamps that were anchored at
    // module load time get re-anchored to "now" on every visit/refresh.
    get().refreshDemoCallbacks()

    try {
      const response = await fetch('/api/callbacks', {
        method: 'GET',
        cache: 'no-store',
      })

      const data = await response.json() as {
        available?: boolean
        callbacks?: PersistedCallbackDto[]
      }

      if (!response.ok || data.available === false) {
        get().hydratePersistedCallbacks([])
        return
      }

      // Freshen persisted callbacks so they always appear to have been taken
      // within the last few minutes — the demo should never show
      // "vor einem Monat" timestamps regardless of when the DB record was
      // actually written.
      const freshened = freshenPersistedCallbacks(data.callbacks ?? [])
      get().hydratePersistedCallbacks(freshened)
    } catch {
      get().hydratePersistedCallbacks([])
    }
  },

  hydratePersistedCallbacks: (callbacks) => {
    set((state) => ({
      callbacks: mergePersistedCallbacks(
        state.callbacks,
        callbacks.map(normalizePersistedCallback),
      ),
    }))
  },

  refreshDemoCallbacks: () => {
    set((state) => {
      const persisted = state.callbacks.filter((callback) => callback.isPersisted) as PersistedCallbackDto[]
      return {
        callbacks: mergePersistedCallbacks(buildFreshMockCallbacks(), persisted),
      }
    })
  },

  updateCallbackStatus: async ({ callbackId, status, completionNotes }) => {
    const existingCallback = get().callbacks.find((callback) => callback.id === callbackId)
    if (!existingCallback) {
      return
    }

    const now = new Date().toISOString()
    const activity = status === 'erledigt'
      ? createActivity(
        'abgeschlossen',
        `Rückruf abgeschlossen${completionNotes ? `: ${completionNotes.trim()}` : ''}`,
        'Admin',
      )
      : createActivity('status_geaendert', `Status geändert auf "${status}"`, 'Admin')

    set((state) => ({
      callbacks: state.callbacks.map((callback) => {
        if (callback.id !== callbackId) {
          return callback
        }

        if (status === 'erledigt') {
          return {
            ...callback,
            status,
            updatedAt: now,
            completedAt: now,
            completionNotes: completionNotes?.trim() || callback.completionNotes || 'Per Voice Assistant erledigt',
            activityLog: [...callback.activityLog, activity],
          }
        }

        return {
          ...callback,
          status,
          updatedAt: now,
          activityLog: [...callback.activityLog, activity],
        }
      }),
    }))

    if (existingCallback.isPersisted && status === 'erledigt') {
      try {
        const response = await fetch(`/api/callbacks/${callbackId}/complete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            completionNotes,
            performedBy: 'Admin',
          }),
        })

        if (!response.ok) {
          throw new Error('Persistierter Rückruf konnte nicht abgeschlossen werden.')
        }

        const data = await response.json() as { callback?: PersistedCallbackDto }
        if (data.callback) {
          get().hydratePersistedCallbacks([data.callback])
        }
      } catch (error) {
        console.error(error)
      }
    }
  },

  createCallback: async (payload) => {
    const state = get()
    const slaMinutes =
      payload.slaDurationMinutes
      ?? state.slaConfig.perPriority[payload.priority]
      ?? state.slaConfig.defaultMinutes

    const response = await fetch('/api/callbacks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...payload,
        slaDurationMinutes: slaMinutes,
        dueAt: payload.dueAt,
      }),
    })

    const data = await response.json() as { callback?: PersistedCallbackDto; error?: string }

    if (!response.ok || !data.callback) {
      throw new Error(data.error ?? 'Rückruf konnte nicht erstellt werden.')
    }

    const createdCallback = normalizePersistedCallback(data.callback)
    set((state) => ({
      callbacks: sortCallbacks([createdCallback, ...state.callbacks.filter((callback) => callback.id !== createdCallback.id)]),
    }))

    return createdCallback
  },

  deleteCallback: async (callbackId) => {
    const existingCallback = get().callbacks.find((callback) => callback.id === callbackId)
    if (!existingCallback) {
      return
    }

    if (existingCallback.isPersisted) {
      const response = await fetch(`/api/callbacks/${callbackId}`, {
        method: 'DELETE',
      })

      const data = await response.json().catch(() => ({ error: '' })) as { error?: string }

      if (!response.ok) {
        throw new Error(data.error ?? 'Rückruf konnte nicht gelöscht werden.')
      }
    }

    set((state) => ({
      callbacks: state.callbacks.filter((callback) => callback.id !== callbackId),
      reminders: state.reminders.filter((reminder) => reminder.callbackId !== callbackId),
    }))
  },

  reassignCallback: ({ callbackId, newAdvisor, newEmployeeId, reassignedBy }) => {
    set((state) => ({
      callbacks: state.callbacks.map((callback) => {
        if (callback.id !== callbackId) return callback
        const activity = createActivity(
          'zugewiesen',
          `Zugewiesen von ${callback.assignedAdvisor} an ${newAdvisor}`,
          reassignedBy,
        )
        return {
          ...callback,
          reassignedFrom: callback.assignedAdvisor,
          assignedAdvisor: newAdvisor,
          assignedEmployeeId: newEmployeeId ?? callback.assignedEmployeeId,
          reassignedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          activityLog: [...callback.activityLog, activity],
        }
      }),
    }))
  },

  escalateCallback: ({ callbackId, newPriority, escalatedBy }) => {
    set((state) => ({
      callbacks: state.callbacks.map((callback) => {
        if (callback.id !== callbackId) return callback
        return {
          ...callback,
          priority: newPriority,
          escalatedAt: new Date().toISOString(),
          escalatedBy,
          updatedAt: new Date().toISOString(),
        }
      }),
    }))
  },

  escalateCallbackToLevel: ({ callbackId, toLevel, escalatedBy, escalatedTo, trigger, note }) => {
    const now = new Date().toISOString()
    set((state) => ({
      callbacks: state.callbacks.map((callback) => {
        if (callback.id !== callbackId) return callback
        const event: EscalationEvent = {
          id: `esc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          callbackId,
          fromLevel: callback.escalationLevel,
          toLevel,
          trigger,
          escalatedBy,
          escalatedTo,
          escalatedAt: now,
          note,
        }
        const activity = createActivity(
          'eskaliert',
          `Eskaliert von Stufe ${callback.escalationLevel} auf Stufe ${toLevel} — an ${escalatedTo}`,
          escalatedBy,
          { trigger },
        )
        return {
          ...callback,
          escalationLevel: toLevel,
          escalationHistory: [...callback.escalationHistory, event],
          escalatedAt: now,
          escalatedBy,
          updatedAt: now,
          activityLog: [...callback.activityLog, activity],
        }
      }),
    }))
  },

  assignToEmployee: ({ callbackId, employeeId, assignedBy }) => {
    const employee = get().employees.find((entry) => entry.id === employeeId)
    if (!employee) {
      return
    }

    set((state) => ({
      callbacks: state.callbacks.map((callback) => {
        if (callback.id !== callbackId) return callback
        const activity = createActivity('zugewiesen', `Zugewiesen an ${employee.name}`, assignedBy, { employeeId })
        return {
          ...callback,
          reassignedFrom: callback.assignedAdvisor,
          assignedAdvisor: employee.name,
          assignedEmployeeId: employeeId,
          reassignedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          activityLog: [...callback.activityLog, activity],
        }
      }),
    }))
  },

  addEmployee: (payload) => {
    const newEmployee: Employee = {
      id: `emp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: payload.name,
      role: payload.role,
      email: payload.email,
      phone: payload.phone,
      status: 'aktiv',
      isCallAgent: payload.isCallAgent,
      isSupervisor: payload.isSupervisor,
      createdAt: new Date().toISOString(),
    }

    set((state) => ({ employees: [...state.employees, newEmployee] }))
  },

  updateEmployee: (id, updates) => {
    set((state) => ({
      employees: state.employees.map((employee) => employee.id === id ? { ...employee, ...updates } : employee),
    }))
  },

  removeEmployee: (id) => {
    set((state) => ({
      employees: state.employees.filter((employee) => employee.id !== id),
    }))
  },

  addReminder: (payload) => {
    const newReminder: Reminder = {
      id: `rem-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      callbackId: payload.callbackId,
      employeeId: payload.employeeId,
      reminderAt: payload.reminderAt,
      message: payload.message,
      status: 'ausstehend',
      createdAt: new Date().toISOString(),
      createdBy: payload.createdBy,
    }
    const activity = createActivity(
      'erinnerung_gesetzt',
      `Erinnerung gesetzt für ${new Date(payload.reminderAt).toLocaleTimeString('de-DE', {
        hour: '2-digit',
        minute: '2-digit',
      })}`,
      payload.createdBy,
    )

    set((state) => ({
      reminders: [...state.reminders, newReminder],
      callbacks: state.callbacks.map((callback) =>
        callback.id === payload.callbackId
          ? { ...callback, reminders: [...callback.reminders, newReminder.id], activityLog: [...callback.activityLog, activity] }
          : callback,
      ),
    }))
  },

  dismissReminder: (id) => {
    set((state) => ({
      reminders: state.reminders.map((reminder) => reminder.id === id ? { ...reminder, status: 'angezeigt' as ReminderStatus } : reminder),
    }))
  },

  completeReminder: (id) => {
    set((state) => ({
      reminders: state.reminders.map((reminder) => reminder.id === id ? { ...reminder, status: 'erledigt' as ReminderStatus } : reminder),
    }))
  },

  addEscalationRule: (rule) => {
    const newRule: EscalationRule = {
      ...rule,
      id: `rule-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    }
    set((state) => ({ escalationRules: [...state.escalationRules, newRule] }))
  },

  updateEscalationRule: (id, updates) => {
    set((state) => ({
      escalationRules: state.escalationRules.map((rule) => rule.id === id ? { ...rule, ...updates } : rule),
    }))
  },

  removeEscalationRule: (id) => {
    set((state) => ({
      escalationRules: state.escalationRules.filter((rule) => rule.id !== id),
    }))
  },

  updateSlaConfig: (config) => {
    set((state) => ({
      slaConfig: {
        ...state.slaConfig,
        ...config,
        perPriority: config.perPriority
          ? { ...state.slaConfig.perPriority, ...config.perPriority }
          : state.slaConfig.perPriority,
      },
    }))
  },

  addActivityToCallback: (callbackId, activity) => {
    set((state) => ({
      callbacks: state.callbacks.map((callback) =>
        callback.id === callbackId
          ? callback.activityLog.some((existingActivity) => existingActivity.id === activity.id)
            ? callback
            : {
                ...callback,
                activityLog: [...callback.activityLog, activity],
                updatedAt: new Date().toISOString(),
              }
          : callback,
      ),
    }))
  },

  sendEmailNotification: (callbackId, recipientEmployeeId, sentBy) => {
    const state = get()
    const employee = state.employees.find((entry) => entry.id === recipientEmployeeId)
    const callback = state.callbacks.find((entry) => entry.id === callbackId)
    if (!employee || !callback) {
      return
    }

    const activity = createActivity(
      'email_gesendet',
      `Erinnerungs-E-Mail gesendet an ${employee.name} (${employee.email ?? 'keine E-Mail'})`,
      sentBy,
      {
        recipientEmail: employee.email ?? '',
        recipientName: employee.name,
        emailKind: 'erinnerung',
        provider: 'intern',
      },
    )

    get().addActivityToCallback(callbackId, activity)
  },

  sendMorningSummary: (sentBy) => {
    const state = get()
    const activeCallbacks = state.callbacks.filter((callback) => callback.status !== 'erledigt')
    const overdueCallbacks = activeCallbacks.filter(
      (callback) => callback.status === 'ueberfaellig' || new Date(callback.dueAt) < new Date(),
    )

    overdueCallbacks.forEach((callback) => {
      const activity = createActivity(
        'email_gesendet',
        `Morgen-Zusammenfassung versendet — ${overdueCallbacks.length} überfällig, ${activeCallbacks.length} aktiv`,
        sentBy,
        { emailKind: 'morgen_zusammenfassung' },
      )
      get().addActivityToCallback(callback.id, activity)
    })
  },

  recordCallbackNotificationEmailSent: ({
    callbackId,
    recipientEmail,
    recipientName,
    sentBy,
    provider,
    providerMessageId,
    activity,
  }) => {
    if (activity) {
      get().addActivityToCallback(callbackId, activity)
      return
    }

    const metadata: Record<string, string> = {
      recipientEmail,
      recipientName,
      provider,
      emailKind: 'callback_benachrichtigung',
    }

    if (providerMessageId) {
      metadata.providerMessageId = providerMessageId
    }

    const fallbackActivity = createActivity(
      'email_gesendet',
      `Callback-Benachrichtigung gesendet an ${recipientName} (${recipientEmail})`,
      sentBy,
      metadata,
    )

    get().addActivityToCallback(callbackId, fallbackActivity)
  },

  checkAutoEscalations: () => {
    const state = get()
    const now = Date.now()
    const activeRules = state.escalationRules.filter((rule) => rule.isActive)
    const supervisors = state.employees.filter((employee) => employee.isSupervisor)

    state.callbacks.forEach((callback) => {
      if (callback.status === 'erledigt') return

      const ageMinutes = (now - new Date(callback.createdAt).getTime()) / (60 * 1000)

      for (const rule of activeRules) {
        if (callback.escalationLevel === rule.fromLevel && ageMinutes >= rule.triggerAfterMinutes) {
          const alreadyEscalated = callback.escalationHistory.some(
            (entry) => entry.fromLevel === rule.fromLevel && entry.toLevel === rule.toLevel,
          )
          if (alreadyEscalated) continue

          const ruleRecipient = rule.recipientEmployeeId
            ? state.employees.find((e) => e.id === rule.recipientEmployeeId)
            : undefined
          const assignedPerson = callback.assignedEmployeeId
            ? state.employees.find((e) => e.id === callback.assignedEmployeeId)
            : undefined
          const target =
            ruleRecipient?.name
              ?? (rule.fromLevel === rule.toLevel ? (assignedPerson?.name ?? callback.assignedAdvisor) : undefined)
              ?? supervisors[0]?.name
              ?? 'Teamleitung'
          get().escalateCallbackToLevel({
            callbackId: callback.id,
            toLevel: rule.toLevel,
            escalatedBy: 'System',
            escalatedTo: target,
            trigger: 'zeit_basiert',
            note: `Automatisch eskaliert nach ${rule.triggerAfterMinutes} Minuten`,
          })
        }
      }
    })
  },

  processEscalations: async () => {
    const state = get()
    const now = Date.now()
    const activeRules = state.escalationRules.filter(
      (rule) => rule.isActive && rule.notifyChannels.includes('email'),
    )
    if (activeRules.length === 0) return

    for (const callback of state.callbacks) {
      // These rules only apply to real callbacks persisted in the database
      // (created via the "Neuer Rückruf" dialog) — never to mock demo data.
      if (!callback.isPersisted) continue
      if (callback.status === 'erledigt') continue

      const elapsedSeconds = (now - new Date(callback.createdAt).getTime()) / 1000

      for (const rule of activeRules) {
        if (rule.appliesToPersistedOnly && !callback.isPersisted) continue
        if (callback.escalationLevel !== rule.fromLevel) continue

        // A rule only applies to callbacks created at or after the moment it was
        // activated — switching it on never retroactively escalates callbacks
        // that already existed in the database.
        if (!rule.activatedAt) continue
        if (new Date(callback.createdAt).getTime() < new Date(rule.activatedAt).getTime()) continue

        const triggerSeconds = rule.triggerAfterSeconds ?? rule.triggerAfterMinutes * 60
        if (elapsedSeconds < triggerSeconds) continue

        const alreadyEscalated = callback.escalationHistory.some(
          (event) => event.fromLevel === rule.fromLevel && event.toLevel === rule.toLevel,
        )
        if (alreadyEscalated) continue

        const { recipientEmail, recipientName } = resolveRuleRecipient(rule, state.employees)
        if (!recipientEmail) continue // never send without a configured recipient

        const inflightKey = `${callback.id}:${rule.id}`
        if (inflightEscalations.has(inflightKey)) continue
        inflightEscalations.add(inflightKey)

        try {
          const response = await fetch(`/api/callbacks/${callback.id}/escalate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ruleId: rule.id,
              ruleName: rule.name,
              fromLevel: rule.fromLevel,
              toLevel: rule.toLevel,
              triggerSeconds,
              recipientEmail,
              recipientName,
              performedBy: 'System (Auto-Eskalation)',
            }),
          })

          const data = (await response.json().catch(() => ({}))) as {
            ok?: boolean
            activity?: CallbackActivity
            error?: string
          }

          if (!response.ok) {
            console.error('Auto-Eskalation fehlgeschlagen:', data.error)
            continue
          }

          // Advance the in-memory escalation level so the next rule (e.g.
          // Stufe 2 → 3) becomes eligible, and surface the e-mail in the log.
          get().escalateCallbackToLevel({
            callbackId: callback.id,
            toLevel: rule.toLevel,
            escalatedBy: 'System (Auto-Eskalation)',
            escalatedTo: recipientName || recipientEmail,
            trigger: 'zeit_basiert',
            note: `Automatisch eskaliert (${rule.name})`,
          })

          if (data.activity) {
            get().addActivityToCallback(callback.id, data.activity)
          }
        } catch (error) {
          console.error(error)
        } finally {
          inflightEscalations.delete(inflightKey)
        }
      }
    }
  },
}))
