'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Clock3, MapPin, Phone, Sparkles } from 'lucide-react'
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
import { formatDateTime } from '@/lib/utils'
import type { Vehicle, VehicleBlocker, VehicleLocation, VehicleOwnerRole, VehicleStatus } from '@/lib/types'

const quickActions: Array<{
  label: string
  description: string
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
    description: 'Steuert das Fahrzeug in die operative Technik-Queue.',
    update: {
      status: 'werkstatt',
      location: 'Werkstatt',
      blocker: 'keiner',
      ownerRole: 'werkstatt',
      nextStep: 'Bitte an Aufbereitung',
    },
  },
  {
    label: 'An Aufbereitung',
    description: 'Wechselt in den kosmetischen Schritt ohne Blocker.',
    update: {
      status: 'aufbereitung',
      location: 'Aufbereitung',
      blocker: 'keiner',
      ownerRole: 'aufbereitung',
      nextStep: 'Bitte an Foto-Team',
    },
  },
  {
    label: 'Zu Fotos',
    description: 'Übergibt an Foto- und Inseratsteam.',
    update: {
      location: 'Fotozone',
      blocker: 'keiner',
      ownerRole: 'foto_inserat',
      nextStep: 'Bereit für Inserat',
    },
  },
  {
    label: 'Zum Lackierer',
    description: 'Markiert externen Lackierer als aktiven Engpass.',
    update: {
      location: 'Externer Lackierer',
      blocker: 'wartet_auf_lackierer',
      ownerRole: 'werkstatt',
      nextStep: 'Zurück in Werkstatt nach Lack',
    },
  },
  {
    label: 'Rückruf offen',
    description: 'Phase-2 Hook für offenen Kundenkontakt.',
    update: {
      blocker: 'wartet_auf_rueckruf',
      ownerRole: 'verkauf',
      nextStep: 'Kunde für Rückruf freigeben',
    },
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
  }

  const handleQuickAction = (action: typeof quickActions[number]) => {
    if (!vehicle) return
    updateVehicleOperationalState({
      vehicleId: vehicle.id,
      ...action.update,
      historyAction: action.label,
      historyNote: action.description,
      actor: 'Hofsteuerung',
      source: 'manual',
    })
  }

  if (!vehicle) return null

  const sla = getSlaState(vehicle)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isDesktop ? 'right' : 'bottom'}
        className={isDesktop ? 'w-full max-w-[560px] p-0 sm:max-w-[560px]' : 'max-h-[88vh] rounded-t-[28px] p-0'}
      >
        <div className="flex h-full flex-col">
          <SheetHeader className="border-b border-border/60 px-6 pb-5 pt-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <SheetTitle className="text-xl">{vehicle.make} {vehicle.model}</SheetTitle>
                <SheetDescription className="mt-1">
                  {vehicle.licensePlate} · {vehicleLocationLabels[vehicle.location]} · {laneLabel}
                </SheetDescription>
              </div>
              <Badge variant={sla.overdue ? 'destructive' : 'secondary'}>
                {sla.text}
              </Badge>
            </div>
          </SheetHeader>

          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
            <section className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Jetzt</p>
                <div className="mt-3 space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant="secondary">{vehicleStatusLabels[vehicle.status]}</Badge>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Standort</span>
                    <span className="font-medium">{vehicleLocationLabels[vehicle.location]}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Verantwortlich</span>
                    <span className="font-medium">{vehicleOwnerRoleLabels[vehicle.ownerRole]}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Wartezeit</span>
                    <span className="font-medium">{getCurrentStepAgeLabel(vehicle)}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Als Nächstes</p>
                <div className="mt-3 space-y-3 text-sm">
                  <div className="rounded-xl bg-background px-3 py-2">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Next Step</p>
                    <p className="mt-1 font-medium">{vehicle.nextStep || 'Noch offen'}</p>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Blocker</span>
                    <Badge variant={vehicle.blocker === 'keiner' ? 'outline' : 'secondary'}>
                      {vehicleBlockerLabels[vehicle.blocker]}
                    </Badge>
                  </div>
                  {vehicle.priorityNote && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-2 text-amber-900">
                      <p className="text-[11px] uppercase tracking-[0.18em] opacity-70">Hinweis</p>
                      <p className="mt-1 text-sm">{vehicle.priorityNote}</p>
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">Quick Actions</h3>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    type="button"
                    onClick={() => handleQuickAction(action)}
                    className="rounded-2xl border border-border/70 bg-card p-4 text-left transition-colors hover:bg-muted/40"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium">{action.label}</p>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{action.description}</p>
                  </button>
                ))}
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <button
                  type="button"
                  disabled
                  className="rounded-2xl border border-dashed border-border/70 bg-muted/20 p-4 text-left opacity-70"
                >
                  <div className="flex items-center gap-2 font-medium">
                    <Phone className="h-4 w-4" />
                    Callcenter
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">Coming soon: offene Rückrufe direkt mit Fahrzeug verknüpfen.</p>
                </button>
                <button
                  type="button"
                  disabled
                  className="rounded-2xl border border-dashed border-border/70 bg-muted/20 p-4 text-left opacity-70"
                >
                  <div className="flex items-center gap-2 font-medium">
                    <MapPin className="h-4 w-4" />
                    Inserate
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">Coming soon: Bereit-für-Inserat direkt in die Listing-Pipeline schieben.</p>
                </button>
              </div>
            </section>

            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">Fallback bearbeiten</h3>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <Select value={status} onValueChange={(value) => setStatus(value as VehicleStatus)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(vehicleStatusLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={location} onValueChange={(value) => setLocation(value as VehicleLocation)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Standort" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(vehicleLocationLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={blocker} onValueChange={(value) => setBlocker(value as VehicleBlocker)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Blocker" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(vehicleBlockerLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={ownerRole} onValueChange={(value) => setOwnerRole(value as VehicleOwnerRole)}>
                  <SelectTrigger>
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
                onChange={(event) => setNextStep(event.target.value)}
                placeholder="Nächster Schritt"
              />

              <Textarea
                value={priorityNote}
                onChange={(event) => setPriorityNote(event.target.value)}
                placeholder="Optionaler Prioritätshinweis"
                className="min-h-[88px]"
              />

              <div className="flex justify-end">
                <Button onClick={handleApply}>Manuelle Änderung speichern</Button>
              </div>
            </section>

            <section className="space-y-3 pb-3">
              <h3 className="text-sm font-semibold">Aktivitätsverlauf</h3>
              <div className="space-y-3">
                {[...vehicle.history].reverse().map((entry) => (
                  <div key={entry.id} className="rounded-2xl border border-border/60 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium">{entry.action}</p>
                      <Badge variant="outline">{entry.source ?? 'system'}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDateTime(entry.date)} · {entry.user}
                    </p>
                    {entry.note && (
                      <p className="mt-2 text-sm text-muted-foreground">{entry.note}</p>
                    )}
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
