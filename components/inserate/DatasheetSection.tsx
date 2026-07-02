'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Calendar, Gauge, Fuel, Cog, Settings2, ShieldCheck, Info,
  AlertTriangle, Cigarette, Wrench, FileCheck, CheckCircle2, Star,
} from 'lucide-react'
import type { Listing, ListingDataSheet } from '@/lib/types'

// ─── Datenblatt helpers (mirrors the mobile.de detail structure) ───────────────

const numberFormat = new Intl.NumberFormat('de-DE')

function formatVerbrauch(d: ListingDataSheet['fahrzeugdaten']) {
  if (d.verbrauchKombiniert == null) return null
  const unit = d.verbrauchEinheit ?? 'l/100km'
  return `${d.verbrauchKombiniert.toString().replace('.', ',')} ${unit} (komb.)`
}

function buildFahrzeugdatenRows(d: ListingDataSheet['fahrzeugdaten']) {
  const rows: { label: string; value: string }[] = [
    { label: 'Fahrzeugzustand', value: d.fahrzeugzustand },
    { label: 'Kategorie', value: d.kategorie },
    { label: 'Erstzulassung', value: d.erstzulassung },
    { label: 'Kilometerstand', value: `${numberFormat.format(d.kilometerstand)} km` },
  ]
  if (d.huBis) rows.push({ label: 'HU bis', value: d.huBis })
  rows.push({ label: 'Vorbesitzer', value: String(d.vorbesitzer) })
  if (d.fahrzeugnummer) rows.push({ label: 'Fahrzeugnummer', value: d.fahrzeugnummer })
  rows.push({ label: 'Türen', value: String(d.tueren) })
  rows.push({ label: 'Sitzplätze', value: String(d.sitze) })
  rows.push({ label: 'Außenfarbe', value: d.aussenfarbe })
  rows.push({ label: 'Innenausstattung', value: d.innenausstattung })
  if (d.schadstoffklasse) rows.push({ label: 'Schadstoffklasse', value: d.schadstoffklasse })
  if (d.umweltplakette) rows.push({ label: 'Umweltplakette', value: d.umweltplakette })
  rows.push({ label: 'Kraftstoff', value: d.kraftstoff })
  if (d.hubraum) rows.push({ label: 'Hubraum', value: `${numberFormat.format(d.hubraum)} ccm` })
  rows.push({ label: 'Leistung', value: `${d.leistungKW} kW (${d.leistungPS} PS)` })
  rows.push({ label: 'Getriebe', value: d.getriebe })
  rows.push({ label: 'Antrieb', value: d.antrieb })
  const verbrauch = formatVerbrauch(d)
  if (verbrauch) rows.push({ label: 'Verbrauch', value: verbrauch })
  if (d.co2Emission != null) rows.push({ label: 'CO₂-Emission', value: `${d.co2Emission} g/km (komb.)` })
  if (d.energieeffizienzklasse) rows.push({ label: 'Energieeffizienzklasse', value: d.energieeffizienzklasse })
  if (d.elektroReichweite) rows.push({ label: 'Elektrische Reichweite', value: `${d.elektroReichweite} km (WLTP)` })
  if (d.batteriekapazitaet) rows.push({ label: 'Batteriekapazität', value: `${d.batteriekapazitaet.toString().replace('.', ',')} kWh` })
  if (d.leergewicht) rows.push({ label: 'Leergewicht', value: `${numberFormat.format(d.leergewicht)} kg` })
  if (d.anhaengelastGebremst) rows.push({ label: 'Anhängelast (gebremst)', value: `${numberFormat.format(d.anhaengelastGebremst)} kg` })
  return rows
}

function FahrzeugdatenIcon({ label }: { label: string }) {
  const map: Record<string, React.ElementType> = {
    'Erstzulassung': Calendar,
    'Kilometerstand': Gauge,
    'Kraftstoff': Fuel,
    'Getriebe': Settings2,
    'Antrieb': Cog,
    'Leistung': Gauge,
  }
  const Icon = map[label] ?? Info
  return <Icon className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
}

function ConditionBadge({
  label,
  active,
  icon: Icon,
}: {
  label: string
  active: boolean
  icon: React.ElementType
}) {
  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${
        active
          ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300'
          : 'bg-muted/40 border-border text-muted-foreground'
      }`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="font-medium">{label}</span>
      {active && <CheckCircle2 className="h-3.5 w-3.5 ml-auto shrink-0" />}
    </div>
  )
}

/** The datasheet sections without a Card wrapper — embeddable in tabs. */
export function DatasheetBody({ sheet, listing }: { sheet: ListingDataSheet; listing: Listing }) {
  const fahrzeugRows = buildFahrzeugdatenRows(sheet.fahrzeugdaten)
  const { unfallfrei, nichtraucher, scheckheftgepflegt, notes } = sheet.schaeden
  const hasSchaedenNotes = notes && notes.length > 0

  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          Fahrzeugdaten
        </h3>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
          {fahrzeugRows.map(row => (
            <div
              key={row.label}
              className="flex items-center justify-between gap-3 py-1.5 border-b border-border/40 last:border-0 sm:[&:nth-last-child(2)]:border-0"
            >
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <FahrzeugdatenIcon label={row.label} />
                {row.label}
              </span>
              <span className="text-sm font-medium text-right">{row.value}</span>
            </div>
          ))}
        </dl>
      </section>

      {sheet.serienausstattung.length > 0 && (
        <>
          <Separator />
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-1.5">
              <Wrench className="h-3.5 w-3.5" />
              Serienausstattung
            </h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
              {sheet.serienausstattung.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-foreground/90">{item}</span>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      {sheet.sonderausstattung.length > 0 && (
        <>
          <Separator />
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5" />
              Sonderausstattung
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {sheet.sonderausstattung.map((item, i) => (
                <Badge key={i} variant="secondary" className="font-normal">
                  {item}
                </Badge>
              ))}
            </div>
          </section>
        </>
      )}

      <Separator />
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5" />
          Zustand
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <ConditionBadge label="Unfallfrei" active={unfallfrei} icon={ShieldCheck} />
          <ConditionBadge label="Nichtraucher" active={nichtraucher} icon={Cigarette} />
          <ConditionBadge label="Scheckheftgepflegt" active={scheckheftgepflegt} icon={FileCheck} />
        </div>
        {hasSchaedenNotes && (
          <ul className="mt-3 space-y-1.5">
            {notes!.map((note, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                <span>{note}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {sheet.zusatzinfo && sheet.zusatzinfo.length > 0 && (
        <>
          <Separator />
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5" />
              Hinweise
            </h3>
            <ul className="space-y-1.5">
              {sheet.zusatzinfo.map((info, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Info className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
                  <span className="text-foreground/90">{info}</span>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      {listing.aiGenerated && (
        <p className="text-[11px] text-muted-foreground italic pt-1">
          Datenblatt automatisch aus Fahrzeugdaten generiert ({listing.aiConfidence}% Konfidenz).
        </p>
      )}
    </div>
  )
}

/** Card-wrapped variant used on the listing detail page. */
export function DatasheetSection({ sheet, listing }: { sheet: ListingDataSheet; listing: Listing }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <FileCheck className="h-5 w-5 text-primary" />
          Datenblatt
        </CardTitle>
      </CardHeader>
      <CardContent>
        <DatasheetBody sheet={sheet} listing={listing} />
      </CardContent>
    </Card>
  )
}
