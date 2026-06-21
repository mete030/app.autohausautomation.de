import 'server-only'

import { createHash } from 'crypto'
import { normalizeCategory } from '@/lib/ki-rezeptionist/ki-reception-config'
import type { KiReceptionCategory } from '@/lib/ki-rezeptionist/types'

/**
 * Defensive Famulor-Webhook-Parser.
 *
 * Die exakte Payload-Struktur von Famulor steht noch nicht fest, daher suchen
 * wir Felder über mehrere wahrscheinliche Schlüsselnamen UND in verschachtelten
 * Containern (variables / data / call / payload ...). Der vollständige
 * Roh-Payload wird zusätzlich gespeichert (rawPayload), damit wir das Mapping
 * nach dem ersten echten Anruf punktgenau schärfen können — ohne Daten zu
 * verlieren.
 */
export interface NormalizedFamulorCall {
  externalCallId: string | null
  customerName: string
  customerPhone: string
  category: KiReceptionCategory
  summary: string
  vehicle: string | null
  desiredAppt: string | null
  transcript: string | null
  recordingUrl: string | null
  callDurationSec: number | null
}

type AnyRecord = Record<string, unknown>

// Feld-Längenlimits (Datenminimierung + DoS-Schutz).
const MAX = {
  name: 200,
  phone: 64,
  summary: 5_000,
  vehicle: 200,
  appt: 200,
  transcript: 50_000,
  callId: 128,
} as const

function isRecord(value: unknown): value is AnyRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Container, in denen Famulor die Post-Call-Variablen verschachteln könnte. */
const NESTED_CONTAINERS = [
  'variables',
  'post_call_variables',
  'postCallVariables',
  'extracted_variables',
  'extractedVariables',
  'data',
  'call',
  'result',
  'analysis',
  'payload',
]

/** Flacht den Payload + bekannte verschachtelte Container in eine Lookup-Map. */
function flattenLookup(raw: AnyRecord): AnyRecord {
  const flat: AnyRecord = { ...raw }
  for (const key of NESTED_CONTAINERS) {
    const nested = raw[key]
    if (isRecord(nested)) {
      for (const [k, v] of Object.entries(nested)) {
        if (!(k in flat)) flat[k] = v
      }
    }
  }
  return flat
}

function pickString(lookup: AnyRecord, keys: string[]): string | null {
  for (const key of keys) {
    const value = lookup[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
    if (typeof value === 'number') return String(value)
  }
  return null
}

function pickNumber(lookup: AnyRecord, keys: string[]): number | null {
  for (const key of keys) {
    const value = lookup[key]
    if (typeof value === 'number' && Number.isFinite(value)) return Math.round(value)
    if (typeof value === 'string' && value.trim() && !Number.isNaN(Number(value))) {
      return Math.round(Number(value))
    }
  }
  return null
}

function cap(value: string | null, max: number): string | null {
  if (value == null) return null
  return value.length > max ? value.slice(0, max) : value
}

/** Nur http(s)-URLs zulassen — blockiert javascript:/data:/file: etc. */
function safeUrl(value: string | null): string | null {
  if (!value) return null
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
    return url.toString()
  } catch {
    return null
  }
}

export function parseFamulorPayload(raw: unknown): NormalizedFamulorCall {
  const root = isRecord(raw) ? raw : {}
  const lookup = flattenLookup(root)

  const rawCategory = pickString(lookup, [
    'anliegen', 'category', 'kategorie', 'intent', 'topic', 'reason', 'concern',
  ])

  const customerName =
    cap(pickString(lookup, ['name', 'customer_name', 'customerName', 'caller_name', 'callerName', 'full_name']), MAX.name) ??
    'Unbekannt'
  const customerPhone =
    cap(pickString(lookup, ['telefon', 'phone', 'phone_number', 'phoneNumber', 'customer_phone', 'customerPhone', 'caller', 'caller_id', 'callerId', 'from', 'from_number']), MAX.phone) ??
    ''
  const summary =
    cap(pickString(lookup, ['summary', 'zusammenfassung', 'call_summary', 'callSummary', 'notes']), MAX.summary) ?? ''
  const vehicle = cap(pickString(lookup, ['fahrzeug', 'vehicle', 'wunschmodell', 'model', 'fahrzeugmodell']), MAX.vehicle)
  const desiredAppt = cap(pickString(lookup, ['wunschtermin', 'desired_appointment', 'appointment', 'termin', 'preferred_time']), MAX.appt)
  const transcript = cap(pickString(lookup, ['transcript', 'transcription', 'call_transcript', 'callTranscript', 'text']), MAX.transcript)
  const recordingUrl = safeUrl(pickString(lookup, [
    'recording_url', 'recordingUrl', 'recording', 'audio_url', 'audioUrl', 'call_recording_url', 'recording_link',
  ]))
  const callDurationSec = pickNumber(lookup, [
    'duration', 'call_duration', 'callDuration', 'duration_seconds', 'durationSeconds', 'length', 'call_length',
  ])

  let externalCallId = cap(
    pickString(lookup, ['call_id', 'callId', 'id', 'uuid', 'conversation_id', 'conversationId', 'call_sid', 'callSid', 'session_id']),
    MAX.callId,
  )
  if (!externalCallId) {
    // Kein Call-ID von Famulor → deterministischer Fallback aus dem Inhalt,
    // damit identische Retries nicht zu Duplikaten führen.
    const basis = JSON.stringify({ customerName, customerPhone, summary, transcript, recordingUrl, callDurationSec })
    externalCallId = 'fallback-' + createHash('sha256').update(basis).digest('hex').slice(0, 40)
  }

  return {
    externalCallId,
    customerName,
    customerPhone,
    category: normalizeCategory(rawCategory),
    summary,
    vehicle,
    desiredAppt,
    transcript,
    recordingUrl,
    callDurationSec,
  }
}
