'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { KYCDocumentConfig, KYCDocumentSubmission, KYCDocumentVerificationStatus } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  CheckCircle, XCircle, Loader2, Upload, Zap, FileText,
  ChevronDown, ChevronUp, AlertCircle,
} from 'lucide-react'

const docStatusConfig: Record<KYCDocumentVerificationStatus, { label: string; color: string }> = {
  nicht_eingereicht: { label: 'Ausstehend', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  hochgeladen: { label: 'Hochgeladen', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  wird_geprueft: { label: 'Wird geprüft...', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  verifiziert: { label: 'Verifiziert', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  abgelehnt: { label: 'Abgelehnt', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  manuell_pruefen: { label: 'Manuell prüfen', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
}

interface DocumentCardProps {
  config: KYCDocumentConfig
  submission?: KYCDocumentSubmission
  isOptional: boolean
  onFieldChange?: (values: Record<string, string>) => void
  onFileUpload?: (file: File) => void
  onRunCheck?: () => void
  mode: 'create' | 'review'
  animationDelay?: number
}

export function DocumentCard({
  config, submission, isOptional, onFieldChange, onFileUpload, onRunCheck, mode, animationDelay = 0,
}: DocumentCardProps) {
  const [expanded, setExpanded] = useState(false)
  const status = submission?.status ?? 'nicht_eingereicht'
  const statusConf = docStatusConfig[status]
  const isAutomated = config.verificationMethod === 'automated' || config.verificationMethod === 'hybrid'
  const isManual = config.verificationMethod === 'manual' || config.verificationMethod === 'hybrid'
  const isChecking = status === 'wird_geprueft'

  return (
    <div
      className={cn(
        'rounded-xl border transition-all duration-200 animate-in fade-in slide-in-from-bottom-1',
        status === 'verifiziert' && 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/10',
        status === 'abgelehnt' && 'border-red-200 dark:border-red-800 bg-red-50/30 dark:bg-red-950/10',
        status === 'wird_geprueft' && 'border-amber-200 dark:border-amber-800',
        !['verifiziert', 'abgelehnt', 'wird_geprueft'].includes(status) && 'border-border bg-card',
      )}
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-3 w-full px-4 py-3 text-left"
      >
        <div className={cn(
          'h-2.5 w-2.5 rounded-full shrink-0 transition-colors',
          status === 'verifiziert' && 'bg-emerald-500',
          status === 'abgelehnt' && 'bg-red-500',
          status === 'wird_geprueft' && 'bg-amber-500 animate-pulse',
          status === 'hochgeladen' && 'bg-blue-500',
          status === 'nicht_eingereicht' && 'bg-gray-300 dark:bg-gray-600',
          status === 'manuell_pruefen' && 'bg-purple-500',
        )} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold truncate">{config.name}</p>
            {isOptional && (
              <span className="text-xs text-muted-foreground">(optional)</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate mt-0.5">{config.description}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isAutomated && (
            <Badge variant="outline" className="text-xs border-blue-200 text-blue-600 dark:border-blue-800 dark:text-blue-400 gap-1 hidden sm:flex">
              <Zap className="h-3 w-3" />Automatisch
            </Badge>
          )}
          {config.verificationMethod === 'manual' && (
            <Badge variant="outline" className="text-xs gap-1 hidden sm:flex">
              <Upload className="h-3 w-3" />Upload
            </Badge>
          )}
          <Badge className={cn(statusConf.color, 'text-xs')} variant="secondary">
            {isChecking && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
            {statusConf.label}
          </Badge>
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {/* Expandable content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-border/50 pt-3 animate-in fade-in slide-in-from-top-1 duration-200">

          {/* Automated check fields */}
          {isAutomated && config.requiredFields && config.requiredFields.length > 0 && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {config.requiredFields.map(field => (
                  <div key={field.key} className="space-y-1.5">
                    <Label className="text-xs">{field.label}</Label>
                    {field.type === 'select' ? (
                      <Select
                        value={submission?.fieldValues?.[field.key] ?? ''}
                        onValueChange={(val) => onFieldChange?.({ [field.key]: val })}
                      >
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue placeholder={field.placeholder} />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options?.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        className="h-9 text-sm"
                        placeholder={field.placeholder}
                        type={field.type === 'date' ? 'date' : 'text'}
                        value={submission?.fieldValues?.[field.key] ?? ''}
                        onChange={(e) => onFieldChange?.({ [field.key]: e.target.value })}
                      />
                    )}
                  </div>
                ))}
              </div>

              {status !== 'verifiziert' && status !== 'wird_geprueft' && (
                <Button size="sm" className="w-full sm:w-auto" onClick={onRunCheck}>
                  <Zap className="h-4 w-4 mr-2" />
                  Automatisch prüfen
                </Button>
              )}
            </div>
          )}

          {/* Manual upload zone */}
          {isManual && status !== 'verifiziert' && (
            <div
              className={cn(
                'border-2 border-dashed rounded-xl p-5 text-center transition-colors cursor-pointer',
                'hover:border-primary/50 hover:bg-primary/5',
                submission?.fileName ? 'border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-950/20' : 'border-border'
              )}
              onClick={() => {
                if (!submission?.fileName && onFileUpload) {
                  const ext = config.acceptedFileTypes?.[0] ?? 'pdf'
                  const mockFile = new File(['mock'], `${config.id}_dokument.${ext}`, { type: `application/${ext}` })
                  onFileUpload(mockFile)
                }
              }}
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-primary', 'bg-primary/10') }}
              onDragLeave={(e) => { e.currentTarget.classList.remove('border-primary', 'bg-primary/10') }}
              onDrop={(e) => {
                e.preventDefault()
                e.currentTarget.classList.remove('border-primary', 'bg-primary/10')
                const file = e.dataTransfer.files[0]
                if (file) onFileUpload?.(file)
              }}
            >
              {submission?.fileName ? (
                <div className="flex items-center justify-center gap-2">
                  <FileText className="h-5 w-5 text-blue-500" />
                  <span className="text-sm font-medium">{submission.fileName}</span>
                  <Badge variant="secondary" className="text-xs">Hochgeladen</Badge>
                </div>
              ) : (
                <>
                  <Upload className="h-7 w-7 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground mb-1">Datei hierher ziehen oder</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      // Mock upload: create a fake file for prototype demo
                      const ext = config.acceptedFileTypes?.[0] ?? 'pdf'
                      const mockFile = new File(['mock'], `${config.id}_dokument.${ext}`, { type: `application/${ext}` })
                      onFileUpload?.(mockFile)
                    }}
                  >
                    <Upload className="h-4 w-4 mr-2" />Datei auswählen
                  </Button>
                  {config.acceptedFileTypes && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {config.acceptedFileTypes.map(t => t.toUpperCase()).join(', ')} &middot; max. {config.maxFileSizeMB ?? 10} MB
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          {/* Verification result */}
          {submission?.checkResult && (
            <div className={cn(
              'rounded-lg p-3 flex items-start gap-2.5',
              submission.checkResult.passed
                ? 'bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800'
                : 'bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800'
            )}>
              {submission.checkResult.passed
                ? <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                : <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />}
              <div>
                <p className={cn('text-sm font-medium',
                  submission.checkResult.passed ? 'text-emerald-800 dark:text-emerald-200' : 'text-red-800 dark:text-red-200'
                )}>{submission.checkResult.check}</p>
                <p className={cn('text-xs mt-0.5',
                  submission.checkResult.passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                )}>{submission.checkResult.detail}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
