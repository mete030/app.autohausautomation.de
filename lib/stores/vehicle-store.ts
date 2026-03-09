'use client'

import { create } from 'zustand'
import { mercedesInventoryVehicles } from '@/lib/mercedes-inventory'
import { inferOwnerRoleFromText, vehicleBlockerLabels, vehicleOwnerRoleLabels, vehicleStatusLabels } from '@/lib/vehicle-operations'
import type { Vehicle, VehicleBlocker, VehicleLocation, VehicleOwnerRole, VehicleStatus } from '@/lib/types'

const initialVehicles = mercedesInventoryVehicles.map((vehicle) => ({
  ...vehicle,
  history: [...vehicle.history],
}))

function createHistoryId() {
  return `hist-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function buildHistoryNote(vehicle: Vehicle, update: VehicleOperationalUpdate) {
  const parts: string[] = []

  if (update.status && update.status !== vehicle.status) {
    parts.push(`Status -> ${vehicleStatusLabels[update.status]}`)
  }

  if (update.location && update.location !== vehicle.location) {
    parts.push(`Standort -> ${update.location}`)
  }

  if (update.blocker && update.blocker !== vehicle.blocker) {
    parts.push(`Blocker -> ${vehicleBlockerLabels[update.blocker]}`)
  }

  if (update.ownerRole && update.ownerRole !== vehicle.ownerRole) {
    parts.push(`Owner -> ${vehicleOwnerRoleLabels[update.ownerRole]}`)
  }

  if (typeof update.nextStep === 'string' && update.nextStep.trim() !== vehicle.nextStep.trim()) {
    parts.push(`Nächster Schritt: ${update.nextStep.trim() || 'Offen'}`)
  }

  if (typeof update.priorityNote === 'string' && update.priorityNote.trim() !== (vehicle.priorityNote ?? '').trim()) {
    parts.push(`Priorität: ${update.priorityNote.trim() || 'Entfernt'}`)
  }

  if (update.historyNote?.trim()) {
    parts.push(update.historyNote.trim())
  }

  if (update.transcript?.trim()) {
    parts.push(`Voice: "${update.transcript.trim()}"`)
  }

  return parts.join(' · ') || 'Fahrzeug aktualisiert'
}

function applyVehicleOperationalUpdate(vehicle: Vehicle, update: VehicleOperationalUpdate) {
  const now = new Date().toISOString()
  const nextStep =
    typeof update.nextStep === 'string'
      ? update.nextStep.trim()
      : vehicle.nextStep

  const inferredOwnerRole =
    update.ownerRole
    ?? (typeof update.nextStep === 'string'
      ? inferOwnerRoleFromText(nextStep) ?? undefined
      : undefined)

  const nextVehicle: Vehicle = {
    ...vehicle,
    status: update.status ?? vehicle.status,
    location: update.location ?? vehicle.location,
    nextStep,
    ownerRole: inferredOwnerRole ?? vehicle.ownerRole,
    blocker: update.blocker ?? vehicle.blocker,
    priorityNote:
      typeof update.priorityNote === 'string'
        ? update.priorityNote.trim() || undefined
        : vehicle.priorityNote,
    lastUpdatedAt: now,
  }

  if (update.status && update.status !== vehicle.status) {
    nextVehicle.currentStepStartedAt = now
  }

  const changeDetected =
    nextVehicle.status !== vehicle.status
    || nextVehicle.location !== vehicle.location
    || nextVehicle.nextStep !== vehicle.nextStep
    || nextVehicle.ownerRole !== vehicle.ownerRole
    || nextVehicle.blocker !== vehicle.blocker
    || (nextVehicle.priorityNote ?? '') !== (vehicle.priorityNote ?? '')

  if (!changeDetected) {
    return vehicle
  }

  return {
    ...nextVehicle,
    history: [
      ...vehicle.history,
      {
        id: createHistoryId(),
        date: now,
        action:
          update.historyAction
          ?? (update.status ? vehicleStatusLabels[update.status] : update.source === 'voice' ? 'Voice Update' : 'Manuelles Update'),
        user: update.actor ?? (update.source === 'voice' ? 'Voice Assistant' : 'Hofsteuerung'),
        note: buildHistoryNote(vehicle, update),
        source: update.source,
      },
    ],
  }
}

interface VehicleOperationalUpdate {
  vehicleId: string
  status?: VehicleStatus | null
  location?: VehicleLocation | null
  nextStep?: string | null
  blocker?: VehicleBlocker | null
  ownerRole?: VehicleOwnerRole | null
  priorityNote?: string | null
  transcript?: string
  source: 'voice' | 'manual' | 'system'
  actor?: string
  historyAction?: string
  historyNote?: string
}

interface UndoSnapshot {
  vehicleId: string
  previousVehicle: Vehicle
}

interface VehicleStoreState {
  vehicles: Vehicle[]
  lastUndoSnapshot: UndoSnapshot | null
  updateVehicleStatus: (vehicleId: string, status: VehicleStatus) => void
  updateVehicleOperationalState: (update: Omit<VehicleOperationalUpdate, 'source'> & { source?: VehicleOperationalUpdate['source'] }) => void
  applyVoiceUpdate: (update: Omit<VehicleOperationalUpdate, 'source'>) => void
  undoLastVehicleUpdate: () => void
}

export const useVehicleStore = create<VehicleStoreState>((set) => ({
  vehicles: initialVehicles,
  lastUndoSnapshot: null,

  updateVehicleStatus: (vehicleId, status) => {
    set((state) => {
      const previousVehicle = state.vehicles.find((vehicle) => vehicle.id === vehicleId)
      if (!previousVehicle || previousVehicle.status === status) {
        return state
      }

      return {
        vehicles: state.vehicles.map((vehicle) => (
          vehicle.id === vehicleId
            ? applyVehicleOperationalUpdate(vehicle, {
              vehicleId,
              status,
              source: 'manual',
              actor: 'Werkstatt Board',
            })
            : vehicle
        )),
        lastUndoSnapshot: {
          vehicleId,
          previousVehicle: {
            ...previousVehicle,
            history: [...previousVehicle.history],
          },
        },
      }
    })
  },

  updateVehicleOperationalState: (update) => {
    set((state) => {
      const previousVehicle = state.vehicles.find((vehicle) => vehicle.id === update.vehicleId)
      if (!previousVehicle) {
        return state
      }

      const nextVehicles = state.vehicles.map((vehicle) => (
        vehicle.id === update.vehicleId
          ? applyVehicleOperationalUpdate(vehicle, {
            ...update,
            source: update.source ?? 'manual',
          })
          : vehicle
      ))

      const nextVehicle = nextVehicles.find((vehicle) => vehicle.id === update.vehicleId)
      if (!nextVehicle || nextVehicle === previousVehicle) {
        return state
      }

      return {
        vehicles: nextVehicles,
        lastUndoSnapshot: {
          vehicleId: update.vehicleId,
          previousVehicle: {
            ...previousVehicle,
            history: [...previousVehicle.history],
          },
        },
      }
    })
  },

  applyVoiceUpdate: (update) => {
    set((state) => {
      const previousVehicle = state.vehicles.find((vehicle) => vehicle.id === update.vehicleId)
      if (!previousVehicle) {
        return state
      }

      const nextVehicles = state.vehicles.map((vehicle) => (
        vehicle.id === update.vehicleId
          ? applyVehicleOperationalUpdate(vehicle, {
            ...update,
            source: 'voice',
          })
          : vehicle
      ))

      const nextVehicle = nextVehicles.find((vehicle) => vehicle.id === update.vehicleId)
      if (!nextVehicle || nextVehicle === previousVehicle) {
        return state
      }

      return {
        vehicles: nextVehicles,
        lastUndoSnapshot: {
          vehicleId: update.vehicleId,
          previousVehicle: {
            ...previousVehicle,
            history: [...previousVehicle.history],
          },
        },
      }
    })
  },

  undoLastVehicleUpdate: () => {
    set((state) => {
      if (!state.lastUndoSnapshot) {
        return state
      }

      const now = new Date().toISOString()
      return {
        vehicles: state.vehicles.map((vehicle) => {
          if (vehicle.id !== state.lastUndoSnapshot?.vehicleId) {
            return vehicle
          }

          const restored = state.lastUndoSnapshot.previousVehicle
          return {
            ...restored,
            history: [
              ...restored.history,
              {
                id: createHistoryId(),
                date: now,
                action: 'Update rückgängig',
                user: 'Hofsteuerung',
                note: 'Letzte lokale Änderung wurde zurückgesetzt.',
                source: 'manual',
              },
            ],
            lastUpdatedAt: now,
          }
        }),
        lastUndoSnapshot: null,
      }
    })
  },
}))
