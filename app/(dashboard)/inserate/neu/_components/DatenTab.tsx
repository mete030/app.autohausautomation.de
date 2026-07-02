'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  mercedesListingCreationVinMock as VIN_MOCK,
  mercedesInventoryListings,
} from '@/lib/mercedes-inventory'
import type { ListingDataSheet } from '@/lib/types'
import { CheckCircle2 } from 'lucide-react'
import { TitleField } from './TitleField'
import { VehicleDataForm } from './VehicleDataForm'
import { ConditionSection } from './ConditionSection'
import { DescriptionEditor } from './DescriptionEditor'
import { EquipmentToggles } from './EquipmentToggles'
import { KiAssistentPanel } from './KiAssistentPanel'

const nf = new Intl.NumberFormat('de-DE')

// The finished GLC listing (Entwurf) — the create form is prefilled from the
// exact same data sheet the detail page renders, so every field a user sees on a
// completed ad is visible & editable here too.
const GLC_LISTING = mercedesInventoryListings.find((l) => l.id === 'l3')

/** Map a finished data sheet → VehicleDataForm field values (all strings). */
function datasheetToPrefill(sheet: ListingDataSheet): Record<string, string> {
  const d = sheet.fahrzeugdaten
  return {
    fahrzeugzustand: d.fahrzeugzustand,
    kategorie: d.kategorie,
    erstzulassung: d.erstzulassung,
    kilometerstand: nf.format(d.kilometerstand),
    huBis: d.huBis ?? '',
    vorbesitzer: String(d.vorbesitzer),
    fahrzeugnummer: d.fahrzeugnummer ?? '',
    tueren: String(d.tueren),
    sitze: String(d.sitze),
    aussenfarbe: d.aussenfarbe,
    innenausstattung: d.innenausstattung,
    kraftstoff: d.kraftstoff,
    hubraum: d.hubraum ? nf.format(d.hubraum) : '',
    leistungPS: String(d.leistungPS),
    leistungKW: String(d.leistungKW),
    // Normalize the type union value 'Schaltung' → the Select's option label.
    getriebe: d.getriebe === 'Schaltung' ? 'Schaltgetriebe' : d.getriebe,
    antrieb: d.antrieb,
    schadstoffklasse: d.schadstoffklasse ?? '',
    umweltplakette: d.umweltplakette ?? '',
    verbrauchKombiniert: d.verbrauchKombiniert != null ? String(d.verbrauchKombiniert).replace('.', ',') : '',
    verbrauchEinheit: d.verbrauchEinheit ?? '',
    co2Emission: d.co2Emission != null ? String(d.co2Emission) : '',
    energieeffizienzklasse: d.energieeffizienzklasse ?? '',
    elektroReichweite: d.elektroReichweite != null ? String(d.elektroReichweite) : '',
    batteriekapazitaet: d.batteriekapazitaet != null ? String(d.batteriekapazitaet).replace('.', ',') : '',
    leergewicht: d.leergewicht ? nf.format(d.leergewicht) : '',
    anhaengelastGebremst: d.anhaengelastGebremst ? nf.format(d.anhaengelastGebremst) : '',
  }
}

function datasheetToCondition(sheet: ListingDataSheet) {
  return {
    unfallfrei: sheet.schaeden.unfallfrei,
    nichtraucher: sheet.schaeden.nichtraucher,
    scheckheftgepflegt: sheet.schaeden.scheckheftgepflegt,
    schaeden: sheet.schaeden.notes ?? [],
    hinweise: sheet.zusatzinfo ?? [],
  }
}

/**
 * The "Fahrzeugdaten" tab. Rendered only once a vehicle is identified (VIN found
 * or manual mode). VIN mode prefills every field from the finished GLC data
 * sheet; manual mode starts empty (same fields, editable). VIN identification +
 * the mode switcher live in the parent page, above the tabs.
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
  const isVin = mode === 'vin' && !!vinData
  const sheet = GLC_LISTING?.dataSheet

  const prefill = isVin && sheet ? datasheetToPrefill(sheet) : undefined
  const conditionPrefill = isVin && sheet ? datasheetToCondition(sheet) : undefined

  const titlePrefix = isVin ? 'Mercedes-Benz GLC 300 4MATIC' : 'Mercedes-Benz'
  const titleZusatz = isVin ? 'AMG Line · Night-Paket · Pano · Burmester' : ''
  const priceValue = fromEinkauf?.suggestedPrice
    ? Number(fromEinkauf.suggestedPrice).toLocaleString('de-DE')
    : isVin
    ? vinData!.price
    : ''

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
      {/* ─── Left column ─────────────────────────────────────────────────── */}
      <div className="space-y-5 lg:col-span-3">

        {/* VIN result banner */}
        {isVin && (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
            <span className="text-sm font-medium text-emerald-600">
              Fahrzeug gefunden: {vinData!.make} {vinData!.model}
            </span>
            <button
              onClick={onResetVin}
              className="ml-auto text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              Neue Abfrage
            </button>
          </div>
        )}

        {/* Titel & Kopfzeile */}
        <TitleField
          prefix={titlePrefix}
          defaultZusatz={titleZusatz}
          suggestion="AMG Line Night-Paket Pano Burmester 360°"
        />

        {/* Fahrzeugdaten (full, editable) */}
        <VehicleDataForm prefill={prefill} prefilled={isVin} />

        {/* Verkaufspreis */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Verkaufspreis festlegen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">€</span>
                <Input className="pl-7" defaultValue={priceValue} placeholder="52.900" aria-label="Verkaufspreis in Euro" />
              </div>
              <span className="whitespace-nowrap text-xs text-muted-foreground">
                {fromEinkauf?.suggestedPrice ? 'Aus Einkauf-Analyse übernommen' : 'Marktpreis ~€ 54.800'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Beschreibung + Ausstattung */}
        <DescriptionEditor />
        <EquipmentToggles />

        {/* Zustand & Hinweise */}
        <ConditionSection prefill={conditionPrefill} />
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
