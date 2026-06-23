'use client'

import { useEffect, useMemo, useState } from 'react'
import { Trash2, CalendarPlus, Save } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  KI_SERVICES,
  KI_STAFF,
  KI_DEFAULT_LOCATION,
} from '@/lib/ki-rezeptionist/calendar-config'
import type { KiAppointmentDto } from '@/lib/ki-rezeptionist/appointment-types'

const FIELD =
  'h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none transition focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50'

function toDateInput(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function toTimeInput(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Bestehender Termin → Bearbeiten-Modus; sonst Neu-Modus. */
  appointment?: KiAppointmentDto | null
  /** Vorbelegung im Neu-Modus (z. B. aus geklicktem Raster-Slot). */
  defaultStart?: Date | null
  onSaved: (appt: KiAppointmentDto) => void
  onDeleted: (id: string) => void
}

export function KiAppointmentFormDialog({
  open,
  onOpenChange,
  appointment,
  defaultStart,
  onSaved,
  onDeleted,
}: Props) {
  const isEdit = Boolean(appointment)

  const [service, setService] = useState(KI_SERVICES[0].label)
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('09:00')
  const [durationMin, setDurationMin] = useState(KI_SERVICES[0].durationMin)
  const [staff, setStaff] = useState('')
  const [priceEuro, setPriceEuro] = useState('')
  const [notesPublic, setNotesPublic] = useState('')
  const [notesInternal, setNotesInternal] = useState('')
  const [confirmed, setConfirmed] = useState(true)
  const [busy, setBusy] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Felder beim Öffnen / Wechsel initialisieren.
  useEffect(() => {
    if (!open) return
    setError(null)
    setConfirmDelete(false)
    if (appointment) {
      const s = new Date(appointment.startTime)
      const e = new Date(appointment.endTime)
      setService(appointment.service || KI_SERVICES[0].label)
      setCustomerName(appointment.customerName === 'Unbekannt' ? '' : appointment.customerName)
      setCustomerPhone(appointment.customerPhone ?? '')
      setDate(toDateInput(s))
      setTime(toTimeInput(s))
      setDurationMin(Math.max(5, Math.round((e.getTime() - s.getTime()) / 60000)))
      setStaff(appointment.staff ?? '')
      setPriceEuro(appointment.priceCents != null ? String(appointment.priceCents / 100) : '')
      setNotesPublic(appointment.notesPublic ?? '')
      setNotesInternal(appointment.notesInternal ?? '')
      setConfirmed(appointment.status === 'bestaetigt')
    } else {
      const start = defaultStart ?? new Date()
      setService(KI_SERVICES[0].label)
      setCustomerName('')
      setCustomerPhone('')
      setDate(toDateInput(start))
      setTime(defaultStart ? toTimeInput(start) : '09:00')
      setDurationMin(KI_SERVICES[0].durationMin)
      setStaff('')
      setPriceEuro('')
      setNotesPublic('')
      setNotesInternal('')
      setConfirmed(true)
    }
  }, [open, appointment, defaultStart])

  const endLabel = useMemo(() => {
    if (!date || !time) return ''
    const start = new Date(`${date}T${time}:00`)
    if (Number.isNaN(start.getTime())) return ''
    const end = new Date(start.getTime() + durationMin * 60000)
    return toTimeInput(end)
  }, [date, time, durationMin])

  async function handleSave() {
    setError(null)
    if (!date || !time) {
      setError('Bitte Datum und Uhrzeit wählen.')
      return
    }
    const start = new Date(`${date}T${time}:00`)
    if (Number.isNaN(start.getTime())) {
      setError('Ungültiges Datum/Uhrzeit.')
      return
    }
    const end = new Date(start.getTime() + Math.max(5, durationMin) * 60000)
    const priceCents = priceEuro.trim() ? Math.round(Number(priceEuro.replace(',', '.')) * 100) : null

    const payload = {
      customerName: customerName.trim() || 'Unbekannt',
      customerPhone: customerPhone.trim() || null,
      service,
      location: KI_DEFAULT_LOCATION,
      staff: staff.trim() || null,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      priceCents: priceCents != null && !Number.isNaN(priceCents) ? priceCents : null,
      notesPublic: notesPublic.trim() || null,
      notesInternal: notesInternal.trim() || null,
      status: confirmed ? ('bestaetigt' as const) : ('geplant' as const),
    }

    setBusy(true)
    try {
      const res = await fetch(
        isEdit ? `/api/ki-rezeptionist/appointments/${appointment!.id}` : '/api/ki-rezeptionist/appointments',
        {
          method: isEdit ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      )
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Speichern fehlgeschlagen.')
        return
      }
      onSaved(data.appointment)
      onOpenChange(false)
    } catch {
      setError('Verbindung zum Server fehlgeschlagen.')
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete() {
    if (!appointment) return
    setBusy(true)
    try {
      const res = await fetch(`/api/ki-rezeptionist/appointments/${appointment.id}`, { method: 'DELETE' })
      if (res.ok) {
        onDeleted(appointment.id)
        onOpenChange(false)
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Termin bearbeiten' : 'Neuer Termin'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Termin anpassen, speichern oder löschen.' : 'Einen neuen Termin für einen Kunden vereinbaren.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Dienst / Service</Label>
            <select
              className={FIELD}
              value={service}
              onChange={(e) => {
                setService(e.target.value)
                if (!isEdit) {
                  const svc = KI_SERVICES.find((s) => s.label === e.target.value)
                  if (svc) setDurationMin(svc.durationMin)
                }
              }}
            >
              {KI_SERVICES.map((s) => (
                <option key={s.id} value={s.label}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Kunde</Label>
              <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Name" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Telefon</Label>
              <Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="optional" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Datum</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Uhrzeit</Label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Dauer (Min)</Label>
              <Input
                type="number"
                min={5}
                step={5}
                value={durationMin}
                onChange={(e) => setDurationMin(Math.max(5, Number(e.target.value) || 0))}
              />
            </div>
          </div>
          {endLabel && (
            <p className="text-xs text-muted-foreground">
              Ende: <span className="font-medium tabular-nums">{endLabel} Uhr</span> · Standort {KI_DEFAULT_LOCATION}
            </p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Mitarbeiter</Label>
              <input
                className={FIELD}
                list="ki-staff-list"
                value={staff}
                onChange={(e) => setStaff(e.target.value)}
                placeholder="optional"
              />
              <datalist id="ki-staff-list">
                {KI_STAFF.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Gesamt (€)</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={priceEuro}
                onChange={(e) => setPriceEuro(e.target.value)}
                placeholder="0,00"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Notizen (für Empfang sichtbar)</Label>
            <textarea
              className={cn(FIELD, 'h-16 resize-none py-2')}
              value={notesPublic}
              onChange={(e) => setNotesPublic(e.target.value)}
              placeholder="z. B. Fahrzeug, Anliegen …"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Interne Notizen (nur Mitarbeiter)</Label>
            <textarea
              className={cn(FIELD, 'h-16 resize-none py-2')}
              value={notesInternal}
              onChange={(e) => setNotesInternal(e.target.value)}
            />
          </div>

          <label className="flex cursor-pointer items-start gap-2 pt-0.5 text-sm">
            <Checkbox
              checked={confirmed}
              onCheckedChange={(v) => setConfirmed(Boolean(v))}
              className="mt-0.5"
            />
            <span>
              Termin bestätigt
              <span className="block text-xs text-muted-foreground">
                Unbestätigt = im Kalender schraffiert/gestrichelt.
              </span>
            </span>
          </label>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <div className="mt-1 flex items-center justify-between gap-2 border-t border-border/60 pt-4">
          <div>
            {isEdit &&
              (confirmDelete ? (
                <div className="flex items-center gap-2">
                  <Button variant="destructive" size="sm" disabled={busy} onClick={handleDelete}>
                    {busy ? 'Löscht …' : 'Ja, löschen'}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
                    Abbrechen
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 className="h-4 w-4" />
                  Löschen
                </Button>
              ))}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button size="sm" disabled={busy} onClick={handleSave}>
              {isEdit ? <Save className="h-4 w-4" /> : <CalendarPlus className="h-4 w-4" />}
              {busy ? 'Speichert …' : isEdit ? 'Änderungen speichern' : 'Termin erstellen'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
