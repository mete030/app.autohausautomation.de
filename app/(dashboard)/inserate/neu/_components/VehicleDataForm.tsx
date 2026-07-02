'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { FileText, Sparkles, ChevronRight } from 'lucide-react'

// Primary sections stay open; the more technical groups collapse by default so
// the form reads as a short overview instead of a wall of ~27 inputs.
const DEFAULT_OPEN = new Set(['Grunddaten', 'Farbe & Interieur', 'Motor & Antrieb'])

// ─── Field schema ──────────────────────────────────────────────────────────────
// One source of truth for every Fahrzeugdaten field a finished listing shows, so
// the create form can never silently drop a field the detail page renders.

type FieldType = 'text' | 'select'

interface FieldSpec {
  id: string
  label: string
  type: FieldType
  options?: string[]
  suffix?: string
  placeholder?: string
}

interface Section {
  title: string
  fields: FieldSpec[]
}

export const vehicleDataSections: Section[] = [
  {
    title: 'Grunddaten',
    fields: [
      { id: 'fahrzeugzustand', label: 'Fahrzeugzustand', type: 'select', options: ['Neuwagen', 'Jahreswagen', 'Gebraucht', 'Vorführfahrzeug', 'Oldtimer'] },
      { id: 'kategorie', label: 'Kategorie', type: 'select', options: ['Limousine', 'Kombi', 'SUV / Geländewagen', 'Coupé', 'Cabrio / Roadster', 'Van / Kleinbus', 'Kleinwagen', 'Sportwagen'] },
      { id: 'erstzulassung', label: 'Erstzulassung', type: 'text', placeholder: 'MM/JJJJ' },
      { id: 'kilometerstand', label: 'Kilometerstand', type: 'text', suffix: 'km', placeholder: '19.800' },
      { id: 'huBis', label: 'HU bis', type: 'text', placeholder: 'MM/JJJJ' },
      { id: 'vorbesitzer', label: 'Vorbesitzer', type: 'text', placeholder: '1' },
      { id: 'fahrzeugnummer', label: 'Fahrzeugnummer (intern)', type: 'text', placeholder: 'WH-GLC-2309' },
      { id: 'tueren', label: 'Türen', type: 'select', options: ['2', '3', '4', '5'] },
      { id: 'sitze', label: 'Sitzplätze', type: 'select', options: ['2', '3', '4', '5', '6', '7', '8', '9'] },
    ],
  },
  {
    title: 'Farbe & Interieur',
    fields: [
      { id: 'aussenfarbe', label: 'Außenfarbe', type: 'text', placeholder: 'Spektralblau metallic' },
      { id: 'innenausstattung', label: 'Innenausstattung', type: 'text', placeholder: 'Leder ARTICO/MICROCUT schwarz' },
    ],
  },
  {
    title: 'Motor & Antrieb',
    fields: [
      { id: 'kraftstoff', label: 'Kraftstoff', type: 'select', options: ['Benzin', 'Diesel', 'Elektro', 'Hybrid (Benzin/Elektro)', 'Plug-in-Hybrid', 'Autogas (LPG)', 'Erdgas (CNG)'] },
      { id: 'hubraum', label: 'Hubraum', type: 'text', suffix: 'ccm', placeholder: '1.999' },
      { id: 'leistungPS', label: 'Leistung', type: 'text', suffix: 'PS', placeholder: '258' },
      { id: 'leistungKW', label: 'Leistung', type: 'text', suffix: 'kW', placeholder: '190' },
      { id: 'getriebe', label: 'Getriebe', type: 'select', options: ['Automatik', 'Schaltgetriebe', 'Halbautomatik'] },
      { id: 'antrieb', label: 'Antrieb', type: 'select', options: ['Allrad (4MATIC)', 'Frontantrieb', 'Heckantrieb'] },
    ],
  },
  {
    title: 'Verbrauch & Umwelt',
    fields: [
      { id: 'schadstoffklasse', label: 'Schadstoffklasse', type: 'text', placeholder: 'Euro 6d' },
      { id: 'umweltplakette', label: 'Umweltplakette', type: 'select', options: ['Grün (4)', 'Gelb (3)', 'Rot (2)', 'Keine'] },
      { id: 'verbrauchKombiniert', label: 'Verbrauch komb.', type: 'text', placeholder: '8,0' },
      { id: 'verbrauchEinheit', label: 'Verbrauch-Einheit', type: 'select', options: ['l/100km', 'kWh/100km'] },
      { id: 'co2Emission', label: 'CO₂-Emission', type: 'text', suffix: 'g/km', placeholder: '181' },
      { id: 'energieeffizienzklasse', label: 'Energieeffizienzklasse', type: 'select', options: ['A+', 'A', 'B', 'C', 'D', 'E', 'F', 'G'] },
    ],
  },
  {
    // Only relevant for electrified vehicles (leave empty otherwise) — shown so
    // create mode never lacks a field a finished EV/Hybrid listing renders.
    title: 'Elektro & Batterie',
    fields: [
      { id: 'elektroReichweite', label: 'Elektrische Reichweite', type: 'text', suffix: 'km · WLTP', placeholder: '638' },
      { id: 'batteriekapazitaet', label: 'Batteriekapazität', type: 'text', suffix: 'kWh', placeholder: '90,6' },
    ],
  },
  {
    title: 'Gewicht & Anhängelast',
    fields: [
      { id: 'leergewicht', label: 'Leergewicht', type: 'text', suffix: 'kg', placeholder: '2.055' },
      { id: 'anhaengelastGebremst', label: 'Anhängelast (gebremst)', type: 'text', suffix: 'kg', placeholder: '2.400' },
    ],
  },
]

const ALL_FIELD_IDS = vehicleDataSections.flatMap((s) => s.fields.map((f) => f.id))

// ─── Component ──────────────────────────────────────────────────────────────────

export function VehicleDataForm({
  prefill,
  prefilled = false,
}: {
  /** field-id → value; from the VIN/DAT lookup. Empty in manual mode. */
  prefill?: Record<string, string>
  /** true when values arrived from a VIN/DAT lookup (shows the "übernommen" hint) */
  prefilled?: boolean
}) {
  const initial = useMemo(() => {
    const base: Record<string, string> = {}
    for (const id of ALL_FIELD_IDS) base[id] = prefill?.[id] ?? ''
    return base
  }, [prefill])

  const [values, setValues] = useState<Record<string, string>>(initial)
  const [openSections, setOpenSections] = useState<Set<string>>(() => new Set(DEFAULT_OPEN))

  const setField = (id: string, v: string) => setValues((prev) => ({ ...prev, [id]: v }))
  const toggleSection = (title: string) =>
    setOpenSections((prev) => {
      const next = new Set(prev)
      if (next.has(title)) next.delete(title)
      else next.add(title)
      return next
    })

  const filledCount = ALL_FIELD_IDS.filter((id) => values[id]?.trim()).length
  const total = ALL_FIELD_IDS.length

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Fahrzeugdaten
          </span>
          <span className="flex items-center gap-2">
            {prefilled && (
              <Badge className="border-0 bg-emerald-50 text-[10px] font-normal text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                <Sparkles className="mr-1 h-2.5 w-2.5" />
                Aus DAT/VIN übernommen
              </Badge>
            )}
            <Badge variant="secondary" className="text-[10px] font-normal tabular-nums">
              {filledCount}/{total} gefüllt
            </Badge>
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-0">
        {vehicleDataSections.map((section) => {
          const open = openSections.has(section.title)
          const sectionTotal = section.fields.length
          const sectionFilled = section.fields.filter((f) => values[f.id]?.trim()).length
          return (
            <section key={section.title} className="border-t border-border/50 py-3 first:border-0 first:pt-0">
              <button
                type="button"
                onClick={() => toggleSection(section.title)}
                aria-expanded={open}
                className="group flex w-full items-center gap-2"
              >
                <ChevronRight
                  className={cn(
                    'h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-hover:text-foreground',
                    open && 'rotate-90',
                  )}
                />
                <h4 className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground group-hover:text-foreground">
                  {section.title}
                </h4>
                <span className="ml-auto rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-normal tabular-nums text-muted-foreground">
                  {sectionFilled}/{sectionTotal}
                </span>
              </button>

              {open && (
                <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-in fade-in slide-in-from-top-1">
                  {section.fields.map((field) => (
                    <div key={field.id} className="space-y-1.5">
                      <Label htmlFor={`vf-${field.id}`} className="text-xs text-muted-foreground">
                        {field.label}
                        {field.suffix && <span className="ml-1 text-muted-foreground/60">({field.suffix})</span>}
                      </Label>
                      {field.type === 'select' ? (
                        <Select value={values[field.id]} onValueChange={(v) => setField(field.id, v)}>
                          <SelectTrigger id={`vf-${field.id}`} className={cn(!values[field.id] && 'text-muted-foreground')}>
                            <SelectValue placeholder="Auswählen" />
                          </SelectTrigger>
                          <SelectContent>
                            {field.options!.map((opt) => (
                              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          id={`vf-${field.id}`}
                          value={values[field.id]}
                          onChange={(e) => setField(field.id, e.target.value)}
                          placeholder={field.placeholder}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )
        })}
      </CardContent>
    </Card>
  )
}
