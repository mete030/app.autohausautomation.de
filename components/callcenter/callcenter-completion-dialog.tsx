'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle } from 'lucide-react'

interface CompletionDialogProps {
  open: boolean
  callbackId: string | null
  onOpenChange: (open: boolean) => void
  onComplete: (id: string, notes: string) => void
}

export function CompletionDialog({ open, callbackId, onOpenChange, onComplete }: CompletionDialogProps) {
  const [notes, setNotes] = useState('')

  const handleComplete = () => {
    if (callbackId && notes.trim()) {
      onComplete(callbackId, notes)
      setNotes('')
    }
  }

  const handleClose = (val: boolean) => {
    if (!val) setNotes('')
    onOpenChange(val)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rückruf als erledigt markieren</DialogTitle>
        </DialogHeader>
        <Textarea
          placeholder="Notiz zum Abschluss (Pflichtfeld)..."
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>Abbrechen</Button>
          <Button disabled={!notes.trim()} onClick={handleComplete}>
            <CheckCircle className="h-4 w-4 mr-1" />
            Erledigt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
