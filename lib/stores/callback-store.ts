'use client'

import { create } from 'zustand'
import { mockCallbacks } from '@/lib/mock-data'
import type { Callback, CallbackStatus, CallbackPriority, CallSource, CallAgent } from '@/lib/types'

const initialCallbacks = mockCallbacks.map((callback) => ({ ...callback }))

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
  priority: CallbackPriority
  source: CallSource
  takenBy: CallAgent
  callTranscript?: string
}

interface ReassignCallbackPayload {
  callbackId: string
  newAdvisor: string
  reassignedBy: string
}

interface EscalateCallbackPayload {
  callbackId: string
  newPriority: CallbackPriority
  escalatedBy: string
}

interface CallbackStoreState {
  callbacks: Callback[]
  updateCallbackStatus: (payload: UpdateCallbackPayload) => void
  createCallback: (payload: CreateCallbackPayload) => void
  reassignCallback: (payload: ReassignCallbackPayload) => void
  escalateCallback: (payload: EscalateCallbackPayload) => void
}

export const useCallbackStore = create<CallbackStoreState>((set) => ({
  callbacks: initialCallbacks,

  updateCallbackStatus: ({ callbackId, status, completionNotes }) => {
    set((state) => ({
      callbacks: state.callbacks.map((callback) => {
        if (callback.id !== callbackId) return callback

        const now = new Date().toISOString()
        if (status === 'erledigt') {
          return {
            ...callback,
            status,
            updatedAt: now,
            completedAt: now,
            completionNotes: completionNotes?.trim() || callback.completionNotes || 'Per Voice Assistant erledigt',
          }
        }

        return {
          ...callback,
          status,
          updatedAt: now,
        }
      }),
    }))
  },

  createCallback: (payload) => {
    const now = new Date()
    const sla = new Date(now.getTime() + 2 * 60 * 60 * 1000)
    const newCallback: Callback = {
      id: `cb-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      customerName: payload.customerName,
      customerPhone: payload.customerPhone,
      reason: payload.reason,
      notes: payload.notes,
      assignedAdvisor: payload.assignedAdvisor,
      status: 'offen',
      priority: payload.priority,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      slaDeadline: sla.toISOString(),
      takenBy: payload.takenBy,
      callTranscript: payload.callTranscript,
      source: payload.source,
    }
    set((state) => ({ callbacks: [newCallback, ...state.callbacks] }))
  },

  reassignCallback: ({ callbackId, newAdvisor, reassignedBy: _ }) => {
    set((state) => ({
      callbacks: state.callbacks.map((callback) => {
        if (callback.id !== callbackId) return callback
        return {
          ...callback,
          reassignedFrom: callback.assignedAdvisor,
          assignedAdvisor: newAdvisor,
          reassignedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
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
}))
