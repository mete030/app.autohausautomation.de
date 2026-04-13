'use client'

import { useId } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface CallbackNotificationRecipientEmailFieldProps {
  defaultRecipientEmail: string
  draftRecipientEmail: string
  hasUnsavedRecipientEmailChanges: boolean
  isDraftRecipientEmailValid: boolean
  unavailableMessage?: string
  label: string
  description?: string
  className?: string
  disabled?: boolean
  onDraftRecipientEmailChange: (value: string) => void
}

export function CallbackNotificationRecipientEmailField({
  defaultRecipientEmail,
  draftRecipientEmail,
  hasUnsavedRecipientEmailChanges,
  isDraftRecipientEmailValid,
  unavailableMessage = '',
  label,
  description,
  className,
  disabled = false,
  onDraftRecipientEmailChange,
}: CallbackNotificationRecipientEmailFieldProps) {
  const inputId = useId()

  return (
    <div className={cn('space-y-2', className)}>
      <div className="space-y-1">
        <Label htmlFor={inputId}>{label}</Label>
        {description && (
          <p className="text-xs text-muted-foreground">
            {description}
          </p>
        )}
      </div>

      <Input
        id={inputId}
        type="email"
        inputMode="email"
        value={draftRecipientEmail}
        placeholder={defaultRecipientEmail || 'name@example.com'}
        disabled={disabled}
        onChange={(event) => onDraftRecipientEmailChange(event.target.value)}
        autoComplete="email"
        spellCheck={false}
      />

      <div className="space-y-1">
        {hasUnsavedRecipientEmailChanges ? (
          <p className="text-xs text-amber-700 dark:text-amber-400">
            Geänderte Empfänger-Adresse wird beim Senden automatisch übernommen.
          </p>
        ) : defaultRecipientEmail ? (
          <p className="text-xs text-muted-foreground">
            Vorgeschlagen aus dem Mitarbeiter-Profil.
          </p>
        ) : null}

        {!isDraftRecipientEmailValid && draftRecipientEmail.trim() && (
          <p className="text-xs text-destructive">
            Bitte eine gültige E-Mail-Adresse eingeben.
          </p>
        )}

        {unavailableMessage && (
          <p className="text-xs text-destructive">{unavailableMessage}</p>
        )}
      </div>
    </div>
  )
}
