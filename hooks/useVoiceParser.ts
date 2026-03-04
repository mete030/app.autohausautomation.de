'use client'

import { useCallback } from 'react'
import type { Vehicle, VehicleLocation, VehicleStatus } from '@/lib/types'

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
    if (normalizedTranscript.includes(make)) {
      score += 2
    }
    if (normalizedTranscript.includes(model)) {
      score += 3
    }
    modelTokens.forEach((token) => {
      if (normalizedTranscript.includes(token)) {
        score += 1
      }
    })

    if (score > bestScore) {
      bestScore = score
      bestVehicle = vehicle
    }
  })

  return bestScore > 2 ? bestVehicle : null
}

function parseNextStep(transcript: string) {
  const patterns = [
    /(?:nächster schritt|naechster schritt)\s*(?:ist)?\s*[:,-]?\s*(.+)$/i,
    /(?:als nächstes|als naechstes)\s*[:,-]?\s*(.+)$/i,
    /(?:danach)\s*[:,-]?\s*(.+)$/i,
  ]

  for (const pattern of patterns) {
    const match = transcript.match(pattern)
    if (match?.[1]) {
      const nextStep = match[1].trim()
      if (nextStep.length >= 4) return nextStep
    }
  }

  return null
}

export interface ParsedVoiceCommand {
  transcript: string
  vehicle: Vehicle | null
  status: VehicleStatus | null
  location: VehicleLocation | null
  nextStep: string | null
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
    const nextStep = parseNextStep(transcript)

    const hasAction = Boolean(status || location || nextStep)
    const canApply = Boolean(vehicle && hasAction)

    const issues: string[] = []
    if (!vehicle) issues.push('Kein Fahrzeug erkannt.')
    if (!hasAction) issues.push('Kein Status, Standort oder nächster Schritt erkannt.')

    const summaryParts: string[] = []
    if (status) summaryParts.push(`Status -> ${status}`)
    if (location) summaryParts.push(`Standort -> ${location}`)
    if (nextStep) summaryParts.push(`Nächster Schritt -> ${nextStep}`)

    const summary = summaryParts.length > 0 ? summaryParts.join(' | ') : 'Keine Änderung erkannt'

    return {
      transcript,
      vehicle,
      status,
      location,
      nextStep,
      canApply,
      summary,
      issues,
    }
  }, [])

  return { parseTranscript }
}
