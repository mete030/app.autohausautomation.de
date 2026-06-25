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
    onChange([...vehicles, { ...base, id: `pkg-neu-${addCounter}`, equipmentSummary: 'Manuell ergänzt' }])
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
          <div key={v.id} className="flex flex-wrap items-end gap-3 rounded-xl border border-border/60 p-3">
            <div className="h-12 w-16 rounded-lg overflow-hidden bg-muted shrink-0 ring-1 ring-border/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={v.imageUrl} alt={v.model} className="w-full h-full object-cover" />
            </div>
            <div className="min-w-[180px] flex-1">
              <Label className="text-[10px] text-muted-foreground">Modell</Label>
              <Select value={v.model} onValueChange={(val) => update(i, { model: val })}>
                <SelectTrigger className="mt-0.5 h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MB_MODEL_NAMES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
              {/* Identifizierte Stammdaten (A4): EZ + Kraftstoff */}
              <p className="mt-1 text-[10px] text-muted-foreground tabular-nums">
                EZ {v.firstRegistration} · {v.fuelType}
              </p>
            </div>
            <div className="w-[110px]">
              <Label className="text-[10px] text-muted-foreground">Kilometer</Label>
              <Input
                type="text"
                inputMode="numeric"
                value={v.mileage.toLocaleString('de-DE')}
                onChange={(e) => update(i, { mileage: Number(e.target.value.replace(/[^0-9]/g, '')) || 0 })}
                className="mt-0.5 h-9 tabular-nums"
              />
            </div>
            <div className="w-[130px]">
              <Label className="text-[10px] text-muted-foreground">Zustand</Label>
              <Select value={v.condition} onValueChange={(val) => update(i, { condition: val as EinkaufCondition })}>
                <SelectTrigger className="mt-0.5 h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CONDITIONS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col items-start gap-1 mb-1">
              <Badge variant="secondary" className="text-[10px] font-normal max-w-[160px] truncate">
                {v.equipmentSummary}
              </Badge>
              {/* A2: erkannte Fahrzeuge sichtbar als „aus Paket identifiziert" labeln */}
              <Badge
                variant="outline"
                className="text-[10px] font-normal text-muted-foreground border-border/60"
              >
                <Layers className="h-3 w-3 mr-1" />
                {v.origin === 'screenshot' ? 'aus Paket-Screenshot (OCR)' : 'aus Paket identifiziert'}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:text-red-500 mb-0.5"
              onClick={() => remove(i)}
              aria-label="Fahrzeug entfernen"
            >
              <X className="h-4 w-4" />
            </Button>
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
