'use client'

import { useCallback } from 'react'
import { useVoiceParser } from '@/hooks/useVoiceParser'
import type { ConversationInboxView } from '@/lib/stores/conversation-store'
import type {
  Advisor,
  Callback,
  CallbackStatus,
  Conversation,
  ConversationStatus,
  KYCStatus,
  KYCSubmission,
  Listing,
  ListingStatus,
  Vehicle,
  VehicleLocation,
  VehicleStatus,
} from '@/lib/types'

const callbackStatusKeywords: Record<CallbackStatus, string[]> = {
  offen: ['offen'],
  in_bearbeitung: ['in bearbeitung', 'in_bearbeitung', 'bearbeitung'],
  erledigt: ['erledigt', 'abschliessen', 'abschließen', 'abgeschlossen', 'fertig'],
  ueberfaellig: ['ueberfaellig', 'überfällig'],
}

const listingStatusKeywords: Record<ListingStatus, string[]> = {
  entwurf: ['entwurf', 'entwurfsmodus'],
  live: ['live', 'veroeffentlichen', 'veröffentlichen', 'online'],
  archiviert: ['archiviert', 'archivieren', 'ins archiv'],
}

const kycStatusKeywords: Record<KYCStatus, string[]> = {
  eingereicht: ['eingereicht'],
  in_pruefung: ['in pruefung', 'in_pruefung', 'pruefen', 'prüfen'],
  verifiziert: ['verifiziert', 'freigeben', 'genehmigen'],
  abgelehnt: ['abgelehnt', 'ablehnen'],
  manuell_pruefen: ['manuell pruefen', 'manuell_pruefen', 'manuell'],
}

const conversationStatusKeywords: Record<ConversationStatus, string[]> = {
  offen: ['offen'],
  spaeter: ['spaeter', 'später'],
  erledigt: ['erledigt', 'abschliessen', 'abschließen', 'abgeschlossen', 'fertig'],
}

const inboxViewKeywords: Record<ConversationInboxView, string[]> = {
  alle: ['alle unterhaltungen', 'alle nachrichten'],
  ungelesen: ['ungelesen', 'ungelesene'],
  mir: ['mir zugewiesen', 'meine unterhaltungen'],
  nicht: ['nicht zugewiesen', 'ohne zuweisung'],
  markiert: ['markiert', 'markierte'],
  papierkorb: ['papierkorb', 'archiv'],
  spam: ['spam'],
  Zentrale: ['zentrale'],
  'Standort Berlin': ['standort berlin', 'berlin'],
  'Standort München': ['standort muenchen', 'standort münchen', 'muenchen', 'münchen'],
  Vertrieb: ['vertrieb'],
  Marketing: ['marketing'],
  vip: ['vip', 'vip kunden'],
  'berlin-mktg': ['berliner marketing'],
  'london-mktg': ['londoner marketing', 'london marketing'],
}

const navigationTargets = [
  { route: '/dashboard', label: 'Dashboard', keywords: ['dashboard', 'startseite', 'uebersicht', 'übersicht'] },
  { route: '/fahrzeuge', label: 'Fahrzeuge', keywords: ['fahrzeuge', 'fahrzeugliste'] },
  { route: '/fahrzeuge/werkstatt', label: 'Werkstatt-Board', keywords: ['werkstatt board', 'werkstatt', 'kanban'] },
  { route: '/callcenter', label: 'Callcenter', keywords: ['callcenter', 'rueckruf', 'rückruf', 'callback'] },
  { route: '/inserate', label: 'Inserate', keywords: ['inserate', 'inserat', 'anzeigen'] },
  { route: '/nachrichten', label: 'Nachrichten', keywords: ['nachrichten', 'postfach', 'messages'] },
  { route: '/verifizierung', label: 'Verifizierung', keywords: ['verifizierung', 'kyc', 'ident'] },
] as const

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

function scoreCandidate(text: string, candidate: string) {
  const normalizedCandidate = normalizeText(candidate)
  if (!normalizedCandidate) return 0

  let score = 0
  if (text.includes(normalizedCandidate)) {
    score += 4
  }

  normalizedCandidate
    .split(' ')
    .filter((token) => token.length > 2)
    .forEach((token) => {
      if (text.includes(token)) {
        score += 1
      }
    })

  return score
}

function findBestEntityMatch<T>(
  text: string,
  items: T[],
  getCandidate: (item: T) => string
): { item: T | null; score: number } {
  let bestMatch: T | null = null
  let bestScore = 0

  for (const item of items) {
    const score = scoreCandidate(text, getCandidate(item))
    if (score > bestScore) {
      bestScore = score
      bestMatch = item
    }
  }

  return { item: bestMatch, score: bestScore }
}

function parseCompletionNotes(transcript: string) {
  const noteMatch = transcript.match(/(?:notiz|abschlussnotiz)\s*[:,-]?\s*(.+)$/i)
  if (!noteMatch?.[1]) return null
  const notes = noteMatch[1].trim()
  return notes.length >= 3 ? notes : null
}

export interface VoiceIntentContext {
  vehicles: Vehicle[]
  callbacks: Callback[]
  listings: Listing[]
  submissions: KYCSubmission[]
  conversations: Conversation[]
  advisors: Advisor[]
}

interface VoiceIntentBase {
  transcript: string
  summary: string
  canApply: boolean
  issues: string[]
}

export interface NavigateIntent extends VoiceIntentBase {
  type: 'navigate'
  route: string
  routeLabel: string
  canApply: true
}

export interface VehicleUpdateIntent extends VoiceIntentBase {
  type: 'vehicle_update'
  vehicle: Vehicle | null
  status: VehicleStatus | null
  location: VehicleLocation | null
  nextStep: string | null
}

export interface CallbackUpdateIntent extends VoiceIntentBase {
  type: 'callback_update'
  callback: Callback | null
  status: CallbackStatus | null
  completionNotes: string | null
}

export interface ListingUpdateIntent extends VoiceIntentBase {
  type: 'listing_update'
  listing: Listing | null
  status: ListingStatus | null
}

export interface KYCUpdateIntent extends VoiceIntentBase {
  type: 'kyc_update'
  submission: KYCSubmission | null
  status: KYCStatus | null
}

export interface MessageUpdateIntent extends VoiceIntentBase {
  type: 'message_update'
  conversation: Conversation | null
  status: ConversationStatus | null
  statusFilter: ConversationStatus | null
  inboxView: ConversationInboxView | null
  assignee: string | null
  assignmentAction: boolean
  clearAssignment: boolean
}

export interface UnknownIntent extends VoiceIntentBase {
  type: 'unknown'
}

export type ParsedVoiceIntent =
  | NavigateIntent
  | VehicleUpdateIntent
  | CallbackUpdateIntent
  | ListingUpdateIntent
  | KYCUpdateIntent
  | MessageUpdateIntent
  | UnknownIntent

export function useVoiceIntentParser() {
  const { parseTranscript } = useVoiceParser()

  const parseIntent = useCallback((transcript: string, context: VoiceIntentContext): ParsedVoiceIntent => {
    const normalizedTranscript = normalizeText(transcript)
    const messageStatusKeyword = getLastKeywordMatch(normalizedTranscript, conversationStatusKeywords)
    const inboxViewKeyword = getLastKeywordMatch(normalizedTranscript, inboxViewKeywords)
    const hasMessageHint = /(nachricht|nachrichten|unterhaltung|konversation|chat|postfach|inbox)/.test(normalizedTranscript)
    const hasFilterVerb = /(zeige|filter|nur|ansicht|liste|öffne|oeffne)/.test(normalizedTranscript)
    const hasAssignmentAction =
      /(zuweisen|weise .* zu|uebergeben|übergeben|zuordnung)/.test(normalizedTranscript)
      || /(nicht zugewiesen|ohne zuweisung|zuweisung entfernen|entferne zuweisung)/.test(normalizedTranscript)
    const clearAssignment = /(nicht zugewiesen|ohne zuweisung|zuweisung entfernen|entferne zuweisung)/.test(normalizedTranscript)

    const conversationCandidate = findBestEntityMatch(
      normalizedTranscript,
      context.conversations,
      (conversation) => `${conversation.customerName} ${conversation.vehicleInterest ?? ''} ${conversation.lastMessage}`
    )
    const matchedConversation = conversationCandidate.score >= 2 ? conversationCandidate.item : null

    const advisorCandidate = findBestEntityMatch(
      normalizedTranscript,
      context.advisors,
      (advisor) => advisor.name
    )
    const matchedAdvisor =
      advisorCandidate.score >= 2
        ? advisorCandidate.item?.name ?? null
        : null

    const shouldApplyStatusFilter =
      Boolean(messageStatusKeyword)
      && !matchedConversation
      && hasFilterVerb
    const messageStatus = shouldApplyStatusFilter ? null : messageStatusKeyword
    const statusFilter = shouldApplyStatusFilter ? messageStatusKeyword : null

    const hasMessageAction = Boolean(inboxViewKeyword || messageStatusKeyword || hasAssignmentAction)

    if (hasMessageAction && (hasMessageHint || matchedConversation || inboxViewKeyword)) {
      const statusCanApply = messageStatus ? Boolean(matchedConversation) : true
      const assignmentCanApply = hasAssignmentAction
        ? Boolean(matchedConversation && (clearAssignment || matchedAdvisor))
        : true
      const canApply = statusCanApply && assignmentCanApply

      const summaryParts: string[] = []
      if (inboxViewKeyword) summaryParts.push(`Inbox-Filter -> ${inboxViewKeyword}`)
      if (statusFilter) summaryParts.push(`Status-Filter -> ${statusFilter}`)
      if (messageStatus && matchedConversation) summaryParts.push(`Konversation -> ${matchedConversation.customerName} (${messageStatus})`)
      if (hasAssignmentAction && matchedConversation) {
        summaryParts.push(clearAssignment
          ? `Zuweisung entfernt bei ${matchedConversation.customerName}`
          : `Zuweisen -> ${matchedConversation.customerName} an ${matchedAdvisor ?? 'unbekannt'}`)
      }

      return {
        type: 'message_update',
        transcript,
        conversation: matchedConversation,
        status: messageStatus,
        statusFilter,
        inboxView: inboxViewKeyword,
        assignee: clearAssignment ? null : matchedAdvisor,
        assignmentAction: hasAssignmentAction,
        clearAssignment,
        summary: summaryParts.join(' | ') || 'Nachrichten-Update nicht vollständig erkannt',
        canApply,
        issues: [
          ...(messageStatus && !matchedConversation ? ['Keine passende Unterhaltung für Status-Update erkannt.'] : []),
          ...(hasAssignmentAction && !matchedConversation ? ['Keine passende Unterhaltung für Zuweisung erkannt.'] : []),
          ...(hasAssignmentAction && !clearAssignment && !matchedAdvisor ? ['Kein Berater für Zuweisung erkannt.'] : []),
        ],
      }
    }

    const hasNavigationVerb = /(oeffne|öffne|gehe zu|wechsel zu|navigiere|zeige|springe zu)/.test(normalizedTranscript)

    if (hasNavigationVerb) {
      const target = navigationTargets.find(({ keywords }) => keywords.some((keyword) => normalizedTranscript.includes(keyword)))
      if (target) {
        return {
          type: 'navigate',
          transcript,
          route: target.route,
          routeLabel: target.label,
          summary: `Navigation -> ${target.label}`,
          canApply: true,
          issues: [],
        }
      }
    }

    const callbackStatus = getLastKeywordMatch(normalizedTranscript, callbackStatusKeywords)
    const callbackCandidate = findBestEntityMatch(
      normalizedTranscript,
      context.callbacks,
      (callback) => `${callback.customerName} ${callback.reason}`
    )
    const callbackHint = /(callback|rueckruf|rückruf|callcenter)/.test(normalizedTranscript)
    const matchedCallback =
      callbackCandidate.score >= (callbackHint ? 1 : 2)
        ? callbackCandidate.item
        : null
    if (callbackHint || (callbackStatus && matchedCallback)) {
      const canApply = Boolean(matchedCallback && callbackStatus)
      return {
        type: 'callback_update',
        transcript,
        callback: matchedCallback,
        status: callbackStatus,
        completionNotes: parseCompletionNotes(transcript),
        summary: canApply
          ? `Callback -> ${matchedCallback?.customerName} (${callbackStatus})`
          : 'Callback-Update nicht vollständig erkannt',
        canApply,
        issues: [
          ...(!matchedCallback ? ['Kein passender Rückruf erkannt.'] : []),
          ...(!callbackStatus ? ['Kein Callback-Status erkannt.'] : []),
        ],
      }
    }

    const listingStatus = getLastKeywordMatch(normalizedTranscript, listingStatusKeywords)
    const listingHint = /(inserat|inserate|anzeige|anzeigen)/.test(normalizedTranscript)
    if (listingHint) {
      const listingCandidate = findBestEntityMatch(
        normalizedTranscript,
        context.listings,
        (listing) => listing.title
      )
      const matchedListing =
        listingCandidate.score >= (listingHint ? 1 : 2)
          ? listingCandidate.item
          : null
      const canApply = Boolean(matchedListing && listingStatus)

      return {
        type: 'listing_update',
        transcript,
        listing: matchedListing,
        status: listingStatus,
        summary: canApply
          ? `Inserat -> ${matchedListing?.title} (${listingStatus})`
          : 'Inserat-Update nicht vollständig erkannt',
        canApply,
        issues: [
          ...(!matchedListing ? ['Kein passendes Inserat erkannt.'] : []),
          ...(!listingStatus ? ['Kein Inserat-Status erkannt.'] : []),
        ],
      }
    }

    const kycStatus = getLastKeywordMatch(normalizedTranscript, kycStatusKeywords)
    const kycHint = /(kyc|verifizierung|ident|identitaet|identität)/.test(normalizedTranscript)
    if (kycHint || (kycStatus && context.submissions.length > 0)) {
      const submissionCandidate = findBestEntityMatch(
        normalizedTranscript,
        context.submissions,
        (submission) => submission.customerName
      )
      const matchedSubmission =
        submissionCandidate.score >= (kycHint ? 1 : 2)
          ? submissionCandidate.item
          : null
      const canApply = Boolean(matchedSubmission && kycStatus)

      return {
        type: 'kyc_update',
        transcript,
        submission: matchedSubmission,
        status: kycStatus,
        summary: canApply
          ? `KYC -> ${matchedSubmission?.customerName} (${kycStatus})`
          : 'KYC-Update nicht vollständig erkannt',
        canApply,
        issues: [
          ...(!matchedSubmission ? ['Keine passende Verifizierung erkannt.'] : []),
          ...(!kycStatus ? ['Kein KYC-Status erkannt.'] : []),
        ],
      }
    }

    const vehicleCommand = parseTranscript(transcript, context.vehicles)
    if (vehicleCommand.vehicle || vehicleCommand.status || vehicleCommand.location || vehicleCommand.nextStep) {
      return {
        type: 'vehicle_update',
        transcript,
        vehicle: vehicleCommand.vehicle,
        status: vehicleCommand.status,
        location: vehicleCommand.location,
        nextStep: vehicleCommand.nextStep,
        summary: vehicleCommand.summary,
        canApply: vehicleCommand.canApply,
        issues: vehicleCommand.issues,
      }
    }

    return {
      type: 'unknown',
      transcript,
      summary: 'Kein passender Intent erkannt',
      canApply: false,
      issues: ['Befehl konnte keinem Modul zugeordnet werden.'],
    }
  }, [parseTranscript])

  return { parseIntent }
}
