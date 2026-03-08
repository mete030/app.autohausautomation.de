'use client'

import { useDeferredValue, useMemo, useState, type ComponentType } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  ListTodo,
  MapPin,
  Mic,
  Search,
  ShieldAlert,
  Sparkles,
  Workflow,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { HofsteuerungVoicePanel } from '@/components/fahrzeuge/hofsteuerung/HofsteuerungVoicePanel'
import { VehicleOperationsSheet } from '@/components/fahrzeuge/hofsteuerung/VehicleOperationsSheet'
import {
  deriveVehicleLane,
  getCurrentStepAgeHours,
  getCurrentStepAgeLabel,
  getSlaState,
  isVehicleOverdue,
  vehicleBlockerLabels,
  vehicleLocationLabels,
  vehicleOwnerRoleLabels,
  vehicleStatusLabels,
} from '@/lib/vehicle-operations'
import { useVehicleStore } from '@/lib/stores/vehicle-store'
import { cn, formatCurrency, formatDateTime } from '@/lib/utils'
import type { Vehicle, VehicleLocation, VehicleOperationalLane } from '@/lib/types'

const laneOrder: VehicleOperationalLane[] = ['kritisch', 'blockiert', 'bereit', 'in_arbeit']

const laneTitles: Record<VehicleOperationalLane, string> = {
  kritisch: 'Jetzt prüfen',
  blockiert: 'Blocker klären',
  bereit: 'Jetzt weitergeben',
  in_arbeit: 'Läuft gerade',
}

const laneDescriptions: Record<VehicleOperationalLane, string> = {
  kritisch: 'Hier fehlt eine klare nächste Aktion oder die SLA ist gerissen.',
  blockiert: 'Hier wartet das Fahrzeug auf Teile, Freigabe, Lackierer oder Rückruf.',
  bereit: 'Hier ist das Fahrzeug fertig für den nächsten Verantwortlichen.',
  in_arbeit: 'Diese Fahrzeuge laufen aktuell stabil im Prozess.',
}

const laneTaskCopy: Record<VehicleOperationalLane, string> = {
  kritisch: 'Nächsten Schritt festlegen',
  blockiert: 'Blocker lösen oder eskalieren',
  bereit: 'An das nächste Team übergeben',
  in_arbeit: 'Nur prüfen, falls etwas kippt',
}

const quickFilters = [
  { id: 'alle', label: 'Alle Fahrzeuge' },
  { id: 'Werkstatt', label: 'Nur Werkstatt' },
  { id: 'Lackierer', label: 'Nur Lackierer' },
  { id: 'ohne_next', label: 'Ohne nächsten Schritt' },
  { id: 'heute_faellig', label: 'Heute fällig' },
] as const

function sortVehicles(a: Vehicle, b: Vehicle) {
  const overdueDiff = Number(isVehicleOverdue(b)) - Number(isVehicleOverdue(a))
  if (overdueDiff !== 0) return overdueDiff

  const blockerDiff = Number(b.blocker !== 'keiner') - Number(a.blocker !== 'keiner')
  if (blockerDiff !== 0) return blockerDiff

  return getCurrentStepAgeHours(b) - getCurrentStepAgeHours(a)
}

function getUrgencyReason(vehicle: Vehicle) {
  if (vehicle.nextStep.trim().length === 0) {
    return 'Kein nächster Schritt definiert'
  }
  if (vehicle.blocker !== 'keiner') {
    return vehicleBlockerLabels[vehicle.blocker]
  }
  if (isVehicleOverdue(vehicle)) {
    return 'SLA überfällig'
  }
  return laneTaskCopy[deriveVehicleLane(vehicle)]
}

function MetricCard({
  label,
  value,
  caption,
  icon: Icon,
  active,
  onClick,
}: {
  label: string
  value: number
  caption: string
  icon: ComponentType<{ className?: string }>
  active?: boolean
  onClick?: () => void
}) {
  return (
    <Card
      className={cn(
        'border-border/70 bg-card/80 transition-all',
        onClick && 'cursor-pointer hover:border-primary/30 hover:shadow-sm',
        active && 'ring-2 ring-primary/50 border-primary/40 bg-primary/5 shadow-sm'
      )}
      onClick={onClick}
    >
      <CardContent className="flex items-start justify-between gap-4 p-4">
        <div>
          <p className={cn(
            'text-[11px] uppercase tracking-[0.18em]',
            active ? 'text-primary' : 'text-muted-foreground'
          )}>{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
          <p className="mt-1 text-sm text-muted-foreground">{caption}</p>
        </div>
        <div className={cn(
          'rounded-2xl p-3',
          active ? 'bg-primary/15' : 'bg-muted'
        )}>
          <Icon className={cn('h-4.5 w-4.5', active ? 'text-primary' : 'text-primary')} />
        </div>
      </CardContent>
    </Card>
  )
}

function VehicleCard({
  vehicle,
  lane,
  onSelect,
}: {
  vehicle: Vehicle
  lane: VehicleOperationalLane
  onSelect: (vehicleId: string) => void
}) {
  const sla = getSlaState(vehicle)

  return (
    <button
      type="button"
      onClick={() => onSelect(vehicle.id)}
      className="w-full rounded-[24px] border border-border/70 bg-card p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-base font-semibold leading-tight">{vehicle.make} {vehicle.model}</p>
          <p className="mt-1 text-sm text-muted-foreground">{vehicle.licensePlate}</p>
        </div>
        <Badge variant={sla.overdue ? 'destructive' : 'secondary'} className="shrink-0">
          {sla.text}
        </Badge>
      </div>

      <div className="mt-3 rounded-xl border border-primary/10 bg-primary/5 px-3 py-2">
        <p className="text-[11px] uppercase tracking-[0.18em] text-primary/80">Was jetzt zu tun ist</p>
        <p className="mt-1 text-sm font-medium text-foreground">{laneTaskCopy[lane]}</p>
      </div>

      <div className="mt-4 space-y-3 text-sm">
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">Standort</span>
          <span className="font-medium">{vehicleLocationLabels[vehicle.location]}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">Wartezeit</span>
          <span className="font-medium">{getCurrentStepAgeLabel(vehicle)}</span>
        </div>
        <div className="rounded-xl bg-muted/50 px-3 py-2">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Nächster Schritt</p>
          <p className="mt-1 font-medium">{vehicle.nextStep || 'Noch offen'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant={vehicle.blocker === 'keiner' ? 'outline' : 'secondary'}>
            {vehicleBlockerLabels[vehicle.blocker]}
          </Badge>
          <Badge variant="outline">
            {vehicleOwnerRoleLabels[vehicle.ownerRole]}
          </Badge>
          <Badge variant="outline">
            {vehicleStatusLabels[vehicle.status]}
          </Badge>
        </div>
      </div>

      {vehicle.priorityNote && (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-2 text-sm text-amber-900">
          {vehicle.priorityNote}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-sm">
        <span className="text-muted-foreground">Bestandswert</span>
        <span className="font-semibold">{formatCurrency(vehicle.price)}</span>
      </div>
    </button>
  )
}

export default function HofsteuerungPage() {
  const vehicles = useVehicleStore((state) => state.vehicles)
  const [search, setSearch] = useState('')
  const [quickFilter, setQuickFilter] = useState<(typeof quickFilters)[number]['id']>('alle')
  const [locationFilter, setLocationFilter] = useState<VehicleLocation | 'alle'>('alle')
  const [laneFilter, setLaneFilter] = useState<VehicleOperationalLane | null>(null)
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null)
  const deferredSearch = useDeferredValue(search)

  const activeVehicles = useMemo(
    () => vehicles.filter((vehicle) => vehicle.status !== 'verkauft'),
    [vehicles]
  )

  const kpis = useMemo(() => {
    const lanes = activeVehicles.reduce<Record<VehicleOperationalLane, number>>(
      (acc, vehicle) => {
        acc[deriveVehicleLane(vehicle)] += 1
        return acc
      },
      { kritisch: 0, in_arbeit: 0, blockiert: 0, bereit: 0 }
    )

    return {
      kritisch: lanes.kritisch,
      blockiert: lanes.blockiert,
      heuteBewegen: activeVehicles.filter((vehicle) => (
        isVehicleOverdue(vehicle) || getCurrentStepAgeHours(vehicle) >= 48 || vehicle.blocker !== 'keiner'
      )).length,
      ohneNextStep: activeVehicles.filter((vehicle) => vehicle.nextStep.trim().length === 0).length,
    }
  }, [activeVehicles])

  const filteredVehicles = useMemo(() => {
    const normalizedSearch = deferredSearch.trim().toLowerCase()
    return activeVehicles.filter((vehicle) => {
      const matchesSearch =
        normalizedSearch.length === 0
        || `${vehicle.make} ${vehicle.model} ${vehicle.licensePlate} ${vehicle.nextStep}`.toLowerCase().includes(normalizedSearch)

      const matchesQuickFilter =
        quickFilter === 'alle'
        || (quickFilter === 'Werkstatt' && vehicle.location === 'Werkstatt')
        || (quickFilter === 'Lackierer' && vehicle.location === 'Externer Lackierer')
        || (quickFilter === 'ohne_next' && vehicle.nextStep.trim().length === 0)
        || (quickFilter === 'heute_faellig' && isVehicleOverdue(vehicle))

      const matchesLocation = locationFilter === 'alle' || vehicle.location === locationFilter

      return matchesSearch && matchesQuickFilter && matchesLocation
    })
  }, [activeVehicles, deferredSearch, locationFilter, quickFilter])

  const vehiclesByLane = useMemo(() => {
    return laneOrder.reduce<Record<VehicleOperationalLane, Vehicle[]>>((acc, lane) => {
      acc[lane] = filteredVehicles
        .filter((vehicle) => deriveVehicleLane(vehicle) === lane)
        .sort(sortVehicles)
      return acc
    }, {
      kritisch: [],
      in_arbeit: [],
      blockiert: [],
      bereit: [],
    })
  }, [filteredVehicles])

  const urgentVehicles = useMemo(() => {
    return activeVehicles
      .filter((vehicle) => {
        const lane = deriveVehicleLane(vehicle)
        return lane === 'kritisch' || lane === 'blockiert'
      })
      .sort(sortVehicles)
      .slice(0, 3)
  }, [activeVehicles])

  const locationCounts = useMemo(() => {
    return activeVehicles.reduce<Partial<Record<VehicleLocation, number>>>((acc, vehicle) => {
      acc[vehicle.location] = (acc[vehicle.location] ?? 0) + 1
      return acc
    }, {})
  }, [activeVehicles])

  const recentActivity = useMemo(() => {
    return activeVehicles
      .flatMap((vehicle) => vehicle.history.map((entry) => ({
        id: `${vehicle.id}-${entry.id}`,
        vehicleId: vehicle.id,
        vehicleLabel: `${vehicle.make} ${vehicle.model}`,
        action: entry.action,
        source: entry.source ?? 'system',
        note: entry.note,
        date: entry.date,
      })))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 8)
  }, [activeVehicles])

  const selectedVehicle = selectedVehicleId
    ? activeVehicles.find((vehicle) => vehicle.id === selectedVehicleId) ?? null
    : null

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-3">
          <Link href="/fahrzeuge" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Zur Fahrzeuginventur
          </Link>
          <div>
            <Badge variant="outline" className="mb-3 gap-1 rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.18em]">
              <Workflow className="h-3 w-3" />
              GW ↔ Service
            </Badge>
            <h1 className="text-3xl font-semibold tracking-tight">Hofsteuerung</h1>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              Diese Seite ist für genau eine Sache da: Fahrzeug öffnen oder einsprechen, Status bestätigen, nächsten Schritt setzen.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href="/fahrzeuge/werkstatt">
            <Button variant="outline">Legacy Werkstatt-Board</Button>
          </Link>
          <Link href="/fahrzeuge">
            <Button>Inventar öffnen</Button>
          </Link>
        </div>
      </div>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <Card className="border-border/70 bg-gradient-to-br from-background via-background to-primary/5">
          <CardHeader className="pb-3">
            <Badge variant="outline" className="w-fit gap-1 rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.18em]">
              <ListTodo className="h-3 w-3" />
              Was von dir erwartet wird
            </Badge>
            <CardTitle className="text-xl">So arbeitest du hier</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              {[
                {
                  number: '1',
                  title: 'Update sprechen',
                  text: 'Sag frei, was mit dem Fahrzeug los ist, oder tippe es kurz ein.',
                  icon: Mic,
                },
                {
                  number: '2',
                  title: 'Erkennung prüfen',
                  text: 'Bestätige Status, Blocker, Standort und Verantwortlichkeit.',
                  icon: CheckCircle2,
                },
                {
                  number: '3',
                  title: 'Nächsten Schritt setzen',
                  text: 'Öffne bei Bedarf das Fahrzeug und übergib es an das nächste Team.',
                  icon: Workflow,
                },
              ].map((step) => (
                <div key={step.number} className="rounded-2xl border border-border/60 bg-card/70 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {step.number}
                    </div>
                    <step.icon className="h-4 w-4 text-primary" />
                  </div>
                  <p className="mt-4 font-medium">{step.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{step.text}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={() => document.getElementById('voice-entry')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                Spracheingabe starten
              </Button>
              <Button
                variant="outline"
                onClick={() => document.getElementById('arbeitsliste')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              >
                Fahrzeug aus der Liste wählen
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/90">
          <CardHeader className="pb-3">
            <Badge variant="outline" className="w-fit gap-1 rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.18em]">
              <AlertTriangle className="h-3 w-3" />
              Jetzt handeln
            </Badge>
            <CardTitle className="text-xl">Starte hier, wenn du nicht suchen willst</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {urgentVehicles.map((vehicle) => (
              <button
                key={vehicle.id}
                type="button"
                onClick={() => setSelectedVehicleId(vehicle.id)}
                className="flex w-full items-start justify-between gap-3 rounded-2xl border border-border/60 bg-muted/20 p-4 text-left transition-colors hover:bg-muted/50"
              >
                <div className="min-w-0">
                  <p className="font-medium">{vehicle.make} {vehicle.model}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{getUrgencyReason(vehicle)}</p>
                </div>
                <Badge variant={isVehicleOverdue(vehicle) ? 'destructive' : 'secondary'} className="shrink-0">
                  {getSlaState(vehicle).text}
                </Badge>
              </button>
            ))}
          </CardContent>
        </Card>
      </section>

      <section id="voice-entry" className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <p className="text-sm font-medium">1. Update per Sprache oder Text</p>
        </div>
        <HofsteuerungVoicePanel />
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium">Lagebild — klicke auf eine Kennzahl, um die Liste zu filtern</p>
          </div>
          {(laneFilter || quickFilter !== 'alle') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setLaneFilter(null)
                setQuickFilter('alle')
              }}
            >
              Filter zurücksetzen
            </Button>
          )}
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Jetzt prüfen"
            value={kpis.kritisch}
            caption="Ohne klare Aktion oder bereits überfällig"
            icon={ShieldAlert}
            active={laneFilter === 'kritisch'}
            onClick={() => {
              setLaneFilter(laneFilter === 'kritisch' ? null : 'kritisch')
              setQuickFilter('alle')
            }}
          />
          <MetricCard
            label="Blocker klären"
            value={kpis.blockiert}
            caption="Wartet auf Teile, Freigabe, Lackierer oder Rückruf"
            icon={AlertTriangle}
            active={laneFilter === 'blockiert'}
            onClick={() => {
              setLaneFilter(laneFilter === 'blockiert' ? null : 'blockiert')
              setQuickFilter('alle')
            }}
          />
          <MetricCard
            label="Heute bewegen"
            value={kpis.heuteBewegen}
            caption="Sollte heute aktiv angerührt oder eskaliert werden"
            icon={Clock3}
            active={quickFilter === 'heute_faellig'}
            onClick={() => {
              setQuickFilter(quickFilter === 'heute_faellig' ? 'alle' : 'heute_faellig')
              setLaneFilter(null)
            }}
          />
          <MetricCard
            label="Ohne nächsten Schritt"
            value={kpis.ohneNextStep}
            caption="Hier fehlt die operative Übergabe"
            icon={Workflow}
            active={quickFilter === 'ohne_next'}
            onClick={() => {
              setQuickFilter(quickFilter === 'ohne_next' ? 'alle' : 'ohne_next')
              setLaneFilter(null)
            }}
          />
        </div>
      </section>

      <section id="arbeitsliste" className="space-y-4">
        <Card className="border-border/70 bg-card/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">2. Fahrzeug auswählen, wenn du lieber klickst</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full lg:max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="BMW, S-WH 1234, Probefahrt, Lackierer ..."
                  className="pl-9"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {quickFilters.map((filter) => (
                  <Button
                    key={filter.id}
                    variant={quickFilter === filter.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setQuickFilter(filter.id)}
                  >
                    {filter.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant={locationFilter === 'alle' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setLocationFilter('alle')}
              >
                Alle Orte
              </Button>
              {(Object.entries(locationCounts) as Array<[VehicleLocation, number]>).map(([location, count]) => (
                <Button
                  key={location}
                  variant={locationFilter === location ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setLocationFilter(location)}
                  className="gap-2"
                >
                  <MapPin className="h-3.5 w-3.5" />
                  {vehicleLocationLabels[location]}
                  <Badge variant="outline" className="ml-1">{count}</Badge>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="overflow-x-auto pb-2">
          <div className={cn(
            'grid gap-4',
            laneFilter
              ? 'grid-cols-1'
              : 'min-w-[1120px] grid-cols-4'
          )}>
            {(laneFilter ? [laneFilter] : laneOrder).map((lane) => (
              <section
                key={lane}
                className={cn(
                  'rounded-[28px] border border-border/70 p-4',
                  lane === 'kritisch' && 'bg-red-50/60',
                  lane === 'blockiert' && 'bg-amber-50/60',
                  lane === 'bereit' && 'bg-emerald-50/60',
                  lane === 'in_arbeit' && 'bg-card'
                )}
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold">{laneTitles[lane]}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{laneDescriptions[lane]}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{vehiclesByLane[lane].length}</Badge>
                    {laneFilter && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLaneFilter(null)}
                      >
                        Alle Lanes zeigen
                      </Button>
                    )}
                  </div>
                </div>

                <div className={cn(
                  'space-y-3',
                  laneFilter && 'grid gap-3 sm:grid-cols-2 xl:grid-cols-3 space-y-0'
                )}>
                  {vehiclesByLane[lane].map((vehicle) => (
                    <VehicleCard key={vehicle.id} vehicle={vehicle} lane={lane} onSelect={setSelectedVehicleId} />
                  ))}

                  {vehiclesByLane[lane].length === 0 && (
                    <div className="rounded-[24px] border border-dashed border-border/70 bg-background/70 p-6 text-center text-sm text-muted-foreground">
                      Kein Fahrzeug in dieser Queue.
                    </div>
                  )}
                </div>
              </section>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="border-border/70 bg-card/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Standorte in Echtzeit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(Object.entries(locationCounts) as Array<[VehicleLocation, number]>)
              .sort((a, b) => b[1] - a[1])
              .map(([location, count]) => (
                <button
                  key={location}
                  type="button"
                  onClick={() => setLocationFilter(location)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-2xl border border-border/60 px-4 py-3 text-left transition-colors hover:bg-muted/40',
                    locationFilter === location && 'border-primary/30 bg-primary/5'
                  )}
                >
                  <div>
                    <p className="font-medium">{vehicleLocationLabels[location]}</p>
                    <p className="text-sm text-muted-foreground">
                      {count} Fahrzeug{count === 1 ? '' : 'e'}
                    </p>
                  </div>
                  <Badge variant="outline">{count}</Badge>
                </button>
              ))}
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Letzte Bewegungen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentActivity.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => setSelectedVehicleId(entry.vehicleId)}
                className="w-full rounded-2xl border border-border/60 p-4 text-left transition-colors hover:bg-muted/40"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{entry.vehicleLabel}</p>
                  <Badge variant="outline">{entry.source}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{entry.action}</p>
                {entry.note && (
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{entry.note}</p>
                )}
                <p className="mt-3 text-xs text-muted-foreground">{formatDateTime(entry.date)}</p>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      <VehicleOperationsSheet
        key={selectedVehicle?.id ?? 'empty-sheet'}
        vehicle={selectedVehicle}
        open={Boolean(selectedVehicle)}
        onOpenChange={(open) => {
          if (!open) setSelectedVehicleId(null)
        }}
      />
    </div>
  )
}
