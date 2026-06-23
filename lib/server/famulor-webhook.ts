import 'server-only'

import { createHash } from 'crypto'
import { normalizeCategory } from '@/lib/ki-rezeptionist/ki-reception-config'
import { germanizeTranscriptSpeakers } from '@/lib/ki-rezeptionist/format'
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
  /** Tatsächlicher Anrufzeitpunkt aus dem Payload (ISO) — sonst null → DB-Default. */
  receivedAt: string | null
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

/**
 * Flacht den Payload rekursiv (BFS) in eine Lookup-Map.
 *
 * Die Post-Call-Webhooks der gängigen Voice-Plattformen verschachteln Felder
 * unterschiedlich tief — z. B. ElevenLabs unter `data.analysis.transcript_summary`,
 * `data.metadata.call_duration_secs`, `data.metadata.phone_call.external_number`.
 * Eine breitensuchende Abflachung findet diese Felder unabhängig von der
 * Verschachtelungstiefe; der ZUERST (am flachsten) gefundene Wert gewinnt.
 * Arrays werden NICHT durchlaufen (Transkript-Turns landen nicht in der Map).
 */
function flattenLookup(raw: AnyRecord): AnyRecord {
  const flat: AnyRecord = {}
  const seen = new Set<unknown>()
  let frontier: AnyRecord[] = [raw]
  const MAX_DEPTH = 6

  for (let depth = 0; depth <= MAX_DEPTH && frontier.length; depth++) {
    const next: AnyRecord[] = []
    for (const obj of frontier) {
      if (seen.has(obj)) continue
      seen.add(obj)
      for (const [k, v] of Object.entries(obj)) {
        if (!(k in flat)) flat[k] = v
        if (isRecord(v)) next.push(v)
      }
    }
    frontier = next
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

/**
 * Zeitstempel robust parsen — ISO-String ODER Unix-Zeit (Sekunden/Millis).
 * Liefert ISO-String oder null bei ungültigem/fehlendem Wert.
 */
function pickDate(lookup: AnyRecord, keys: string[]): string | null {
  for (const key of keys) {
    const value = lookup[key]
    if (typeof value === 'string' && value.trim()) {
      const t = new Date(value.trim())
      if (!Number.isNaN(t.getTime())) return t.toISOString()
    }
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
      // Heuristik: < 10^12 → Sekunden, sonst Millisekunden.
      const t = new Date(value < 1e12 ? value * 1000 : value)
      if (!Number.isNaN(t.getTime())) return t.toISOString()
    }
  }
  return null
}

/** Erster nicht-leerer String-Wert eines Datensatzes über mehrere Schlüssel. */
function firstString(record: AnyRecord, keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return null
}

/** Sprecher-Rolle eines Transkript-Turns auf „Agent"/„Kunde" normalisieren. */
function roleLabel(raw: string | null): string | null {
  if (!raw) return null
  const r = raw.toLowerCase()
  if (/(agent|assistant|assistent|bot|ai|system)/.test(r)) return 'Assistent'
  if (/(user|human|customer|kunde|caller|anrufer|client)/.test(r)) return 'Kunde'
  return raw.charAt(0).toUpperCase() + raw.slice(1)
}

/** Einen einzelnen Transkript-Turn in eine lesbare Zeile umwandeln. */
function turnToLine(turn: unknown): string | null {
  if (typeof turn === 'string') return turn.trim() || null
  if (!isRecord(turn)) return null
  const text = firstString(turn, ['message', 'text', 'content', 'transcript', 'value', 'utterance'])
  if (!text) return null
  const label = roleLabel(firstString(turn, ['role', 'sender', 'speaker', 'type', 'from', 'participant']))
  return label ? `${label}: ${text}` : text
}

/**
 * Transkript robust extrahieren — egal ob als fertiger String
 * (`formatted_transcript`/`transcript`) oder als strukturiertes Array von
 * Gesprächs-Turns (ElevenLabs/Famulor-Stil: [{ role, message }, …]) geliefert.
 * Array-Turns werden zu „Agent: …\nKunde: …" zusammengesetzt.
 */
function pickTranscript(lookup: AnyRecord, keys: string[]): string | null {
  for (const key of keys) {
    const value = lookup[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
    if (Array.isArray(value)) {
      const lines = value.map(turnToLine).filter((l): l is string => Boolean(l))
      if (lines.length) return lines.join('\n')
    }
  }
  return null
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
    cap(pickString(lookup, ['telefon', 'phone', 'phone_number', 'phoneNumber', 'customer_phone', 'customerPhone', 'caller', 'caller_id', 'callerId', 'caller_number', 'external_number', 'from', 'from_number']), MAX.phone) ??
    ''
  const summary =
    cap(pickString(lookup, [
      'summary', 'zusammenfassung', 'call_summary', 'callSummary',
      'transcript_summary', 'conversation_summary', 'notes',
    ]), MAX.summary) ?? ''
  const vehicle = cap(pickString(lookup, ['fahrzeug', 'vehicle', 'wunschmodell', 'model', 'fahrzeugmodell']), MAX.vehicle)
  const desiredAppt = cap(pickString(lookup, ['wunschtermin', 'desired_appointment', 'appointment', 'termin', 'preferred_time']), MAX.appt)
  // Transkript: fertiger String ODER Array von Gesprächs-Turns.
  // Deutsche Schreibweise `transkript`/`transkription` (Famulor-Variable)
  // ebenso berücksichtigt; native Felder gewinnen, wenn beide vorhanden sind.
  // Sprecher-Labels werden auf Deutsch umgeschrieben („AI/Customer" → „Assistent/Kunde").
  const rawTranscript = pickTranscript(lookup, [
    'formatted_transcript', 'transcript', 'transcription',
    'call_transcript', 'callTranscript', 'transkript', 'transkription',
    'messages', 'turns', 'dialogue', 'gespraechsverlauf', 'gesprächsverlauf', 'text',
  ])
  const transcript = cap(
    rawTranscript ? germanizeTranscriptSpeakers(rawTranscript) : null,
    MAX.transcript,
  )
  const recordingUrl = safeUrl(pickString(lookup, [
    'recording_url', 'recordingUrl', 'recording', 'audio_url', 'audioUrl', 'call_recording_url', 'recording_link',
  ]))
  const callDurationSec = pickNumber(lookup, [
    'duration', 'call_duration', 'callDuration', 'call_duration_secs', 'call_duration_seconds',
    'duration_seconds', 'durationSeconds', 'length', 'call_length',
  ])
  // Tatsächlicher Anrufzeitpunkt (für „Eingegangen" + Live-Wartezeit) —
  // bevorzugt Anrufbeginn; fehlt er, nutzt die DB den Empfangszeitpunkt.
  const receivedAt = pickDate(lookup, [
    'created_at', 'createdAt', 'started_at', 'startedAt', 'start_time',
    'call_time', 'call_date', 'finished_at', 'ended_at',
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
    receivedAt,
  }
}
