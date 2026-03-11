'use client'

import { useMemo, useState } from 'react'
import { CheckCircle, Sparkles, Wrench, ArrowRight, Zap, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { HofsteuerungVoicePanel } from '@/components/fahrzeuge/hofsteuerung/HofsteuerungVoicePanel'
import { VehicleOperationsSheet } from '@/components/fahrzeuge/hofsteuerung/VehicleOperationsSheet'
import { VehicleDatabaseTable } from '@/components/fahrzeuge/hofsteuerung/VehicleDatabaseTable'
import {
  deriveVehicleLane,
  getCurrentStepAgeHours,
  getCurrentStepAgeLabel,
  getSlaState,
  isVehicleOverdue,
  vehicleBlockerLabels,
  vehicleLocationLabels,
  vehicleStatusLabels,
} from '@/lib/vehicle-operations'
import { useVehicleStore } from '@/lib/stores/vehicle-store'
import { cn } from '@/lib/utils'
import type { Vehicle, VehicleStatus } from '@/lib/types'

// ─── Constants ───────────────────────────────────────────────────────────────

const WORKSHOP_CAPACITY = 4 // Max concurrent vehicles in workshop

/** Status workflow order - earlier statuses are "before" workshop/aufbereitung */
const STATUS_ORDER: VehicleStatus[] = [
  'eingang', 'inspektion', 'werkstatt', 'aufbereitung', 'verkaufsbereit', 'verkauft',
]

function statusIndex(status: VehicleStatus): number {
  return STATUS_ORDER.indexOf(status)
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sortVehicles(a: Vehicle, b: Vehicle) {
  const overdueDiff = Number(isVehicleOverdue(b)) - Number(isVehicleOverdue(a))
  if (overdueDiff !== 0) return overdueDiff
  const blockerDiff = Number(b.blocker !== 'keiner') - Number(a.blocker !== 'keiner')
  if (blockerDiff !== 0) return blockerDiff
  return getCurrentStepAgeHours(b) - getCurrentStepAgeHours(a)
}

/**
 * Smart Scheduling: Find vehicles that could be moved to workshop/aufbereitung
 * to better utilize workshop capacity.
 *
 * Criteria:
 * - Vehicle is NOT currently in the workshop (status !== 'werkstatt')
 * - Vehicle is idle on the yard (location is Hof A/B) or in a pre-workshop stage
 * - Vehicle still needs workshop/aufbereitung (status is before those stages)
 * - Vehicle has no active blocker
 * - Sorted by deadline urgency (soonest deadline first)
 */
function getSchedulingCandidates(vehicles: Vehicle[]): Vehicle[] {
  return vehicles
    .filter(v => {
      // Must be active (not sold)
      if (v.status === 'verkauft') return false
      // Must not already be in workshop or aufbereitung
      if (v.status === 'werkstatt' || v.status === 'aufbereitung') return false
      // Must still need workshop (status is before werkstatt in the pipeline)
      if (statusIndex(v.status) >= statusIndex('verkaufsbereit')) return false
      // Must not have a blocker
      if (v.blocker !== 'keiner') return false
      // Must be sitting somewhere (yard or early stage), not actively being processed elsewhere
      const isOnYard = v.location === 'Hof A' || v.location === 'Hof B'
      const isEarlyStage = v.status === 'eingang' || v.status === 'inspektion'
      return isOnYard || isEarlyStage
    })
    .sort((a, b) => {
      // Prioritize by deadline urgency
      const deadlineA = new Date(a.deadline).getTime()
      const deadlineB = new Date(b.deadline).getTime()
      if (deadlineA !== deadlineB) return deadlineA - deadlineB
      // Then by how long they've been sitting
      return getCurrentStepAgeHours(b) - getCurrentStepAgeHours(a)
    })
}

function getSchedulingReason(vehicle: Vehicle): string {
  const sla = getSlaState(vehicle)
  const stepAge = getCurrentStepAgeLabel(vehicle)

  if (sla.overdue) return `SLA überschritten · seit ${stepAge} in ${vehicleStatusLabels[vehicle.status]}`
  if (statusIndex(vehicle.status) <= statusIndex('inspektion')) {
    return `Wartet auf Werkstatt · seit ${stepAge} im ${vehicleStatusLabels[vehicle.status]}`
  }
  return `Bereit für nächsten Schritt · ${sla.text}`
}

// ─── Components ──────────────────────────────────────────────────────────────

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

function SchedulingRecommendationCard({
  vehicle,
  onAccept,
  onSelect,
}: {
  vehicle: Vehicle
  onAccept: (vehicleId: string) => void
  onSelect: (vehicleId: string) => void
}) {
  const sla = getSlaState(vehicle)
  const reason = getSchedulingReason(vehicle)

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/80 px-3 py-2.5 transition-colors hover:border-blue-200/80">
      {/* Vehicle info - clickable */}
      <button
        type="button"
        onClick={() => onSelect(vehicle.id)}
        className="min-w-0 flex-1 text-left"
      >
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium">
            {vehicle.make} {vehicle.model}
          </p>
          <span className="shrink-0 text-xs text-muted-foreground">
            {vehicle.licensePlate}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3 w-3 shrink-0 text-blue-400" />
          <span>{reason}</span>
        </div>
      </button>

      {/* Location + SLA */}
      <div className="hidden shrink-0 text-right sm:block">
        <span className="text-[10px] text-muted-foreground block">
          {vehicleLocationLabels[vehicle.location]}
        </span>
        <Badge
          variant={sla.overdue ? 'destructive' : 'secondary'}
          className="mt-0.5 px-1.5 py-0 text-[10px]"
        >
          {sla.text}
        </Badge>
      </div>

      {/* Accept CTA */}
      <Button
        size="sm"
        className="h-7 gap-1 px-2.5 text-[11px] font-semibold shrink-0"
        onClick={(e) => {
          e.stopPropagation()
          onAccept(vehicle.id)
        }}
      >
        Einplanen
        <ArrowRight className="h-3 w-3" />
      </Button>
    </div>
  )
}

function WorkshopUtilizationBar({ current, capacity }: { current: number; capacity: number }) {
  const pct = Math.min(100, Math.round((current / capacity) * 100))
  const isFull = current >= capacity
  const isLow = current <= 1

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Werkstatt-Auslastung</span>
        <span className={cn(
          'font-semibold tabular-nums',
          isFull ? 'text-red-600' : isLow ? 'text-blue-600' : 'text-zinc-700',
        )}>
          {current} / {capacity} Plätze
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            isFull ? 'bg-red-500' : isLow ? 'bg-blue-500' : 'bg-emerald-500',
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      {isLow && (
        <p className="text-[11px] text-blue-600 font-medium flex items-center gap-1">
          <Zap className="h-3 w-3" />
          Kapazität frei — Fahrzeuge vorziehen empfohlen
        </p>
      )}
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function HofsteuerungPage() {
  const vehicles = useVehicleStore((state) => state.vehicles)
  const updateVehicleOperationalState = useVehicleStore((state) => state.updateVehicleOperationalState)
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

  // Workshop utilization
  const workshopVehicles = useMemo(
    () => activeVehicles.filter((v) => v.status === 'werkstatt' || v.location === 'Werkstatt'),
    [activeVehicles]
  )

  // Smart scheduling candidates
  const schedulingCandidates = useMemo(
    () => getSchedulingCandidates(activeVehicles),
    [activeVehicles]
  )

  const selectedVehicle = selectedVehicleId
    ? vehicles.find((v) => v.id === selectedVehicleId) ?? null
    : null

  const actionCount = kritischVehicles.length + blockiertVehicles.length
  const hasActionItems = actionCount > 0

  const hasCapacity = workshopVehicles.length < WORKSHOP_CAPACITY
  const showScheduling = schedulingCandidates.length > 0 && hasCapacity

  function handleAcceptScheduling(vehicleId: string) {
    updateVehicleOperationalState({
      vehicleId,
      status: 'werkstatt',
      location: 'Werkstatt',
      nextStep: 'Inspektion & Aufbereitung durchführen',
      ownerRole: 'werkstatt',
      blocker: 'keiner',
      source: 'system',
      actor: 'Smart Scheduling',
      historyAction: 'Werkstatt eingeplant',
      historyNote: 'Vom Smart Scheduling vorgeschlagen und angenommen — Werkstattkapazität optimal nutzen.',
    })
  }

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

      {/* ─── Section B: Smart Scheduling ─── */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Wrench className="h-4 w-4 text-blue-500" />
          <h2 className="text-sm font-semibold tracking-tight">Werkstatt-Empfehlungen</h2>
          {showScheduling && (
            <Badge className="bg-blue-100 text-blue-700 border-0 px-1.5 py-0 text-[10px]">
              {schedulingCandidates.length} vorziehbar
            </Badge>
          )}
        </div>

        <div className="rounded-2xl border border-blue-200/40 bg-blue-50/20 p-3 sm:p-4 dark:border-blue-900/20 dark:bg-blue-950/10 space-y-3">
          {/* Utilization bar */}
          <WorkshopUtilizationBar
            current={workshopVehicles.length}
            capacity={WORKSHOP_CAPACITY}
          />

          {/* Recommendations */}
          {showScheduling ? (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 pt-1">
                <Zap className="h-3 w-3 text-blue-500" />
                <p className="text-[11px] font-medium text-blue-700 dark:text-blue-400">
                  Diese Fahrzeuge stehen auf dem Hof und können jetzt in die Werkstatt
                </p>
              </div>
              {schedulingCandidates.slice(0, WORKSHOP_CAPACITY - workshopVehicles.length).map(vehicle => (
                <SchedulingRecommendationCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  onAccept={handleAcceptScheduling}
                  onSelect={setSelectedVehicleId}
                />
              ))}
              {schedulingCandidates.length > (WORKSHOP_CAPACITY - workshopVehicles.length) && (
                <p className="text-[10px] text-muted-foreground pl-1 pt-1">
                  +{schedulingCandidates.length - (WORKSHOP_CAPACITY - workshopVehicles.length)} weitere Fahrzeuge warten
                </p>
              )}
            </div>
          ) : workshopVehicles.length >= WORKSHOP_CAPACITY ? (
            <div className="flex items-center gap-2 pt-1">
              <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                Werkstatt voll ausgelastet — keine Empfehlungen nötig.
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2 pt-1">
              <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                Keine Fahrzeuge auf dem Hof, die vorgezogen werden könnten.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ─── Section C: Fahrzeugdatenbank ─── */}
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
