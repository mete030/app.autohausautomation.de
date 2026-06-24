'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { KiReceptionCallDto } from '@/lib/ki-rezeptionist/types'

/** „Kurze Notiz" — bewusst niedrig, damit auch „kein Ergebnis" zulässig ist. */
export const KI_MIN_COMPLETION_NOTE_LENGTH = 3

interface KiCompletionDialogProps {
  /** Zu erledigender Anruf — `null` schließt den Dialog. */
  call: KiReceptionCallDto | null
  busy: boolean
  onOpenChange: (open: boolean) => void
  onComplete: (id: string, notes: string) => void
}

export function KiCompletionDialog({ call, busy, onOpenChange, onComplete }: KiCompletionDialogProps) {
  // Inhalt während der Schließ-Animation halten + Notiz beim Anruf-Wechsel leeren.
  const [shown, setShown] = useState<KiReceptionCallDto | null>(call)
  const [prevId, setPrevId] = useState<string | undefined>(call?.id)
  const [notes, setNotes] = useState('')

  if (call && call !== shown) setShown(call)
  if (call?.id !== prevId) {
    setPrevId(call?.id)
    setNotes('')
  }

  if (!shown) return null

  const trimmedLength = notes.trim().length
  const isValid = trimmedLength >= KI_MIN_COMPLETION_NOTE_LENGTH

  function handleComplete() {
    if (shown && isValid && !busy) onComplete(shown.id, notes.trim())
  }

  return (
    <Dialog open={Boolean(call)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle>Konversation als erledigt markieren</DialogTitle>
          <DialogDescription>
            Halte kurz fest, wie der Rückruf ausgegangen ist — das Ergebnis ist
            danach im Dashboard sichtbar.
          </DialogDescription>
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
              {trimmedLength} / {KI_MIN_COMPLETION_NOTE_LENGTH}
            </span>
          </div>
          <Textarea
            autoFocus
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="z. B. Kunde erreicht — Probefahrt für Do., 10:00 Uhr vereinbart. Oder: „Kein Ergebnis – nicht erreicht."
            rows={4}
            maxLength={2000}
          />
          {!isValid && (
            <p className="text-[11px] text-muted-foreground">
              Bitte eine kurze Notiz angeben (mind. {KI_MIN_COMPLETION_NOTE_LENGTH} Zeichen).
            </p>
          )}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-end">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>
            Abbrechen
          </Button>
          <Button onClick={handleComplete} disabled={!isValid || busy}>
            <Check className="h-4 w-4" />
            {busy ? 'Speichert …' : 'Als erledigt markieren'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
