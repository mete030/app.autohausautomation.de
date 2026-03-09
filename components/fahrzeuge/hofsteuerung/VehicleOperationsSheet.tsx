'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Clock3,
  MessageSquare,
  Sparkles,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { useHydrated } from '@/hooks/useHydrated'
import {
  deriveVehicleLane,
  getCurrentStepAgeLabel,
  getSlaState,
  vehicleBlockerLabels,
  vehicleLocationLabels,
  vehicleOperationalLaneLabels,
  vehicleOwnerRoleLabels,
  vehicleStatusLabels,
} from '@/lib/vehicle-operations'
import { useVehicleStore } from '@/lib/stores/vehicle-store'
import { cn, formatDateTime } from '@/lib/utils'
import type { Vehicle, VehicleBlocker, VehicleLocation, VehicleOwnerRole, VehicleStatus } from '@/lib/types'

const quickActions: Array<{
  label: string
  update: {
    status?: VehicleStatus
    location?: VehicleLocation
    blocker?: VehicleBlocker
    ownerRole?: VehicleOwnerRole
    nextStep?: string
  }
}> = [
  {
    label: 'An Werkstatt',
    update: { status: 'werkstatt', location: 'Werkstatt', blocker: 'keiner', ownerRole: 'werkstatt', nextStep: 'Bitte an Aufbereitung' },
  },
  {
    label: 'An Aufbereitung',
    update: { status: 'aufbereitung', location: 'Aufbereitung', blocker: 'keiner', ownerRole: 'aufbereitung', nextStep: 'Bitte an Foto-Team' },
  },
  {
    label: 'Zu Fotos',
    update: { location: 'Fotozone', blocker: 'keiner', ownerRole: 'foto_inserat', nextStep: 'Bereit für Inserat' },
  },
  {
    label: 'Zum Lackierer',
    update: { location: 'Externer Lackierer', blocker: 'wartet_auf_lackierer', ownerRole: 'werkstatt', nextStep: 'Zurück in Werkstatt nach Lack' },
  },
  {
    label: 'Rückruf offen',
    update: { blocker: 'wartet_auf_rueckruf', ownerRole: 'verkauf', nextStep: 'Kunde für Rückruf freigeben' },
  },
]

interface VehicleOperationsSheetProps {
  vehicle: Vehicle | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function VehicleOperationsSheet({ vehicle, open, onOpenChange }: VehicleOperationsSheetProps) {
  const hydrated = useHydrated()
  const updateVehicleOperationalState = useVehicleStore((state) => state.updateVehicleOperationalState)
  const [isDesktop, setIsDesktop] = useState(false)
  const [status, setStatus] = useState<VehicleStatus>(vehicle?.status ?? 'eingang')
  const [location, setLocation] = useState<VehicleLocation>(vehicle?.location ?? 'Hof A')
  const [blocker, setBlocker] = useState<VehicleBlocker>(vehicle?.blocker ?? 'keiner')
  const [ownerRole, setOwnerRole] = useState<VehicleOwnerRole>(vehicle?.ownerRole ?? 'vorpark')
  const [nextStep, setNextStep] = useState(vehicle?.nextStep ?? '')
  const [priorityNote, setPriorityNote] = useState(vehicle?.priorityNote ?? '')
  const [showEditor, setShowEditor] = useState(false)
  const [internalNote, setInternalNote] = useState('')

  useEffect(() => {
    if (!hydrated) return
    const sync = () => setIsDesktop(window.innerWidth >= 1024)
    sync()
    window.addEventListener('resize', sync)
    return () => window.removeEventListener('resize', sync)
  }, [hydrated])

  const laneLabel = useMemo(() => {
    if (!vehicle) return null
    return vehicleOperationalLaneLabels[deriveVehicleLane(vehicle)]
  }, [vehicle])

  const handleApply = () => {
    if (!vehicle) return
    updateVehicleOperationalState({
      vehicleId: vehicle.id,
      status,
      location,
      blocker,
      ownerRole,
      nextStep,
      priorityNote,
      historyAction: 'Manuelles Update',
      actor: 'Hofsteuerung',
      source: 'manual',
    })
    setShowEditor(false)
  }

  const handleQuickAction = (action: (typeof quickActions)[number]) => {
    if (!vehicle) return
    updateVehicleOperationalState({
      vehicleId: vehicle.id,
      ...action.update,
      historyAction: action.label,
      actor: 'Hofsteuerung',
      source: 'manual',
    })
  }

  const handleSaveNote = () => {
    if (!vehicle || !internalNote.trim()) return
    updateVehicleOperationalState({
      vehicleId: vehicle.id,
      historyAction: 'Notiz',
      historyNote: internalNote.trim(),
      actor: 'Hofsteuerung',
      source: 'manual',
    })
    setInternalNote('')
  }

  if (!vehicle) return null

  const sla = getSlaState(vehicle)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isDesktop ? 'right' : 'bottom'}
        className={isDesktop ? 'w-full max-w-[520px] p-0 sm:max-w-[520px]' : 'max-h-[88vh] rounded-t-[28px] p-0'}
      >
        <div className="flex h-full flex-col">
          {/* ─── Header ─── */}
          <SheetHeader className="border-b border-border/60 px-3.5 pb-3 pt-4 sm:px-5 sm:pb-4 sm:pt-5">
            <div className="flex items-start justify-between gap-2 sm:gap-3">
              <div className="min-w-0">
                <SheetTitle className="text-base sm:text-lg">{vehicle.make} {vehicle.model}</SheetTitle>
                <SheetDescription className="mt-0.5 text-xs">
                  {vehicle.licensePlate} · {vehicleLocationLabels[vehicle.location]} · {laneLabel}
                </SheetDescription>
              </div>
              <Badge variant={sla.overdue ? 'destructive' : 'secondary'} className="shrink-0 text-xs">
                {sla.text}
              </Badge>
            </div>
          </SheetHeader>

          <div className="flex-1 space-y-4 overflow-y-auto px-3.5 py-3 sm:space-y-5 sm:px-5 sm:py-4">
            {/* ─── Status Overview ─── */}
            <section className="grid gap-2.5 sm:grid-cols-2 sm:gap-3">
              <div className="rounded-xl border border-border/60 bg-muted/30 px-3 py-2.5 sm:px-3.5 sm:py-3">
                <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Aktuell</p>
                <div className="mt-1.5 space-y-1.5 text-[13px] sm:mt-2 sm:space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant="secondary" className="text-[10px]">{vehicleStatusLabels[vehicle.status]}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Standort</span>
                    <span className="font-medium">{vehicleLocationLabels[vehicle.location]}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Verantwortlich</span>
                    <span className="font-medium">{vehicleOwnerRoleLabels[vehicle.ownerRole]}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Wartezeit</span>
                    <span className="font-medium">{getCurrentStepAgeLabel(vehicle)}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border/60 bg-muted/30 px-3 py-2.5 sm:px-3.5 sm:py-3">
                <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Nächster Schritt</p>
                <p className={cn('mt-2 text-sm font-medium', !vehicle.nextStep && 'italic text-muted-foreground')}>
                  {vehicle.nextStep || 'Noch offen'}
                </p>
                {vehicle.blocker !== 'keiner' && (
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    <span className="text-xs text-amber-700 dark:text-amber-400">
                      {vehicleBlockerLabels[vehicle.blocker]}
                    </span>
                  </div>
                )}
                {vehicle.priorityNote && (
                  <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50/70 px-2.5 py-1.5 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
                    {vehicle.priorityNote}
                  </div>
                )}
              </div>
            </section>

            {/* ─── Quick Actions (compact pills) ─── */}
            <section className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-violet-500" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quick Actions</h3>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {quickActions.map((action) => (
                  <Button
                    key={action.label}
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1 rounded-full px-3 text-xs"
                    onClick={() => handleQuickAction(action)}
                  >
                    {action.label}
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  </Button>
                ))}
              </div>
            </section>

            {/* ─── Manual Editor (collapsible) ─── */}
            <section className="space-y-2">
              <button
                type="button"
                onClick={() => setShowEditor(!showEditor)}
                className="flex w-full items-center gap-1.5 text-left"
              >
                <Clock3 className="h-3.5 w-3.5 text-muted-foreground" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Manuell bearbeiten</h3>
                {showEditor ? (
                  <ChevronUp className="ml-auto h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="ml-auto h-3.5 w-3.5 text-muted-foreground" />
                )}
              </button>

              {showEditor && (
                <div className="space-y-2.5 rounded-xl border border-border/60 bg-muted/20 p-3">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Select value={status} onValueChange={(value) => setStatus(value as VehicleStatus)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(vehicleStatusLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={location} onValueChange={(value) => setLocation(value as VehicleLocation)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Standort" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(vehicleLocationLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={blocker} onValueChange={(value) => setBlocker(value as VehicleBlocker)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Blocker" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(vehicleBlockerLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={ownerRole} onValueChange={(value) => setOwnerRole(value as VehicleOwnerRole)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Verantwortlich" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(vehicleOwnerRoleLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Input
                    value={nextStep}
                    onChange={(e) => setNextStep(e.target.value)}
                    placeholder="Nächster Schritt"
                    className="h-8 text-xs"
                  />
                  <Textarea
                    value={priorityNote}
                    onChange={(e) => setPriorityNote(e.target.value)}
                    placeholder="Prioritätshinweis (optional)"
                    className="min-h-[60px] text-xs"
                  />
                  <div className="flex justify-end">
                    <Button size="sm" className="h-7 text-xs" onClick={handleApply}>
                      Speichern
                    </Button>
                  </div>
                </div>
              )}
            </section>

            {/* ─── Internal Notes ─── */}
            <section className="space-y-2">
              <div className="flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Interne Notiz</h3>
              </div>
              <div className="flex gap-2">
                <Textarea
                  value={internalNote}
                  onChange={(e) => setInternalNote(e.target.value)}
                  placeholder="Notiz hinzufügen ..."
                  className="min-h-[48px] flex-1 text-xs"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="h-auto self-end text-xs"
                  disabled={!internalNote.trim()}
                  onClick={handleSaveNote}
                >
                  Senden
                </Button>
              </div>
            </section>

            {/* ─── Activity History (compact timeline) ─── */}
            <section className="space-y-2 pb-2 sm:pb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Verlauf</h3>
              <div className="space-y-0">
                {[...vehicle.history].reverse().map((entry, i) => (
                  <div
                    key={entry.id}
                    className={cn(
                      'relative flex gap-3 py-2.5',
                      i < vehicle.history.length - 1 && 'border-b border-border/40'
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{entry.action}</p>
                        <Badge variant="outline" className="px-1 py-0 text-[9px]">
                          {entry.source ?? 'system'}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {formatDateTime(entry.date)} · {entry.user}
                      </p>
                      {entry.note && (
                        <p className="mt-1 text-xs text-muted-foreground">{entry.note}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
