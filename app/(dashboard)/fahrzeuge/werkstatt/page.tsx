'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { formatCurrency, getEscalationLevel, getDaysRemaining } from '@/lib/utils'
import { escalationColors } from '@/lib/constants'
import { useVehicleStore } from '@/lib/stores/vehicle-store'
import { ArrowLeft, AlertTriangle, GripVertical, Car } from 'lucide-react'
import Link from 'next/link'
import type { VehicleStatus } from '@/lib/types'

const kanbanColumns: { id: VehicleStatus; label: string }[] = [
  { id: 'eingang', label: 'Eingang' },
  { id: 'inspektion', label: 'Inspektion' },
  { id: 'werkstatt', label: 'Werkstatt' },
  { id: 'aufbereitung', label: 'Aufbereitung' },
  { id: 'verkaufsbereit', label: 'Verkaufsbereit' },
]

export default function WerkstattPage() {
  const vehicles = useVehicleStore((state) => state.vehicles)
  const updateVehicleStatus = useVehicleStore((state) => state.updateVehicleStatus)
  const [draggedId, setDraggedId] = useState<string | null>(null)

  const activeVehicles = vehicles.filter(v => v.status !== 'verkauft')

  const getColumnVehicles = (status: VehicleStatus) => {
    return activeVehicles
      .filter(v => v.status === status)
      .sort((a, b) => {
        const aDays = getDaysRemaining(a.deadline)
        const bDays = getDaysRemaining(b.deadline)
        return aDays - bDays // Overdue first
      })
  }

  const overdueCount = activeVehicles.filter(v => getDaysRemaining(v.deadline) < 0).length

  const handleDragStart = (e: React.DragEvent, vehicleId: string) => {
    setDraggedId(vehicleId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, targetStatus: VehicleStatus) => {
    e.preventDefault()
    if (!draggedId) return

    updateVehicleStatus(draggedId, targetStatus)
    setDraggedId(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/fahrzeuge">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Werkstatt-Board</h1>
            <p className="text-muted-foreground">Legacy-Kanban für Status-Drag-&-Drop</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/fahrzeuge/hofsteuerung">
            <Button variant="outline">Zur Hofsteuerung</Button>
          </Link>
          {overdueCount > 0 && (
            <Badge variant="destructive" className="gap-1 px-3 py-1.5">
              <AlertTriangle className="h-4 w-4" />
              {overdueCount} überfällig
            </Badge>
          )}
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-2 sm:pb-4">
        {kanbanColumns.map((column) => {
          const columnVehicles = getColumnVehicles(column.id)
          return (
            <div
              key={column.id}
              className="w-[84vw] max-w-[300px] flex-shrink-0 sm:w-72"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="font-semibold text-sm">{column.label}</h3>
                <Badge variant="secondary" className="text-xs">
                  {columnVehicles.length}
                </Badge>
              </div>

              {/* Column Body */}
              <div className="space-y-2 min-h-[200px] rounded-xl bg-muted/40 p-2">
                {columnVehicles.map((vehicle) => {
                  const escLevel = getEscalationLevel(vehicle.deadline)
                  const escConfig = escalationColors[escLevel]
                  const daysLeft = getDaysRemaining(vehicle.deadline)

                  return (
                    <Card
                      key={vehicle.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, vehicle.id)}
                      className={`p-3 cursor-grab active:cursor-grabbing transition-all hover:shadow-md ${
                        draggedId === vehicle.id ? 'opacity-50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground/50 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-medium text-sm leading-tight">
                                {vehicle.make} {vehicle.model}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {vehicle.licensePlate}
                              </p>
                            </div>
                            <Badge
                              variant="outline"
                              className={`${escConfig.bg} ${escConfig.text} border-0 text-[10px] px-1.5 shrink-0`}
                            >
                              {daysLeft < 0 ? `${Math.abs(daysLeft)}d!` : `${daysLeft}d`}
                            </Badge>
                          </div>
                          {vehicle.notes && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {vehicle.notes}
                            </p>
                          )}
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">{vehicle.location}</span>
                            <span className="text-xs font-medium">{formatCurrency(vehicle.price)}</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )
                })}
                {columnVehicles.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground/50">
                    <Car className="h-8 w-8 mb-2" />
                    <p className="text-xs">Keine Fahrzeuge</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
