'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'
import { useVehicleStore } from '@/lib/stores/vehicle-store'
import { useCallbackStore } from '@/lib/stores/callback-store'
import { useListingStore } from '@/lib/stores/listing-store'
import { useKYCStore } from '@/lib/stores/kyc-store'
import { mockAdvisors } from '@/lib/mock-data'
import { useConversationStore } from '@/lib/stores/conversation-store'
import { useVoiceIntentParser, type ParsedVoiceIntent } from '@/hooks/useVoiceIntentParser'
import { VoiceButton } from '@/components/voice/VoiceButton'
import { TranscriptFeedback } from '@/components/voice/TranscriptFeedback'

export function VoiceControl() {
  const router = useRouter()
  const vehicles = useVehicleStore((state) => state.vehicles)
  const applyVoiceUpdate = useVehicleStore((state) => state.applyVoiceUpdate)
  const callbacks = useCallbackStore((state) => state.callbacks)
  const updateCallbackStatus = useCallbackStore((state) => state.updateCallbackStatus)
  const listings = useListingStore((state) => state.listings)
  const updateListingStatus = useListingStore((state) => state.updateListingStatus)
  const submissions = useKYCStore((state) => state.submissions)
  const updateSubmissionStatus = useKYCStore((state) => state.updateSubmissionStatus)
  const conversations = useConversationStore((state) => state.conversations)
  const setConversationView = useConversationStore((state) => state.setView)
  const setConversationStatusFilter = useConversationStore((state) => state.setStatusFilter)
  const setSelectedConversation = useConversationStore((state) => state.setSelectedConversation)
  const updateConversationStatus = useConversationStore((state) => state.updateConversationStatus)
  const assignConversation = useConversationStore((state) => state.assignConversation)
  const { parseIntent } = useVoiceIntentParser()

  const [pendingIntent, setPendingIntent] = useState<ParsedVoiceIntent | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!successMessage) return

    const timeoutId = window.setTimeout(() => {
      setSuccessMessage(null)
    }, 2600)

    return () => window.clearTimeout(timeoutId)
  }, [successMessage])

  const handleTranscript = useCallback(
    async (transcript: string) => {
      const intent = parseIntent(transcript, {
        vehicles,
        callbacks,
        listings,
        submissions,
        conversations,
        advisors: mockAdvisors,
      })
      setPendingIntent(intent)
    },
    [callbacks, conversations, listings, parseIntent, submissions, vehicles]
  )

  const handleConfirm = useCallback(() => {
    if (!pendingIntent || !pendingIntent.canApply) return

    if (pendingIntent.type === 'vehicle_update' && pendingIntent.vehicle) {
      applyVoiceUpdate({
        vehicleId: pendingIntent.vehicle.id,
        status: pendingIntent.status,
        location: pendingIntent.location,
        nextStep: pendingIntent.nextStep,
        transcript: pendingIntent.transcript,
      })
    }

    if (pendingIntent.type === 'callback_update' && pendingIntent.callback && pendingIntent.status) {
      updateCallbackStatus({
        callbackId: pendingIntent.callback.id,
        status: pendingIntent.status,
        completionNotes: pendingIntent.completionNotes ?? undefined,
      })
    }

    if (pendingIntent.type === 'listing_update' && pendingIntent.listing && pendingIntent.status) {
      updateListingStatus(pendingIntent.listing.id, pendingIntent.status)
    }

    if (pendingIntent.type === 'kyc_update' && pendingIntent.submission && pendingIntent.status) {
      updateSubmissionStatus(pendingIntent.submission.id, pendingIntent.status)
    }

    if (pendingIntent.type === 'navigate') {
      router.push(pendingIntent.route)
    }

    if (pendingIntent.type === 'message_update') {
      if (pendingIntent.inboxView) {
        setConversationView(pendingIntent.inboxView)
      }
      if (pendingIntent.statusFilter) {
        setConversationStatusFilter(pendingIntent.statusFilter)
      }
      if (pendingIntent.conversation) {
        setSelectedConversation(pendingIntent.conversation.id)
      }
      if (pendingIntent.status && pendingIntent.conversation) {
        updateConversationStatus(pendingIntent.conversation.id, pendingIntent.status)
      }
      if (pendingIntent.assignmentAction && pendingIntent.conversation) {
        assignConversation(
          pendingIntent.conversation.id,
          pendingIntent.clearAssignment ? null : pendingIntent.assignee
        )
      }
    }

    setSuccessMessage(pendingIntent.summary)
    setPendingIntent(null)
  }, [
    applyVoiceUpdate,
    pendingIntent,
    router,
    assignConversation,
    setConversationStatusFilter,
    setConversationView,
    setSelectedConversation,
    updateCallbackStatus,
    updateConversationStatus,
    updateListingStatus,
    updateSubmissionStatus,
  ])

  const handleCancel = useCallback(() => {
    setPendingIntent(null)
  }, [])

  return (
    <>
      {successMessage && (
        <div className="fixed bottom-24 right-6 z-50 max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="rounded-2xl bg-card border border-border/60 shadow-xl px-4 py-3 backdrop-blur-sm">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span className="text-sm">{successMessage}</span>
            </div>
          </div>
        </div>
      )}

      <TranscriptFeedback
        intent={pendingIntent}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />

      <VoiceButton
        onTranscript={handleTranscript}
        disabled={Boolean(pendingIntent)}
      />
    </>
  )
}
