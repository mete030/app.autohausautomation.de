'use client'

import { create } from 'zustand'
import { mockKYCSubmissions } from '@/lib/mock-data'
import type { KYCStatus, KYCSubmission, KYCDocumentSubmission, KYCDocumentVerificationStatus } from '@/lib/types'

const initialSubmissions = mockKYCSubmissions.map((submission) => ({
  ...submission,
  checkResults: submission.checkResults ? [...submission.checkResults] : undefined,
}))

interface KYCStoreState {
  submissions: KYCSubmission[]
  updateSubmissionStatus: (submissionId: string, status: KYCStatus) => void
  addSubmission: (submission: KYCSubmission) => void
  updateDocumentStatus: (
    submissionId: string,
    documentConfigId: string,
    status: KYCDocumentVerificationStatus,
    result?: { passed: boolean; detail: string }
  ) => void
  setDocumentFieldValues: (
    submissionId: string,
    documentConfigId: string,
    fieldValues: Record<string, string>
  ) => void
  uploadDocument: (
    submissionId: string,
    documentConfigId: string,
    fileName: string,
    fileUrl: string
  ) => void
  computeVerificationProgress: (submissionId: string) => number
}

export const useKYCStore = create<KYCStoreState>((set, get) => ({
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

  addSubmission: (submission) => {
    set((state) => ({
      submissions: [submission, ...state.submissions],
    }))
  },

  updateDocumentStatus: (submissionId, documentConfigId, status, result) => {
    set((state) => ({
      submissions: state.submissions.map((sub) => {
        if (sub.id !== submissionId) return sub
        const docs = sub.documentSubmissions ?? []
        const existing = docs.find(d => d.documentConfigId === documentConfigId)
        const checkResult = result ? { check: documentConfigId, passed: result.passed, detail: result.detail } : undefined

        if (existing) {
          return {
            ...sub,
            documentSubmissions: docs.map(d =>
              d.documentConfigId === documentConfigId
                ? {
                    ...d,
                    status,
                    verifiedAt: status === 'verifiziert' ? new Date().toISOString() : d.verifiedAt,
                    checkResult: checkResult ?? d.checkResult,
                  }
                : d
            ),
          }
        }

        const newDoc: KYCDocumentSubmission = {
          documentConfigId,
          status,
          checkResult,
        }
        return { ...sub, documentSubmissions: [...docs, newDoc] }
      }),
    }))
  },

  setDocumentFieldValues: (submissionId, documentConfigId, fieldValues) => {
    set((state) => ({
      submissions: state.submissions.map((sub) => {
        if (sub.id !== submissionId) return sub
        const docs = sub.documentSubmissions ?? []
        const existing = docs.find(d => d.documentConfigId === documentConfigId)

        if (existing) {
          return {
            ...sub,
            documentSubmissions: docs.map(d =>
              d.documentConfigId === documentConfigId
                ? { ...d, fieldValues: { ...d.fieldValues, ...fieldValues } }
                : d
            ),
          }
        }

        return {
          ...sub,
          documentSubmissions: [...docs, { documentConfigId, status: 'nicht_eingereicht' as const, fieldValues }],
        }
      }),
    }))
  },

  uploadDocument: (submissionId, documentConfigId, fileName, fileUrl) => {
    set((state) => ({
      submissions: state.submissions.map((sub) => {
        if (sub.id !== submissionId) return sub
        const docs = sub.documentSubmissions ?? []
        const existing = docs.find(d => d.documentConfigId === documentConfigId)
        const update = {
          status: 'hochgeladen' as const,
          uploadedAt: new Date().toISOString(),
          fileName,
          fileUrl,
        }

        if (existing) {
          return {
            ...sub,
            documentSubmissions: docs.map(d =>
              d.documentConfigId === documentConfigId ? { ...d, ...update } : d
            ),
          }
        }

        return {
          ...sub,
          documentSubmissions: [...docs, { documentConfigId, ...update }],
        }
      }),
    }))
  },

  computeVerificationProgress: (submissionId) => {
    const sub = get().submissions.find(s => s.id === submissionId)
    if (!sub?.documentSubmissions?.length) return 0
    const verified = sub.documentSubmissions.filter(d => d.status === 'verifiziert').length
    return Math.round((verified / sub.documentSubmissions.length) * 100)
  },
}))
