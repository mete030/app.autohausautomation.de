'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  X, Check, RotateCcw, SquareDashed, MapPin, Search, Loader2,
} from 'lucide-react'
import type { LatLng, AxisAlignedBounds } from '@/lib/yard-geometry'
import { boundsDimensionsM, autoGenerateRows, DEFAULT_SPOT_PARAMS } from '@/lib/yard-geometry'

// ─── Nominatim ───────────────────────────────────────────────────────────────

interface NominatimResult {
  place_id: number
  display_name: string
  lat: string
  lon: string
}

function AddressSearch({ onSelect }: { onSelect: (label: string, center: LatLng) => void }) {
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
      } catch { /* network error */ }
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

// ─── Main Panel ──────────────────────────────────────────────────────────────

interface AreaSetupPanelProps {
  /** Whether this is the very first area (show address search step) */
  isFirstArea: boolean
  /** Current step in the setup wizard */
  step: 1 | 2 | 3
  /** Address label (if already set) */
  addressLabel: string
  /** Confirmed bounds from drawing */
  confirmedBounds: AxisAlignedBounds | null
  /** Whether currently in draw mode */
  drawMode: boolean
  /** Whether first corner is set */
  hasFirstCorner: boolean
  /** Area name being configured */
  areaName: string

  onAddressSelect: (label: string, center: LatLng) => void
  onStartDraw: () => void
  onCancelDraw: () => void
  onAreaNameChange: (name: string) => void
  onConfirm: () => void
  onBack: () => void
  onClose: () => void
}

export default function AreaSetupPanel({
  isFirstArea,
  step,
  addressLabel,
  confirmedBounds,
  drawMode,
  hasFirstCorner,
  areaName,
  onAddressSelect,
  onStartDraw,
  onCancelDraw,
  onAreaNameChange,
  onConfirm,
  onBack,
  onClose,
}: AreaSetupPanelProps) {
  const totalSteps = isFirstArea ? 3 : 2
  const displayStep = isFirstArea ? step : step - 1

  // Compute preview info
  let dims = { widthM: 0, heightM: 0, areaM2: 0 }
  let rowCount = 0
  if (confirmedBounds) {
    dims = boundsDimensionsM(confirmedBounds)
    rowCount = autoGenerateRows('preview', confirmedBounds, DEFAULT_SPOT_PARAMS).length
  }

  return (
    <div className="absolute top-3 left-3 z-[1001] w-[calc(100%-1.5rem)] max-w-80 bg-white/96 backdrop-blur-md rounded-xl shadow-2xl border border-white/60">
      {/* Header with step indicators */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-zinc-50/80 rounded-t-xl overflow-hidden">
        <div className="flex items-center gap-2">
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map(n => (
            <div
              key={n}
              className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-colors',
                displayStep === n ? 'bg-zinc-900 text-white' :
                displayStep > n  ? 'bg-emerald-500 text-white' :
                                   'bg-zinc-200 text-zinc-500',
              )}
            >
              {displayStep > n ? <Check className="h-3 w-3" /> : n}
            </div>
          ))}
          <span className="text-xs font-medium text-zinc-600 ml-1">
            {step === 1 && 'Adresse suchen'}
            {step === 2 && 'Bereich zeichnen'}
            {step === 3 && 'Bereich konfigurieren'}
          </span>
        </div>
        <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700 transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="p-4 space-y-3">
        {/* Step 1: Address search (only for first area) */}
        {step === 1 && isFirstArea && (
          <>
            <p className="text-xs text-muted-foreground">
              Gib die Adresse deines Autohauses ein, um die Karte auf dein Gelände auszurichten.
            </p>
            <AddressSearch onSelect={onAddressSelect} />
          </>
        )}

        {/* Step 2: Draw area boundary */}
        {step === 2 && (
          <>
            {addressLabel && (
              <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="font-medium truncate">{addressLabel}</span>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Klicke auf zwei gegenüberliegende Ecken auf der Karte, um einen Bereich abzustecken.
            </p>
            {!drawMode && (
              <Button className="w-full h-9 gap-2 text-sm" onClick={onStartDraw}>
                <SquareDashed className="h-4 w-4" />
                Bereich abmessen
              </Button>
            )}
            {drawMode && (
              <div className="space-y-2">
                <div className={cn(
                  'rounded-lg px-3 py-2.5 text-xs font-medium',
                  hasFirstCorner ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700',
                )}>
                  {hasFirstCorner
                    ? '✓ Erste Ecke gesetzt. Klicke auf die gegenüberliegende Ecke.'
                    : 'Klicke auf die erste Ecke des Bereichs auf der Karte.'}
                </div>
                <Button
                  variant="outline" size="sm"
                  className="w-full h-8 text-xs gap-1.5"
                  onClick={onCancelDraw}
                >
                  <RotateCcw className="h-3 w-3" /> Abbrechen
                </Button>
              </div>
            )}
          </>
        )}

        {/* Step 3: Configure area */}
        {step === 3 && confirmedBounds && (
          <>
            <div className="bg-zinc-50 rounded-xl p-3 space-y-3">
              {/* Area name */}
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 block mb-1.5">
                  Bereichsname
                </label>
                <Input
                  value={areaName}
                  onChange={e => onAreaNameChange(e.target.value)}
                  className="h-8 text-sm font-medium"
                  placeholder="Bereich A"
                />
              </div>

              {/* Dimensions readout */}
              <div className="flex items-center justify-between text-xs border-t pt-2">
                <span className="text-muted-foreground">Fläche</span>
                <span className="font-medium tabular-nums">
                  {Math.round(dims.widthM)} × {Math.round(dims.heightM)} m ({dims.areaM2} m²)
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Auto-Reihen</span>
                <span className="font-medium tabular-nums">{rowCount} Reihen</span>
              </div>

              <p className="text-[11px] text-muted-foreground border-t pt-2">
                Reihen werden automatisch generiert (2,5 m × 5 m Stellplätze, 6 m Fahrspuren). Du kannst sie danach im Bearbeitungsmodus anpassen.
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline" size="sm"
                className="flex-1 h-9 gap-1.5 text-xs"
                onClick={onBack}
              >
                <RotateCcw className="h-3 w-3" /> Neu
              </Button>
              <Button
                size="sm"
                className="flex-1 h-9 gap-1.5 text-xs"
                onClick={onConfirm}
              >
                <Check className="h-3.5 w-3.5" /> Erstellen
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
