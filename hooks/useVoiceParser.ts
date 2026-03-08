'use client'

import { useCallback } from 'react'
import { inferOwnerRoleFromText, vehicleBlockerLabels, vehicleOwnerRoleLabels, vehicleStatusLabels } from '@/lib/vehicle-operations'
import type {
  Vehicle,
  VehicleBlocker,
  VehicleLocation,
  VehicleOwnerRole,
  VehicleStatus,
} from '@/lib/types'

const statusKeywords: Record<VehicleStatus, string[]> = {
  eingang: ['eingang', 'eingetroffen', 'angekommen', 'angeliefert'],
  inspektion: ['inspektion', 'pruefung', 'prüfung', 'check'],
  werkstatt: ['werkstatt', 'reparatur', 'in reparatur'],
  aufbereitung: ['aufbereitung', 'aufbereiten', 'polieren', 'innenreinigung'],
  verkaufsbereit: ['verkaufsbereit', 'verkauf bereit', 'verkaufsfertig'],
  verkauft: ['verkauft', 'ausgeliefert'],
}

const locationKeywords: Record<VehicleLocation, string[]> = {
  'Hof A': ['hof a', 'hof eins'],
  'Hof B': ['hof b', 'hof zwei'],
  Werkstatt: ['werkstatt'],
  Showroom: ['showroom', 'ausstellung'],
  Aufbereitung: ['aufbereitung'],
  Fotozone: ['fotozone', 'foto zone', 'foto team', 'fotoplatz'],
  'Externer Lackierer': ['lackierer', 'externer lackierer'],
}

const blockerKeywords: Record<Exclude<VehicleBlocker, 'keiner'>, string[]> = {
  wartet_auf_teile: ['wartet auf teile', 'teile fehlen', 'teile bestellt'],
  wartet_auf_freigabe: ['wartet auf freigabe', 'freigabe offen', 'muss freigegeben werden'],
  wartet_auf_lackierer: ['wartet auf lackierer', 'beim lackierer', 'lackierer'],
  wartet_auf_aufbereitung: ['wartet auf aufbereitung', 'aufbereitung offen'],
  wartet_auf_fotos: ['wartet auf fotos', 'fotos fehlen', 'bilder fehlen'],
  wartet_auf_inserat: ['wartet auf inserat', 'inserat offen', 'anzeige fehlt', 'kann ins inserat'],
  wartet_auf_rueckruf: ['wartet auf rueckruf', 'rueckruf offen', 'rückruf offen'],
}

const explicitOwnerRoleKeywords: Record<VehicleOwnerRole, string[]> = {
  ankauf: ['ankauf', 'ankauf team', 'einkauf'],
  vorpark: ['vorpark', 'hofteam', 'hof'],
  service: ['an service', 'bitte an service', 'serviceleiter', 'meister'],
  werkstatt: ['an werkstatt', 'bitte an werkstatt', 'technik'],
  aufbereitung: ['an aufbereitung', 'geht an aufbereitung', 'bitte an aufbereitung'],
  foto_inserat: ['an foto team', 'bitte an foto team', 'foto team', 'inserat team'],
  verkauf: ['an verkauf', 'bitte an verkauf', 'sales team'],
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeLicensePlate(value: string) {
  return normalizeText(value).replace(/[^a-z0-9]/g, '')
}

function getLastKeywordMatch<T extends string>(text: string, keywordMap: Record<T, string[]>) {
  let selected: T | null = null
  let maxIndex = -1

  ;(Object.keys(keywordMap) as T[]).forEach((value) => {
    const keywords = keywordMap[value]
    keywords.forEach((keyword) => {
      const idx = text.lastIndexOf(keyword)
      if (idx > maxIndex) {
        selected = value
        maxIndex = idx
      }
    })
  })

  return selected
}

function parseVehicle(transcript: string, vehicles: Vehicle[]) {
  const normalizedTranscript = normalizeText(transcript)
  const spokenPlate = transcript.match(/[A-ZÄÖÜ]{1,3}\s*-\s*[A-Z]{1,2}\s*\d{1,4}/i)?.[0]

  if (spokenPlate) {
    const normalizedSpokenPlate = normalizeLicensePlate(spokenPlate)
    const byPlate = vehicles.find(
      (vehicle) => normalizeLicensePlate(vehicle.licensePlate) === normalizedSpokenPlate
    )
    if (byPlate) return byPlate
  }

  let bestVehicle: Vehicle | null = null
  let bestScore = 0

  vehicles.forEach((vehicle) => {
    const make = normalizeText(vehicle.make)
    const model = normalizeText(vehicle.model)
    const modelTokens = model.split(' ').filter((token) => token.length > 1)

    let score = 0
    if (normalizedTranscript.includes(make)) score += 2
    if (normalizedTranscript.includes(model)) score += 3
    modelTokens.forEach((token) => {
      if (normalizedTranscript.includes(token)) score += 1
    })

    if (score > bestScore) {
      bestScore = score
      bestVehicle = vehicle
    }
  })

  return bestScore > 2 ? bestVehicle : null
}

function parseNextStep(transcript: string, normalizedTranscript: string) {
  const patterns = [
    /(?:nächster schritt|naechster schritt)\s*(?:ist)?\s*[:,-]?\s*(.+)$/i,
    /(?:als nächstes|als naechstes)\s*[:,-]?\s*(.+)$/i,
    /(?:danach)\s*[:,-]?\s*(.+)$/i,
  ]

  for (const pattern of patterns) {
    const match = transcript.match(pattern)
    if (match?.[1]) {
      const nextStep = match[1].trim()
      if (nextStep.length >= 3) return nextStep
    }
  }

  if (normalizedTranscript.includes('fertig fuer aufbereitung')) return 'Bitte an Aufbereitung'
  if (normalizedTranscript.includes('fertig fuer fotos')) return 'Bitte an Foto-Team'
  if (normalizedTranscript.includes('fertig fuers inserat') || normalizedTranscript.includes('fertig fuer inserat') || normalizedTranscript.includes('kann ins inserat')) {
    return 'Bereit für Inserat'
  }
  if (normalizedTranscript.includes('kann in verkauf')) return 'Bitte an Verkauf'
  if (normalizedTranscript.includes('bitte an service')) return 'Bitte an Service'
  if (normalizedTranscript.includes('geht an aufbereitung')) return 'Bitte an Aufbereitung'
  if (normalizedTranscript.includes('an foto team')) return 'Bitte an Foto-Team'

  return null
}

function parseBlocker(normalizedTranscript: string) {
  if (
    normalizedTranscript.includes('teile sind da')
    || normalizedTranscript.includes('freigabe liegt vor')
    || normalizedTranscript.includes('fertig fuer aufbereitung')
    || normalizedTranscript.includes('fertig fuer fotos')
    || normalizedTranscript.includes('fertig fuers inserat')
    || normalizedTranscript.includes('fertig fuer inserat')
    || normalizedTranscript.includes('kann in verkauf')
  ) {
    return 'keiner' satisfies VehicleBlocker
  }

  return getLastKeywordMatch(normalizedTranscript, blockerKeywords)
}

function parseOwnerRole(normalizedTranscript: string, nextStep: string | null) {
  const explicit = getLastKeywordMatch(normalizedTranscript, explicitOwnerRoleKeywords)
  if (explicit) return explicit
  return inferOwnerRoleFromText(nextStep)
}

export interface ParsedVoiceCommand {
  transcript: string
  vehicle: Vehicle | null
  status: VehicleStatus | null
  location: VehicleLocation | null
  nextStep: string | null
  blocker: VehicleBlocker | null
  ownerRole: VehicleOwnerRole | null
  canApply: boolean
  summary: string
  issues: string[]
}

export function useVoiceParser() {
  const parseTranscript = useCallback((transcript: string, vehicles: Vehicle[]): ParsedVoiceCommand => {
    const normalizedTranscript = normalizeText(transcript)
    const vehicle = parseVehicle(transcript, vehicles)
    const status = getLastKeywordMatch(normalizedTranscript, statusKeywords)
    const location = getLastKeywordMatch(normalizedTranscript, locationKeywords)
    const nextStep = parseNextStep(transcript, normalizedTranscript)
    const blocker = parseBlocker(normalizedTranscript)
    const ownerRole = parseOwnerRole(normalizedTranscript, nextStep)

    const hasAction = Boolean(status || location || nextStep || blocker || ownerRole)
    const canApply = Boolean(vehicle && hasAction)

    const issues: string[] = []
    if (!vehicle) issues.push('Kein Fahrzeug erkannt.')
    if (!hasAction) issues.push('Kein operativer Status, Standort, Blocker oder nächster Schritt erkannt.')

    const summaryParts: string[] = []
    if (status) summaryParts.push(`Status -> ${vehicleStatusLabels[status]}`)
    if (location) summaryParts.push(`Standort -> ${location}`)
    if (blocker) summaryParts.push(`Blocker -> ${vehicleBlockerLabels[blocker]}`)
    if (ownerRole) summaryParts.push(`Owner -> ${vehicleOwnerRoleLabels[ownerRole]}`)
    if (nextStep) summaryParts.push(`Nächster Schritt -> ${nextStep}`)

    const summary = summaryParts.length > 0 ? summaryParts.join(' | ') : 'Keine Änderung erkannt'

    return {
      transcript,
      vehicle,
      status,
      location,
      nextStep,
      blocker,
      ownerRole,
      canApply,
      summary,
      issues,
    }
  }, [])

  return { parseTranscript }
}
