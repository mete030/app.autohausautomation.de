import type { KYCDocumentConfig, KYCSegmentConfig, KYCDocumentCategory, CustomerSegment } from './types'

// ---- Document Definitions ----

export const kycDocuments: Record<string, KYCDocumentConfig> = {
  personalausweis: {
    id: 'personalausweis',
    name: 'Personalausweis / Reisepass',
    description: 'Gültiger amtlicher Lichtbildausweis zur Identitätsfeststellung',
    category: 'identitaetsnachweis',
    verificationMethod: 'hybrid',
    automationSource: 'ocr_security',
    required: true,
    requiredFields: [
      {
        key: 'documentType',
        label: 'Dokumenttyp',
        placeholder: 'Auswählen',
        type: 'select',
        options: [
          { value: 'personalausweis', label: 'Personalausweis' },
          { value: 'reisepass', label: 'Reisepass' },
        ],
      },
      { key: 'documentNumber', label: 'Dokumentennummer', placeholder: 'L01X00T47', type: 'text' },
      { key: 'dateOfBirth', label: 'Geburtsdatum', placeholder: '15.06.1985', type: 'date' },
    ],
    acceptedFileTypes: ['pdf', 'jpg', 'png'],
    maxFileSizeMB: 10,
  },

  handelsregister: {
    id: 'handelsregister',
    name: 'Handelsregisterauszug',
    description: 'Aktueller Auszug aus dem Handelsregister (nicht älter als 6 Monate)',
    category: 'unternehmensnachweis',
    verificationMethod: 'automated',
    automationSource: 'bundesanzeiger',
    required: true,
    requiredFields: [
      { key: 'handelsregisterNr', label: 'Handelsregisternummer', placeholder: 'HRB 123456', type: 'text', validation: 'hrb' },
      { key: 'registergericht', label: 'Registergericht', placeholder: 'Stuttgart', type: 'text' },
    ],
  },

  transparenzregister: {
    id: 'transparenzregister',
    name: 'Transparenzregister',
    description: 'Prüfung des wirtschaftlich Berechtigten gem. § 11 GwG',
    category: 'unternehmensnachweis',
    verificationMethod: 'automated',
    automationSource: 'transparenzregister',
    required: true,
    requiredFields: [
      { key: 'companyName', label: 'Firma / Bezeichnung', placeholder: 'Muster GmbH', type: 'text' },
    ],
  },

  ust_id: {
    id: 'ust_id',
    name: 'USt-IdNr.',
    description: 'Umsatzsteuer-Identifikationsnummer – Prüfung über EU-VIES-System',
    category: 'steuernachweis',
    verificationMethod: 'automated',
    automationSource: 'vies',
    required: true,
    requiredFields: [
      { key: 'ustIdNr', label: 'USt-IdNr.', placeholder: 'DE123456789', type: 'text', validation: 'ust_id' },
    ],
  },

  gewerbeanmeldung: {
    id: 'gewerbeanmeldung',
    name: 'Gewerbeanmeldung',
    description: 'Kopie der Gewerbeanmeldung / Gewerbeummeldung',
    category: 'unternehmensnachweis',
    verificationMethod: 'manual',
    automationSource: 'none',
    required: true,
    acceptedFileTypes: ['pdf', 'jpg', 'png'],
    maxFileSizeMB: 10,
  },

  vollmacht: {
    id: 'vollmacht',
    name: 'Vollmacht',
    description: 'Schriftliche Vollmacht des Unternehmens für den Unterzeichner',
    category: 'unternehmensnachweis',
    verificationMethod: 'manual',
    automationSource: 'none',
    required: false,
    acceptedFileTypes: ['pdf'],
    maxFileSizeMB: 5,
  },

  flottenrahmenvertrag: {
    id: 'flottenrahmenvertrag',
    name: 'Flottenrahmenvertrag',
    description: 'Bestehender Rahmenvertrag für Flottenkonditionen',
    category: 'handelsnachweis',
    verificationMethod: 'manual',
    automationSource: 'none',
    required: true,
    acceptedFileTypes: ['pdf'],
    maxFileSizeMB: 20,
  },

  paragraph2_bescheinigung: {
    id: 'paragraph2_bescheinigung',
    name: '§2 Bescheinigung (Wiederverkäufer)',
    description: 'Nachweis der Wiederverkäufereigenschaft gem. § 2 UStG',
    category: 'steuernachweis',
    verificationMethod: 'manual',
    automationSource: 'none',
    required: true,
    acceptedFileTypes: ['pdf'],
    maxFileSizeMB: 5,
  },

  cmr_frachtbrief: {
    id: 'cmr_frachtbrief',
    name: 'CMR-Frachtbrief',
    description: 'Internationaler Frachtbrief für den Fahrzeugtransport (Feld 24 unterschrieben)',
    category: 'transportnachweis',
    verificationMethod: 'manual',
    automationSource: 'none',
    required: true,
    acceptedFileTypes: ['pdf'],
    maxFileSizeMB: 10,
  },

  gelangensbestaetigung: {
    id: 'gelangensbestaetigung',
    name: 'Gelangensbestätigung',
    description: 'Bestätigung des Erhalts gem. § 17a UStDV für innergemeinschaftliche Lieferung',
    category: 'transportnachweis',
    verificationMethod: 'manual',
    automationSource: 'none',
    required: true,
    acceptedFileTypes: ['pdf'],
    maxFileSizeMB: 5,
  },

  ausfuhrnachweis: {
    id: 'ausfuhrnachweis',
    name: 'Ausfuhr- / Verbringungsnachweis',
    description: 'Nachweis der Ausfuhr bzw. innergemeinschaftlichen Verbringung',
    category: 'transportnachweis',
    verificationMethod: 'manual',
    automationSource: 'none',
    required: true,
    acceptedFileTypes: ['pdf'],
    maxFileSizeMB: 10,
  },

  diplomatenausweis: {
    id: 'diplomatenausweis',
    name: 'Diplomatenausweis',
    description: 'Gültiger Diplomaten- oder NATO-Ausweis',
    category: 'identitaetsnachweis',
    verificationMethod: 'manual',
    automationSource: 'none',
    required: true,
    acceptedFileTypes: ['pdf', 'jpg', 'png'],
    maxFileSizeMB: 10,
  },

  steuerbefreiung: {
    id: 'steuerbefreiung',
    name: 'Steuerbefreiungsbescheinigung',
    description: 'Bescheinigung über die Befreiung von der Umsatzsteuer',
    category: 'steuernachweis',
    verificationMethod: 'manual',
    automationSource: 'none',
    required: true,
    acceptedFileTypes: ['pdf'],
    maxFileSizeMB: 5,
  },
}

// ---- Segment Definitions ----

export const kycSegments: KYCSegmentConfig[] = [
  {
    segment: 'privat',
    label: 'Privatkunde',
    shortDescription: 'Privatperson als Käufer',
    icon: 'User',
    color: 'text-blue-600 dark:text-blue-400',
    accentBg: 'bg-blue-50 dark:bg-blue-950/30',
    requiredDocuments: ['personalausweis'],
  },
  {
    segment: 'gewerbe',
    label: 'Gewerblicher Kunde',
    shortDescription: 'Unternehmen / GmbH / KG',
    icon: 'Building',
    color: 'text-violet-600 dark:text-violet-400',
    accentBg: 'bg-violet-50 dark:bg-violet-950/30',
    requiredDocuments: ['handelsregister', 'transparenzregister', 'ust_id', 'gewerbeanmeldung'],
    optionalDocuments: ['vollmacht'],
  },
  {
    segment: 'flotte',
    label: 'Flottenkunde',
    shortDescription: 'Mehrfahrzeug-Abnehmer',
    icon: 'Truck',
    color: 'text-teal-600 dark:text-teal-400',
    accentBg: 'bg-teal-50 dark:bg-teal-950/30',
    requiredDocuments: ['handelsregister', 'transparenzregister', 'ust_id', 'flottenrahmenvertrag'],
    optionalDocuments: ['vollmacht'],
  },
  {
    segment: 'haendler',
    label: 'Händler (B2B)',
    shortDescription: 'Autohaus-zu-Autohaus',
    icon: 'Handshake',
    color: 'text-amber-600 dark:text-amber-400',
    accentBg: 'bg-amber-50 dark:bg-amber-950/30',
    requiredDocuments: ['handelsregister', 'transparenzregister', 'ust_id', 'gewerbeanmeldung', 'paragraph2_bescheinigung'],
  },
  {
    segment: 'export',
    label: 'Exportkunde',
    shortDescription: 'Auslands- / EU-Käufer',
    icon: 'Globe',
    color: 'text-emerald-600 dark:text-emerald-400',
    accentBg: 'bg-emerald-50 dark:bg-emerald-950/30',
    requiredDocuments: ['personalausweis', 'cmr_frachtbrief', 'gelangensbestaetigung', 'ausfuhrnachweis'],
  },
  {
    segment: 'diplomat',
    label: 'Diplomat / NATO',
    shortDescription: 'Diplomatischer Käufer (steuerfrei)',
    icon: 'Crown',
    color: 'text-rose-600 dark:text-rose-400',
    accentBg: 'bg-rose-50 dark:bg-rose-950/30',
    requiredDocuments: ['diplomatenausweis', 'steuerbefreiung'],
  },
]

// ---- Category Display Config ----

export const kycDocumentCategoryConfig: Record<KYCDocumentCategory, { label: string; icon: string }> = {
  identitaetsnachweis: { label: 'Identitätsnachweis', icon: 'UserCheck' },
  unternehmensnachweis: { label: 'Unternehmensnachweis', icon: 'Building2' },
  steuernachweis: { label: 'Steuernachweis', icon: 'Receipt' },
  handelsnachweis: { label: 'Handelsnachweis', icon: 'FileSignature' },
  transportnachweis: { label: 'Transportnachweis', icon: 'Truck' },
  sondernachweis: { label: 'Sondernachweis', icon: 'Star' },
}

// ---- Helper Functions ----

export function getSegmentConfig(segment: CustomerSegment): KYCSegmentConfig | undefined {
  return kycSegments.find(s => s.segment === segment)
}

export function getDocumentsForSegment(segment: CustomerSegment): KYCDocumentConfig[] {
  const segmentConfig = getSegmentConfig(segment)
  if (!segmentConfig) return []
  const allDocIds = [...segmentConfig.requiredDocuments, ...(segmentConfig.optionalDocuments ?? [])]
  return allDocIds.map(id => kycDocuments[id]).filter(Boolean)
}

export function getRequiredDocumentsForSegment(segment: CustomerSegment): KYCDocumentConfig[] {
  const segmentConfig = getSegmentConfig(segment)
  if (!segmentConfig) return []
  return segmentConfig.requiredDocuments.map(id => kycDocuments[id]).filter(Boolean)
}

export function groupDocumentsByCategory(docs: KYCDocumentConfig[]): [KYCDocumentCategory, KYCDocumentConfig[]][] {
  const groups: Partial<Record<KYCDocumentCategory, KYCDocumentConfig[]>> = {}
  for (const doc of docs) {
    if (!groups[doc.category]) groups[doc.category] = []
    groups[doc.category]!.push(doc)
  }
  return Object.entries(groups) as [KYCDocumentCategory, KYCDocumentConfig[]][]
}
