'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCurrency, formatMileage, getEscalationLevel, getDaysRemaining } from '@/lib/utils'
import { escalationColors } from '@/lib/constants'
import { useVehicleStore } from '@/lib/stores/vehicle-store'
import { Search, LayoutGrid, List, MapPin, Fuel, Gauge, Map } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import type { VehicleStatus } from '@/lib/types'

const VehicleMap = dynamic(() => import('@/components/fahrzeuge/VehicleMap'), {
  ssr: false,
  loading: () => (
    <div className="rounded-xl border border-border/60 bg-muted/30 animate-pulse" style={{ height: 'calc(100vh - 260px)', minHeight: '560px' }} />
  ),
})

const statusLabels: Record<VehicleStatus, string> = {
  eingang: 'Eingang',
  inspektion: 'Inspektion',
  werkstatt: 'Werkstatt',
  aufbereitung: 'Aufbereitung',
  verkaufsbereit: 'Verkaufsbereit',
  verkauft: 'Verkauft',
}

const statusColors: Record<VehicleStatus, string> = {
  eingang: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
  inspektion: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  werkstatt: 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400',
  aufbereitung: 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400',
  verkaufsbereit: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
  verkauft: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800/40 dark:text-neutral-400',
}

export default function FahrzeugePage() {
  const vehicles = useVehicleStore((state) => state.vehicles)
  const [view, setView] = useState<'grid' | 'list' | 'map'>('map')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('alle')
  const [locationFilter, setLocationFilter] = useState<string>('alle')

  const filtered = vehicles.filter(v => {
    const matchSearch = `${v.make} ${v.model} ${v.licensePlate}`.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'alle' || v.status === statusFilter
    const matchLocation = locationFilter === 'alle' || v.location === locationFilter
    return matchSearch && matchStatus && matchLocation
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Fahrzeuge</h1>
          <p className="text-sm text-muted-foreground mt-1">{filtered.length} Fahrzeuge im Bestand</p>
        </div>
        <Link href="/fahrzeuge/werkstatt">
          <Button>Werkstatt-Board</Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Marke, Modell oder Kennzeichen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="alle">Alle Status</SelectItem>
            <SelectItem value="eingang">Eingang</SelectItem>
            <SelectItem value="inspektion">Inspektion</SelectItem>
            <SelectItem value="werkstatt">Werkstatt</SelectItem>
            <SelectItem value="aufbereitung">Aufbereitung</SelectItem>
            <SelectItem value="verkaufsbereit">Verkaufsbereit</SelectItem>
          </SelectContent>
        </Select>
        <Select value={locationFilter} onValueChange={setLocationFilter}>
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="Standort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="alle">Alle Standorte</SelectItem>
            <SelectItem value="Hof A">Hof A</SelectItem>
            <SelectItem value="Hof B">Hof B</SelectItem>
            <SelectItem value="Werkstatt">Werkstatt</SelectItem>
            <SelectItem value="Showroom">Showroom</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-0.5 border rounded-lg p-0.5">
          <Button
            variant={view === 'grid' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => setView('grid')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={view === 'list' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => setView('list')}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={view === 'map' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => setView('map')}
          >
            <Map className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Grid View */}
      {view === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((vehicle) => {
            const escLevel = getEscalationLevel(vehicle.deadline)
            const escConfig = escalationColors[escLevel]
            const daysLeft = getDaysRemaining(vehicle.deadline)

            return (
              <Link key={vehicle.id} href={`/fahrzeuge/${vehicle.id}`}>
                <Card className="group overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer h-full border-border/60">
                  {/* Image */}
                  <div className="aspect-[16/10] relative overflow-hidden bg-muted">
                    <Image
                      src={vehicle.imageUrl}
                      alt={`${vehicle.make} ${vehicle.model}`}
                      fill
                      className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                    {/* Status pill overlay */}
                    <div className="absolute top-3 left-3">
                      <Badge className={`${statusColors[vehicle.status]} border-0 shadow-sm backdrop-blur-sm text-[11px] font-medium`} variant="secondary">
                        {statusLabels[vehicle.status]}
                      </Badge>
                    </div>
                    {/* Deadline pill */}
                    <div className="absolute top-3 right-3">
                      <Badge
                        variant="outline"
                        className={`${escConfig.bg} ${escConfig.text} border-0 shadow-sm backdrop-blur-sm text-[11px] font-medium`}
                      >
                        {daysLeft < 0 ? `${Math.abs(daysLeft)}d überfällig` : `${daysLeft}d`}
                      </Badge>
                    </div>
                  </div>

                  {/* Content */}
                  <CardContent className="p-4 space-y-3">
                    <div>
                      <h3 className="font-semibold leading-tight">{vehicle.make} {vehicle.model}</h3>
                      <p className="text-sm text-muted-foreground mt-0.5">{vehicle.year} · {vehicle.color}</p>
                    </div>

                    {/* Specs row */}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Gauge className="h-3.5 w-3.5" />
                        {formatMileage(vehicle.mileage)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Fuel className="h-3.5 w-3.5" />
                        {vehicle.fuelType}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {vehicle.location}
                      </span>
                    </div>

                    {/* Price */}
                    <div className="flex items-center justify-between pt-1 border-t">
                      <span className="text-xs text-muted-foreground">{vehicle.power} PS · {vehicle.transmission}</span>
                      <span className="text-base font-semibold">{formatCurrency(vehicle.price)}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}

      {/* Map View */}
      {view === 'map' && (
        <VehicleMap vehicles={filtered} />
      )}

      {/* List View */}
      {view === 'list' && (
        <Card className="border-border/60">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left p-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Fahrzeug</th>
                  <th className="text-left p-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Status</th>
                  <th className="text-left p-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Standort</th>
                  <th className="text-left p-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Km-Stand</th>
                  <th className="text-left p-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Deadline</th>
                  <th className="text-right p-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Preis</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((vehicle) => {
                  const escLevel = getEscalationLevel(vehicle.deadline)
                  const escConfig = escalationColors[escLevel]
                  const daysLeft = getDaysRemaining(vehicle.deadline)

                  return (
                    <tr key={vehicle.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors cursor-pointer">
                      <td className="p-3">
                        <Link href={`/fahrzeuge/${vehicle.id}`} className="flex items-center gap-3">
                          <div className="h-10 w-14 rounded-md overflow-hidden bg-muted shrink-0 relative">
                            <Image
                              src={vehicle.imageUrl}
                              alt={`${vehicle.make} ${vehicle.model}`}
                              fill
                              className="object-cover"
                              sizes="56px"
                            />
                          </div>
                          <div>
                            <div className="font-medium">{vehicle.make} {vehicle.model}</div>
                            <div className="text-xs text-muted-foreground">{vehicle.year} · {vehicle.licensePlate}</div>
                          </div>
                        </Link>
                      </td>
                      <td className="p-3">
                        <Badge className={`${statusColors[vehicle.status]} border-0 text-[11px]`} variant="secondary">
                          {statusLabels[vehicle.status]}
                        </Badge>
                      </td>
                      <td className="p-3 text-muted-foreground">{vehicle.location}</td>
                      <td className="p-3 text-muted-foreground">{formatMileage(vehicle.mileage)}</td>
                      <td className="p-3">
                        <Badge variant="outline" className={`${escConfig.bg} ${escConfig.text} border-0 text-[11px]`}>
                          {daysLeft < 0 ? `${Math.abs(daysLeft)}d überfällig` : `${daysLeft}d`}
                        </Badge>
                      </td>
                      <td className="p-3 text-right font-medium">{formatCurrency(vehicle.price)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
