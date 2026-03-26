'use client'

import { useEffect, useId, useState } from 'react'
import { Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface SaveRecipientEmailResult {
  ok: boolean
  error?: string
  recipientEmail?: string
}

interface CallbackNotificationRecipientEmailFieldProps {
  activeRecipientEmail: string
  defaultRecipientEmail: string
  draftRecipientEmail: string
  hasUnsavedRecipientEmailChanges: boolean
  isDraftRecipientEmailValid: boolean
  unavailableMessage?: string
  label: string
  description?: string
  className?: string
  compact?: boolean
  onDraftRecipientEmailChange: (value: string) => void
  onSave: () => SaveRecipientEmailResult
}

export function CallbackNotificationRecipientEmailField({
  activeRecipientEmail,
  defaultRecipientEmail,
  draftRecipientEmail,
  hasUnsavedRecipientEmailChanges,
  isDraftRecipientEmailValid,
  unavailableMessage = '',
  label,
  description,
  className,
  compact = false,
  onDraftRecipientEmailChange,
  onSave,
}: CallbackNotificationRecipientEmailFieldProps) {
  const inputId = useId()
  const [feedback, setFeedback] = useState<{
    tone: 'success' | 'error'
    message: string
  } | null>(null)

  useEffect(() => {
    if (!feedback) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setFeedback(null)
    }, 2500)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [feedback])

  const handleSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const result = onSave()
    if (!result.ok) {
      setFeedback({
        tone: 'error',
        message: result.error ?? 'Empfänger-E-Mail konnte nicht gespeichert werden.',
      })
      return
    }

    setFeedback({
      tone: 'success',
      message:
        result.recipientEmail === defaultRecipientEmail
          ? 'Gespeichert. Der Server-Standard ist wieder aktiv.'
          : `Gespeichert. Versand geht jetzt an ${result.recipientEmail}.`,
    })
  }

  return (
    <form
      className={cn('space-y-2', className)}
      onSubmit={handleSave}
    >
      <div className="space-y-1">
        <Label htmlFor={inputId}>{label}</Label>
        {description && (
          <p className="text-xs text-muted-foreground">
            {description}
          </p>
        )}
      </div>

      <div className={cn(
        'flex flex-col gap-2 sm:flex-row',
        compact && 'sm:items-start',
      )}
      >
        <Input
          id={inputId}
          type="email"
          value={draftRecipientEmail}
          placeholder={defaultRecipientEmail || 'name@example.com'}
          onChange={(event) => {
            setFeedback(null)
            onDraftRecipientEmailChange(event.target.value)
          }}
        />
        <Button
          type="submit"
          size={compact ? 'sm' : 'default'}
          disabled={
            !hasUnsavedRecipientEmailChanges
            || !isDraftRecipientEmailValid
          }
          className={cn(compact && 'sm:min-w-[110px]')}
        >
          <Save className="mr-1 h-4 w-4" />
          Speichern
        </Button>
      </div>

      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">
          Aktiv für Versand:{' '}
          <span className="font-medium text-foreground">
            {activeRecipientEmail || 'Keine E-Mail hinterlegt'}
          </span>
        </p>

        {defaultRecipientEmail && activeRecipientEmail !== defaultRecipientEmail && (
          <p className="text-xs text-muted-foreground">
            Server-Standard:{' '}
            <span className="font-medium text-foreground">
              {defaultRecipientEmail}
            </span>
          </p>
        )}

        {hasUnsavedRecipientEmailChanges && (
          <p className="text-xs text-amber-700 dark:text-amber-400">
            Ungespeicherte Änderung. Erst nach dem Speichern wird an diese Adresse versendet.
          </p>
        )}

        {!isDraftRecipientEmailValid && draftRecipientEmail.trim() && (
          <p className="text-xs text-destructive">
            Bitte eine gültige E-Mail-Adresse eingeben.
          </p>
        )}

        {unavailableMessage && (
          <p className="text-xs text-destructive">
            {unavailableMessage}
          </p>
        )}

        {feedback && (
          <p
            className={cn(
              'text-xs',
              feedback.tone === 'success'
                ? 'text-emerald-700 dark:text-emerald-400'
                : 'text-destructive',
            )}
          >
            {feedback.message}
          </p>
        )}
      </div>
    </form>
  )
}
