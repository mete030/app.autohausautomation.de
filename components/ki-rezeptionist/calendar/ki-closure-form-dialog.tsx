'use client'

import { useEffect, useState } from 'react'
import { CalendarOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { KI_CLOSURE_TYPE_LABEL, KI_DEFAULT_LOCATION } from '@/lib/ki-rezeptionist/calendar-config'
import type { KiClosureDto, KiClosureType } from '@/lib/ki-rezeptionist/appointment-types'

const FIELD =
  'h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none transition focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50'

function toDateInput(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultDate?: Date | null
  onSaved: (closure: KiClosureDto) => void
}

export function KiClosureFormDialog({ open, onOpenChange, defaultDate, onSaved }: Props) {
  const [type, setType] = useState<KiClosureType>('betriebsschliessung')
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setError(null)
    const d = defaultDate ?? new Date()
    setType('betriebsschliessung')
    setName('')
    setStartDate(toDateInput(d))
    setEndDate(toDateInput(d))
    setReason('')
  }, [open, defaultDate])

  async function handleSave() {
    setError(null)
    if (!startDate || !endDate) {
      setError('Bitte Start- und Enddatum wählen.')
      return
    }
    const start = new Date(`${startDate}T00:00:00`)
    const end = new Date(`${endDate}T23:59:59`)
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end.getTime() < start.getTime()) {
      setError('Das Enddatum darf nicht vor dem Startdatum liegen.')
      return
    }

    setBusy(true)
    try {
      const res = await fetch('/api/ki-rezeptionist/closures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: KI_DEFAULT_LOCATION,
          type,
          name: name.trim() || KI_CLOSURE_TYPE_LABEL[type],
          allDay: true,
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          reason: reason.trim() || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Speichern fehlgeschlagen.')
        return
      }
      onSaved(data.closure)
      onOpenChange(false)
    } catch {
      setError('Verbindung zum Server fehlgeschlagen.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Urlaub / Schließzeit hinzufügen</DialogTitle>
          <DialogDescription>
            Eine Betriebsschließung, einen Urlaub oder eine Wartungsperiode planen.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Typ</Label>
            <select className={FIELD} value={type} onChange={(e) => setType(e.target.value as KiClosureType)}>
              {(Object.keys(KI_CLOSURE_TYPE_LABEL) as KiClosureType[]).map((t) => (
                <option key={t} value={t}>
                  {KI_CLOSURE_TYPE_LABEL[t]}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="z. B. Weihnachten, Betriebsurlaub" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Startdatum</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Enddatum</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Grund (optional)</Label>
            <textarea
              className={cn(FIELD, 'h-16 resize-none py-2')}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="z. B. Urlaub, Renovierung"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <div className="mt-1 flex items-center justify-end gap-2 border-t border-border/60 pt-4">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button size="sm" disabled={busy} onClick={handleSave}>
            <CalendarOff className="h-4 w-4" />
            {busy ? 'Speichert …' : 'Hinzufügen'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
