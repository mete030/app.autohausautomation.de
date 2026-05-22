'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle } from 'lucide-react'
import { MIN_CALLBACK_COMPLETION_NOTE_LENGTH } from '@/lib/email/callback-email-config'
import { cn } from '@/lib/utils'

interface CompletionDialogProps {
  open: boolean
  callbackId: string | null
  onOpenChange: (open: boolean) => void
  onComplete: (id: string, notes: string) => void
}

export function CompletionDialog({ open, callbackId, onOpenChange, onComplete }: CompletionDialogProps) {
  const [notes, setNotes] = useState('')

  const trimmedLength = notes.trim().length
  const isValid = trimmedLength >= MIN_CALLBACK_COMPLETION_NOTE_LENGTH

  const handleComplete = () => {
    if (callbackId && isValid) {
      onComplete(callbackId, notes.trim())
      setNotes('')
    }
  }

  const handleClose = (val: boolean) => {
    if (!val) setNotes('')
    onOpenChange(val)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:!max-w-md md:!max-w-lg">
        <DialogHeader>
          <DialogTitle>Rückruf als erledigt markieren</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">
              Ergebnis des Rückrufs
              <span className="ml-1 text-destructive">*</span>
            </label>
            <span
              className={cn(
                'text-[11px] tabular-nums',
                isValid ? 'text-muted-foreground' : 'text-destructive',
              )}
            >
              {trimmedLength} / {MIN_CALLBACK_COMPLETION_NOTE_LENGTH}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Was wurde mit dem Kunden besprochen und wie wurde verblieben?
          </p>
          <Textarea
            placeholder="z. B. Kunde erreicht — Probefahrt für Do., 10:00 Uhr vereinbart. Kunde ist zufrieden, keine weitere Aktion nötig."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={4}
          />
          {!isValid && (
            <p className="text-[11px] text-muted-foreground">
              Mindestens {MIN_CALLBACK_COMPLETION_NOTE_LENGTH} Zeichen erforderlich.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>Abbrechen</Button>
          <Button disabled={!isValid} onClick={handleComplete}>
            <CheckCircle className="h-4 w-4 mr-1" />
            Erledigt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
