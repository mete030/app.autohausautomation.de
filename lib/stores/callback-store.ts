'use client'

import { create } from 'zustand'
import { mockCallbacks } from '@/lib/mock-data'
import type { Callback, CallbackStatus } from '@/lib/types'

const initialCallbacks = mockCallbacks.map((callback) => ({ ...callback }))

interface UpdateCallbackPayload {
  callbackId: string
  status: CallbackStatus
  completionNotes?: string
}

interface CallbackStoreState {
  callbacks: Callback[]
  updateCallbackStatus: (payload: UpdateCallbackPayload) => void
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
}))
