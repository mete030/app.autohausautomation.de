import { differenceInHours, differenceInMinutes } from 'date-fns'
import type {
  Vehicle,
  VehicleBlocker,
  VehicleLocation,
  VehicleOperationalLane,
  VehicleOwnerRole,
  VehicleStatus,
} from '@/lib/types'

export const vehicleStatusLabels: Record<VehicleStatus, string> = {
  eingang: 'Eingang',
  inspektion: 'Inspektion',
  werkstatt: 'Werkstatt',
  aufbereitung: 'Aufbereitung',
  verkaufsbereit: 'Verkaufsbereit',
  verkauft: 'Verkauft',
}

export const vehicleLocationLabels: Record<VehicleLocation, string> = {
  'Hof A': 'Hof A',
  'Hof B': 'Hof B',
  Werkstatt: 'Werkstatt',
  Showroom: 'Showroom',
  Aufbereitung: 'Aufbereitung',
  Fotozone: 'Fotozone',
  'Externer Lackierer': 'Externer Lackierer',
}

export const vehicleBlockerLabels: Record<VehicleBlocker, string> = {
  keiner: 'Kein Blocker',
  wartet_auf_teile: 'Wartet auf Teile',
  wartet_auf_freigabe: 'Wartet auf Freigabe',
  wartet_auf_lackierer: 'Wartet auf Lackierer',
  wartet_auf_aufbereitung: 'Wartet auf Aufbereitung',
  wartet_auf_fotos: 'Wartet auf Fotos',
  wartet_auf_inserat: 'Wartet auf Inserat',
  wartet_auf_rueckruf: 'Rückruf offen',
}

export const vehicleOwnerRoleLabels: Record<VehicleOwnerRole, string> = {
  ankauf: 'Ankauf',
  vorpark: 'Vorpark',
  service: 'Service',
  werkstatt: 'Werkstatt',
  aufbereitung: 'Aufbereitung',
  foto_inserat: 'Foto & Inserat',
  verkauf: 'Verkauf',
}

export const vehicleOperationalLaneLabels: Record<VehicleOperationalLane, string> = {
  kritisch: 'Kritisch',
  in_arbeit: 'In Arbeit',
  blockiert: 'Blockiert',
  bereit: 'Bereit für nächsten Schritt',
}

const ownerRoleHints: Array<{ role: VehicleOwnerRole; patterns: RegExp[] }> = [
  { role: 'service', patterns: [/\bservice\b/, /serviceleiter/, /meister/, /freigabe/] },
  { role: 'werkstatt', patterns: [/\bwerkstatt\b/, /\breparatur\b/, /teile/, /technik/, /inspektion/] },
  { role: 'aufbereitung', patterns: [/aufbereitung/, /polier/, /innenreinigung/, /aufbereiten/] },
  { role: 'foto_inserat', patterns: [/foto/, /bilder/, /inserat/, /mobile/, /autoscout/, /anzeige/] },
  { role: 'verkauf', patterns: [/verkauf/, /probefahrt/, /showroom/, /kundenkontakt/, /ausstellen/] },
  { role: 'vorpark', patterns: [/hof/, /vorpark/, /stellplatz/, /umparken/] },
  { role: 'ankauf', patterns: [/ankauf/, /bewertung/, /hereinnahme/, /einkauf/] },
]

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
}

export function inferOwnerRoleFromText(text: string | null | undefined): VehicleOwnerRole | null {
  if (!text?.trim()) return null
  const normalized = normalizeText(text)

  for (const hint of ownerRoleHints) {
    if (hint.patterns.some((pattern) => pattern.test(normalized))) {
      return hint.role
    }
  }

  return null
}

export function isVehicleOverdue(vehicle: Pick<Vehicle, 'slaDueAt'>, now = new Date()) {
  return new Date(vehicle.slaDueAt) < now
}

export function getCurrentStepAgeHours(vehicle: Pick<Vehicle, 'currentStepStartedAt'>, now = new Date()) {
  return Math.max(0, differenceInHours(now, new Date(vehicle.currentStepStartedAt)))
}

export function getCurrentStepAgeLabel(vehicle: Pick<Vehicle, 'currentStepStartedAt'>, now = new Date()) {
  const minutes = Math.max(0, differenceInMinutes(now, new Date(vehicle.currentStepStartedAt)))
  const days = Math.floor(minutes / (60 * 24))
  const hours = Math.floor((minutes % (60 * 24)) / 60)

  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h`
  return `${minutes}m`
}

export function getSlaState(vehicle: Pick<Vehicle, 'slaDueAt'>, now = new Date()) {
  const dueAt = new Date(vehicle.slaDueAt)
  const overdue = dueAt < now
  const minutes = Math.abs(differenceInMinutes(dueAt, now))
  const days = Math.floor(minutes / (60 * 24))
  const hours = Math.floor((minutes % (60 * 24)) / 60)

  if (overdue) {
    return {
      overdue: true,
      text: days > 0 ? `${days}d ${hours}h überfällig` : `${Math.max(1, hours)}h überfällig`,
    }
  }

  return {
    overdue: false,
    text: days > 0 ? `${days}d ${hours}h bis SLA` : `${Math.max(1, hours)}h bis SLA`,
  }
}

export function deriveVehicleLane(vehicle: Vehicle, now = new Date()): VehicleOperationalLane {
  if (vehicle.blocker !== 'keiner') return 'blockiert'

  const stepAgeHours = getCurrentStepAgeHours(vehicle, now)
  const overdue = isVehicleOverdue(vehicle, now)
  const missingNextStep = vehicle.nextStep.trim().length === 0

  if (overdue || missingNextStep || stepAgeHours >= 72) {
    return 'kritisch'
  }

  const nextOwner = inferOwnerRoleFromText(vehicle.nextStep)
  if (nextOwner && nextOwner !== vehicle.ownerRole) {
    return 'bereit'
  }

  return 'in_arbeit'
}
