'use client'

import { useCallback, useId, useMemo, useRef, useState } from 'react'
import { FileText, Image as ImageIcon, Loader2, Paperclip, Trash2, UploadCloud, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { CallbackAttachment, CallbackAttachmentStage, CallbackAttachmentUploaderRole } from '@/lib/types'

const ALLOWED_MIME = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
] as const

const MAX_FILE_BYTES = 10 * 1024 * 1024
const MAX_FILES_PER_STAGE = 5
const ACCEPT_ATTR = '.pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/png,image/jpeg,image/webp'

export interface LocalAttachment {
  id: string
  file: File
}

interface BaseProps {
  stage: CallbackAttachmentStage
  className?: string
  label?: string
  description?: string
  disabled?: boolean
  maxFiles?: number
}

interface DeferredProps extends BaseProps {
  /**
   * Deferred mode: hold files locally until the parent decides when to upload
   * them (used during callback creation when the callback ID does not yet
   * exist).
   */
  mode: 'deferred'
  pending: LocalAttachment[]
  onPendingChange: (next: LocalAttachment[]) => void
}

interface AuthenticatedProps extends BaseProps {
  /** Authenticated upload tied to a known callback id. */
  mode: 'authenticated'
  callbackId: string
  uploadedByName: string
  uploadedByRole: CallbackAttachmentUploaderRole
  existing: CallbackAttachment[]
  onAttachmentUploaded: (attachment: CallbackAttachment) => void
  onAttachmentDeleted?: (attachmentId: string) => void
}

interface TokenProps extends BaseProps {
  /** Token-authenticated upload from the email completion page. */
  mode: 'token'
  token: string
  existing: CallbackAttachment[]
  onAttachmentUploaded: (attachment: CallbackAttachment) => void
}

export type CallbackAttachmentUploaderProps = DeferredProps | AuthenticatedProps | TokenProps

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function isAllowedMime(type: string): boolean {
  return (ALLOWED_MIME as readonly string[]).includes(type)
}

function fileIconFor(mime: string) {
  if (mime.startsWith('image/')) return ImageIcon
  return FileText
}

export function CallbackAttachmentUploader(props: CallbackAttachmentUploaderProps) {
  const {
    stage,
    className,
    label = stage === 'creation' ? 'Anhänge (PDF / Bild)' : 'Anhänge zum Abschluss',
    description = 'PDFs oder Bilder bis 10 MB. Maximal 5 Dateien.',
    disabled = false,
    maxFiles = MAX_FILES_PER_STAGE,
  } = props

  const inputId = useId()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const existingCount = useMemo(() => {
    if (props.mode === 'deferred') return props.pending.length
    return props.existing.length
  }, [props])

  const remainingSlots = Math.max(0, maxFiles - existingCount)
  const limitReached = remainingSlots === 0

  const validateFile = useCallback((file: File): string | null => {
    if (!isAllowedMime(file.type)) {
      return `${file.name}: Dateityp nicht erlaubt (nur PDF, PNG, JPG, WEBP).`
    }
    if (file.size > MAX_FILE_BYTES) {
      return `${file.name}: überschreitet 10 MB.`
    }
    if (file.size === 0) {
      return `${file.name}: leere Datei.`
    }
    return null
  }, [])

  const handleFiles = useCallback(
    async (files: File[]) => {
      if (disabled) return
      if (files.length === 0) return
      setError(null)

      const accepted: File[] = []
      for (const file of files) {
        if (accepted.length >= remainingSlots) {
          setError(`Maximal ${maxFiles} Dateien erlaubt.`)
          break
        }
        const validation = validateFile(file)
        if (validation) {
          setError(validation)
          continue
        }
        accepted.push(file)
      }

      if (accepted.length === 0) return

      if (props.mode === 'deferred') {
        const next = [
          ...props.pending,
          ...accepted.map((file) => ({
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            file,
          })),
        ]
        props.onPendingChange(next)
        return
      }

      // authenticated / token modes upload immediately
      setIsUploading(true)
      try {
        for (const file of accepted) {
          const formData = new FormData()
          formData.set('file', file)
          formData.set('stage', stage)

          let endpoint: string
          if (props.mode === 'authenticated') {
            endpoint = `/api/callbacks/${props.callbackId}/attachments`
            formData.set('uploadedByName', props.uploadedByName)
            formData.set('uploadedByRole', props.uploadedByRole)
          } else {
            endpoint = '/api/callback-actions/complete/attachments'
            formData.set('token', props.token)
          }

          const res = await fetch(endpoint, { method: 'POST', body: formData })
          if (!res.ok) {
            const data = (await res.json().catch(() => ({}))) as { error?: string }
            throw new Error(data.error || `Anhang "${file.name}" konnte nicht hochgeladen werden.`)
          }
          const data = (await res.json()) as { attachment: CallbackAttachment }
          props.onAttachmentUploaded(data.attachment)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload fehlgeschlagen.')
      } finally {
        setIsUploading(false)
      }
    },
    [disabled, maxFiles, props, remainingSlots, stage, validateFile],
  )

  const handleSelectClick = () => {
    if (disabled || limitReached) return
    fileInputRef.current?.click()
  }

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : []
    void handleFiles(files)
    event.target.value = ''
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    if (disabled || limitReached) return
    setIsDragging(true)
  }

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)
    if (disabled || limitReached) return
    const files = Array.from(event.dataTransfer.files ?? [])
    void handleFiles(files)
  }

  const handleRemovePending = (id: string) => {
    if (props.mode !== 'deferred') return
    props.onPendingChange(props.pending.filter((p) => p.id !== id))
  }

  const handleDeleteExisting = async (attachmentId: string) => {
    if (props.mode !== 'authenticated' || !props.onAttachmentDeleted) return
    try {
      const res = await fetch(`/api/callback-attachments/${attachmentId}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(data.error || 'Anhang konnte nicht gelöscht werden.')
      }
      props.onAttachmentDeleted(attachmentId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Anhang konnte nicht gelöscht werden.')
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={inputId} className="text-sm font-medium">
          <Paperclip className="inline-block mr-1 h-3.5 w-3.5 text-muted-foreground" />
          {label}
        </label>
        {existingCount > 0 && (
          <span className="text-[11px] text-muted-foreground">
            {existingCount} / {maxFiles}
          </span>
        )}
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-3 py-4 text-center transition-colors',
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/30 bg-muted/20',
          (disabled || limitReached) && 'opacity-60',
        )}
      >
        <UploadCloud className="h-5 w-5 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">{description}</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || limitReached || isUploading}
          onClick={handleSelectClick}
        >
          {isUploading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <UploadCloud className="h-3.5 w-3.5" />
          )}
          {limitReached ? 'Limit erreicht' : isUploading ? 'Lade hoch...' : 'Datei auswählen'}
        </Button>
        <input
          ref={fileInputRef}
          id={inputId}
          type="file"
          accept={ACCEPT_ATTR}
          multiple
          className="hidden"
          onChange={handleInputChange}
          disabled={disabled}
        />
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      {/* Pending list (deferred mode) */}
      {props.mode === 'deferred' && props.pending.length > 0 && (
        <ul className="space-y-1.5">
          {props.pending.map((item) => {
            const Icon = fileIconFor(item.file.type)
            return (
              <li
                key={item.id}
                className="flex items-center gap-2 rounded-md border bg-background px-2.5 py-1.5"
              >
                <Icon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                <span className="flex-1 truncate text-xs">{item.file.name}</span>
                <span className="text-[10px] text-muted-foreground">
                  {formatBytes(item.file.size)}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemovePending(item.id)}
                  className="ml-1 text-muted-foreground hover:text-foreground"
                  aria-label="Entfernen"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {/* Uploaded list (authenticated/token mode) */}
      {props.mode !== 'deferred' && props.existing.length > 0 && (
        <ul className="space-y-1.5">
          {props.existing.map((att) => {
            const Icon = fileIconFor(att.mimeType)
            return (
              <li
                key={att.id}
                className="flex items-center gap-2 rounded-md border bg-background px-2.5 py-1.5"
              >
                <Icon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                <a
                  href={att.downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 truncate text-xs hover:underline"
                >
                  {att.fileName}
                </a>
                <span className="text-[10px] text-muted-foreground">
                  {formatBytes(att.fileSizeBytes)}
                </span>
                {props.mode === 'authenticated' && props.onAttachmentDeleted && (
                  <button
                    type="button"
                    onClick={() => handleDeleteExisting(att.id)}
                    className="ml-1 text-muted-foreground hover:text-destructive"
                    aria-label="Löschen"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
