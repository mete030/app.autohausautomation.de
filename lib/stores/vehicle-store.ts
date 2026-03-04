'use client'

import { create } from 'zustand'
import { mockVehicles } from '@/lib/mock-data'
import type { Vehicle, VehicleLocation, VehicleStatus } from '@/lib/types'

const initialVehicles = mockVehicles.map((vehicle) => ({
  ...vehicle,
  history: [...vehicle.history],
}))

const statusActionLabels: Record<VehicleStatus, string> = {
  eingang: 'Eingang',
  inspektion: 'Inspektion',
  werkstatt: 'Werkstatt',
  aufbereitung: 'Aufbereitung',
  verkaufsbereit: 'Verkaufsbereit',
  verkauft: 'Verkauft',
}

function createHistoryId() {
  return `hist-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

interface VoiceVehicleUpdate {
  vehicleId: string
  status?: VehicleStatus | null
  location?: VehicleLocation | null
  nextStep?: string | null
  transcript: string
}

interface VehicleStoreState {
  vehicles: Vehicle[]
  updateVehicleStatus: (vehicleId: string, status: VehicleStatus) => void
  applyVoiceUpdate: (update: VoiceVehicleUpdate) => void
}

export const useVehicleStore = create<VehicleStoreState>((set) => ({
  vehicles: initialVehicles,

  updateVehicleStatus: (vehicleId, status) => {
    set((state) => ({
      vehicles: state.vehicles.map((vehicle) => {
        if (vehicle.id !== vehicleId || vehicle.status === status) return vehicle
        return {
          ...vehicle,
          status,
          history: [
            ...vehicle.history,
            {
              id: createHistoryId(),
              date: new Date().toISOString(),
              action: statusActionLabels[status],
              user: 'Werkstatt Board',
            },
          ],
        }
      }),
    }))
  },

  applyVoiceUpdate: ({ vehicleId, status, location, nextStep, transcript }) => {
    set((state) => ({
      vehicles: state.vehicles.map((vehicle) => {
        if (vehicle.id !== vehicleId) return vehicle

        const nextStatus = status ?? vehicle.status
        const nextLocation = location ?? vehicle.location

        const noteLines: string[] = []
        if (nextStep?.trim()) {
          noteLines.push(`Nächster Schritt: ${nextStep.trim()}`)
        }
        noteLines.push(`Voice: "${transcript.trim()}"`)

        const nextNotes = vehicle.notes
          ? `${vehicle.notes}\n${noteLines.join('\n')}`
          : noteLines.join('\n')

        const historyNoteParts: string[] = []
        if (status && status !== vehicle.status) {
          historyNoteParts.push(`Status -> ${statusActionLabels[status]}`)
        }
        if (location && location !== vehicle.location) {
          historyNoteParts.push(`Standort -> ${location}`)
        }
        if (nextStep?.trim()) {
          historyNoteParts.push(`Nächster Schritt: ${nextStep.trim()}`)
        }

        return {
          ...vehicle,
          status: nextStatus,
          location: nextLocation,
          notes: nextNotes,
          history: [
            ...vehicle.history,
            {
              id: createHistoryId(),
              date: new Date().toISOString(),
              action: status ? statusActionLabels[status] : 'Voice Update',
              user: 'Voice Assistant',
              note: historyNoteParts.join(' · ') || 'Per Spracheingabe aktualisiert',
            },
          ],
        }
      }),
    }))
  },
}))
