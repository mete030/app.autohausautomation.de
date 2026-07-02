'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { einkaufPackageVehicles, MB_MODEL_NAMES, type EinkaufPackageVehicle, type EinkaufCondition } from '@/lib/mock-data-paket'
import { EquipmentPicker } from './EquipmentPicker'
import { pkwEquipmentCatalog, pkwExtraFlat } from '@/lib/mock-data-einkauf-equipment'
import { CheckCircle2, Plus, X, Sparkles, Settings2, Layers } from 'lucide-react'
const CONDITIONS: { value: EinkaufCondition; label: string }[] = [
  { value: 'sehr_gut', label: 'Sehr gut' },
  { value: 'gut', label: 'Gut' },
  { value: 'maengel', label: 'Mängel' },
  { value: 'unfallschaden', label: 'Unfallschaden' },
]

const FUEL_TYPES = ['Diesel', 'Benzin', 'Hybrid', 'Plug-in-Hybrid', 'Elektro']

function FieldLabel({ children, missing }: { children: React.ReactNode; missing?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-1">
      <Label className="text-[10px] text-muted-foreground">{children}</Label>
      {missing && (
        <span className="flex items-center gap-1 text-[10px] text-amber-600">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          fehlt
        </span>
      )}
    </div>
  )
}

interface PaketConfirmProps {
  vehicles: EinkaufPackageVehicle[]
  onChange: (vehicles: EinkaufPackageVehicle[]) => void
  onCompute: () => void
}

export function PaketConfirm({ vehicles, onChange, onCompute }: PaketConfirmProps) {
  const [addCounter, setAddCounter] = useState(0)

  const update = (i: number, patch: Partial<EinkaufPackageVehicle>) =>
    onChange(vehicles.map((v, idx) => (idx === i ? { ...v, ...patch } : v)))
  const remove = (i: number) => onChange(vehicles.filter((_, idx) => idx !== i))
  const add = () => {
    const base = einkaufPackageVehicles[0]
    setAddCounter((c) => c + 1)
    onChange([
      ...vehicles,
      {
        ...base,
        id: `pkg-neu-${addCounter}`,
        firstRegistration: '',
        fuelType: '',
        equipment: [],
      },
    ])
  }

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-primary" />
            Zug / Paket — {vehicles.length} Fahrzeuge erkannt, bitte prüfen/korrigieren
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-500" />
            {vehicles.length} im Paket
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {vehicles.map((v, i) => (
          <div key={v.id} className="flex gap-3 rounded-xl border border-border/60 p-2.5">
            {/* Thumbnail füllt die Kartenhöhe (kein Leerraum darunter) */}
            <div className="w-20 shrink-0 self-stretch overflow-hidden rounded-lg bg-muted ring-1 ring-border/60 sm:w-24">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={v.imageUrl} alt={v.model} className="h-full w-full object-cover" />
            </div>

            <div className="min-w-0 flex-1">
              {/* Kopfzeile: Herkunft + Entfernen (schmale Zeile) */}
              <div className="flex items-center justify-between gap-2">
                {/* A2: erkannte Fahrzeuge sichtbar als „aus Paket identifiziert" labeln */}
                <Badge
                  variant="outline"
                  className="text-[10px] font-normal text-muted-foreground border-border/60"
                >
                  <Layers className="h-3 w-3 mr-1" />
                  {v.origin === 'screenshot' ? 'aus Paket-Screenshot (OCR)' : 'aus Paket identifiziert'}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 -mr-0.5 text-muted-foreground hover:text-red-500 shrink-0"
                  onClick={() => remove(i)}
                  aria-label="Fahrzeug entfernen"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Stammdaten — eine füllende Zeile (flex-wrap) statt 12-Spalten-Raster mit Lücke */}
              <div className="mt-1.5 flex flex-wrap items-start gap-x-3 gap-y-2">
                <div className="min-w-[150px] flex-[1.5]">
                  <FieldLabel>Modell</FieldLabel>
                  <Select value={v.model} onValueChange={(val) => update(i, { model: val })}>
                    <SelectTrigger className="mt-0.5 h-9"><SelectValue /></SelectTrigger>
                    <SelectContent position="popper">
                      {MB_MODEL_NAMES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="min-w-[104px] flex-1">
                  <FieldLabel missing={!v.firstRegistration}>Erstzul.</FieldLabel>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={v.firstRegistration}
                    placeholder="MM/JJJJ"
                    onChange={(e) => update(i, { firstRegistration: e.target.value })}
                    className="mt-0.5 h-9 tabular-nums"
                  />
                </div>

                <div className="min-w-[112px] flex-1">
                  <FieldLabel missing={!v.fuelType}>Kraftstoff</FieldLabel>
                  <Select value={v.fuelType} onValueChange={(val) => update(i, { fuelType: val })}>
                    <SelectTrigger className="mt-0.5 h-9"><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent position="popper">
                      {FUEL_TYPES.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="min-w-[96px] flex-1">
                  <FieldLabel>Kilometer</FieldLabel>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={v.mileage.toLocaleString('de-DE')}
                    onChange={(e) => update(i, { mileage: Number(e.target.value.replace(/[^0-9]/g, '')) || 0 })}
                    className="mt-0.5 h-9 tabular-nums"
                  />
                </div>

                <div className="min-w-[104px] flex-1">
                  <FieldLabel>Zustand</FieldLabel>
                  <Select value={v.condition} onValueChange={(val) => update(i, { condition: val as EinkaufCondition })}>
                    <SelectTrigger className="mt-0.5 h-9"><SelectValue /></SelectTrigger>
                    <SelectContent position="popper">
                      {CONDITIONS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Ausstattung — Label inline, Chips fließen daneben (spart eine Zeile) */}
              <div className="mt-2 flex flex-wrap items-start gap-x-2 gap-y-1">
                <span className="pt-1.5 text-[10px] text-muted-foreground shrink-0">Ausstattung</span>
                {v.equipment.length === 0 && (
                  <span className="flex items-center gap-1 pt-1.5 text-[10px] text-amber-600 shrink-0">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    fehlt
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <EquipmentPicker
                    variant="compact"
                    value={v.equipment}
                    onChange={(next) => update(i, { equipment: next })}
                    detected={v.equipment}
                    catalog={pkwEquipmentCatalog}
                    searchPool={pkwExtraFlat}
                    emptyHint="Ausstattung ergänzen…"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={add}
          className="w-full rounded-xl border-2 border-dashed border-border/60 py-3 text-sm text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors flex items-center justify-center gap-1.5"
        >
          <Plus className="h-4 w-4" />
          Fahrzeug hinzufügen
        </button>

        <div className="flex justify-end pt-1">
          <Button
            size="lg"
            onClick={onCompute}
            disabled={vehicles.length === 0}
            className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white px-8"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Paket kalkulieren
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
