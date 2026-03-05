'use client'

import { use, useState } from 'react'
import dynamic from 'next/dynamic'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { formatCurrency, formatMileage, formatDate, getEscalationLevel, getDaysRemaining } from '@/lib/utils'
import { escalationColors } from '@/lib/constants'
import { useVehicleStore } from '@/lib/stores/vehicle-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ArrowLeft, MapPin, Fuel, Gauge, Calendar, Hash, Palette, Zap, Upload } from 'lucide-react'
import type { VehicleStatus } from '@/lib/types'

const PLATFORMS = [
  {
    id: 'mobile_de',
    name: 'mobile.de',
    description: 'Größter deutscher Automarkt',
    bg: '#FF6600',
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="white">
        <path d="M18.92 6.01L15 2H9L5.08 6.01C4.4 6.73 4 7.7 4 8.75V19c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8.75c0-1.05-.4-2.02-1.08-2.74zM12 17.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 12.5 12 12.5s2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5zM9.5 7l1.5-3h2l1.5 3h-5z" />
      </svg>
    ),
  },
  {
    id: 'autoscout24',
    name: 'AutoScout24',
    description: 'Europäisches Automarktportal',
    bg: '#003F87',
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
        <circle cx="10.5" cy="10" r="6" stroke="white" strokeWidth="2" />
        <line x1="15" y1="14.5" x2="21" y2="20.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M7.5 10.5h6M8.5 8.5l.9-1.5h2.2l.9 1.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="9.2" cy="11.8" r="0.9" fill="white" />
        <circle cx="12.8" cy="11.8" r="0.9" fill="white" />
      </svg>
    ),
  },
  {
    id: 'truckscout24',
    name: 'TruckScout24',
    description: 'Nutzfahrzeuge & Transporter',
    bg: '#009C3B',
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="white">
        <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9 1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
      </svg>
    ),
  },
]

const MiniVehicleMap = dynamic(() => import('@/components/fahrzeuge/MiniVehicleMap'), {
  ssr: false,
  loading: () => <div className="h-48 rounded-lg bg-muted animate-pulse" />,
})

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
  const router = useRouter()
  const [platformOpen, setPlatformOpen] = useState(false)

  if (!vehicle) return notFound()

  const escLevel = getEscalationLevel(vehicle.deadline)
  const escConfig = escalationColors[escLevel]
  const daysLeft = getDaysRemaining(vehicle.deadline)

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <Link href="/fahrzeuge">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{vehicle.make} {vehicle.model}</h1>
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
              <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2 xl:grid-cols-4">
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
                    <p className="text-sm font-medium break-words">{item.value}</p>
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
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant="secondary">{statusLabels[vehicle.status]}</Badge>
              </div>
              <div className="flex items-start justify-between gap-3">
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
              <Button className="w-full gap-2" onClick={() => setPlatformOpen(true)}>
                <Upload className="h-4 w-4" />
                Inserat hochladen
              </Button>
              <Button variant="outline" className="w-full">Status ändern</Button>
            </CardContent>
          </Card>

          <Dialog open={platformOpen} onOpenChange={setPlatformOpen}>
            <DialogContent className="max-w-[calc(100vw-1rem)] sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Plattform auswählen</DialogTitle>
                <p className="text-sm text-muted-foreground">
                  Wähle, auf welcher Plattform du <span className="font-medium">{vehicle.make} {vehicle.model}</span> inserieren möchtest.
                </p>
              </DialogHeader>
              <div className="flex flex-col gap-3 pt-2">
                {PLATFORMS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setPlatformOpen(false)
                      router.push(`/inserate/neu?vehicleId=${vehicle.id}&platform=${p.id}`)
                    }}
                    className="flex items-center gap-4 rounded-xl border border-border/60 p-4 text-left transition-colors hover:bg-muted/50"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ background: p.bg }}>
                      {p.icon}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </DialogContent>
          </Dialog>

          <Card className="border-border/60 overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                Standort auf Karte
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-48 relative">
                <MiniVehicleMap location={vehicle.location} />
              </div>
              <div className="px-4 py-2.5 border-t bg-muted/30 flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{
                    background: {
                      Showroom: '#3b82f6',
                      'Hof A': '#22c55e',
                      'Hof B': '#a855f7',
                      Werkstatt: '#f97316',
                    }[vehicle.location],
                  }}
                />
                <span className="text-sm font-medium">{vehicle.location}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
