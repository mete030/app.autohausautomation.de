// Typen für den KI-Kalender (Termine + Schließzeiten). Standalone, isoliert.

import type { KiReceptionCategory } from './types'

export type KiAppointmentStatus = 'geplant' | 'bestaetigt' | 'abgesagt' | 'erledigt'
export type KiAppointmentSource = 'manuell' | 'ki_wunsch' | 'ki_gebucht' | 'api'
export type KiClosureType = 'betriebsschliessung' | 'urlaub' | 'wartung' | 'feiertag'

export interface KiAppointmentDto {
  id: string
  externalId?: string
  customerName: string
  customerPhone?: string
  category?: KiReceptionCategory
  service: string
  location: string
  staff?: string
  startTime: string // ISO
  endTime: string // ISO
  priceCents?: number
  notesPublic?: string
  notesInternal?: string
  status: KiAppointmentStatus
  source: KiAppointmentSource
  sourceCallId?: string
  createdBy?: string
  createdAt: string
  updatedAt: string
}

export interface KiClosureDto {
  id: string
  location: string
  type: KiClosureType
  name: string
  allDay: boolean
  startDate: string // ISO
  endDate: string // ISO
  reason?: string
  createdBy?: string
  createdAt: string
  updatedAt: string
}
