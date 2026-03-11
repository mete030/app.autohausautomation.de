'use client'

import { useState, useEffect, useRef } from 'react'
import {
  MapContainer, TileLayer, Marker, Rectangle, Tooltip,
  useMap, useMapEvents, Polygon,
} from 'react-leaflet'
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
import {
  X, ChevronRight, ChevronDown, Navigation2, Plus,
} from 'lucide-react'
import {
  useDealershipStore, DEFAULT_SPOT_PARAMS,
} from '@/lib/stores/dealership-store'
import type { LatLng, AxisAlignedBounds } from '@/lib/stores/dealership-store'
import { useVehicleStore } from '@/lib/stores/vehicle-store'
import { angleBetween, boundsCenter, rotatePoint, LAT_PER_M } from '@/lib/yard-geometry'
import AreaPolygon from '@/components/fahrzeuge/yard-map/AreaPolygon'
import AreaSetupPanel from '@/components/fahrzeuge/yard-map/AreaSetupPanel'
import AreaEditPanel from '@/components/fahrzeuge/yard-map/AreaEditPanel'

// ─── Static config ────────────────────────────────────────────────────────────

const DEALERSHIP_CENTER: [number, number] = [48.7758, 9.1829]
const DEALERSHIP_ZOOM = 17

const LOCATION_COORDS: Record<VehicleLocation, [number, number]> = {
  Showroom:  [48.77620, 9.18290],
  'Hof A':   [48.77570, 9.18225],
  'Hof B':   [48.77570, 9.18360],
  Werkstatt: [48.77520, 9.18290],
  Aufbereitung: [48.77595, 9.18305],
  Fotozone: [48.77602, 9.18245],
  'Externer Lackierer': [48.77510, 9.18420],
}

const LOCATION_CONFIG: Record<VehicleLocation, { color: string; label: string }> = {
  Showroom:  { color: '#3b82f6', label: 'Showroom' },
  'Hof A':   { color: '#22c55e', label: 'Hof A' },
  'Hof B':   { color: '#a855f7', label: 'Hof B' },
  Werkstatt: { color: '#f97316', label: 'Werkstatt' },
  Aufbereitung: { color: '#14b8a6', label: 'Aufbereitung' },
  Fotozone: { color: '#ec4899', label: 'Fotozone' },
  'Externer Lackierer': { color: '#64748b', label: 'Externer Lackierer' },
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

// ─── Leaflet marker icons ─────────────────────────────────────────────────────

function createZoneIcon(location: VehicleLocation, count: number, selected: boolean) {
  const { color } = LOCATION_CONFIG[location]
  const size = selected ? 60 : 52
  const glow = selected ? `, 0 0 0 5px ${color}44` : ''
  return L.divIcon({
    html: `<div style="width:${size}px;height:${size}px;background:${color};border:3px solid ${selected ? '#fff' : 'rgba(255,255,255,0.7)'};border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(0,0,0,.35)${glow};cursor:pointer;">
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
    html: `<div style="width:40px;height:40px;background:${selected ? color : '#fff'};border:2.5px solid ${color};border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 10px rgba(0,0,0,.25)${glow};cursor:pointer;">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M3 12l2-5h14l2 5" stroke="${selected ? '#fff' : color}" stroke-width="1.5" stroke-linecap="round"/>
        <rect x="2" y="12" width="20" height="6" rx="2" fill="${selected ? '#fff' : color}" fill-opacity=".18" stroke="${selected ? '#fff' : color}" stroke-width="1.5"/>
        <circle cx="7" cy="18" r="1.8" fill="${selected ? '#fff' : color}"/>
        <circle cx="17" cy="18" r="1.8" fill="${selected ? '#fff' : color}"/>
      </svg>
    </div>`,
    className: '',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  })
}

// ─── Inner map components ─────────────────────────────────────────────────────

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

function CursorChanger({ cursor }: { cursor: string }) {
  const map = useMap()
  useEffect(() => {
    map.getContainer().style.cursor = cursor
    return () => { map.getContainer().style.cursor = '' }
  }, [map, cursor])
  return null
}

function DrawingLayer({
  corner1,
  onFirstClick,
  onSecondClick,
  setPreviewCorner,
}: {
  corner1: LatLng | null
  onFirstClick: (pos: LatLng) => void
  onSecondClick: (pos: LatLng) => void
  setPreviewCorner: (pos: LatLng) => void
}) {
  useMapEvents({
    click(e) {
      const pos: LatLng = [e.latlng.lat, e.latlng.lng]
      if (!corner1) onFirstClick(pos)
      else onSecondClick(pos)
    },
    mousemove(e) {
      setPreviewCorner([e.latlng.lat, e.latlng.lng])
    },
  })
  return null
}

function vehicleCoords(loc: VehicleLocation, idx: number, total: number): [number, number] {
  const [lat, lng] = LOCATION_COORDS[loc]
  if (total <= 1) return [lat, lng]
  const angle = (idx / total) * 2 * Math.PI - Math.PI / 2
  const r = 0.00006
  return [lat + r * Math.cos(angle) * 0.65, lng + r * Math.sin(angle)]
}

// ─── Map Mode ─────────────────────────────────────────────────────────────────

type MapMode =
  | { type: 'view' }
  | { type: 'draw-area'; step: 1 | 2 | 3; corner1: LatLng | null; addressLabel: string; addressCenter: LatLng | null; confirmedBounds: AxisAlignedBounds | null; areaName: string }
  | { type: 'edit-area'; areaId: string }
  | { type: 'assign-spot'; spotId: string }

// ─── Main component ───────────────────────────────────────────────────────────

export default function VehicleMap({ vehicles }: { vehicles: Vehicle[] }) {
  // Map + view state
  const [layer, setLayer] = useState<'satellite' | 'street'>('street')
  const [selectedLoc, setSelectedLoc] = useState<VehicleLocation | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [flyTarget, setFlyTarget] = useState<{ pos: [number, number]; zoom: number; ts: number } | null>(null)
  const [previewCorner, setPreviewCorner] = useState<LatLng | null>(null)

  // Mode state machine
  const [mode, setMode] = useState<MapMode>({ type: 'view' })

  // Sidebar: expanded areas
  const [expandedAreas, setExpandedAreas] = useState<Set<string>>(new Set())

  const dealership = useDealershipStore()
  const allVehicles = useVehicleStore(s => s.vehicles)

  const selectedVehicle = vehicles.find(v => v.id === selectedId) ?? null

  const byLoc = vehicles.reduce<Partial<Record<VehicleLocation, Vehicle[]>>>((acc, v) => {
    ;(acc[v.location] ??= []).push(v)
    return acc
  }, {})

  const sidebarList = selectedLoc ? (byLoc[selectedLoc] ?? []) : vehicles

  function flyTo(pos: [number, number], zoom: number) {
    setFlyTarget({ pos, zoom, ts: Date.now() })
  }

  // ── Zone mode handlers (non-configured) ──────────────────────────────────

  function handleZoneClick(loc: VehicleLocation) {
    if (selectedLoc === loc) {
      setSelectedLoc(null); setSelectedId(null)
      flyTo(DEALERSHIP_CENTER, DEALERSHIP_ZOOM)
    } else {
      setSelectedLoc(loc); setSelectedId(null)
      flyTo(LOCATION_COORDS[loc], 20)
    }
  }

  function handleVehicleClick(v: Vehicle) {
    const group = byLoc[v.location] ?? []
    const idx = group.findIndex(g => g.id === v.id)
    setSelectedLoc(v.location); setSelectedId(v.id)
    flyTo(vehicleCoords(v.location, idx, group.length), 21)
  }

  // ── Draw area handlers ───────────────────────────────────────────────────

  function startDrawArea() {
    const isFirst = !dealership.isConfigured
    setMode({
      type: 'draw-area',
      step: isFirst ? 1 : 2,
      corner1: null,
      addressLabel: dealership.address,
      addressCenter: dealership.center,
      confirmedBounds: null,
      areaName: `Bereich ${String.fromCharCode(65 + dealership.areas.length)}`,
    })
  }

  function handleAddressSelect(label: string, center: LatLng) {
    if (mode.type !== 'draw-area') return
    dealership.configure(label, center)
    flyTo(center, 18)
    setMode({ ...mode, step: 2, addressLabel: label, addressCenter: center })
  }

  function handleStartDraw() {
    if (mode.type !== 'draw-area') return
    setMode({ ...mode, corner1: null })
    setPreviewCorner(null)
  }

  function handleFirstClick(pos: LatLng) {
    if (mode.type !== 'draw-area') return
    setMode({ ...mode, corner1: pos })
  }

  function handleSecondClick(pos: LatLng) {
    if (mode.type !== 'draw-area' || !mode.corner1) return
    const sw: LatLng = [Math.min(mode.corner1[0], pos[0]), Math.min(mode.corner1[1], pos[1])]
    const ne: LatLng = [Math.max(mode.corner1[0], pos[0]), Math.max(mode.corner1[1], pos[1])]
    const bounds: AxisAlignedBounds = [sw, ne]
    setMode({ ...mode, step: 3, confirmedBounds: bounds })
  }

  function handleConfirmArea() {
    if (mode.type !== 'draw-area' || !mode.confirmedBounds) return
    const areaId = dealership.addArea(mode.confirmedBounds, mode.areaName)
    const center = boundsCenter(mode.confirmedBounds)
    flyTo(center, 19)
    // Switch to edit mode for the new area
    setMode({ type: 'edit-area', areaId })
  }

  function handleCancelDraw() {
    if (mode.type !== 'draw-area') return
    setMode({ ...mode, corner1: null })
    setPreviewCorner(null)
  }

  function handleDrawBack() {
    if (mode.type !== 'draw-area') return
    setMode({ ...mode, step: 2, confirmedBounds: null, corner1: null })
    setPreviewCorner(null)
  }

  // ── Area interaction handlers ────────────────────────────────────────────

  function handleAreaClick(areaId: string) {
    if (mode.type === 'edit-area' && mode.areaId === areaId) return
    const area = dealership.areas.find(a => a.id === areaId)
    if (!area) return
    flyTo(boundsCenter(area.baseBounds), 19)
    setMode({ type: 'edit-area', areaId })
  }

  function handleSpotClick(spotId: string) {
    if (mode.type === 'edit-area') {
      dealership.toggleSpot(spotId)
      return
    }
    // Find the spot across all areas
    const allSpots = dealership.getAllSpots()
    const spot = allSpots.find(s => s.id === spotId)
    if (!spot || spot.disabled) return
    if (spot.vehicleId) {
      setSelectedId(spot.vehicleId)
    } else {
      setMode({ type: 'assign-spot', spotId })
    }
  }

  function handleCornerDrag(areaId: string, cornerIdx: number, lat: number, lng: number) {
    const area = dealership.areas.find(a => a.id === areaId)
    if (!area) return

    // Reverse-rotate the dragged position back to local space
    const center = boundsCenter(area.baseBounds)
    const localPos = rotatePoint([lat, lng], center, -area.rotationDeg)

    const [[swLat, swLng], [neLat, neLng]] = area.baseBounds
    let newSW: LatLng, newNE: LatLng

    switch (cornerIdx) {
      case 0: newSW = [localPos[0], localPos[1]]; newNE = [neLat, neLng]; break  // SW
      case 1: newSW = [swLat, localPos[1]]; newNE = [localPos[0], neLng]; break  // NW
      case 2: newSW = [swLat, swLng]; newNE = [localPos[0], localPos[1]]; break  // NE
      case 3: newSW = [localPos[0], swLng]; newNE = [neLat, localPos[1]]; break  // SE
      default: return
    }

    const normalized: AxisAlignedBounds = [
      [Math.min(newSW[0], newNE[0]), Math.min(newSW[1], newNE[1])],
      [Math.max(newSW[0], newNE[0]), Math.max(newSW[1], newNE[1])],
    ]
    dealership.updateAreaBounds(areaId, normalized)
  }

  function handleRotationDrag(areaId: string, lat: number, lng: number) {
    const area = dealership.areas.find(a => a.id === areaId)
    if (!area) return
    const center = boundsCenter(area.baseBounds)
    const angle = angleBetween(center, [lat, lng])
    dealership.updateAreaRotation(areaId, angle)
  }

  // ── Spot assignment ──────────────────────────────────────────────────────

  const allSpots = dealership.getAllSpots()
  const assigningSpot = mode.type === 'assign-spot'
    ? allSpots.find(s => s.id === mode.spotId) ?? null
    : null
  const assigningSpotIndex = assigningSpot?.index ?? 0
  const occupiedVehicleIds = new Set(allSpots.map(s => s.vehicleId).filter(Boolean))
  const unassignedVehicles = allVehicles.filter(v => !occupiedVehicleIds.has(v.id))

  // ── Derived stats ────────────────────────────────────────────────────────

  const totalEnabledSpots = allSpots.filter(s => !s.disabled).length
  const totalOccupied = allSpots.filter(s => s.vehicleId && !s.disabled).length

  // ── Sidebar area toggle ──────────────────────────────────────────────────

  function toggleAreaExpanded(areaId: string) {
    setExpandedAreas(prev => {
      const next = new Set(prev)
      if (next.has(areaId)) next.delete(areaId)
      else next.add(areaId)
      return next
    })
  }

  // Is draw mode active?
  const isDrawMode = mode.type === 'draw-area' && mode.step === 2 && mode.corner1 !== null || mode.type === 'draw-area' && mode.step === 2 && !mode.confirmedBounds
  const drawCorner1 = mode.type === 'draw-area' ? mode.corner1 : null

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div
      className="flex h-[calc(100dvh-220px)] min-h-[560px] flex-col overflow-hidden rounded-xl border border-border/60 bg-background shadow-sm xl:h-[calc(100vh-260px)] xl:flex-row"
    >
      {/* ── Map panel ─────────────────────────────────────────────────── */}
      <div className="relative min-h-[300px] min-w-0 flex-[1.1]">

        {/* ── Setup panel overlay ── */}
        {mode.type === 'draw-area' && (
          <AreaSetupPanel
            isFirstArea={!dealership.isConfigured || dealership.areas.length === 0}
            step={mode.step as 1 | 2 | 3}
            addressLabel={mode.addressLabel}
            confirmedBounds={mode.confirmedBounds}
            drawMode={mode.step === 2 && !mode.confirmedBounds}
            hasFirstCorner={mode.corner1 !== null}
            areaName={mode.areaName}
            onAddressSelect={handleAddressSelect}
            onStartDraw={handleStartDraw}
            onCancelDraw={handleCancelDraw}
            onAreaNameChange={(name) => {
              if (mode.type === 'draw-area') setMode({ ...mode, areaName: name })
            }}
            onConfirm={handleConfirmArea}
            onBack={handleDrawBack}
            onClose={() => setMode({ type: 'view' })}
          />
        )}

        {/* ── Edit panel overlay ── */}
        {mode.type === 'edit-area' && (() => {
          const area = dealership.areas.find(a => a.id === mode.areaId)
          if (!area) return null
          return (
            <AreaEditPanel
              area={area}
              onRenameArea={(name) => dealership.renameArea(mode.areaId, name)}
              onUpdateRotation={(deg) => dealership.updateAreaRotation(mode.areaId, deg)}
              onUpdateSpotParams={(params) => dealership.updateAreaSpotParams(mode.areaId, params)}
              onRenameRow={(rowId, name) => dealership.renameRow(mode.areaId, rowId, name)}
              onAddRow={() => dealership.addRow(mode.areaId)}
              onRemoveRow={(rowId) => dealership.removeRow(mode.areaId, rowId)}
              onRemoveArea={() => { dealership.removeArea(mode.areaId); setMode({ type: 'view' }) }}
              onClose={() => setMode({ type: 'view' })}
            />
          )
        })()}

        {/* ── "Not configured" CTA overlay ── */}
        {!dealership.isConfigured && mode.type === 'view' && (
          <div className="absolute inset-0 z-[999] flex items-center justify-center pointer-events-none">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border p-6 max-w-xs text-center pointer-events-auto">
              <div className="w-12 h-12 bg-zinc-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Navigation2 className="h-5 w-5 text-zinc-600" />
              </div>
              <h3 className="font-semibold text-sm">Gelände einrichten</h3>
              <p className="text-xs text-muted-foreground mt-1 mb-4 leading-relaxed">
                Zeichne Bereiche auf der Karte, um Fahrzeuge physisch zu platzieren.
              </p>
              <Button className="w-full gap-2 h-9 text-sm" onClick={startDrawArea}>
                <Plus className="h-4 w-4" />
                Ersten Bereich zeichnen
              </Button>
            </div>
          </div>
        )}

        {/* ── Layer toggle ── */}
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

        {/* ── Zone legend (only in non-configured mode) ── */}
        {!dealership.isConfigured && mode.type === 'view' && (
          <div className="absolute bottom-6 left-3 z-[1000] bg-white/92 dark:bg-zinc-900/92 backdrop-blur-md rounded-xl shadow-xl border border-white/50 p-2.5 min-w-[152px]">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 px-1 mb-1.5">Standorte</p>
            {(Object.keys(LOCATION_CONFIG) as VehicleLocation[]).map(loc => {
              const count = byLoc[loc]?.length ?? 0
              const active = selectedLoc === loc
              return (
                <button
                  key={loc}
                  onClick={() => handleZoneClick(loc)}
                  className={cn(
                    'flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-xs font-medium transition-all',
                    active ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900' : 'text-zinc-600 hover:bg-zinc-50',
                  )}
                >
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: LOCATION_CONFIG[loc].color }} />
                  <span className="flex-1 text-left">{loc}</span>
                  <span className={cn('tabular-nums', active ? 'font-bold' : 'text-zinc-400')}>{count}</span>
                </button>
              )
            })}
          </div>
        )}

        {/* ── Bottom-left action buttons (when configured) ── */}
        {dealership.isConfigured && mode.type === 'view' && (
          <div className="absolute bottom-6 left-3 z-[1000] flex gap-2">
            <button
              onClick={startDrawArea}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/90 backdrop-blur-md rounded-lg shadow-md border text-xs font-medium text-zinc-700 hover:bg-white transition-colors"
            >
              <Plus className="h-3 w-3" />
              Bereich
            </button>
          </div>
        )}

        {/* ── Map ── */}
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

          {/* Cursor override */}
          {mode.type === 'draw-area' && mode.step === 2 && !mode.confirmedBounds && (
            <CursorChanger cursor="crosshair" />
          )}

          {/* Drawing interaction */}
          {mode.type === 'draw-area' && mode.step === 2 && !mode.confirmedBounds && (
            <DrawingLayer
              corner1={mode.corner1}
              onFirstClick={handleFirstClick}
              onSecondClick={handleSecondClick}
              setPreviewCorner={setPreviewCorner}
            />
          )}

          {/* Live preview rectangle while drawing */}
          {mode.type === 'draw-area' && mode.step === 2 && mode.corner1 && previewCorner && !mode.confirmedBounds && (
            <Rectangle
              bounds={[mode.corner1, previewCorner]}
              pathOptions={{ color: '#3b82f6', fillColor: '#dbeafe', fillOpacity: 0.25, weight: 2, dashArray: '6,4' }}
            />
          )}

          {/* Confirmed rectangle during step 3 */}
          {mode.type === 'draw-area' && mode.step === 3 && mode.confirmedBounds && (
            <Rectangle
              bounds={mode.confirmedBounds}
              pathOptions={{ color: '#22c55e', fillColor: '#dcfce7', fillOpacity: 0.3, weight: 2.5, dashArray: '6,3' }}
            />
          )}

          {/* ── CONFIGURED: Area polygons + spots ── */}
          {dealership.isConfigured && dealership.areas.map(area => (
            <AreaPolygon
              key={area.id}
              area={area}
              vehicles={allVehicles}
              isEditing={mode.type === 'edit-area' && mode.areaId === area.id}
              isSelected={false}
              assigningSpotId={mode.type === 'assign-spot' ? mode.spotId : null}
              onSpotClick={handleSpotClick}
              onAreaClick={handleAreaClick}
              onCornerDrag={handleCornerDrag}
              onRotationDrag={handleRotationDrag}
            />
          ))}

          {/* ── NOT CONFIGURED: zone cluster markers ── */}
          {!dealership.isConfigured && mode.type === 'view' && (
            <>
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
            </>
          )}
        </MapContainer>
      </div>

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <div className="h-[44%] min-h-[260px] w-full flex flex-col border-t bg-background shrink-0 xl:h-auto xl:w-[380px] xl:border-l xl:border-t-0">

        {/* ── Assignment mode ── */}
        {mode.type === 'assign-spot' && (
          <>
            <div className="px-4 py-3 border-b flex items-center justify-between shrink-0 bg-blue-50/60">
              <div>
                <p className="text-sm font-semibold text-blue-900">Fahrzeug zuweisen</p>
                <p className="text-xs text-blue-600 mt-0.5">Platz {assigningSpotIndex} · wähle ein Fahrzeug</p>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={() => setMode({ type: 'view' })}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-border/50">
              {unassignedVehicles.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm gap-2">
                  <p>Alle Fahrzeuge sind bereits platziert.</p>
                </div>
              ) : (
                unassignedVehicles.map(v => {
                  const locColor = LOCATION_CONFIG[v.location].color
                  return (
                    <div
                      key={v.id}
                      onClick={() => {
                        dealership.assignVehicle(mode.spotId, v.id)
                        setMode({ type: 'view' })
                      }}
                      className="flex gap-3 p-3 cursor-pointer hover:bg-blue-50/50 transition-colors"
                    >
                      <div className="relative h-12 w-16 rounded-lg overflow-hidden bg-muted shrink-0">
                        <Image src={v.imageUrl} alt="" fill className="object-cover" sizes="64px" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium truncate">{v.make} {v.model}</p>
                        <p className="text-[11px] text-muted-foreground">{v.year} · {v.licensePlate}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: locColor }} />
                          <span className="text-[10px] text-muted-foreground">{v.location}</span>
                          <Badge variant="secondary" className={cn('text-[10px] border-0 h-4 ml-1', STATUS_COLORS[v.status])}>
                            {STATUS_LABELS[v.status]}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </>
        )}

        {/* ── Normal sidebar ── */}
        {mode.type !== 'assign-spot' && (
          <>
            {/* Header */}
            <div className={cn(
              'px-4 py-3 border-b flex items-center justify-between shrink-0',
              mode.type === 'edit-area' && 'bg-blue-50/40',
            )}>
              <div>
                <p className="text-sm font-semibold">
                  {mode.type === 'edit-area'
                    ? 'Bearbeitungsmodus'
                    : dealership.isConfigured
                    ? dealership.address.split(',').slice(0, 2).join(',')
                    : (selectedLoc ?? 'Alle Standorte')}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {mode.type === 'edit-area'
                    ? `${dealership.areas.length} Bereiche · ${totalEnabledSpots} Plätze`
                    : dealership.isConfigured
                    ? `${totalOccupied} / ${totalEnabledSpots} Stellplätze belegt`
                    : `${sidebarList.length} Fahrzeug${sidebarList.length !== 1 ? 'e' : ''}`}
                </p>
              </div>
              {!dealership.isConfigured && selectedLoc && (
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={() => {
                  setSelectedLoc(null); setSelectedId(null); flyTo(DEALERSHIP_CENTER, DEALERSHIP_ZOOM)
                }}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>

            {/* ── Configured: Area accordion + vehicle list ── */}
            {dealership.isConfigured && (
              <div className="flex-1 overflow-y-auto">
                {/* Area accordion */}
                {dealership.areas.length > 0 && (
                  <div className="border-b">
                    {dealership.areas.map(area => {
                      const areaSpots = area.rows.flatMap(r => r.spots)
                      const areaEnabled = areaSpots.filter(s => !s.disabled).length
                      const areaOccupied = areaSpots.filter(s => s.vehicleId && !s.disabled).length
                      const isExpanded = expandedAreas.has(area.id)
                      const isEditing = mode.type === 'edit-area' && mode.areaId === area.id

                      return (
                        <div key={area.id}>
                          <button
                            onClick={() => {
                              toggleAreaExpanded(area.id)
                              flyTo(boundsCenter(area.baseBounds), 19)
                            }}
                            className={cn(
                              'flex items-center gap-2.5 w-full px-4 py-2.5 text-left hover:bg-muted/40 transition-colors',
                              isEditing && 'bg-blue-50/50',
                            )}
                          >
                            <span className="w-3 h-3 rounded-full shrink-0" style={{ background: area.color }} />
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-medium truncate">{area.name}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {areaOccupied} / {areaEnabled} belegt · {area.rows.length} Reihen
                              </p>
                            </div>
                            <ChevronDown className={cn(
                              'h-3.5 w-3.5 text-zinc-400 transition-transform',
                              isExpanded && 'rotate-180',
                            )} />
                          </button>

                          {/* Expanded row list */}
                          {isExpanded && (
                            <div className="pl-9 pr-4 pb-2 space-y-0.5">
                              {area.rows.map(row => {
                                const rowEnabled = row.spots.filter(s => !s.disabled).length
                                const rowOccupied = row.spots.filter(s => s.vehicleId && !s.disabled).length
                                return (
                                  <div
                                    key={row.id}
                                    className="flex items-center justify-between py-1 text-[11px]"
                                  >
                                    <span className="text-zinc-600 font-medium">{row.name}</span>
                                    <span className="text-zinc-400 tabular-nums">{rowOccupied}/{rowEnabled}</span>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Vehicle list */}
                <div className="divide-y divide-border/50">
                  {allVehicles.map(v => {
                    const escLevel = getEscalationLevel(v.deadline)
                    const esc = escalationColors[escLevel]
                    const daysLeft = getDaysRemaining(v.deadline)
                    const isSelected = selectedId === v.id
                    const locColor = LOCATION_CONFIG[v.location].color
                    const assignedSpot = allSpots.find(s => s.vehicleId === v.id)

                    return (
                      <div
                        key={v.id}
                        onClick={() => mode.type !== 'edit-area' && setSelectedId(v.id)}
                        className={cn(
                          'flex gap-3 p-3 transition-colors hover:bg-muted/40',
                          isSelected && 'bg-muted/60',
                          mode.type !== 'edit-area' && 'cursor-pointer',
                        )}
                        style={isSelected ? { boxShadow: `inset 3px 0 0 ${locColor}` } : {}}
                      >
                        <div className="relative h-14 w-[72px] rounded-lg overflow-hidden bg-muted shrink-0">
                          <Image src={v.imageUrl} alt="" fill className="object-cover" sizes="72px" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-1 justify-between">
                            <p className="text-[13px] font-medium leading-snug truncate">{v.make} {v.model}</p>
                            <Badge variant="outline" className={cn('text-[10px] border-0 shrink-0 h-5', esc.bg, esc.text)}>
                              {daysLeft < 0 ? `${Math.abs(daysLeft)}d` : `${daysLeft}d`}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{v.year} · {v.licensePlate}</p>
                          <div className="flex items-center justify-between mt-1.5">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <Badge variant="secondary" className={cn('text-[10px] border-0 h-5 shrink-0', STATUS_COLORS[v.status])}>
                                {STATUS_LABELS[v.status]}
                              </Badge>
                              {assignedSpot
                                ? <span className="text-[10px] text-emerald-600 font-medium shrink-0">Platz {assignedSpot.index}</span>
                                : <span className="text-[10px] text-zinc-400 shrink-0">Kein Platz</span>
                              }
                            </div>
                            <span className="text-[13px] font-semibold shrink-0 ml-1">{formatCurrency(v.price)}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── Not configured: zone-based vehicle list ── */}
            {!dealership.isConfigured && (
              <>
                {/* Selected vehicle hero card */}
                {selectedVehicle && (
                  <div
                    className="mx-3 mt-3 mb-0.5 rounded-xl overflow-hidden border shrink-0"
                    style={{ borderColor: `${LOCATION_CONFIG[selectedVehicle.location].color}50` }}
                  >
                    <div className="relative h-28">
                      <Image src={selectedVehicle.imageUrl} alt="" fill className="object-cover" sizes="380px" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
                      <div className="absolute bottom-2.5 left-3 right-3 flex items-end justify-between">
                        <div>
                          <p className="text-white font-semibold text-sm leading-tight drop-shadow-md">
                            {selectedVehicle.make} {selectedVehicle.model}
                          </p>
                          <p className="text-white/75 text-[11px] mt-0.5">{selectedVehicle.year} · {selectedVehicle.licensePlate}</p>
                        </div>
                        <p className="text-white font-bold text-base drop-shadow-md">{formatCurrency(selectedVehicle.price)}</p>
                      </div>
                    </div>
                    <div className="px-3 py-2.5 flex items-center justify-between bg-muted/40">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className={cn('text-[10px] border-0', STATUS_COLORS[selectedVehicle.status])}>
                          {STATUS_LABELS[selectedVehicle.status]}
                        </Badge>
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: LOCATION_CONFIG[selectedVehicle.location].color }} />
                          {selectedVehicle.location}
                        </span>
                      </div>
                      <Link href={`/fahrzeuge/${selectedVehicle.id}`} className="flex items-center gap-0.5 text-xs text-primary font-medium hover:underline">
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
                          <Image src={v.imageUrl} alt="" fill className="object-cover" sizes="72px" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-1 justify-between">
                            <p className="text-[13px] font-medium leading-snug truncate">{v.make} {v.model}</p>
                            <Badge variant="outline" className={cn('text-[10px] border-0 shrink-0 h-5', esc.bg, esc.text)}>
                              {daysLeft < 0 ? `${Math.abs(daysLeft)}d` : `${daysLeft}d`}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{v.year} · {v.licensePlate}</p>
                          <div className="flex items-center justify-between mt-1.5">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <Badge variant="secondary" className={cn('text-[10px] border-0 h-5 shrink-0', STATUS_COLORS[v.status])}>
                                {STATUS_LABELS[v.status]}
                              </Badge>
                              {!selectedLoc && (
                                <span className="flex items-center gap-1 text-[10px] text-muted-foreground shrink-0">
                                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: locColor }} />
                                  {v.location}
                                </span>
                              )}
                            </div>
                            <span className="text-[13px] font-semibold shrink-0 ml-1">{formatCurrency(v.price)}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  {sidebarList.length === 0 && (
                    <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">Keine Fahrzeuge</div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
