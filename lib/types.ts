// ============================================
// Wackenhut Autohaus Management Platform - Types
// ============================================

// ---- Fahrzeuge & Werkstatt (Problem 1) ----

export type VehicleStatus = 'eingang' | 'inspektion' | 'werkstatt' | 'aufbereitung' | 'verkaufsbereit' | 'verkauft'
export type VehicleLocation = 'Hof A' | 'Hof B' | 'Werkstatt' | 'Showroom'
export type FuelType = 'Benzin' | 'Diesel' | 'Elektro' | 'Hybrid' | 'Plug-in-Hybrid'

export interface Vehicle {
  id: string
  make: string
  model: string
  year: number
  vin: string
  licensePlate: string
  color: string
  mileage: number
  fuelType: FuelType
  transmission: 'Automatik' | 'Schaltung'
  power: number // PS
  price: number
  purchasePrice: number
  status: VehicleStatus
  location: VehicleLocation
  intakeDate: string // ISO date
  deadline: string // ISO date (10 days from intake)
  imageUrl: string
  notes: string
  history: VehicleHistoryEntry[]
}

export interface VehicleHistoryEntry {
  id: string
  date: string
  action: string
  user: string
  note?: string
}

// ---- Callcenter-Tracking (Problem 2) ----

export type CallbackStatus = 'offen' | 'in_bearbeitung' | 'erledigt' | 'ueberfaellig'
export type CallbackPriority = 'niedrig' | 'mittel' | 'hoch' | 'dringend'

export interface Callback {
  id: string
  customerName: string
  customerPhone: string
  reason: string
  notes: string
  assignedAdvisor: string
  status: CallbackStatus
  priority: CallbackPriority
  createdAt: string // ISO datetime
  updatedAt: string
  completedAt?: string
  completionNotes?: string
  slaDeadline: string // ISO datetime (2h after creation)
}

export interface Advisor {
  id: string
  name: string
  avatar: string
  role: string
  openCallbacks: number
  completedToday: number
  overdueCallbacks: number
}

// ---- KI-Inserate (Problem 3) ----

export type ListingStatus = 'entwurf' | 'live' | 'archiviert'
export type PriceCategory = 'sehr_gut' | 'gut' | 'zufriedenstellend' | 'erhoht' | 'stark_erhoht'

export interface Listing {
  id: string
  vehicleId: string
  title: string
  description: string
  price: number
  status: ListingStatus
  platform: string[]
  images: string[]
  priceCategory: PriceCategory
  marketPrice: number
  aiGenerated: boolean
  aiConfidence: number // 0-100
  createdAt: string
  updatedAt: string
  views: number
  inquiries: number
}

// ---- Nachrichten-Zentrale (Problem 4) ----

export type MessageChannel = 'whatsapp' | 'email' | 'sms' | 'mobile_de' | 'messenger' | 'instagram' | 'telegram'
export type ConversationStatus = 'offen' | 'spaeter' | 'erledigt'

export interface Conversation {
  id: string
  customerName: string
  customerPhone?: string
  customerEmail?: string
  channel: MessageChannel
  lastMessage: string
  lastMessageAt: string
  unread: boolean
  unreadCount: number
  assignedTo?: string
  vehicleInterest?: string
  label?: string
  inbox?: string
  status?: ConversationStatus
  messages: Message[]
}

export interface Message {
  id: string
  conversationId: string
  content: string
  sender: 'customer' | 'advisor'
  senderName: string
  timestamp: string
  read: boolean
  channel: MessageChannel
  imageUrl?: string
}

// ---- KYC & Verifizierung (Problem 5) ----

export type KYCStatus = 'eingereicht' | 'in_pruefung' | 'verifiziert' | 'abgelehnt' | 'manuell_pruefen'
export type CustomerType = 'privat' | 'gewerbe'

export interface KYCSubmission {
  id: string
  customerName: string
  customerType: CustomerType
  email: string
  phone: string
  status: KYCStatus
  submittedAt: string
  reviewedAt?: string
  reviewedBy?: string
  vehicleIds?: string[]
  // Privatkunde
  documentType?: 'personalausweis' | 'reisepass'
  documentNumber?: string
  dateOfBirth?: string
  address?: string
  privacyMethod?: 'upload' | 'link'
  // Gewerbekunde
  companyName?: string
  handelsregisterNr?: string
  ustIdNr?: string
  // Results
  checkResults?: KYCCheckResult[]
  notes?: string
}

export interface KYCCheckResult {
  check: string
  passed: boolean
  detail: string
}

// ---- Dashboard ----

export interface DashboardStats {
  werkstatt: { aktiv: number; ueberfaellig: number }
  rueckrufe: { offen: number; ueberfaellig: number }
  inserate: { live: number; entwuerfe: number }
  nachrichten: { ungelesen: number; heuteNeu: number }
  kyc: { offen: number; zuPruefen: number }
}

export interface ActivityDetail {
  label: string
  value: string
}

export interface ActivityEntry {
  id: string
  module: 'werkstatt' | 'callcenter' | 'inserate' | 'nachrichten' | 'kyc'
  action: string
  subject: string
  description: string
  user: string
  timestamp: string
  link?: string
  details?: ActivityDetail[]
}

// ---- Navigation ----

export interface NavItem {
  title: string
  href: string
  icon: string
  badge?: number
  children?: NavItem[]
}
