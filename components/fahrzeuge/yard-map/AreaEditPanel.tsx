'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { X, Check, Trash2, Plus, RotateCw } from 'lucide-react'
import type { YardArea } from '@/lib/stores/dealership-store'
import type { SpotParams } from '@/lib/yard-geometry'
import { boundsDimensionsM } from '@/lib/yard-geometry'

// ─── Slider Row ──────────────────────────────────────────────────────────────

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

// ─── Main Component ──────────────────────────────────────────────────────────

interface AreaEditPanelProps {
  area: YardArea
  onRenameArea: (name: string) => void
  onUpdateRotation: (deg: number) => void
  onUpdateSpotParams: (params: Partial<SpotParams>) => void
  onRenameRow: (rowId: string, name: string) => void
  onAddRow: () => void
  onRemoveRow: (rowId: string) => void
  onRemoveArea: () => void
  onClose: () => void
}

export default function AreaEditPanel({
  area,
  onRenameArea,
  onUpdateRotation,
  onUpdateSpotParams,
  onRenameRow,
  onAddRow,
  onRemoveRow,
  onRemoveArea,
  onClose,
}: AreaEditPanelProps) {
  const dims = boundsDimensionsM(area.baseBounds)
  const totalSpots = area.rows.reduce((sum, r) => sum + r.spots.length, 0)
  const enabledSpots = area.rows.reduce((sum, r) => sum + r.spots.filter(s => !s.disabled).length, 0)

  return (
    <div className="absolute top-3 left-3 z-[1001] w-[calc(100%-1.5rem)] max-w-72 bg-white/96 backdrop-blur-md rounded-xl shadow-2xl border border-white/60">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-zinc-50/80 rounded-t-xl overflow-hidden">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full shrink-0" style={{ background: area.color }} />
          <span className="text-xs font-semibold text-zinc-700">Bereich bearbeiten</span>
        </div>
        <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700 transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="p-4 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
        {/* Area name */}
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 block mb-1.5">
            Name
          </label>
          <Input
            value={area.name}
            onChange={e => onRenameArea(e.target.value)}
            className="h-8 text-sm font-medium"
          />
        </div>

        {/* Dimensions readout */}
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span>{Math.round(dims.widthM)} × {Math.round(dims.heightM)} m</span>
          <span>{enabledSpots} / {totalSpots} Plätze</span>
        </div>

        {/* Rotation */}
        <div className="border-t pt-3 space-y-2">
          <div className="flex items-center gap-1.5">
            <RotateCw className="h-3 w-3 text-zinc-400" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Rotation</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0} max={360} step={1}
              value={area.rotationDeg}
              onChange={e => onUpdateRotation(parseFloat(e.target.value))}
              className="flex-1 h-1.5 accent-blue-500 cursor-pointer"
            />
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={Math.round(area.rotationDeg)}
                onChange={e => onUpdateRotation(Math.max(0, Math.min(360, parseInt(e.target.value) || 0)))}
                className="w-16 h-7 text-xs text-center font-semibold tabular-nums"
                min={0} max={360}
              />
              <span className="text-xs text-zinc-400">°</span>
            </div>
          </div>
        </div>

        {/* Spot dimension sliders */}
        <div className="border-t pt-3 space-y-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Stellplatz-Maße</p>
          <SliderRow
            label="Breite" value={area.spotParams.spotW}
            min={1.8} max={4.0} step={0.1} unit="m"
            onChange={v => onUpdateSpotParams({ spotW: v })}
          />
          <SliderRow
            label="Tiefe" value={area.spotParams.spotD}
            min={3.5} max={7.0} step={0.1} unit="m"
            onChange={v => onUpdateSpotParams({ spotD: v })}
          />
          <SliderRow
            label="Fahrspurbreite" value={area.spotParams.lane}
            min={4.0} max={9.0} step={0.1} unit="m"
            onChange={v => onUpdateSpotParams({ lane: v })}
          />
        </div>

        {/* Row list */}
        <div className="border-t pt-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
              Reihen ({area.rows.length})
            </p>
            <button
              onClick={onAddRow}
              className="flex items-center gap-1 text-[10px] font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              <Plus className="h-3 w-3" /> Hinzufügen
            </button>
          </div>
          <div className="space-y-1.5 max-h-44 overflow-y-auto">
            {area.rows.map(row => (
              <div
                key={row.id}
                className="flex items-center gap-2 px-2.5 py-1.5 bg-zinc-50 rounded-lg group"
              >
                <Input
                  value={row.name}
                  onChange={e => onRenameRow(row.id, e.target.value)}
                  className="flex-1 h-6 text-[11px] font-medium border-0 bg-transparent px-0 focus-visible:ring-0"
                />
                <span className="text-[10px] text-zinc-400 tabular-nums shrink-0">
                  {row.spots.filter(s => !s.disabled).length} Plätze
                </span>
                <button
                  onClick={() => onRemoveRow(row.id)}
                  className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500 transition-all"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
            {area.rows.length === 0 && (
              <p className="text-[11px] text-zinc-400 text-center py-2">
                Keine Reihen vorhanden
              </p>
            )}
          </div>
        </div>

        {/* Tip */}
        <div className="border-t pt-3 flex gap-2 items-start">
          <div className="text-[18px] leading-none mt-0.5">💡</div>
          <p className="text-[11px] text-zinc-500 leading-snug">
            Ziehe die <span className="font-semibold text-zinc-700">Eckpunkte</span> zum Skalieren und den <span className="font-semibold text-zinc-700">Rotations-Griff</span> zum Drehen. Klicke auf Spots zum De-/Aktivieren.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline" size="sm"
            className="h-8 text-xs gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={onRemoveArea}
          >
            <Trash2 className="h-3 w-3" /> Löschen
          </Button>
          <Button size="sm" className="flex-1 h-8 gap-1.5 text-xs" onClick={onClose}>
            <Check className="h-3.5 w-3.5" /> Fertig
          </Button>
        </div>
      </div>
    </div>
  )
}
