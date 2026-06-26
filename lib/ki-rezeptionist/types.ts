// KI-Rezeptionist — eigenständige Typen, vollständig entkoppelt vom Callcenter.
// Bewusst NICHT die geteilten Callback-/CallSource-Typen erweitern.

export type KiReceptionStatus = 'offen' | 'in_bearbeitung' | 'erledigt'

/** Fahrzeug-Zustand aus Famulor `extracted_variables.fahrzeug_zustand`. */
export type FahrzeugZustand = 'neuwagen' | 'gebrauchtwagen' | 'unklar'

/** Fahrzeug-Marke (aus Famulor `extracted_variables.marke`, sonst aus dem Fahrzeug abgeleitet). */
export type KiMarke = 'mercedes' | 'smart' | 'lucid' | 'skoda' | 'byd' | 'fuso' | 'andere'

export type KiReceptionCategory =
  | 'neuwagen'
  | 'gebrauchtwagen'
  | 'probefahrt'
  | 'finanzierung_leasing'
  | 'inzahlungnahme'
  | 'werkstatt_service'
  | 'beschwerde'
  | 'sonstiges'

/** Was die UI / API über einen vom KI-Rezeptionisten erfassten Anruf erhält. */
export interface KiReceptionCallDto {
  id: string
  externalCallId?: string
  customerName: string
  customerPhone: string
  category: KiReceptionCategory
  summary: string
  vehicle?: string
  marke?: KiMarke
  desiredAppt?: string
  transcript?: string
  recordingUrl?: string
  callDurationSec?: number
  status: KiReceptionStatus
  assignedTo?: string
  completionNotes?: string
  completedAt?: string
  completedBy?: string
  receivedAt: string
  createdAt: string
  updatedAt: string
}
