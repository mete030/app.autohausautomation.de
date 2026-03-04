'use client'

import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import Image from 'next/image'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency, getDaysRemaining, getEscalationLevel } from '@/lib/utils'
import { escalationColors } from '@/lib/constants'
import type { Vehicle, VehicleLocation, VehicleStatus } from '@/lib/types'
import { cn } from '@/lib/utils'
import { X, ChevronRight } from 'lucide-react'

// ─── Map config ───────────────────────────────────────────────────────────────

/** Stuttgart-Mitte – fictional but visually plausible dealership lot */
const DEALERSHIP_CENTER: [number, number] = [48.7758, 9.1829]
const DEALERSHIP_ZOOM = 17

const LOCATION_COORDS: Record<VehicleLocation, [number, number]> = {
  Showroom:  [48.77620, 9.18290],
  'Hof A':   [48.77570, 9.18225],
  'Hof B':   [48.77570, 9.18360],
  Werkstatt: [48.77520, 9.18290],
}

const LOCATION_CONFIG: Record<VehicleLocation, { color: string; label: string }> = {
  Showroom:  { color: '#3b82f6', label: 'Showroom' },
  'Hof A':   { color: '#22c55e', label: 'Hof A' },
  'Hof B':   { color: '#a855f7', label: 'Hof B' },
  Werkstatt: { color: '#f97316', label: 'Werkstatt' },
}

const TILE_LAYERS = {
  street: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxNativeZoom: 19,
    maxZoom: 22,
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri',
    maxNativeZoom: 18,
    maxZoom: 22,
  },
} as const

// ─── Status helpers ───────────────────────────────────────────────────────────

const STATUS_COLORS: Record<VehicleStatus, string> = {
  eingang:       'bg-blue-50 text-blue-700',
  inspektion:    'bg-amber-50 text-amber-700',
  werkstatt:     'bg-orange-50 text-orange-700',
  aufbereitung:  'bg-violet-50 text-violet-700',
  verkaufsbereit:'bg-emerald-50 text-emerald-700',
  verkauft:      'bg-neutral-100 text-neutral-600',
}

const STATUS_LABELS: Record<VehicleStatus, string> = {
  eingang: 'Eingang', inspektion: 'Inspektion', werkstatt: 'Werkstatt',
  aufbereitung: 'Aufbereitung', verkaufsbereit: 'Verkaufsbereit', verkauft: 'Verkauft',
}

// ─── Custom Leaflet icons (divIcon – no image files needed) ───────────────────

function createZoneIcon(location: VehicleLocation, count: number, selected: boolean) {
  const { color } = LOCATION_CONFIG[location]
  const size = selected ? 60 : 52
  const glow = selected ? `, 0 0 0 5px ${color}44` : ''
  return L.divIcon({
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${color};
      border:3px solid ${selected ? '#fff' : 'rgba(255,255,255,0.7)'};
      border-radius:50%;
      display:flex;flex-direction:column;align-items:center;justify-content:center;
      box-shadow:0 4px 16px rgba(0,0,0,.35)${glow};
      cursor:pointer;
    ">
      <span style="color:#fff;font-size:${selected ? 20 : 18}px;font-weight:800;line-height:1">${count}</span>
      <span style="color:rgba(255,255,255,.85);font-size:8px;font-weight:600;letter-spacing:.04em">KFZ</span>
    </div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

function createVehicleIcon(vehicle: Vehicle, selected: boolean) {
  const { color } = LOCATION_CONFIG[vehicle.location]
  const glow = selected ? `, 0 0 0 4px ${color}40` : ''
  return L.divIcon({
    html: `<div style="
      width:40px;height:40px;
      background:${selected ? color : '#fff'};
      border:2.5px solid ${color};
      border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      box-shadow:0 2px 10px rgba(0,0,0,.25)${glow};
      cursor:pointer;
    ">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M3 12l2-5h14l2 5" stroke="${selected ? '#fff' : color}" stroke-width="1.5" stroke-linecap="round"/>
        <rect x="2" y="12" width="20" height="6" rx="2"
          fill="${selected ? '#fff' : color}" fill-opacity=".18"
          stroke="${selected ? '#fff' : color}" stroke-width="1.5"/>
        <circle cx="7" cy="18" r="1.8" fill="${selected ? '#fff' : color}"/>
        <circle cx="17" cy="18" r="1.8" fill="${selected ? '#fff' : color}"/>
      </svg>
    </div>`,
    className: '',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  })
}

// ─── Map fly-to controller ────────────────────────────────────────────────────

function MapController({ target }: { target: { pos: [number, number]; zoom: number; ts: number } | null }) {
  const map = useMap()
  const prevTs = useRef(0)
  useEffect(() => {
    if (!target || target.ts === prevTs.current) return
    prevTs.current = target.ts
    map.flyTo(target.pos, target.zoom, { duration: 0.8, easeLinearity: 0.4 })
  }, [map, target])
  return null
}

// ─── Spread vehicle markers inside a zone ────────────────────────────────────

function vehicleCoords(loc: VehicleLocation, idx: number, total: number): [number, number] {
  const [lat, lng] = LOCATION_COORDS[loc]
  if (total <= 1) return [lat, lng]
  const angle = (idx / total) * 2 * Math.PI - Math.PI / 2
  const r = 0.00006
  return [lat + r * Math.cos(angle) * 0.65, lng + r * Math.sin(angle)]
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function VehicleMap({ vehicles }: { vehicles: Vehicle[] }) {
  const [layer, setLayer] = useState<'satellite' | 'street'>('street')
  const [selectedLoc, setSelectedLoc] = useState<VehicleLocation | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [flyTarget, setFlyTarget] = useState<{ pos: [number, number]; zoom: number; ts: number } | null>(null)

  const selectedVehicle = vehicles.find(v => v.id === selectedId) ?? null

  const byLoc = vehicles.reduce<Partial<Record<VehicleLocation, Vehicle[]>>>((acc, v) => {
    ;(acc[v.location] ??= []).push(v)
    return acc
  }, {})

  const sidebarList = selectedLoc ? (byLoc[selectedLoc] ?? []) : vehicles

  function flyTo(pos: [number, number], zoom: number) {
    setFlyTarget({ pos, zoom, ts: Date.now() })
  }

  function handleZoneClick(loc: VehicleLocation) {
    if (selectedLoc === loc) {
      setSelectedLoc(null)
      setSelectedId(null)
      flyTo(DEALERSHIP_CENTER, DEALERSHIP_ZOOM)
    } else {
      setSelectedLoc(loc)
      setSelectedId(null)
      flyTo(LOCATION_COORDS[loc], 20)
    }
  }

  function handleVehicleClick(v: Vehicle) {
    const group = byLoc[v.location] ?? []
    const idx = group.findIndex(g => g.id === v.id)
    setSelectedLoc(v.location)
    setSelectedId(v.id)
    flyTo(vehicleCoords(v.location, idx, group.length), 21)
  }

  return (
    <div
      className="flex rounded-xl overflow-hidden border border-border/60 shadow-sm bg-background"
      style={{ height: 'calc(100vh - 260px)', minHeight: '560px' }}
    >
      {/* ── Map panel ───────────────────────────────────────────────────── */}
      <div className="relative flex-1 min-w-0">

        {/* Layer toggle */}
        <div className="absolute top-3 right-3 z-[1000] flex overflow-hidden rounded-lg shadow-lg border border-white/20 bg-black/50 backdrop-blur-md">
          {(['street', 'satellite'] as const).map(l => (
            <button
              key={l}
              onClick={() => setLayer(l)}
              className={cn(
                'px-3 py-1.5 text-[11px] font-semibold transition-colors',
                layer === l ? 'bg-white text-zinc-900' : 'text-white/80 hover:text-white hover:bg-white/10',
              )}
            >
              {l === 'satellite' ? 'Satellit' : 'Karte'}
            </button>
          ))}
        </div>

        {/* Zone legend overlay */}
        <div className="absolute bottom-6 left-3 z-[1000] bg-white/92 dark:bg-zinc-900/92 backdrop-blur-md rounded-xl shadow-xl border border-white/50 dark:border-zinc-700/60 p-2.5 min-w-[152px]">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 px-1 mb-1.5">
            Standorte
          </p>
          {(Object.keys(LOCATION_CONFIG) as VehicleLocation[]).map(loc => {
            const count = byLoc[loc]?.length ?? 0
            const active = selectedLoc === loc
            return (
              <button
                key={loc}
                onClick={() => handleZoneClick(loc)}
                className={cn(
                  'flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-xs font-medium transition-all',
                  active
                    ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50',
                )}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ background: LOCATION_CONFIG[loc].color }}
                />
                <span className="flex-1 text-left">{loc}</span>
                <span className={cn('tabular-nums', active ? 'font-bold' : 'text-zinc-400 dark:text-zinc-500')}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        <MapContainer
          center={DEALERSHIP_CENTER}
          zoom={DEALERSHIP_ZOOM}
          className="h-full w-full"
          zoomControl
          scrollWheelZoom
        >
          <TileLayer
            key={layer}
            url={TILE_LAYERS[layer].url}
            attribution={TILE_LAYERS[layer].attribution}
            maxNativeZoom={TILE_LAYERS[layer].maxNativeZoom}
            maxZoom={TILE_LAYERS[layer].maxZoom}
          />
          <MapController target={flyTarget} />

          {/* Zone cluster markers */}
          {(Object.keys(LOCATION_CONFIG) as VehicleLocation[])
            .filter(loc => (byLoc[loc]?.length ?? 0) > 0)
            .map(loc => (
              <Marker
                key={`zone-${loc}`}
                position={LOCATION_COORDS[loc]}
                icon={createZoneIcon(loc, byLoc[loc]!.length, selectedLoc === loc)}
                eventHandlers={{ click: () => handleZoneClick(loc) }}
              />
            ))}

          {/* Individual vehicle markers for selected zone */}
          {selectedLoc && (byLoc[selectedLoc] ?? []).map((v, idx) => {
            const group = byLoc[selectedLoc]!
            return (
              <Marker
                key={`v-${v.id}`}
                position={vehicleCoords(selectedLoc, idx, group.length)}
                icon={createVehicleIcon(v, selectedId === v.id)}
                eventHandlers={{ click: () => handleVehicleClick(v) }}
              />
            )
          })}
        </MapContainer>
      </div>

      {/* ── Sidebar panel ───────────────────────────────────────────────── */}
      <div className="w-[340px] xl:w-[380px] flex flex-col border-l bg-background shrink-0">

        {/* Header */}
        <div className="px-4 py-3 border-b flex items-center justify-between shrink-0">
          <div>
            <p className="text-sm font-semibold">
              {selectedLoc ?? 'Alle Standorte'}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {sidebarList.length} Fahrzeug{sidebarList.length !== 1 ? 'e' : ''}
            </p>
          </div>
          {selectedLoc && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full shrink-0"
              onClick={() => {
                setSelectedLoc(null)
                setSelectedId(null)
                flyTo(DEALERSHIP_CENTER, DEALERSHIP_ZOOM)
              }}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {/* Selected vehicle hero card */}
        {selectedVehicle && (
          <div
            className="mx-3 mt-3 mb-0.5 rounded-xl overflow-hidden border shrink-0"
            style={{ borderColor: `${LOCATION_CONFIG[selectedVehicle.location].color}50` }}
          >
            <div className="relative h-28">
              <Image
                src={selectedVehicle.imageUrl}
                alt={`${selectedVehicle.make} ${selectedVehicle.model}`}
                fill
                className="object-cover"
                sizes="380px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
              <div className="absolute bottom-2.5 left-3 right-3 flex items-end justify-between">
                <div>
                  <p className="text-white font-semibold text-sm leading-tight drop-shadow-md">
                    {selectedVehicle.make} {selectedVehicle.model}
                  </p>
                  <p className="text-white/75 text-[11px] mt-0.5">
                    {selectedVehicle.year} · {selectedVehicle.licensePlate}
                  </p>
                </div>
                <p className="text-white font-bold text-base drop-shadow-md">
                  {formatCurrency(selectedVehicle.price)}
                </p>
              </div>
            </div>
            <div className="px-3 py-2.5 flex items-center justify-between bg-muted/40">
              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className={cn('text-[10px] border-0', STATUS_COLORS[selectedVehicle.status])}
                >
                  {STATUS_LABELS[selectedVehicle.status]}
                </Badge>
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: LOCATION_CONFIG[selectedVehicle.location].color }}
                  />
                  {selectedVehicle.location}
                </span>
              </div>
              <Link
                href={`/fahrzeuge/${selectedVehicle.id}`}
                className="flex items-center gap-0.5 text-xs text-primary font-medium hover:underline"
              >
                Details <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        )}

        {/* Vehicle list */}
        <div className="flex-1 overflow-y-auto divide-y divide-border/50">
          {sidebarList.map(v => {
            const escLevel = getEscalationLevel(v.deadline)
            const esc = escalationColors[escLevel]
            const daysLeft = getDaysRemaining(v.deadline)
            const isSelected = selectedId === v.id
            const locColor = LOCATION_CONFIG[v.location].color

            return (
              <div
                key={v.id}
                onClick={() => handleVehicleClick(v)}
                className={cn(
                  'flex gap-3 p-3 cursor-pointer transition-colors hover:bg-muted/40',
                  isSelected && 'bg-muted/60',
                )}
                style={isSelected ? { boxShadow: `inset 3px 0 0 ${locColor}` } : {}}
              >
                <div className="relative h-14 w-[72px] rounded-lg overflow-hidden bg-muted shrink-0">
                  <Image
                    src={v.imageUrl}
                    alt={`${v.make} ${v.model}`}
                    fill
                    className="object-cover"
                    sizes="72px"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-1 justify-between">
                    <p className="text-[13px] font-medium leading-snug truncate">
                      {v.make} {v.model}
                    </p>
                    <Badge
                      variant="outline"
                      className={cn('text-[10px] border-0 shrink-0 h-5', esc.bg, esc.text)}
                    >
                      {daysLeft < 0 ? `${Math.abs(daysLeft)}d` : `${daysLeft}d`}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {v.year} · {v.licensePlate}
                  </p>
                  <div className="flex items-center justify-between mt-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Badge
                        variant="secondary"
                        className={cn('text-[10px] border-0 h-5 shrink-0', STATUS_COLORS[v.status])}
                      >
                        {STATUS_LABELS[v.status]}
                      </Badge>
                      {!selectedLoc && (
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: locColor }} />
                          {v.location}
                        </span>
                      )}
                    </div>
                    <span className="text-[13px] font-semibold shrink-0 ml-1">
                      {formatCurrency(v.price)}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}

          {sidebarList.length === 0 && (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm">
              Keine Fahrzeuge
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
