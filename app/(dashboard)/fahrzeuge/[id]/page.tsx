'use client'

import { use } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { formatCurrency, formatMileage, formatDate, getEscalationLevel, getDaysRemaining } from '@/lib/utils'
import { escalationColors } from '@/lib/constants'
import { useVehicleStore } from '@/lib/stores/vehicle-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, MapPin, Fuel, Gauge, Calendar, Hash, Palette, Zap } from 'lucide-react'
import type { VehicleStatus } from '@/lib/types'

const statusLabels: Record<VehicleStatus, string> = {
  eingang: 'Eingang',
  inspektion: 'Inspektion',
  werkstatt: 'Werkstatt',
  aufbereitung: 'Aufbereitung',
  verkaufsbereit: 'Verkaufsbereit',
  verkauft: 'Verkauft',
}

export default function VehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const vehicles = useVehicleStore((state) => state.vehicles)
  const { id } = use(params)
  const vehicle = vehicles.find(v => v.id === id)

  if (!vehicle) return notFound()

  const escLevel = getEscalationLevel(vehicle.deadline)
  const escConfig = escalationColors[escLevel]
  const daysLeft = getDaysRemaining(vehicle.deadline)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/fahrzeuge">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{vehicle.make} {vehicle.model}</h1>
          <p className="text-sm text-muted-foreground">{vehicle.year} · {vehicle.licensePlate}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image */}
          <Card className="overflow-hidden border-border/60">
            <div className="aspect-video relative bg-muted">
              <Image
                src={vehicle.imageUrl}
                alt={`${vehicle.make} ${vehicle.model}`}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 66vw"
                priority
              />
            </div>
          </Card>

          {/* Details Grid */}
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Fahrzeugdaten</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-5 gap-x-4">
                {[
                  { icon: Calendar, label: 'Baujahr', value: String(vehicle.year) },
                  { icon: Gauge, label: 'Kilometerstand', value: formatMileage(vehicle.mileage) },
                  { icon: Fuel, label: 'Kraftstoff', value: vehicle.fuelType },
                  { icon: Zap, label: 'Leistung', value: `${vehicle.power} PS` },
                  { icon: Hash, label: 'Getriebe', value: vehicle.transmission },
                  { icon: Palette, label: 'Farbe', value: vehicle.color },
                  { icon: MapPin, label: 'Standort', value: vehicle.location },
                  { icon: Hash, label: 'FIN', value: vehicle.vin },
                ].map((item) => (
                  <div key={item.label} className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <item.icon className="h-3.5 w-3.5" />
                      {item.label}
                    </div>
                    <p className="text-sm font-medium">{item.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* History */}
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Verlauf</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {vehicle.history.map((entry, i) => (
                  <div key={entry.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                      {i < vehicle.history.length - 1 && (
                        <div className="w-px flex-1 bg-border mt-1" />
                      )}
                    </div>
                    <div className="pb-4">
                      <p className="text-sm font-medium">{entry.action}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(entry.date)} · {entry.user}
                      </p>
                      {entry.note && (
                        <p className="text-sm text-muted-foreground mt-1">{entry.note}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="border-border/60">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant="secondary">{statusLabels[vehicle.status]}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Deadline</span>
                <Badge variant="outline" className={`${escConfig.bg} ${escConfig.text} border-0`}>
                  {daysLeft < 0 ? `${Math.abs(daysLeft)} Tage überfällig` : `${daysLeft} Tage übrig`}
                </Badge>
              </div>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Einkaufspreis</span>
                  <span className="text-sm">{formatCurrency(vehicle.purchasePrice)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Verkaufspreis</span>
                  <span className="text-xl font-semibold">{formatCurrency(vehicle.price)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Marge</span>
                  <span className="text-sm font-medium text-emerald-600">
                    +{formatCurrency(vehicle.price - vehicle.purchasePrice)}
                  </span>
                </div>
              </div>
              {vehicle.notes && (
                <>
                  <Separator />
                  <div>
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">Notizen</span>
                    <p className="text-sm mt-1.5">{vehicle.notes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardContent className="pt-6 space-y-2">
              <Button className="w-full">Inserat erstellen</Button>
              <Button variant="outline" className="w-full">Status ändern</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
