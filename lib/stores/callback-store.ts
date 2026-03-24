'use client'

import { create } from 'zustand'
import { mockCallbacks } from '@/lib/mock-data'
import { defaultSlaConfig, mockEmployees, mockEscalationRules } from '@/lib/constants'
import type {
  Callback, CallbackStatus, CallbackPriority, CallSource, CallAgent,
  CallbackActivity, CallbackActivityType,
  Employee, EmployeeRole,
  EscalationLevel, EscalationTrigger, EscalationEvent, EscalationRule,
  Reminder, ReminderStatus, SlaConfig,
} from '@/lib/types'

function createActivity(type: CallbackActivityType, description: string, performedBy: string, metadata?: Record<string, string>): CallbackActivity {
  return {
    id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type,
    description,
    performedBy,
    performedAt: new Date().toISOString(),
    metadata,
  }
}

const initialCallbacks = mockCallbacks.map((callback) => ({ ...callback }))

// ---- Payload Interfaces ----

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
}

// ---- Store Interface ----

interface CallbackStoreState {
  callbacks: Callback[]
  employees: Employee[]
  reminders: Reminder[]
  escalationRules: EscalationRule[]
  slaConfig: SlaConfig

  // Callback actions
  updateCallbackStatus: (payload: UpdateCallbackPayload) => void
  createCallback: (payload: CreateCallbackPayload) => void
  reassignCallback: (payload: ReassignCallbackPayload) => void
  escalateCallback: (payload: EscalateCallbackPayload) => void
  escalateCallbackToLevel: (payload: EscalateToLevelPayload) => void
  assignToEmployee: (payload: { callbackId: string; employeeId: string; assignedBy: string }) => void

  // Employee actions
  addEmployee: (payload: AddEmployeePayload) => void
  updateEmployee: (id: string, updates: Partial<Employee>) => void
  removeEmployee: (id: string) => void

  // Reminder actions
  addReminder: (payload: AddReminderPayload) => void
  dismissReminder: (id: string) => void
  completeReminder: (id: string) => void

  // Escalation rule actions
  addEscalationRule: (rule: Omit<EscalationRule, 'id'>) => void
  updateEscalationRule: (id: string, updates: Partial<EscalationRule>) => void
  removeEscalationRule: (id: string) => void

  // SLA config
  updateSlaConfig: (config: Partial<SlaConfig>) => void

  // Activity log
  addActivityToCallback: (callbackId: string, activity: CallbackActivity) => void

  // Email notifications
  sendEmailNotification: (callbackId: string, recipientEmployeeId: string, sentBy: string) => void
  sendMorningSummary: (sentBy: string) => void
  recordCallbackNotificationEmailSent: (payload: RecordCallbackNotificationEmailSentPayload) => void

  // Auto-escalation
  checkAutoEscalations: () => void
}

export const useCallbackStore = create<CallbackStoreState>((set, get) => ({
  callbacks: initialCallbacks,
  employees: mockEmployees.map(e => ({ ...e })),
  reminders: [],
  escalationRules: mockEscalationRules.map(r => ({ ...r })),
  slaConfig: { ...defaultSlaConfig },

  // ---- Callback Actions ----

  updateCallbackStatus: ({ callbackId, status, completionNotes }) => {
    set((state) => ({
      callbacks: state.callbacks.map((callback) => {
        if (callback.id !== callbackId) return callback
        const now = new Date().toISOString()
        const activity = status === 'erledigt'
          ? createActivity('abgeschlossen', `Rückruf abgeschlossen${completionNotes ? ': ' + completionNotes.trim() : ''}`, 'Admin')
          : createActivity('status_geaendert', `Status geändert auf "${status}"`, 'Admin')
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
        return { ...callback, status, updatedAt: now, activityLog: [...callback.activityLog, activity] }
      }),
    }))
  },

  createCallback: (payload) => {
    const state = get()
    const slaMinutes = payload.slaDurationMinutes ?? state.slaConfig.perPriority[payload.priority] ?? state.slaConfig.defaultMinutes
    const now = new Date()
    const dueDate = new Date(now.getTime() + slaMinutes * 60 * 1000)
    const newCallback: Callback = {
      id: `cb-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      customerName: payload.customerName,
      customerPhone: payload.customerPhone,
      reason: payload.reason,
      notes: payload.notes,
      assignedAdvisor: payload.assignedAdvisor,
      assignedEmployeeId: payload.assignedEmployeeId,
      status: 'offen',
      priority: payload.priority,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      slaDeadline: dueDate.toISOString(),
      slaDurationMinutes: slaMinutes,
      dueAt: dueDate.toISOString(),
      takenBy: payload.takenBy,
      callTranscript: payload.callTranscript,
      source: payload.source,
      escalationLevel: 1,
      escalationHistory: [],
      reminders: [],
      activityLog: [
        createActivity('erstellt', `Rückruf erstellt — zugewiesen an ${payload.assignedAdvisor}`, 'System'),
      ],
    }
    set((state) => ({ callbacks: [newCallback, ...state.callbacks] }))
  },

  reassignCallback: ({ callbackId, newAdvisor, newEmployeeId, reassignedBy }) => {
    set((state) => ({
      callbacks: state.callbacks.map((callback) => {
        if (callback.id !== callbackId) return callback
        const activity = createActivity('zugewiesen', `Zugewiesen von ${callback.assignedAdvisor} an ${newAdvisor}`, reassignedBy)
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
        const activity = createActivity('eskaliert', `Eskaliert von Stufe ${callback.escalationLevel} auf Stufe ${toLevel} — an ${escalatedTo}`, escalatedBy, { trigger })
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
    const state = get()
    const employee = state.employees.find(e => e.id === employeeId)
    if (!employee) return
    set((s) => ({
      callbacks: s.callbacks.map((callback) => {
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

  // ---- Employee Actions ----

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
      employees: state.employees.map(e => e.id === id ? { ...e, ...updates } : e),
    }))
  },

  removeEmployee: (id) => {
    set((state) => ({
      employees: state.employees.filter(e => e.id !== id),
    }))
  },

  // ---- Reminder Actions ----

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
    const activity = createActivity('erinnerung_gesetzt', `Erinnerung gesetzt für ${new Date(payload.reminderAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`, payload.createdBy)
    set((state) => ({
      reminders: [...state.reminders, newReminder],
      callbacks: state.callbacks.map(cb =>
        cb.id === payload.callbackId
          ? { ...cb, reminders: [...cb.reminders, newReminder.id], activityLog: [...cb.activityLog, activity] }
          : cb
      ),
    }))
  },

  dismissReminder: (id) => {
    set((state) => ({
      reminders: state.reminders.map(r => r.id === id ? { ...r, status: 'angezeigt' as ReminderStatus } : r),
    }))
  },

  completeReminder: (id) => {
    set((state) => ({
      reminders: state.reminders.map(r => r.id === id ? { ...r, status: 'erledigt' as ReminderStatus } : r),
    }))
  },

  // ---- Escalation Rule Actions ----

  addEscalationRule: (rule) => {
    const newRule: EscalationRule = {
      ...rule,
      id: `rule-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    }
    set((state) => ({ escalationRules: [...state.escalationRules, newRule] }))
  },

  updateEscalationRule: (id, updates) => {
    set((state) => ({
      escalationRules: state.escalationRules.map(r => r.id === id ? { ...r, ...updates } : r),
    }))
  },

  removeEscalationRule: (id) => {
    set((state) => ({
      escalationRules: state.escalationRules.filter(r => r.id !== id),
    }))
  },

  // ---- SLA Config ----

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

  // ---- Activity Log ----

  addActivityToCallback: (callbackId, activity) => {
    set((state) => ({
      callbacks: state.callbacks.map(cb =>
        cb.id === callbackId
          ? { ...cb, activityLog: [...cb.activityLog, activity], updatedAt: new Date().toISOString() }
          : cb
      ),
    }))
  },

  // ---- Email Notifications ----

  sendEmailNotification: (callbackId, recipientEmployeeId, sentBy) => {
    const state = get()
    const cb = state.callbacks.find(c => c.id === callbackId)
    const employee = state.employees.find(e => e.id === recipientEmployeeId)
    if (!cb || !employee) return

    const activity = createActivity(
      'email_gesendet',
      `Erinnerungs-E-Mail gesendet an ${employee.name} (${employee.email ?? 'keine E-Mail'})`,
      sentBy,
      {
        recipientEmail: employee.email ?? '',
        recipientName: employee.name,
        emailKind: 'erinnerung',
        provider: 'intern',
      }
    )
    get().addActivityToCallback(callbackId, activity)
  },

  sendMorningSummary: (sentBy) => {
    const state = get()
    const activeCallbacks = state.callbacks.filter(cb => cb.status !== 'erledigt')
    const overdueCallbacks = activeCallbacks.filter(cb => cb.status === 'ueberfaellig' || new Date(cb.dueAt) < new Date())

    // Log activity on each overdue callback
    overdueCallbacks.forEach(cb => {
      const activity = createActivity(
        'email_gesendet',
        `Morgen-Zusammenfassung versendet — ${overdueCallbacks.length} überfällig, ${activeCallbacks.length} aktiv`,
        sentBy,
        { emailKind: 'morgen_zusammenfassung' }
      )
      get().addActivityToCallback(cb.id, activity)
    })
  },

  recordCallbackNotificationEmailSent: ({ callbackId, recipientEmail, recipientName, sentBy, provider, providerMessageId }) => {
    const metadata: Record<string, string> = {
      recipientEmail,
      recipientName,
      provider,
      emailKind: 'callback_benachrichtigung',
    }

    if (providerMessageId) {
      metadata.providerMessageId = providerMessageId
    }

    const activity = createActivity(
      'email_gesendet',
      `Callback-Benachrichtigung gesendet an ${recipientName} (${recipientEmail})`,
      sentBy,
      metadata,
    )

    get().addActivityToCallback(callbackId, activity)
  },

  // ---- Auto-Escalation ----

  checkAutoEscalations: () => {
    const state = get()
    const now = Date.now()
    const activeRules = state.escalationRules.filter(r => r.isActive)
    const supervisors = state.employees.filter(e => e.isSupervisor)

    state.callbacks.forEach((cb) => {
      if (cb.status === 'erledigt') return

      const ageMinutes = (now - new Date(cb.createdAt).getTime()) / (60 * 1000)

      for (const rule of activeRules) {
        if (cb.escalationLevel === rule.fromLevel && ageMinutes >= rule.triggerAfterMinutes) {
          const alreadyEscalated = cb.escalationHistory.some(
            e => e.fromLevel === rule.fromLevel && e.toLevel === rule.toLevel
          )
          if (alreadyEscalated) continue

          const target = supervisors[0]?.name ?? 'Teamleitung'
          get().escalateCallbackToLevel({
            callbackId: cb.id,
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
}))
