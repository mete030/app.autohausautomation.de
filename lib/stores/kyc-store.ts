'use client'

import { create } from 'zustand'
import { mockKYCSubmissions } from '@/lib/mock-data'
import type { KYCStatus, KYCSubmission } from '@/lib/types'

const initialSubmissions = mockKYCSubmissions.map((submission) => ({
  ...submission,
  checkResults: submission.checkResults ? [...submission.checkResults] : undefined,
}))

interface KYCStoreState {
  submissions: KYCSubmission[]
  updateSubmissionStatus: (submissionId: string, status: KYCStatus) => void
}

export const useKYCStore = create<KYCStoreState>((set) => ({
  submissions: initialSubmissions,

  updateSubmissionStatus: (submissionId, status) => {
    set((state) => ({
      submissions: state.submissions.map((submission) => {
        if (submission.id !== submissionId) return submission

        const shouldSetReviewedAt = status === 'verifiziert' || status === 'abgelehnt' || status === 'in_pruefung'
        return {
          ...submission,
          status,
          reviewedAt: shouldSetReviewedAt ? new Date().toISOString() : submission.reviewedAt,
          reviewedBy: shouldSetReviewedAt ? 'Voice Assistant' : submission.reviewedBy,
        }
      }),
    }))
  },
}))
