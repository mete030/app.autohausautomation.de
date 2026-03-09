'use client'

import { useMemo, useState } from 'react'
import { CheckCircle, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { HofsteuerungVoicePanel } from '@/components/fahrzeuge/hofsteuerung/HofsteuerungVoicePanel'
import { VehicleOperationsSheet } from '@/components/fahrzeuge/hofsteuerung/VehicleOperationsSheet'
import { VehicleDatabaseTable } from '@/components/fahrzeuge/hofsteuerung/VehicleDatabaseTable'
import {
  deriveVehicleLane,
  getCurrentStepAgeHours,
  getSlaState,
  isVehicleOverdue,
  vehicleBlockerLabels,
  vehicleLocationLabels,
} from '@/lib/vehicle-operations'
import { useVehicleStore } from '@/lib/stores/vehicle-store'
import { cn } from '@/lib/utils'
import type { Vehicle } from '@/lib/types'

function sortVehicles(a: Vehicle, b: Vehicle) {
  const overdueDiff = Number(isVehicleOverdue(b)) - Number(isVehicleOverdue(a))
  if (overdueDiff !== 0) return overdueDiff
  const blockerDiff = Number(b.blocker !== 'keiner') - Number(a.blocker !== 'keiner')
  if (blockerDiff !== 0) return blockerDiff
  return getCurrentStepAgeHours(b) - getCurrentStepAgeHours(a)
}

function VehicleAlertCard({
  vehicle,
  onSelect,
}: {
  vehicle: Vehicle
  onSelect: (id: string) => void
}) {
  const sla = getSlaState(vehicle)

  return (
    <button
      type="button"
      onClick={() => onSelect(vehicle.id)}
      className="flex w-full items-center gap-3 rounded-xl border border-border/60 bg-card/80 px-3 py-2.5 text-left transition-colors hover:border-primary/30 hover:bg-muted/30"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium">
            {vehicle.make} {vehicle.model}
          </p>
          <span className="shrink-0 text-xs text-muted-foreground">
            {vehicle.licensePlate}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Sparkles className="h-3 w-3 shrink-0 text-violet-400" />
          <span className={vehicle.nextStep ? '' : 'italic'}>
            {vehicle.nextStep || 'Kein nächster Schritt'}
          </span>
        </div>
      </div>

      <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">
        {vehicleLocationLabels[vehicle.location]}
      </span>

      {vehicle.blocker !== 'keiner' && (
        <Badge variant="secondary" className="shrink-0 px-1.5 py-0 text-[10px]">
          {vehicleBlockerLabels[vehicle.blocker]}
        </Badge>
      )}

      <Badge
        variant={sla.overdue ? 'destructive' : 'secondary'}
        className="shrink-0 px-1.5 py-0 text-[10px]"
      >
        {sla.text}
      </Badge>
    </button>
  )
}

export default function HofsteuerungPage() {
  const vehicles = useVehicleStore((state) => state.vehicles)
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null)

  const activeVehicles = useMemo(
    () => vehicles.filter((v) => v.status !== 'verkauft'),
    [vehicles]
  )

  const kritischVehicles = useMemo(
    () =>
      activeVehicles
        .filter((v) => deriveVehicleLane(v) === 'kritisch')
        .sort(sortVehicles),
    [activeVehicles]
  )

  const blockiertVehicles = useMemo(
    () =>
      activeVehicles
        .filter((v) => deriveVehicleLane(v) === 'blockiert')
        .sort(sortVehicles),
    [activeVehicles]
  )

  const selectedVehicle = selectedVehicleId
    ? activeVehicles.find((v) => v.id === selectedVehicleId) ?? null
    : null

  const actionCount = kritischVehicles.length + blockiertVehicles.length
  const hasActionItems = actionCount > 0

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* ─── Header ─── */}
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-semibold tracking-tight">Hofsteuerung</h1>
        <Badge variant="outline" className="text-[10px]">
          {activeVehicles.length} Fahrzeuge
        </Badge>
      </div>

      {/* ─── Voice Panel ─── */}
      <HofsteuerungVoicePanel />

      {/* ─── Section A: Handlungsbedarf ─── */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-violet-500" />
          <h2 className="text-sm font-semibold tracking-tight">Handlungsbedarf</h2>
          {hasActionItems && (
            <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
              {actionCount}
            </Badge>
          )}
        </div>

        {hasActionItems ? (
          <div className="grid gap-3 sm:gap-4 lg:grid-cols-2">
            {/* Kritisch */}
            {kritischVehicles.length > 0 && (
              <div className="space-y-2 rounded-2xl border border-red-200/60 bg-red-50/30 p-3 sm:p-4 dark:border-red-900/30 dark:bg-red-950/10">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  <h3 className="text-sm font-semibold">Jetzt prüfen</h3>
                  <Badge variant="secondary" className="px-1 py-0 text-[10px]">
                    {kritischVehicles.length}
                  </Badge>
                </div>
                <div className="space-y-1.5">
                  {kritischVehicles.map((vehicle) => (
                    <VehicleAlertCard
                      key={vehicle.id}
                      vehicle={vehicle}
                      onSelect={setSelectedVehicleId}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Blockiert */}
            {blockiertVehicles.length > 0 && (
              <div className="space-y-2 rounded-2xl border border-amber-200/60 bg-amber-50/30 p-3 sm:p-4 dark:border-amber-900/30 dark:bg-amber-950/10">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  <h3 className="text-sm font-semibold">Blocker klären</h3>
                  <Badge variant="secondary" className="px-1 py-0 text-[10px]">
                    {blockiertVehicles.length}
                  </Badge>
                </div>
                <div className="space-y-1.5">
                  {blockiertVehicles.map((vehicle) => (
                    <VehicleAlertCard
                      key={vehicle.id}
                      vehicle={vehicle}
                      onSelect={setSelectedVehicleId}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-200/60 bg-emerald-50/30 px-4 py-3 dark:border-emerald-900/30 dark:bg-emerald-950/10">
            <CheckCircle className="h-4 w-4 text-emerald-500" />
            <p className="text-sm text-emerald-700 dark:text-emerald-400">
              Alles im grünen Bereich — keine Fahrzeuge erfordern Aufmerksamkeit.
            </p>
          </div>
        )}
      </section>

      {/* ─── Section B: Fahrzeugdatenbank ─── */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-tight">Alle Fahrzeuge</h2>
        <VehicleDatabaseTable
          vehicles={activeVehicles}
          onSelectVehicle={setSelectedVehicleId}
        />
      </section>

      {/* ─── Detail Sheet ─── */}
      <VehicleOperationsSheet
        key={selectedVehicle?.id ?? 'empty'}
        vehicle={selectedVehicle}
        open={Boolean(selectedVehicle)}
        onOpenChange={(open) => {
          if (!open) setSelectedVehicleId(null)
        }}
      />
    </div>
  )
}
