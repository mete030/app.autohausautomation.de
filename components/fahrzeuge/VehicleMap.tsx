'use client'

import { useState, useEffect, useRef } from 'react'
import {
  MapContainer, TileLayer, Marker, Rectangle, Tooltip,
  useMap, useMapEvents,
} from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import Image from 'next/image'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatCurrency, getDaysRemaining, getEscalationLevel } from '@/lib/utils'
import { escalationColors } from '@/lib/constants'
import type { Vehicle, VehicleLocation, VehicleStatus } from '@/lib/types'
import { cn } from '@/lib/utils'
import {
  X, ChevronRight, Search, MapPin, Loader2,
  SquareDashed, Check, RotateCcw, Navigation2, Pencil, Minus, Plus,
} from 'lucide-react'
import {
  useDealershipStore, generateSpots, DEFAULT_SPOT_PARAMS,
} from '@/lib/stores/dealership-store'
import type { SpotParams } from '@/lib/stores/dealership-store'
import { useVehicleStore } from '@/lib/stores/vehicle-store'

// ─── Static config ────────────────────────────────────────────────────────────

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

// ─── Nominatim ────────────────────────────────────────────────────────────────

interface NominatimResult {
  place_id: number
  display_name: string
  lat: string
  lon: string
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

function createCornerIcon() {
  return L.divIcon({
    html: `<div style="width:14px;height:14px;background:white;border:2.5px solid #3b82f6;border-radius:3px;box-shadow:0 1px 6px rgba(0,0,0,.35);cursor:grab;"></div>`,
    className: '',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
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
  corner1: [number, number] | null
  onFirstClick: (pos: [number, number]) => void
  onSecondClick: (pos: [number, number]) => void
  setPreviewCorner: (pos: [number, number]) => void
}) {
  useMapEvents({
    click(e) {
      const pos: [number, number] = [e.latlng.lat, e.latlng.lng]
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

// ─── Address search (Nominatim) ───────────────────────────────────────────────

function AddressSearch({
  onSelect,
}: {
  onSelect: (label: string, center: [number, number]) => void
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<NominatimResult[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (query.length < 3) { setResults([]); return }
    const t = setTimeout(async () => {
      setLoading(true)
      try {
        const r = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=6&accept-language=de`,
          { headers: { 'Accept-Language': 'de' } },
        )
        setResults(await r.json())
      } catch { /* network error – silent */ }
      finally { setLoading(false) }
    }, 400)
    return () => clearTimeout(t)
  }, [query])

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground animate-spin" />}
        <Input
          autoFocus
          placeholder="Adresse suchen …"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="pl-8 pr-8 h-9 text-sm bg-white"
        />
      </div>
      {results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-xl shadow-xl z-[9999] overflow-hidden max-h-52 overflow-y-auto">
          {results.map(r => (
            <button
              key={r.place_id}
              onClick={() => {
                const label = r.display_name.split(',').slice(0, 3).join(', ')
                onSelect(label, [parseFloat(r.lat), parseFloat(r.lon)])
                setQuery(label)
                setResults([])
              }}
              className="flex items-start gap-2 w-full px-3 py-2 text-sm text-left hover:bg-zinc-50 border-b last:border-0"
            >
              <MapPin className="h-3.5 w-3.5 text-zinc-400 shrink-0 mt-0.5" />
              <span className="text-zinc-700 leading-snug line-clamp-2">{r.display_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Slider row ───────────────────────────────────────────────────────────────

function SliderRow({
  label, value, min, max, step, unit, onChange,
}: {
  label: string; value: number; min: number; max: number; step: number; unit: string
  onChange: (v: number) => void
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-zinc-600">{label}</span>
        <span className="font-semibold text-zinc-900 tabular-nums w-10 text-right">{value.toFixed(1)} {unit}</span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 accent-blue-500 cursor-pointer"
      />
      <div className="flex justify-between text-[10px] text-zinc-400">
        <span>{min}</span><span>{max}</span>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function VehicleMap({ vehicles }: { vehicles: Vehicle[] }) {
  // Map + view state
  const [layer, setLayer] = useState<'satellite' | 'street'>('street')
  const [selectedLoc, setSelectedLoc] = useState<VehicleLocation | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [flyTarget, setFlyTarget] = useState<{ pos: [number, number]; zoom: number; ts: number } | null>(null)

  // Setup flow state
  const [setupOpen, setSetupOpen] = useState(false)
  const [setupStep, setSetupStep] = useState<1 | 2 | 3>(1)
  const [addressLabel, setAddressLabel] = useState('')
  const [addressCenter, setAddressCenter] = useState<[number, number] | null>(null)
  const [drawMode, setDrawMode] = useState(false)
  const [corner1, setCorner1] = useState<[number, number] | null>(null)
  const [previewCorner, setPreviewCorner] = useState<[number, number] | null>(null)
  const [confirmedBounds, setConfirmedBounds] = useState<[[number, number], [number, number]] | null>(null)
  const [manualSpotCount, setManualSpotCount] = useState<number>(0)

  // Spot assignment state
  const [assigningSpotId, setAssigningSpotId] = useState<string | null>(null)

  // Edit mode state
  const [editMode, setEditMode] = useState(false)
  const [editBounds, setEditBounds] = useState<[[number, number], [number, number]] | null>(null)
  const [editParams, setEditParams] = useState<SpotParams>(DEFAULT_SPOT_PARAMS)
  const [editMaxSpots, setEditMaxSpots] = useState(0)

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

  // ── Setup helpers ──────────────────────────────────────────────────────────

  function openSetup() {
    setSetupOpen(true); setSetupStep(1)
    setAddressLabel(''); setAddressCenter(null)
    setDrawMode(false); setCorner1(null)
    setPreviewCorner(null); setConfirmedBounds(null)
    setEditMode(false)
  }

  function handleAddressSelect(label: string, center: [number, number]) {
    setAddressLabel(label); setAddressCenter(center)
    flyTo(center, 18)
    setSetupStep(2)
  }

  function handleStartDraw() {
    setDrawMode(true); setCorner1(null)
    setPreviewCorner(null); setConfirmedBounds(null)
  }

  function handleFirstClick(pos: [number, number]) {
    setCorner1(pos)
  }

  function handleSecondClick(pos: [number, number]) {
    if (!corner1) return
    const sw: [number, number] = [Math.min(corner1[0], pos[0]), Math.min(corner1[1], pos[1])]
    const ne: [number, number] = [Math.max(corner1[0], pos[0]), Math.max(corner1[1], pos[1])]
    setConfirmedBounds([sw, ne])
    setDrawMode(false)
    setSetupStep(3)
    // Initialize manual spot count from algorithm estimate
    const { spots: preview } = generateSpots(sw, ne)
    setManualSpotCount(preview.length)
  }

  function handleConfirm() {
    if (!confirmedBounds || !addressCenter || !addressLabel) return
    const center: [number, number] = [
      (confirmedBounds[0][0] + confirmedBounds[1][0]) / 2,
      (confirmedBounds[0][1] + confirmedBounds[1][1]) / 2,
    ]
    dealership.configure(addressLabel, center, confirmedBounds, manualSpotCount || undefined)
    setSetupOpen(false)
    flyTo(center, 19)
  }

  // ── Spot click ─────────────────────────────────────────────────────────────

  function handleSpotClick(spotId: string) {
    if (editMode) {
      dealership.toggleSpot(spotId)
      return
    }
    const spot = dealership.spots.find(s => s.id === spotId)
    if (!spot || spot.disabled) return
    if (spot.vehicleId) {
      setSelectedId(spot.vehicleId)
    } else {
      setAssigningSpotId(spotId)
    }
  }

  // ── Edit mode helpers ──────────────────────────────────────────────────────

  function openEditMode() {
    setEditBounds(dealership.lotBounds)
    setEditParams(dealership.spotParams)
    setEditMaxSpots(dealership.spots.length)
    setEditMode(true)
    setAssigningSpotId(null)
    setSetupOpen(false)
  }

  function closeEditMode() {
    setEditMode(false)
  }

  function handleCornerDrag(cornerIdx: number, lat: number, lng: number) {
    if (!editBounds) return
    const [[swLat, swLng], [neLat, neLng]] = editBounds
    let newSW: [number, number], newNE: [number, number]
    switch (cornerIdx) {
      case 0: newSW = [lat, lng];     newNE = [neLat, neLng]; break  // SW
      case 1: newSW = [swLat, lng];   newNE = [lat, neLng];   break  // NW
      case 2: newSW = [swLat, swLng]; newNE = [lat, lng];     break  // NE
      case 3: newSW = [lat, swLng];   newNE = [neLat, lng];   break  // SE
      default: return
    }
    const normalized: [[number, number], [number, number]] = [
      [Math.min(newSW[0], newNE[0]), Math.min(newSW[1], newNE[1])],
      [Math.max(newSW[0], newNE[0]), Math.max(newSW[1], newNE[1])],
    ]
    setEditBounds(normalized)
    dealership.updateLot(normalized, editParams, editMaxSpots || undefined)
  }

  function handleEditParam(field: keyof SpotParams, value: number) {
    const np = { ...editParams, [field]: value }
    setEditParams(np)
    if (editBounds) dealership.updateLot(editBounds, np, editMaxSpots || undefined)
  }

  function handleEditMaxSpots(val: number) {
    const clamped = Math.max(0, val)
    setEditMaxSpots(clamped)
    if (editBounds) dealership.updateLot(editBounds, editParams, clamped || undefined)
  }

  // Corner positions for draggable handles (use editBounds, fall back to dealership.lotBounds)
  const activeBounds = editBounds ?? dealership.lotBounds
  const cornerPositions: [number, number][] = editMode && activeBounds ? [
    [activeBounds[0][0], activeBounds[0][1]],  // SW
    [activeBounds[1][0], activeBounds[0][1]],  // NW
    [activeBounds[1][0], activeBounds[1][1]],  // NE
    [activeBounds[0][0], activeBounds[1][1]],  // SE
  ] : []

  // ── Spot assignment ────────────────────────────────────────────────────────

  const assigningSpot = dealership.spots.find(s => s.id === assigningSpotId) ?? null
  const occupiedVehicleIds = new Set(dealership.spots.map(s => s.vehicleId).filter(Boolean))
  const unassignedVehicles = allVehicles.filter(v => !occupiedVehicleIds.has(v.id))

  // ── Spot preview estimation ────────────────────────────────────────────────

  let estimatedSpots = 0
  if (confirmedBounds) {
    const { spots: preview } = generateSpots(confirmedBounds[0], confirmedBounds[1])
    estimatedSpots = preview.length
  }

  const enabledSpotsCount = dealership.spots.filter(s => !s.disabled).length

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div
      className="flex rounded-xl overflow-hidden border border-border/60 shadow-sm bg-background"
      style={{ height: 'calc(100vh - 260px)', minHeight: '560px' }}
    >
      {/* ── Map panel ─────────────────────────────────────────────────── */}
      <div className="relative flex-1 min-w-0">

        {/* ── Setup overlay ── */}
        {setupOpen && (
          <div className="absolute top-3 left-3 z-[1001] w-80 bg-white/96 backdrop-blur-md rounded-xl shadow-2xl border border-white/60">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b bg-zinc-50/80 rounded-t-xl overflow-hidden">
              <div className="flex items-center gap-2">
                {[1, 2, 3].map(n => (
                  <div
                    key={n}
                    className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-colors',
                      setupStep === n ? 'bg-zinc-900 text-white' :
                      setupStep > n  ? 'bg-emerald-500 text-white' :
                                       'bg-zinc-200 text-zinc-500',
                    )}
                  >
                    {setupStep > n ? <Check className="h-3 w-3" /> : n}
                  </div>
                ))}
                <span className="text-xs font-medium text-zinc-600 ml-1">
                  {setupStep === 1 && 'Adresse suchen'}
                  {setupStep === 2 && 'Gelände abmessen'}
                  {setupStep === 3 && 'Stellplätze bestätigen'}
                </span>
              </div>
              <button
                onClick={() => setSetupOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              {/* Step 1: Address search */}
              {setupStep === 1 && (
                <>
                  <p className="text-xs text-muted-foreground">
                    Gib die Adresse deines Autohauses ein, um die Karte auf dein Gelände auszurichten.
                  </p>
                  <AddressSearch onSelect={handleAddressSelect} />
                </>
              )}

              {/* Step 2: Draw lot boundary */}
              {setupStep === 2 && (
                <>
                  <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="font-medium truncate">{addressLabel}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Klicke auf zwei gegenüberliegende Ecken deines Geländes auf der Karte, um die Fläche abzustecken.
                  </p>
                  {!drawMode && !confirmedBounds && (
                    <Button
                      className="w-full h-9 gap-2 text-sm"
                      onClick={handleStartDraw}
                    >
                      <SquareDashed className="h-4 w-4" />
                      Gelände abmessen
                    </Button>
                  )}
                  {drawMode && (
                    <div className="space-y-2">
                      <div className={cn(
                        'rounded-lg px-3 py-2.5 text-xs font-medium',
                        corner1
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-amber-50 text-amber-700',
                      )}>
                        {corner1
                          ? '✓ Erste Ecke gesetzt. Klicke auf die gegenüberliegende Ecke.'
                          : 'Klicke auf die erste Ecke deines Geländes auf der Karte.'}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full h-8 text-xs gap-1.5"
                        onClick={() => { setDrawMode(false); setCorner1(null) }}
                      >
                        <RotateCcw className="h-3 w-3" /> Abbrechen
                      </Button>
                    </div>
                  )}
                </>
              )}

              {/* Step 3: Confirm with editable spot count */}
              {setupStep === 3 && confirmedBounds && (
                <>
                  <div className="bg-zinc-50 rounded-xl p-3 space-y-3">
                    {/* Editable spot count */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted-foreground">Stellplätze</span>
                        <span className="text-[10px] text-zinc-400">Algorithmus: {estimatedSpots}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setManualSpotCount(v => Math.max(1, v - 1))}
                          className="w-8 h-8 flex items-center justify-center rounded-lg border bg-white hover:bg-zinc-50 transition-colors"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <Input
                          type="number"
                          value={manualSpotCount}
                          onChange={e => setManualSpotCount(Math.max(1, parseInt(e.target.value) || 1))}
                          className="flex-1 h-8 text-center text-sm font-bold"
                          min={1}
                        />
                        <button
                          onClick={() => setManualSpotCount(v => v + 1)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg border bg-white hover:bg-zinc-50 transition-colors"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm border-t pt-2">
                      <span className="text-muted-foreground text-xs">Standort</span>
                      <span className="font-medium text-xs text-right max-w-[160px] truncate">{addressLabel}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground border-t pt-2">
                      Stellplätze werden automatisch berechnet (2,5 m × 5 m pro Platz, 6 m Fahrspuren). Du kannst die Anzahl manuell anpassen.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-9 gap-1.5 text-xs"
                      onClick={() => { setSetupStep(2); setConfirmedBounds(null); setCorner1(null) }}
                    >
                      <RotateCcw className="h-3 w-3" /> Neu
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 h-9 gap-1.5 text-xs"
                      onClick={handleConfirm}
                      disabled={manualSpotCount === 0}
                    >
                      <Check className="h-3.5 w-3.5" /> Einrichten
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── Edit mode panel ── */}
        {editMode && dealership.isConfigured && (
          <div className="absolute top-3 left-3 z-[1001] w-72 bg-white/96 backdrop-blur-md rounded-xl shadow-2xl border border-white/60">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b bg-zinc-50/80 rounded-t-xl overflow-hidden">
              <div className="flex items-center gap-2">
                <Pencil className="h-3.5 w-3.5 text-zinc-600" />
                <span className="text-xs font-semibold text-zinc-700">Gelände anpassen</span>
              </div>
              <button
                onClick={closeEditMode}
                className="text-zinc-400 hover:text-zinc-700 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Spot dimension sliders */}
              <div className="space-y-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Stellplatz-Maße</p>
                <SliderRow
                  label="Breite" value={editParams.spotW}
                  min={1.8} max={4.0} step={0.1} unit="m"
                  onChange={v => handleEditParam('spotW', v)}
                />
                <SliderRow
                  label="Tiefe" value={editParams.spotD}
                  min={3.5} max={7.0} step={0.1} unit="m"
                  onChange={v => handleEditParam('spotD', v)}
                />
                <SliderRow
                  label="Fahrspurbreite" value={editParams.lane}
                  min={4.0} max={9.0} step={0.1} unit="m"
                  onChange={v => handleEditParam('lane', v)}
                />
              </div>

              {/* Max spots override */}
              <div className="border-t pt-3 space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Max. Stellplätze</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEditMaxSpots(editMaxSpots - 1)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border bg-white hover:bg-zinc-50 transition-colors"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <Input
                    type="number"
                    value={editMaxSpots}
                    onChange={e => handleEditMaxSpots(parseInt(e.target.value) || 0)}
                    className="flex-1 h-8 text-center text-sm font-bold"
                    min={0}
                  />
                  <button
                    onClick={() => handleEditMaxSpots(editMaxSpots + 1)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border bg-white hover:bg-zinc-50 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="text-[10px] text-zinc-400">{enabledSpotsCount} aktive Plätze · {dealership.spots.filter(s => s.disabled).length} deaktiviert</p>
              </div>

              {/* Tip */}
              <div className="border-t pt-3 flex gap-2 items-start">
                <div className="text-[18px] leading-none mt-0.5">💡</div>
                <p className="text-[11px] text-zinc-500 leading-snug">
                  Ziehe die <span className="font-semibold text-zinc-700">Eckpunkte</span> auf der Karte, um das Gelände neu zuzuschneiden. Klicke auf einzelne Stellplätze, um sie zu de-/aktivieren.
                </p>
              </div>

              <Button className="w-full h-9 gap-2 text-sm" onClick={closeEditMode}>
                <Check className="h-4 w-4" /> Fertig
              </Button>
            </div>
          </div>
        )}

        {/* ── "Not configured" CTA overlay ── */}
        {!dealership.isConfigured && !setupOpen && (
          <div className="absolute inset-0 z-[999] flex items-center justify-center pointer-events-none">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border p-6 max-w-xs text-center pointer-events-auto">
              <div className="w-12 h-12 bg-zinc-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Navigation2 className="h-5 w-5 text-zinc-600" />
              </div>
              <h3 className="font-semibold text-sm">Standort einrichten</h3>
              <p className="text-xs text-muted-foreground mt-1 mb-4 leading-relaxed">
                Richte dein Autohaus-Gelände ein, um Fahrzeuge auf der Karte physisch zu platzieren.
              </p>
              <Button className="w-full gap-2 h-9 text-sm" onClick={openSetup}>
                <MapPin className="h-4 w-4" />
                Jetzt einrichten
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

        {/* ── Zone legend (only in zone mode) ── */}
        {!dealership.isConfigured && (
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
        {dealership.isConfigured && !editMode && (
          <div className="absolute bottom-6 left-3 z-[1000] flex gap-2">
            <button
              onClick={openEditMode}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/90 backdrop-blur-md rounded-lg shadow-md border text-xs font-medium text-zinc-700 hover:bg-white transition-colors"
            >
              <Pencil className="h-3 w-3" />
              Anpassen
            </button>
            <button
              onClick={openSetup}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/90 backdrop-blur-md rounded-lg shadow-md border text-xs font-medium text-zinc-700 hover:bg-white transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
              Neu einrichten
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
          {drawMode && <CursorChanger cursor="crosshair" />}
          {editMode && <CursorChanger cursor="default" />}

          {/* Drawing interaction */}
          {drawMode && (
            <DrawingLayer
              corner1={corner1}
              onFirstClick={handleFirstClick}
              onSecondClick={handleSecondClick}
              setPreviewCorner={setPreviewCorner}
            />
          )}

          {/* Live preview rectangle while drawing */}
          {drawMode && corner1 && previewCorner && (
            <Rectangle
              bounds={[corner1, previewCorner]}
              pathOptions={{ color: '#3b82f6', fillColor: '#dbeafe', fillOpacity: 0.25, weight: 2, dashArray: '6,4' }}
            />
          )}

          {/* Confirmed rectangle during step 3 */}
          {setupStep === 3 && confirmedBounds && (
            <Rectangle
              bounds={confirmedBounds}
              pathOptions={{ color: '#22c55e', fillColor: '#dcfce7', fillOpacity: 0.3, weight: 2.5, dashArray: '6,3' }}
            />
          )}

          {/* ── CONFIGURED: lot boundary + parking spots ── */}
          {dealership.isConfigured && dealership.lotBounds && (
            <>
              {/* Lot boundary outline */}
              <Rectangle
                bounds={editMode && editBounds ? editBounds : dealership.lotBounds}
                pathOptions={{
                  color: editMode ? '#3b82f6' : '#3b82f6',
                  fillColor: '#dbeafe',
                  fillOpacity: editMode ? 0.06 : 0.08,
                  weight: editMode ? 2 : 2.5,
                  dashArray: editMode ? '8,4' : '',
                }}
              />

              {/* Parking spots */}
              {dealership.spots.map(spot => {
                const vehicle = spot.vehicleId
                  ? allVehicles.find(v => v.id === spot.vehicleId)
                  : null
                const isDisabled = spot.disabled
                const isAssigning = assigningSpotId === spot.id
                const color = isDisabled
                  ? '#ef4444'
                  : vehicle ? LOCATION_CONFIG[vehicle.location].color : '#94a3b8'

                return (
                  <Rectangle
                    key={spot.id}
                    bounds={spot.bounds}
                    pathOptions={{
                      color: isAssigning ? '#3b82f6' : color,
                      fillColor: isDisabled
                        ? '#fee2e2'
                        : isAssigning ? '#bfdbfe'
                        : vehicle ? color : '#f8fafc',
                      fillOpacity: isDisabled ? 0.5 : vehicle ? 0.55 : (isAssigning ? 0.5 : 0.3),
                      weight: isAssigning ? 2.5 : (isDisabled ? 1.5 : 1.2),
                      dashArray: isDisabled ? '5,3' : (vehicle || isAssigning ? '' : '4,3'),
                    }}
                    eventHandlers={{ click: () => handleSpotClick(spot.id) }}
                  >
                    <Tooltip sticky direction="top" offset={[0, -4]}>
                      <div className="text-xs">
                        {isDisabled
                          ? <span className="text-red-500">Platz {spot.index} · Deaktiviert {editMode ? '(Klick zum Aktivieren)' : ''}</span>
                          : vehicle
                          ? <><strong>{vehicle.make} {vehicle.model}</strong><br />{vehicle.licensePlate}</>
                          : <span className="text-zinc-500">Platz {spot.index} · Frei{editMode ? ' (Klick zum Deaktivieren)' : ''}</span>
                        }
                      </div>
                    </Tooltip>
                  </Rectangle>
                )
              })}

              {/* Draggable corner handles in edit mode */}
              {editMode && cornerPositions.map((pos, idx) => (
                <Marker
                  key={`corner-${idx}`}
                  position={pos}
                  icon={createCornerIcon()}
                  draggable
                  eventHandlers={{
                    dragend(e) {
                      const { lat, lng } = e.target.getLatLng()
                      handleCornerDrag(idx, lat, lng)
                    },
                  }}
                />
              ))}
            </>
          )}

          {/* ── NOT CONFIGURED: zone cluster markers ── */}
          {!dealership.isConfigured && !setupOpen && (
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
      <div className="w-[340px] xl:w-[380px] flex flex-col border-l bg-background shrink-0">

        {/* ── Assignment mode ── */}
        {assigningSpotId && !editMode && (
          <>
            <div className="px-4 py-3 border-b flex items-center justify-between shrink-0 bg-blue-50/60">
              <div>
                <p className="text-sm font-semibold text-blue-900">Fahrzeug zuweisen</p>
                <p className="text-xs text-blue-600 mt-0.5">Platz {assigningSpot?.index} · wähle ein Fahrzeug</p>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={() => setAssigningSpotId(null)}>
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
                      onClick={() => { dealership.assignVehicle(assigningSpotId, v.id); setAssigningSpotId(null) }}
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
        {!assigningSpotId && (
          <>
            {/* Header */}
            <div className={cn(
              'px-4 py-3 border-b flex items-center justify-between shrink-0',
              editMode && 'bg-blue-50/40',
            )}>
              <div>
                <p className="text-sm font-semibold">
                  {editMode
                    ? 'Bearbeitungsmodus'
                    : dealership.isConfigured
                    ? dealership.address.split(',').slice(0, 2).join(',')
                    : (selectedLoc ?? 'Alle Standorte')}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {editMode
                    ? `${enabledSpotsCount} aktive · ${dealership.spots.filter(s => s.disabled).length} deaktivierte Stellplätze`
                    : dealership.isConfigured
                    ? `${dealership.spots.filter(s => s.vehicleId).length} / ${enabledSpotsCount} Stellplätze belegt`
                    : `${sidebarList.length} Fahrzeug${sidebarList.length !== 1 ? 'e' : ''}`}
                </p>
              </div>
              {editMode ? (
                <Button size="sm" className="h-7 text-xs gap-1.5" onClick={closeEditMode}>
                  <Check className="h-3 w-3" /> Fertig
                </Button>
              ) : !dealership.isConfigured && selectedLoc ? (
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={() => {
                  setSelectedLoc(null); setSelectedId(null); flyTo(DEALERSHIP_CENTER, DEALERSHIP_ZOOM)
                }}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              ) : null}
            </div>

            {/* Selected vehicle hero card */}
            {selectedVehicle && !dealership.isConfigured && (
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
              {(dealership.isConfigured ? allVehicles : sidebarList).map(v => {
                const escLevel = getEscalationLevel(v.deadline)
                const esc = escalationColors[escLevel]
                const daysLeft = getDaysRemaining(v.deadline)
                const isSelected = selectedId === v.id
                const locColor = LOCATION_CONFIG[v.location].color
                const assignedSpot = dealership.spots.find(s => s.vehicleId === v.id)

                return (
                  <div
                    key={v.id}
                    onClick={() => !editMode && (dealership.isConfigured ? setSelectedId(v.id) : handleVehicleClick(v))}
                    className={cn(
                      'flex gap-3 p-3 transition-colors hover:bg-muted/40',
                      isSelected && 'bg-muted/60',
                      !editMode && 'cursor-pointer',
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
                          {dealership.isConfigured ? (
                            assignedSpot
                              ? <span className="text-[10px] text-emerald-600 font-medium shrink-0">Platz {assignedSpot.index}</span>
                              : <span className="text-[10px] text-zinc-400 shrink-0">Kein Platz</span>
                          ) : (
                            !selectedLoc && (
                              <span className="flex items-center gap-1 text-[10px] text-muted-foreground shrink-0">
                                <span className="w-1.5 h-1.5 rounded-full" style={{ background: locColor }} />
                                {v.location}
                              </span>
                            )
                          )}
                        </div>
                        <span className="text-[13px] font-semibold shrink-0 ml-1">{formatCurrency(v.price)}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
              {sidebarList.length === 0 && !dealership.isConfigured && (
                <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">Keine Fahrzeuge</div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
