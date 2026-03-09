'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowRightLeft } from 'lucide-react'
import type { Callback } from '@/lib/types'

interface ReassignDialogProps {
  open: boolean
  callback: Callback | null
  onOpenChange: (open: boolean) => void
  onReassign: (callbackId: string, newAdvisor: string) => void
  advisorNames: string[]
}

export function ReassignDialog({ open, callback, onOpenChange, onReassign, advisorNames }: ReassignDialogProps) {
  const [selected, setSelected] = useState('')

  const handleClose = (val: boolean) => {
    if (!val) setSelected('')
    onOpenChange(val)
  }

  const handleReassign = () => {
    if (callback && selected) {
      onReassign(callback.id, selected)
      setSelected('')
    }
  }

  const available = advisorNames.filter(n => n !== callback?.assignedAdvisor)

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rückruf neu zuweisen</DialogTitle>
        </DialogHeader>
        {callback && (
          <div className="space-y-3">
            <div className="text-sm">
              <span className="text-muted-foreground">Kunde:</span>{' '}
              <span className="font-medium">{callback.customerName}</span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Aktuell zugewiesen an:</span>{' '}
              <span className="font-medium">{callback.assignedAdvisor}</span>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Neuer Berater</label>
              <Select value={selected} onValueChange={setSelected}>
                <SelectTrigger>
                  <SelectValue placeholder="Berater auswählen..." />
                </SelectTrigger>
                <SelectContent>
                  {available.map(name => (
                    <SelectItem key={name} value={name}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>Abbrechen</Button>
          <Button disabled={!selected} onClick={handleReassign}>
            <ArrowRightLeft className="h-4 w-4 mr-1" />
            Neu zuweisen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
