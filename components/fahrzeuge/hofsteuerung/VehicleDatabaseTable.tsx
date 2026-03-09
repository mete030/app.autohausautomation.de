'use client'

import { useDeferredValue, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  getSlaState,
  vehicleLocationLabels,
  vehicleOwnerRoleLabels,
  vehicleStatusLabels,
} from '@/lib/vehicle-operations'
import type { Vehicle, VehicleStatus } from '@/lib/types'

const statusColors: Record<VehicleStatus, string> = {
  eingang: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
  inspektion: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  werkstatt: 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400',
  aufbereitung: 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400',
  verkaufsbereit: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
  verkauft: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800/40 dark:text-neutral-400',
}

interface VehicleDatabaseTableProps {
  vehicles: Vehicle[]
  onSelectVehicle: (vehicleId: string) => void
}

export function VehicleDatabaseTable({ vehicles, onSelectVehicle }: VehicleDatabaseTableProps) {
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)

  const filteredVehicles = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase()
    if (!q) return vehicles
    return vehicles.filter((v) =>
      `${v.make} ${v.model} ${v.licensePlate} ${v.vin} ${v.nextStep} ${v.location}`
        .toLowerCase()
        .includes(q)
    )
  }, [vehicles, deferredSearch])

  return (
    <div className="space-y-3">
      <div className="relative w-full max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Kennzeichen, Modell, VIN suchen ..."
          className="h-9 pl-9 text-sm"
        />
      </div>

      {/* Mobile card list */}
      <div className="space-y-2 sm:hidden">
        {filteredVehicles.map((vehicle) => {
          const sla = getSlaState(vehicle)
          return (
            <button
              key={vehicle.id}
              type="button"
              onClick={() => onSelectVehicle(vehicle.id)}
              className="flex w-full items-start gap-3 rounded-xl border border-border/60 bg-card px-3 py-3 text-left transition-colors hover:bg-muted/30"
            >
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">{vehicle.make} {vehicle.model}</span>
                  <span className="text-xs text-muted-foreground">{vehicle.year}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-mono">{vehicle.licensePlate}</span>
                  <span>·</span>
                  <span>{vehicleLocationLabels[vehicle.location]}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className={`${statusColors[vehicle.status]} border-0 text-[10px] font-medium`}
                  >
                    {vehicleStatusLabels[vehicle.status]}
                  </Badge>
                  <span className={`text-xs truncate ${vehicle.nextStep ? 'text-muted-foreground' : 'italic text-muted-foreground/60'}`}>
                    {vehicle.nextStep || 'Kein nächster Schritt'}
                  </span>
                </div>
              </div>
              <Badge
                variant={sla.overdue ? 'destructive' : 'secondary'}
                className="shrink-0 px-1.5 py-0 text-[10px] mt-0.5"
              >
                {sla.text}
              </Badge>
            </button>
          )
        })}
        {filteredVehicles.length === 0 && (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Keine Fahrzeuge gefunden
          </div>
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block rounded-xl border border-border/60 overflow-hidden">
        <div className="max-h-[calc(100vh-480px)] min-h-[200px] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Fahrzeug</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Kennzeichen</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Standort</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</TableHead>
                <TableHead className="hidden lg:table-cell text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nächster Schritt</TableHead>
                <TableHead className="hidden lg:table-cell text-xs font-semibold uppercase tracking-wider text-muted-foreground">Verantwortlich</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">SLA</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVehicles.map((vehicle) => {
                const sla = getSlaState(vehicle)
                return (
                  <TableRow
                    key={vehicle.id}
                    className="cursor-pointer"
                    onClick={() => onSelectVehicle(vehicle.id)}
                  >
                    <TableCell>
                      <span className="font-medium text-sm">{vehicle.make} {vehicle.model}</span>
                      <span className="ml-2 text-xs text-muted-foreground">{vehicle.year}</span>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {vehicle.licensePlate}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {vehicleLocationLabels[vehicle.location]}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={`${statusColors[vehicle.status]} border-0 text-[10px] font-medium`}
                      >
                        {vehicleStatusLabels[vehicle.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell max-w-[200px]">
                      <span className={`text-sm truncate block ${vehicle.nextStep ? '' : 'italic text-muted-foreground'}`}>
                        {vehicle.nextStep || 'Offen'}
                      </span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                      {vehicleOwnerRoleLabels[vehicle.ownerRole]}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={sla.overdue ? 'destructive' : 'secondary'}
                        className="px-1.5 py-0 text-[10px]"
                      >
                        {sla.text}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              })}
              {filteredVehicles.length === 0 && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                    Keine Fahrzeuge gefunden
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {filteredVehicles.length} von {vehicles.length} Fahrzeuge{search && ' (gefiltert)'}
      </p>
    </div>
  )
}
