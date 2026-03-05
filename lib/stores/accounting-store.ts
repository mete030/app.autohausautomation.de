'use client'

import { create } from 'zustand'
import {
  mockAccountingDocuments,
  mockAccountingExportBatches,
  mockVehicleAccountingCases,
} from '@/lib/mock-data'
import type {
  AccountingDocument,
  AccountingPaymentStatus,
  AccountingDocumentStatus,
  AccountingTaxMode,
  AccountingExportBatch,
  VehicleAccountingCase,
} from '@/lib/types'

function cloneDocuments(documents: AccountingDocument[]) {
  return documents.map((document) => ({
    ...document,
    extractionFields: document.extractionFields.map((field) => ({ ...field })),
    bookingProposal: { ...document.bookingProposal },
    flags: document.flags.map((flag) => ({ ...flag })),
  }))
}

function cloneCases(cases: VehicleAccountingCase[]) {
  return cases.map((item) => ({
    ...item,
    blockers: [...item.blockers],
  }))
}

function cloneBatches(batches: AccountingExportBatch[]) {
  return batches.map((batch) => ({
    ...batch,
    totals: { ...batch.totals },
  }))
}

const initialDocuments = cloneDocuments(mockAccountingDocuments)
const initialCases = cloneCases(mockVehicleAccountingCases)
const initialBatches = cloneBatches(mockAccountingExportBatches)

interface AccountingStoreState {
  documents: AccountingDocument[]
  vehicleCases: VehicleAccountingCase[]
  exportBatches: AccountingExportBatch[]
  updateDocumentStatus: (documentId: string, status: AccountingDocumentStatus) => boolean
  updatePaymentStatus: (documentId: string, status: AccountingPaymentStatus) => void
  setFlagResolved: (documentId: string, flagId: string, resolved: boolean) => void
  addScannedIncomingInvoice: (payload: {
    month: string
    invoiceNumber: string
    invoiceDate: string
    partnerName: string
    vehicleId: string | null
    netAmount: number
    vatAmount: number
    grossAmount: number
    taxMode: AccountingTaxMode
    pdfUrl: string
  }) => string
  finalizeExport: (month: string) => void
}

export const useAccountingStore = create<AccountingStoreState>((set) => ({
  documents: initialDocuments,
  vehicleCases: initialCases,
  exportBatches: initialBatches,

  updateDocumentStatus: (documentId, status) => {
    let didUpdate = false

    set((state) => ({
      documents: state.documents.map((document) => {
        if (document.id !== documentId) return document

        const hasBlockingCriticalFlag = document.flags.some((flag) => flag.severity === 'critical' && !flag.resolved)
        if (status === 'gebucht' && hasBlockingCriticalFlag) return document

        didUpdate = true
        return {
          ...document,
          status,
          updatedAt: new Date().toISOString(),
        }
      }),
    }))

    return didUpdate
  },

  updatePaymentStatus: (documentId, status) => {
    set((state) => ({
      documents: state.documents.map((document) => {
        if (document.id !== documentId) return document
        return {
          ...document,
          paymentStatus: status,
          updatedAt: new Date().toISOString(),
        }
      }),
    }))
  },

  setFlagResolved: (documentId, flagId, resolved) => {
    set((state) => ({
      documents: state.documents.map((document) => {
        if (document.id !== documentId) return document
        return {
          ...document,
          flags: document.flags.map((flag) => (
            flag.id === flagId ? { ...flag, resolved } : flag
          )),
          updatedAt: new Date().toISOString(),
        }
      }),
    }))
  },

  addScannedIncomingInvoice: ({
    month,
    invoiceNumber,
    invoiceDate,
    partnerName,
    vehicleId,
    netAmount,
    vatAmount,
    grossAmount,
    taxMode,
    pdfUrl,
  }) => {
    const now = new Date().toISOString()
    const documentId = `acc-doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    const createdDocument: AccountingDocument = {
      id: documentId,
      month,
      vehicleId,
      type: 'eingangsrechnung',
      status: 'freigabe_noetig',
      paymentStatus: 'offen',
      taxMode,
      invoiceNumber,
      invoiceDate,
      partnerName,
      netAmount,
      vatAmount,
      grossAmount,
      currency: 'EUR',
      pdfUrl,
      aiConfidence: 94,
      extractionFields: [
        { key: 'invoiceNumber', label: 'Rechnungsnummer', value: invoiceNumber, confidence: 99, required: true },
        { key: 'invoiceDate', label: 'Rechnungsdatum', value: invoiceDate, confidence: 98, required: true },
        { key: 'partnerName', label: 'Lieferant', value: partnerName, confidence: 95, required: true },
        { key: 'vehicleRef', label: 'Fahrzeug', value: vehicleId ?? 'Nicht zugeordnet', confidence: vehicleId ? 92 : 38, required: true },
        { key: 'grossAmount', label: 'Brutto', value: `${grossAmount.toFixed(2).replace('.', ',')} EUR`, confidence: 98, required: true },
        { key: 'taxMode', label: 'Steuerart', value: taxMode === 'regelbesteuerung_19' ? 'Regelbesteuerung 19%' : 'Differenzbesteuerung §25a', confidence: 93, required: true },
      ],
      bookingProposal: {
        kontoSoll: '3200 Wareneingang Fahrzeuge',
        kontoHaben: '70000 Verbindlichkeiten',
        steuerSchluessel: taxMode === 'regelbesteuerung_19' ? 'V19' : 'D25',
        netto: netAmount,
        ust: vatAmount,
        brutto: grossAmount,
      },
      flags: vehicleId
        ? []
        : [{
          id: `flag-${documentId}-vehicle`,
          code: 'MISSING_VEHICLE',
          severity: 'critical',
          message: 'Fehlende Fahrzeugzuordnung.',
          resolved: false,
        }],
      createdAt: now,
      updatedAt: now,
    }

    set((state) => {
      const hasLinkedCase = vehicleId
        ? state.vehicleCases.some((item) => item.month === month && item.vehicleId === vehicleId)
        : false

      const nextCases = !vehicleId || hasLinkedCase
        ? state.vehicleCases
        : [
          {
            id: `acc-case-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            month,
            vehicleId,
            incomingDocumentId: documentId,
            hasIncomingInvoice: true,
            hasOutgoingInvoice: false,
            taxMode,
            purchaseAmount: grossAmount,
            status: 'offen' as const,
            blockers: ['Ausgangsrechnung fehlt.'],
          },
          ...state.vehicleCases,
        ]

      return {
        documents: [createdDocument, ...state.documents],
        vehicleCases: nextCases,
      }
    })

    return documentId
  },

  finalizeExport: (month) => {
    const nowIso = new Date().toISOString()

    set((state) => ({
      documents: state.documents.map((document) => {
        if (document.month !== month) return document
        if (document.status !== 'freigegeben') return document
        return {
          ...document,
          status: 'gebucht',
          updatedAt: nowIso,
        }
      }),
      vehicleCases: state.vehicleCases.map((item) => {
        if (item.month !== month) return item
        if (item.status !== 'exportbereit') return item
        return { ...item, status: 'exportiert' }
      }),
      exportBatches: state.exportBatches.map((batch) => (
        batch.month === month
          ? { ...batch, status: 'erstellt', createdAt: nowIso }
          : batch
      )),
    }))
  },
}))
