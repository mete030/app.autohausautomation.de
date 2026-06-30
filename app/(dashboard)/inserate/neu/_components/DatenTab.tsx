'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { mercedesListingCreationVinMock as VIN_MOCK } from '@/lib/mercedes-inventory'
import { CheckCircle2 } from 'lucide-react'
import { DescriptionEditor } from './DescriptionEditor'
import { EquipmentToggles } from './EquipmentToggles'
import { KiAssistentPanel } from './KiAssistentPanel'

/**
 * The "Fahrzeugdaten" tab. Rendered only once a vehicle is identified (VIN found
 * or manual mode), so it always has content. VIN identification + the mode
 * switcher live in the parent page, above the tabs.
 */
export function DatenTab({
  mode,
  vinData,
  fromEinkauf,
  onResetVin,
}: {
  mode: 'vin' | 'manual'
  vinData: typeof VIN_MOCK | null
  fromEinkauf: { suggestedPrice?: string; mileage?: number } | null
  onResetVin: () => void
}) {
  const [formData, setFormData] = useState({
    make: '', model: '', year: '', mileage: '', power: '', displacement: '',
    fuelType: '', transmission: '', color: '', doors: '', seats: '',
    firstRegistration: '', hu: '', licensePlate: '', price: '',
  })

  const setField = (key: keyof typeof formData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setFormData(prev => ({ ...prev, [key]: e.target.value }))

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">

      {/* ─── Left column ─────────────────────────────────────────────────── */}
      <div className="space-y-5 lg:col-span-3">

        {/* ─── VIN results ───────────────────────────────────────────────── */}
        {mode === 'vin' && vinData && (
          <>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
              <span className="text-sm font-medium text-emerald-600">
                Fahrzeug gefunden: {vinData.make} {vinData.model}
              </span>
              <button
                onClick={onResetVin}
                className="ml-auto text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
              >
                Neue Abfrage
              </button>
            </div>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Fahrzeugdaten</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-x-8 gap-y-0 text-sm sm:grid-cols-2">
                  {[
                    ['Marke', vinData.make], ['Modell', vinData.model],
                    ['Baujahr', vinData.year], ['Erstzulassung', vinData.firstRegistration],
                    ['Kilometerstand', `${vinData.mileage} km`], ['HU bis', vinData.hu],
                    ['Kraftstoff', 'Benzin'], ['Getriebe', 'Automatik (9G-TRONIC)'],
                    ['Leistung', `${vinData.power} PS`], ['Hubraum', `${vinData.displacement} ccm`],
                    ['Farbe', vinData.color], ['Türen / Sitze', `${vinData.doors} / ${vinData.seats}`],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between border-b border-border/40 py-2 last:border-0">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="text-right font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Verkaufspreis festlegen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">€</span>
                    <Input
                      className="pl-7"
                      defaultValue={
                        fromEinkauf?.suggestedPrice
                          ? Number(fromEinkauf.suggestedPrice).toLocaleString('de-DE')
                          : vinData.price
                      }
                    />
                  </div>
                  <span className="whitespace-nowrap text-xs text-muted-foreground">
                    {fromEinkauf?.suggestedPrice ? 'Aus Einkauf-Analyse übernommen' : 'Marktpreis ~€ 54.800'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* ─── Manual form ───────────────────────────────────────────────── */}
        {mode === 'manual' && (
          <>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Grunddaten</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Marke</Label>
                    <Input placeholder="z.B. Mercedes-Benz" value={formData.make} onChange={setField('make')} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Modell</Label>
                    <Input placeholder="z.B. GLC 300 4MATIC AMG Line" value={formData.model} onChange={setField('model')} />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Baujahr</Label>
                    <Input placeholder="2021" value={formData.year} onChange={setField('year')} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Erstzulassung</Label>
                    <Input placeholder="03.2021" value={formData.firstRegistration} onChange={setField('firstRegistration')} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">HU bis</Label>
                    <Input placeholder="03.2025" value={formData.hu} onChange={setField('hu')} />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Kilometerstand</Label>
                    <Input placeholder="62.400" value={formData.mileage} onChange={setField('mileage')} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Kennzeichen</Label>
                    <Input placeholder="KA-WH 1234" value={formData.licensePlate} onChange={setField('licensePlate')} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Verkaufspreis (€)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">€</span>
                    <Input className="pl-7" placeholder="38.900" value={formData.price} onChange={setField('price')} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Technische Daten</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Kraftstoff</Label>
                    <Select value={formData.fuelType} onValueChange={v => setFormData(prev => ({ ...prev, fuelType: v }))}>
                      <SelectTrigger><SelectValue placeholder="Auswählen" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="benzin">Benzin</SelectItem>
                        <SelectItem value="diesel">Diesel</SelectItem>
                        <SelectItem value="elektro">Elektro</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                        <SelectItem value="plug_in_hybrid">Plug-in-Hybrid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Getriebe</Label>
                    <Select value={formData.transmission} onValueChange={v => setFormData(prev => ({ ...prev, transmission: v }))}>
                      <SelectTrigger><SelectValue placeholder="Auswählen" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="automatik">Automatik</SelectItem>
                        <SelectItem value="schaltung">Schaltgetriebe</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Leistung (PS)</Label>
                    <Input placeholder="190" value={formData.power} onChange={setField('power')} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Hubraum (ccm)</Label>
                    <Input placeholder="1.995" value={formData.displacement} onChange={setField('displacement')} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Farbe</Label>
                    <Input placeholder="Silber Metallic" value={formData.color} onChange={setField('color')} />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Türen</Label>
                    <Select value={formData.doors} onValueChange={v => setFormData(prev => ({ ...prev, doors: v }))}>
                      <SelectTrigger><SelectValue placeholder="Auswählen" /></SelectTrigger>
                      <SelectContent>
                        {['2', '3', '4', '5'].map(d => <SelectItem key={d} value={d}>{d} Türen</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Sitzplätze</Label>
                    <Select value={formData.seats} onValueChange={v => setFormData(prev => ({ ...prev, seats: v }))}>
                      <SelectTrigger><SelectValue placeholder="Auswählen" /></SelectTrigger>
                      <SelectContent>
                        {['2', '4', '5', '6', '7', '8', '9'].map(s => <SelectItem key={s} value={s}>{s} Sitze</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* ─── Beschreibung + Ausstattung (both modes) ───────────────────── */}
        <DescriptionEditor />
        <EquipmentToggles />
      </div>

      {/* ─── Right column: KI-Assistent ──────────────────────────────────── */}
      <div className="space-y-5 lg:col-span-2">
        <div className="lg:sticky lg:top-6">
          <KiAssistentPanel />
        </div>
      </div>
    </div>
  )
}
