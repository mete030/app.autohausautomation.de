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
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCallbackStore } from '@/lib/stores/callback-store'
import { escalationLevelConfig } from '@/lib/constants'
import type { Callback, EscalationLevel } from '@/lib/types'

interface EscalationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  callback: Callback | null
}

export function CallcenterEscalationDialog({
  open,
  onOpenChange,
  callback,
}: EscalationDialogProps) {
  const [selectedLevel, setSelectedLevel] = useState<EscalationLevel | null>(null)
  const [selectedTarget, setSelectedTarget] = useState('')
  const [reason, setReason] = useState('')

  const employees = useCallbackStore((s) => s.employees)
  const escalateCallbackToLevel = useCallbackStore((s) => s.escalateCallbackToLevel)

  const supervisors = employees.filter((e) => e.isSupervisor)

  const availableLevels = ([2, 3] as EscalationLevel[]).filter(
    (level) => callback && level > callback.escalationLevel
  )

  const handleClose = (val: boolean) => {
    if (!val) {
      setSelectedLevel(null)
      setSelectedTarget('')
      setReason('')
    }
    onOpenChange(val)
  }

  const handleSubmit = () => {
    if (!callback || !selectedLevel || !selectedTarget) return

    escalateCallbackToLevel({
      callbackId: callback.id,
      toLevel: selectedLevel,
      escalatedBy: 'Manuell',
      escalatedTo: selectedTarget,
      trigger: 'manuell',
      note: reason.trim() || undefined,
    })

    setSelectedLevel(null)
    setSelectedTarget('')
    setReason('')
    onOpenChange(false)
  }

  const currentConfig = callback
    ? escalationLevelConfig[callback.escalationLevel]
    : null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rückruf eskalieren</DialogTitle>
          <DialogDescription>
            Eskalieren Sie diesen Rückruf an eine höhere Bearbeitungsstufe.
          </DialogDescription>
        </DialogHeader>

        {callback && (
          <div className="space-y-4">
            {/* Customer & current level */}
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <span className="text-muted-foreground">Kunde:</span>{' '}
                <span className="font-medium">{callback.customerName}</span>
              </div>
              {currentConfig && (
                <Badge
                  variant="outline"
                  className={cn(currentConfig.bg, currentConfig.color)}
                >
                  {currentConfig.label}
                </Badge>
              )}
            </div>

            {/* Level selection cards */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Neue Eskalationsstufe</label>
              <div className="grid gap-2">
                {availableLevels.map((level) => {
                  const config = escalationLevelConfig[level]
                  const isSelected = selectedLevel === level
                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => {
                        setSelectedLevel(level)
                        setSelectedTarget('')
                      }}
                      className={cn(
                        'flex items-center gap-3 rounded-lg border p-3 text-left text-sm transition-colors',
                        isSelected
                          ? 'border-primary bg-primary/5 ring-1 ring-primary'
                          : 'border-border hover:bg-muted/50'
                      )}
                    >
                      <div
                        className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold',
                          config.bg,
                          config.color
                        )}
                      >
                        {level}
                      </div>
                      <span className="font-medium">{config.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Supervisor selection */}
            {selectedLevel && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Eskalieren an</label>
                <Select value={selectedTarget} onValueChange={setSelectedTarget}>
                  <SelectTrigger>
                    <SelectValue placeholder="Vorgesetzten auswählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {supervisors.map((emp) => (
                      <SelectItem key={emp.id} value={emp.name}>
                        {emp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Reason */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Grund der Eskalation</label>
              <Textarea
                placeholder="Beschreiben Sie den Grund..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>
            Abbrechen
          </Button>
          <Button
            disabled={!selectedLevel || !selectedTarget}
            onClick={handleSubmit}
          >
            <AlertTriangle className="h-4 w-4 mr-1" />
            Eskalieren
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
