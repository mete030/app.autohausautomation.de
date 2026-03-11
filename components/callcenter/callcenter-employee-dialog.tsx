'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Save, Plus } from 'lucide-react'
import { employeeRoleConfig } from '@/lib/constants'
import type { Employee, EmployeeRole } from '@/lib/types'

interface EmployeeFormData {
  name: string
  role: EmployeeRole
  email: string
  phone: string
  isCallAgent: boolean
  isSupervisor: boolean
}

interface CallcenterEmployeeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employee?: Employee
  onSave: (data: EmployeeFormData) => void
}

const roleOptions = Object.entries(employeeRoleConfig).map(([value, cfg]) => ({
  value: value as EmployeeRole,
  label: cfg.label,
}))

const emptyForm: EmployeeFormData = {
  name: '',
  role: 'serviceberater',
  email: '',
  phone: '',
  isCallAgent: false,
  isSupervisor: false,
}

export function CallcenterEmployeeDialog({
  open, onOpenChange, employee, onSave,
}: CallcenterEmployeeDialogProps) {
  const [form, setForm] = useState<EmployeeFormData>(emptyForm)

  const isEditing = !!employee

  useEffect(() => {
    if (open) {
      if (employee) {
        setForm({
          name: employee.name,
          role: employee.role,
          email: employee.email ?? '',
          phone: employee.phone ?? '',
          isCallAgent: employee.isCallAgent,
          isSupervisor: employee.isSupervisor,
        })
      } else {
        setForm(emptyForm)
      }
    }
  }, [open, employee])

  const handleClose = (val: boolean) => {
    if (!val) setForm(emptyForm)
    onOpenChange(val)
  }

  const handleSave = () => {
    if (!form.name.trim()) return
    onSave({
      ...form,
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
    })
    setForm(emptyForm)
    onOpenChange(false)
  }

  const isValid = form.name.trim().length > 0

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Mitarbeiter bearbeiten' : 'Neuer Mitarbeiter'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Bearbeiten Sie die Mitarbeiterdaten und klicken Sie auf Speichern.'
              : 'Geben Sie die Daten des neuen Mitarbeiters ein.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="emp-name">Name *</Label>
            <Input
              id="emp-name"
              placeholder="Vor- und Nachname"
              value={form.name}
              onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="emp-role">Rolle</Label>
            <Select
              value={form.role}
              onValueChange={v => setForm(prev => ({ ...prev, role: v as EmployeeRole }))}
            >
              <SelectTrigger id="emp-role">
                <SelectValue placeholder="Rolle auswählen..." />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map(o => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="emp-email">E-Mail</Label>
              <Input
                id="emp-email"
                type="email"
                placeholder="name@firma.de"
                value={form.email}
                onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="emp-phone">Telefon</Label>
              <Input
                id="emp-phone"
                type="tel"
                placeholder="+49 711 ..."
                value={form.phone}
                onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-md border px-3 py-2.5">
            <Label htmlFor="emp-call-agent" className="cursor-pointer">
              Kann Anrufe entgegennehmen
            </Label>
            <Switch
              id="emp-call-agent"
              checked={form.isCallAgent}
              onCheckedChange={v => setForm(prev => ({ ...prev, isCallAgent: v }))}
            />
          </div>

          <div className="flex items-center justify-between rounded-md border px-3 py-2.5">
            <Label htmlFor="emp-supervisor" className="cursor-pointer">
              Ist Vorgesetzter
            </Label>
            <Switch
              id="emp-supervisor"
              checked={form.isSupervisor}
              onCheckedChange={v => setForm(prev => ({ ...prev, isSupervisor: v }))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>
            Abbrechen
          </Button>
          <Button disabled={!isValid} onClick={handleSave}>
            {isEditing ? (
              <>
                <Save className="h-4 w-4 mr-1" />
                Speichern
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-1" />
                Erstellen
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
