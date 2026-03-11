'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Bell, Mail, Send } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCallbackStore } from '@/lib/stores/callback-store'
import type { Callback } from '@/lib/types'

interface ReminderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  callback: Callback | null
}

const reminderPresets = [
  { minutes: 0, label: 'Sofort' },
  { minutes: 5, label: '5 min' },
  { minutes: 10, label: '10 min' },
  { minutes: 15, label: '15 min' },
  { minutes: 30, label: '30 min' },
  { minutes: 60, label: '1 Std' },
] as const

export function CallcenterReminderDialog({
  open,
  onOpenChange,
  callback,
}: ReminderDialogProps) {
  const [selectedMinutes, setSelectedMinutes] = useState<number | null>(null)
  const [message, setMessage] = useState('')
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('')
  const [emailSent, setEmailSent] = useState(false)

  const employees = useCallbackStore((s) => s.employees)
  const addReminder = useCallbackStore((s) => s.addReminder)
  const sendEmailNotification = useCallbackStore((s) => s.sendEmailNotification)

  const handleClose = (val: boolean) => {
    if (!val) {
      setSelectedMinutes(null)
      setMessage('')
      setSelectedEmployeeId('')
      setEmailSent(false)
    }
    onOpenChange(val)
  }

  const targetEmployeeId = selectedEmployeeId || callback?.assignedEmployeeId || employees[0]?.id || ''
  const targetEmployee = employees.find(e => e.id === targetEmployeeId)

  const handleSendEmail = () => {
    if (!callback || !targetEmployeeId) return
    sendEmailNotification(callback.id, targetEmployeeId, 'Admin')
    setEmailSent(true)
  }

  const handleSubmit = () => {
    if (!callback || selectedMinutes === null) return

    const reminderAt = new Date(
      Date.now() + selectedMinutes * 60 * 1000
    ).toISOString()

    addReminder({
      callbackId: callback.id,
      employeeId: targetEmployeeId,
      reminderAt,
      message: message.trim() || (selectedMinutes === 0
        ? `Sofortige Erinnerung: Rückruf für ${callback.customerName}`
        : `Erinnerung in ${selectedMinutes} Min: Rückruf für ${callback.customerName}`),
      createdBy: 'Admin',
    })

    // Auto-send email for immediate reminders
    if (selectedMinutes === 0 && targetEmployeeId) {
      sendEmailNotification(callback.id, targetEmployeeId, 'Admin')
    }

    setSelectedMinutes(null)
    setMessage('')
    setSelectedEmployeeId('')
    setEmailSent(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Erinnerung setzen</DialogTitle>
          {callback && (
            <DialogDescription>
              {callback.customerName} — {callback.reason}
            </DialogDescription>
          )}
        </DialogHeader>

        {callback && (
          <div className="space-y-4">
            {/* Employee selection */}
            <div className="space-y-1.5">
              <Label>Erinnern:</Label>
              <Select
                value={targetEmployeeId}
                onValueChange={setSelectedEmployeeId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Mitarbeiter auswählen..." />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Direct email send */}
            <div className="flex items-center gap-2 rounded-lg border px-3 py-2.5 bg-muted/30">
              <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">E-Mail-Benachrichtigung</p>
                <p className="text-xs text-muted-foreground truncate">
                  {targetEmployee ? `An ${targetEmployee.name} (${targetEmployee.email ?? 'keine E-Mail'})` : 'Mitarbeiter auswählen'}
                </p>
              </div>
              <Button
                size="sm"
                variant={emailSent ? 'secondary' : 'default'}
                disabled={!targetEmployeeId || emailSent}
                onClick={handleSendEmail}
                className="flex-shrink-0"
              >
                <Send className="h-3.5 w-3.5 mr-1" />
                {emailSent ? 'Gesendet' : 'Jetzt senden'}
              </Button>
            </div>

            {/* Time presets */}
            <div className="space-y-1.5">
              <Label>Erinnerung planen:</Label>
              <div className="flex flex-wrap gap-2">
                {reminderPresets.map((preset) => (
                  <Button
                    key={preset.minutes}
                    type="button"
                    variant="outline"
                    size="sm"
                    className={cn(
                      selectedMinutes === preset.minutes &&
                        'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground'
                    )}
                    onClick={() => setSelectedMinutes(preset.minutes)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Optional message */}
            <div className="space-y-1.5">
              <Label>Nachricht (optional):</Label>
              <Input
                placeholder="Erinnerungsnotiz..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>
            Abbrechen
          </Button>
          <Button
            disabled={selectedMinutes === null}
            onClick={handleSubmit}
          >
            <Bell className="h-4 w-4 mr-1" />
            {selectedMinutes === 0 ? 'Sofort senden' : 'Erinnerung setzen'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
