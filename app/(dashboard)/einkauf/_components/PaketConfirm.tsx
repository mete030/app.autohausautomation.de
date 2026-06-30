'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { einkaufPackageVehicles, MB_MODEL_NAMES, type EinkaufPackageVehicle, type EinkaufCondition } from '@/lib/mock-data-paket'
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
        equipmentSummary: '',
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
      <CardContent className="space-y-3">
        {vehicles.map((v, i) => (
          <div key={v.id} className="flex flex-col gap-3 rounded-xl border border-border/60 p-3 sm:flex-row sm:items-start">
            <div className="h-16 w-24 sm:h-20 sm:w-28 rounded-lg overflow-hidden bg-muted shrink-0 ring-1 ring-border/60">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={v.imageUrl} alt={v.model} className="w-full h-full object-cover" />
            </div>

            <div className="min-w-0 flex-1 space-y-2">
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
                  className="h-7 w-7 -mr-1 text-muted-foreground hover:text-red-500 shrink-0"
                  onClick={() => remove(i)}
                  aria-label="Fahrzeug entfernen"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-12">
                <div className="col-span-2 sm:col-span-4">
                  <FieldLabel>Modell</FieldLabel>
                  <Select value={v.model} onValueChange={(val) => update(i, { model: val })}>
                    <SelectTrigger className="mt-0.5 h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {MB_MODEL_NAMES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="sm:col-span-4">
                  <FieldLabel missing={!v.firstRegistration}>Erstzulassung</FieldLabel>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={v.firstRegistration}
                    placeholder="MM/JJJJ"
                    onChange={(e) => update(i, { firstRegistration: e.target.value })}
                    className="mt-0.5 h-9 tabular-nums"
                  />
                </div>

                <div className="sm:col-span-4">
                  <FieldLabel missing={!v.fuelType}>Kraftstoff</FieldLabel>
                  <Select value={v.fuelType} onValueChange={(val) => update(i, { fuelType: val })}>
                    <SelectTrigger className="mt-0.5 h-9"><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>
                      {FUEL_TYPES.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="sm:col-span-4">
                  <FieldLabel>Kilometer</FieldLabel>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={v.mileage.toLocaleString('de-DE')}
                    onChange={(e) => update(i, { mileage: Number(e.target.value.replace(/[^0-9]/g, '')) || 0 })}
                    className="mt-0.5 h-9 tabular-nums"
                  />
                </div>

                <div className="sm:col-span-4">
                  <FieldLabel>Zustand</FieldLabel>
                  <Select value={v.condition} onValueChange={(val) => update(i, { condition: val as EinkaufCondition })}>
                    <SelectTrigger className="mt-0.5 h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CONDITIONS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2 sm:col-span-4">
                  <FieldLabel missing={!v.equipmentSummary}>Ausstattung</FieldLabel>
                  <Input
                    type="text"
                    value={v.equipmentSummary}
                    placeholder="Ausstattung ergänzen…"
                    onChange={(e) => update(i, { equipmentSummary: e.target.value })}
                    className="mt-0.5 h-9"
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
