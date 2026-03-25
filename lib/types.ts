// ============================================
// Wackenhut Autohaus Management Platform - Types
// ============================================

// ---- Fahrzeuge & Werkstatt (Problem 1) ----

export type VehicleStatus = 'eingang' | 'inspektion' | 'werkstatt' | 'aufbereitung' | 'verkaufsbereit' | 'verkauft'
export type VehicleLocation =
  | 'Hof A'
  | 'Hof B'
  | 'Werkstatt'
  | 'Showroom'
  | 'Aufbereitung'
  | 'Fotozone'
  | 'Externer Lackierer'
export type VehicleBlocker =
  | 'keiner'
  | 'wartet_auf_teile'
  | 'wartet_auf_freigabe'
  | 'wartet_auf_lackierer'
  | 'wartet_auf_aufbereitung'
  | 'wartet_auf_fotos'
  | 'wartet_auf_inserat'
  | 'wartet_auf_rueckruf'
export type VehicleOwnerRole =
  | 'ankauf'
  | 'vorpark'
  | 'service'
  | 'werkstatt'
  | 'aufbereitung'
  | 'foto_inserat'
  | 'verkauf'
export type VehicleOperationalLane = 'kritisch' | 'in_arbeit' | 'blockiert' | 'bereit'
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
  nextStep: string
  ownerRole: VehicleOwnerRole
  blocker: VehicleBlocker
  currentStepStartedAt: string
  lastUpdatedAt: string
  slaDueAt: string
  priorityNote?: string
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
  source?: 'voice' | 'manual' | 'system'
}

export type VehicleAuctionStatus = 'aktiv' | 'verkauft' | 'reserviert'

export interface VehicleListRowLegacy {
  id: string
  vehicleId: string
  autoId: string
  catalogNumber: string
  kNumber: string
  lotNumber: string
  minimumPrice: number
  currentBid: number
  auctionStatus: VehicleAuctionStatus
  imagesAvailable: boolean
  auctionDate: string // ISO date
  docsCoc: boolean
  docsServiceHistory: boolean
  docsSpareKey: boolean
  huValidUntil: string // ISO date
  damageNote: string
  lastAuction: string
  listingUrl: string
  contractTextUrl: string
  rowLocked?: boolean
}

// ---- Callcenter-Tracking (Problem 2) ----

export type CallbackStatus = 'offen' | 'in_bearbeitung' | 'erledigt' | 'ueberfaellig'
export type CallbackPriority = 'niedrig' | 'mittel' | 'hoch' | 'dringend'
export type CallSource = 'telefon' | 'website' | 'whatsapp' | 'ki_agent' | 'manuell'
export type AgentType = 'mensch' | 'ki'

export interface CallAgent {
  id: string
  name: string
  type: AgentType
}

// ---- Employee / Mitarbeiter System ----

export type EmployeeRole = 'verkaufer' | 'serviceberater' | 'werkstattleiter' | 'backoffice' | 'geschaeftsfuehrung' | 'callcenter_agent'
export type EmployeeStatus = 'aktiv' | 'abwesend' | 'pause'

export interface Employee {
  id: string
  name: string
  role: EmployeeRole
  email?: string
  phone?: string
  status: EmployeeStatus
  isCallAgent: boolean
  isSupervisor: boolean
  createdAt: string
}

// ---- Escalation System ----

export type EscalationLevel = 1 | 2 | 3
export type EscalationTrigger = 'manuell' | 'zeit_basiert' | 'sla_verletzung'

export interface EscalationRule {
  id: string
  name: string
  triggerAfterMinutes: number
  fromLevel: EscalationLevel
  toLevel: EscalationLevel
  notifyChannels: ('app' | 'email')[]
  isActive: boolean
}

export interface EscalationEvent {
  id: string
  callbackId: string
  fromLevel: EscalationLevel
  toLevel: EscalationLevel
  trigger: EscalationTrigger
  escalatedBy: string
  escalatedTo: string
  escalatedAt: string
  note?: string
}

// ---- Reminder System ----

export type ReminderStatus = 'ausstehend' | 'angezeigt' | 'erledigt'

export interface Reminder {
  id: string
  callbackId: string
  employeeId: string
  reminderAt: string
  message: string
  status: ReminderStatus
  createdAt: string
  createdBy: string
}

// ---- SLA Configuration ----

export interface SlaConfig {
  defaultMinutes: number
  perPriority: Record<CallbackPriority, number>
}

// ---- Activity Log for Callback ----

export type CallbackActivityType =
  | 'erstellt'
  | 'zugewiesen'
  | 'status_geaendert'
  | 'eskaliert'
  | 'erinnerung_gesetzt'
  | 'erinnerung_erledigt'
  | 'email_gesendet'
  | 'notiz_hinzugefuegt'
  | 'abgeschlossen'

export interface CallbackActivity {
  id: string
  type: CallbackActivityType
  description: string
  performedBy: string
  performedAt: string
  metadata?: Record<string, string>
}

export interface Callback {
  id: string
  customerName: string
  customerPhone: string
  reason: string
  notes: string
  assignedAdvisor: string
  assignedEmployeeId?: string
  status: CallbackStatus
  priority: CallbackPriority
  createdAt: string // ISO datetime
  updatedAt: string
  completedAt?: string
  completionNotes?: string
  slaDeadline: string // ISO datetime
  slaDurationMinutes: number
  dueAt: string // ISO datetime
  takenBy: CallAgent
  callTranscript?: string
  callDuration?: number // seconds
  source: CallSource
  reassignedFrom?: string
  reassignedAt?: string
  escalatedAt?: string
  escalatedBy?: string
  escalationLevel: EscalationLevel
  escalationHistory: EscalationEvent[]
  reminders: string[]
  activityLog: CallbackActivity[]
  dataOrigin?: 'mock' | 'persisted'
  isPersisted?: boolean
}

export type PersistedCallbackDto = Callback & {
  dataOrigin: 'persisted'
  isPersisted: true
}

export interface CallbackCompletionLinkViewModel {
  callbackId: string
  customerName: string
  reason: string
  assignedAdvisor: string
  status: CallbackStatus
  expiresAt: string
  completionNotes?: string
  isAlreadyCompleted: boolean
  isLinkExpired: boolean
  isLinkUsed: boolean
  isInvalid: boolean
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

export type MessageChannel = 'whatsapp' | 'email' | 'sms' | 'mobile_de' | 'messenger' | 'instagram' | 'telegram' | 'website' | 'website_chatbot'
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

export type CustomerSegment =
  | 'privat'
  | 'gewerbe'
  | 'flotte'
  | 'haendler'
  | 'export'
  | 'diplomat'

// Backward-compatible alias
export type CustomerType = CustomerSegment

// ---- KYC Document Verification System ----

export type KYCDocumentCategory =
  | 'identitaetsnachweis'
  | 'unternehmensnachweis'
  | 'steuernachweis'
  | 'handelsnachweis'
  | 'transportnachweis'
  | 'sondernachweis'

export type KYCVerificationMethod = 'automated' | 'manual' | 'hybrid'

export type AutomationSource =
  | 'ocr_security'
  | 'vies'
  | 'bundesanzeiger'
  | 'transparenzregister'
  | 'email_link'
  | 'none'

export type KYCDocumentVerificationStatus =
  | 'nicht_eingereicht'
  | 'hochgeladen'
  | 'wird_geprueft'
  | 'verifiziert'
  | 'abgelehnt'
  | 'manuell_pruefen'

export interface KYCDocumentField {
  key: string
  label: string
  placeholder: string
  type: 'text' | 'date' | 'select'
  options?: { value: string; label: string }[]
  validation?: string
}

export interface KYCDocumentConfig {
  id: string
  name: string
  description: string
  category: KYCDocumentCategory
  verificationMethod: KYCVerificationMethod
  automationSource: AutomationSource
  required: boolean
  requiredFields?: KYCDocumentField[]
  acceptedFileTypes?: string[]
  maxFileSizeMB?: number
}

export interface KYCDocumentSubmission {
  documentConfigId: string
  status: KYCDocumentVerificationStatus
  uploadedAt?: string
  verifiedAt?: string
  fileUrl?: string
  fileName?: string
  fieldValues?: Record<string, string>
  checkResult?: KYCCheckResult
  notes?: string
}

export interface KYCSegmentConfig {
  segment: CustomerSegment
  label: string
  shortDescription: string
  icon: string
  color: string
  accentBg: string
  requiredDocuments: string[]
  optionalDocuments?: string[]
}

export interface KYCSubmission {
  id: string
  customerName: string
  customerType: CustomerSegment
  email: string
  phone: string
  status: KYCStatus
  submittedAt: string
  reviewedAt?: string
  reviewedBy?: string
  vehicleIds?: string[]
  // Privatkunde (legacy)
  documentType?: 'personalausweis' | 'reisepass'
  documentNumber?: string
  dateOfBirth?: string
  address?: string
  privacyMethod?: 'upload' | 'link'
  // Gewerbekunde (legacy)
  companyName?: string
  handelsregisterNr?: string
  ustIdNr?: string
  // Results
  checkResults?: KYCCheckResult[]
  notes?: string
  documentBundle?: DocumentBundleState
  // Segment-based document tracking (new)
  documentSubmissions?: KYCDocumentSubmission[]
  verificationProgress?: number
}

export interface KYCCheckResult {
  check: string
  passed: boolean
  detail: string
}

export type DocumentBundleStatus = 'idle' | 'generating' | 'ready' | 'sending' | 'sent'
export type KYCDocumentType = 'kaufbestaetigung' | 'abholschein' | 'rechnung' | 'gelangensbestaetigung'

export interface DocumentBundleState {
  status: DocumentBundleStatus
  generatedAt?: string
  sentAt?: string
}

// ---- Buchhaltung (Problem 6) ----

export type AccountingDocumentType = 'eingangsrechnung' | 'ausgangsrechnung'
export type AccountingDocumentStatus = 'neu' | 'ki_extrahiert' | 'freigabe_noetig' | 'freigegeben' | 'gebucht' | 'fehler'
export type AccountingTaxMode = 'regelbesteuerung_19' | 'differenzbesteuerung_25a'
export type AccountingPaymentStatus = 'bezahlt' | 'offen' | 'ueberfaellig'
export type AccountingFlagSeverity = 'info' | 'warn' | 'critical'
export type VehicleAccountingCaseStatus = 'offen' | 'pruefung' | 'exportbereit' | 'exportiert'
export type AccountingExportBatchStatus = 'bereit' | 'erstellt'

export interface AccountingFlag {
  id: string
  code: string
  severity: AccountingFlagSeverity
  message: string
  resolved: boolean
}

export interface AccountingExtractionField {
  key: string
  label: string
  value: string
  confidence: number // 0-100
  required?: boolean
}

export interface AccountingBookingProposal {
  kontoSoll: string
  kontoHaben: string
  steuerSchluessel: string
  netto: number
  ust: number
  brutto: number
}

export interface AccountingDocument {
  id: string
  month: string // YYYY-MM
  vehicleId: string | null
  type: AccountingDocumentType
  status: AccountingDocumentStatus
  paymentStatus: AccountingPaymentStatus
  taxMode: AccountingTaxMode
  invoiceNumber: string
  invoiceDate: string // ISO date
  partnerName: string
  netAmount: number
  vatAmount: number
  grossAmount: number
  currency: 'EUR'
  pdfUrl: string
  aiConfidence: number // 0-100
  extractionFields: AccountingExtractionField[]
  bookingProposal: AccountingBookingProposal
  flags: AccountingFlag[]
  createdAt: string
  updatedAt: string
}

export interface VehicleAccountingCase {
  id: string
  month: string // YYYY-MM
  vehicleId: string
  incomingDocumentId?: string
  outgoingDocumentId?: string
  hasIncomingInvoice: boolean
  hasOutgoingInvoice: boolean
  taxMode: AccountingTaxMode
  purchaseAmount?: number
  saleAmount?: number
  marginAmount?: number
  vatAmount?: number
  status: VehicleAccountingCaseStatus
  blockers: string[]
}

export interface AccountingExportBatch {
  id: string
  month: string // YYYY-MM
  status: AccountingExportBatchStatus
  createdAt: string
  createdBy: string
  documentCount: number
  totals: {
    net: number
    vat: number
    gross: number
  }
  datevCsvUrl: string
  belegZipUrl: string
  protocolUrl?: string
}

// ---- Dashboard ----

export interface DashboardStats {
  werkstatt: { wartend: number; ueberfaellig: number }
  rueckrufe: { offen: number; ueberfaellig: number }
  inserate: { zuErstellen: number; zuVeroeffentlichen: number }
  nachrichten: { ungelesen: number; heuteNeu: number }
  kyc: { offen: number; zuPruefen: number }
  buchhaltung: { offen: number; kritisch: number }
}

export interface ActivityDetail {
  label: string
  value: string
}

export interface ActivityEntry {
  id: string
  module: 'werkstatt' | 'callcenter' | 'inserate' | 'nachrichten' | 'kyc' | 'buchhaltung'
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
