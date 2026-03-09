'use client'

import { useMemo } from 'react'
import { getDocumentsForSegment, getSegmentConfig, groupDocumentsByCategory, kycDocumentCategoryConfig } from '@/lib/kyc-config'
import type { CustomerSegment, KYCDocumentConfig, KYCDocumentSubmission, KYCDocumentCategory } from '@/lib/types'
import { DocumentCard } from './DocumentCard'
import { Separator } from '@/components/ui/separator'
import { UserCheck, Building2, FileSignature, Receipt, Truck, Star } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const categoryIconMap: Record<string, LucideIcon> = {
  UserCheck, Building2, FileSignature, Receipt, Truck, Star,
}

interface DocumentRequirementsListProps {
  segment: CustomerSegment
  documentSubmissions?: KYCDocumentSubmission[]
  onFieldChange?: (docId: string, fieldValues: Record<string, string>) => void
  onFileUpload?: (docId: string, file: File) => void
  onRunCheck?: (docId: string) => void
  mode: 'create' | 'review'
}

export function DocumentRequirementsList({
  segment, documentSubmissions, onFieldChange, onFileUpload, onRunCheck, mode,
}: DocumentRequirementsListProps) {
  const segmentConfig = getSegmentConfig(segment)
  const documents = useMemo(() => getDocumentsForSegment(segment), [segment])
  const grouped = useMemo(() => groupDocumentsByCategory(documents), [documents])

  if (!segmentConfig || documents.length === 0) return null

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center gap-2 text-sm">
        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
        <span className="text-muted-foreground">
          {documents.length} Dokumente erforderlich f&uuml;r{' '}
          <span className="font-medium text-foreground">{segmentConfig.label}</span>
        </span>
      </div>

      {grouped.map(([category, docs], groupIndex) => {
        const catConfig = kycDocumentCategoryConfig[category]
        if (!catConfig) return null
        const CatIcon = categoryIconMap[catConfig.icon]

        return (
          <div key={category} className="space-y-3">
            <div className="flex items-center gap-2">
              {CatIcon && <CatIcon className="h-4 w-4 text-muted-foreground" />}
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {catConfig.label}
              </h4>
            </div>

            <div className="space-y-2">
              {docs.map((doc: KYCDocumentConfig, docIndex: number) => {
                const submission = documentSubmissions?.find(d => d.documentConfigId === doc.id)
                const isOptional = segmentConfig.optionalDocuments?.includes(doc.id) ?? false
                return (
                  <DocumentCard
                    key={doc.id}
                    config={doc}
                    submission={submission}
                    isOptional={isOptional}
                    onFieldChange={onFieldChange ? (vals) => onFieldChange(doc.id, vals) : undefined}
                    onFileUpload={onFileUpload ? (file) => onFileUpload(doc.id, file) : undefined}
                    onRunCheck={onRunCheck ? () => onRunCheck(doc.id) : undefined}
                    mode={mode}
                    animationDelay={groupIndex * 100 + docIndex * 60}
                  />
                )
              })}
            </div>

            {groupIndex < grouped.length - 1 && <Separator className="mt-1" />}
          </div>
        )
      })}
    </div>
  )
}
