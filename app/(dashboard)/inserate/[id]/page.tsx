'use client'

import { use, useState } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { useListingStore } from '@/lib/stores/listing-store'
import { mercedesMedia } from '@/lib/mercedes-inventory'
import { formatCurrency } from '@/lib/utils'
import { priceCategoryConfig } from '@/lib/constants'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft, Eye, MessageSquare, Star, ExternalLink, Upload, Loader2,
  CheckCircle2, Send, Gauge, Calendar, Fuel, Cog, Settings2,
  ShieldCheck, Info, AlertTriangle, Cigarette, Wrench, FileCheck,
} from 'lucide-react'
import type { Listing, ListingDataSheet, ListingStatus } from '@/lib/types'

// ─── Platform Brand Icons (shared with neu/page.tsx) ─────────────────────────

const MobileDeIcon = ({ size = 40 }: { size?: number }) => (
  <div className="rounded-2xl flex items-center justify-center shrink-0" style={{ width: size, height: size, background: '#FF6600' }}>
    <svg viewBox="0 0 24 24" style={{ width: size * 0.58, height: size * 0.58 }} fill="white">
      <path d="M18.92 6.01L15 2H9L5.08 6.01C4.4 6.73 4 7.7 4 8.75V19c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8.75c0-1.05-.4-2.02-1.08-2.74zM12 17.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 12.5 12 12.5s2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5zM9.5 7l1.5-3h2l1.5 3h-5z" />
    </svg>
  </div>
)

const AutoScout24Icon = ({ size = 40 }: { size?: number }) => (
  <div className="rounded-2xl flex items-center justify-center shrink-0" style={{ width: size, height: size, background: '#003F87' }}>
    <svg viewBox="0 0 24 24" style={{ width: size * 0.58, height: size * 0.58 }} fill="none">
      <circle cx="10.5" cy="10" r="6" stroke="white" strokeWidth="2" />
      <line x1="15" y1="14.5" x2="21" y2="20.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M7.5 10.5h6M8.5 8.5l.9-1.5h2.2l.9 1.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9.2" cy="11.8" r="0.9" fill="white" />
      <circle cx="12.8" cy="11.8" r="0.9" fill="white" />
    </svg>
  </div>
)

const TruckScout24Icon = ({ size = 40 }: { size?: number }) => (
  <div className="rounded-2xl flex items-center justify-center shrink-0" style={{ width: size, height: size, background: '#009C3B' }}>
    <svg viewBox="0 0 24 24" style={{ width: size * 0.58, height: size * 0.58 }} fill="white">
      <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9 1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
    </svg>
  </div>
)

// ─── Constants ────────────────────────────────────────────────────────────────

const EXPORT_PLATFORMS = [
  {
    id: 'mobile_de',
    name: 'mobile.de',
    description: 'Größter deutscher Automarkt',
    icon: <MobileDeIcon size={44} />,
    borderColor: 'border-orange-200 dark:border-orange-800',
    bgColor: 'bg-orange-50 dark:bg-orange-950/30',
    btnStyle: { background: '#FF6600' } as React.CSSProperties,
    viewUrl: 'https://www.mobile.de',
  },
  {
    id: 'autoscout24',
    name: 'AutoScout24',
    description: 'Europäisches Automarktportal',
    icon: <AutoScout24Icon size={44} />,
    borderColor: 'border-blue-200 dark:border-blue-900',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    btnStyle: { background: '#003F87' } as React.CSSProperties,
    viewUrl: 'https://www.autoscout24.de',
  },
  {
    id: 'truckscout24',
    name: 'TruckScout24',
    description: 'Nutzfahrzeuge & Transporter',
    icon: <TruckScout24Icon size={44} />,
    borderColor: 'border-emerald-200 dark:border-emerald-800',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    btnStyle: { background: '#009C3B' } as React.CSSProperties,
    viewUrl: 'https://www.truckscout24.de',
  },
]

const statusLabels: Record<ListingStatus, string> = {
  entwurf: 'Entwurf',
  live: 'Live',
  archiviert: 'Archiviert',
}

const statusColors: Record<ListingStatus, string> = {
  entwurf: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  live: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  archiviert: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
}

const FALLBACK_PHOTOS = [mercedesMedia.glcExterior]

type ExportStatus = 'idle' | 'exporting' | 'done'

// ─── Datenblatt helpers ──────────────────────────────────────────────────────

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

function DatasheetSection({ sheet, listing }: { sheet: ListingDataSheet; listing: Listing }) {
  const fahrzeugRows = buildFahrzeugdatenRows(sheet.fahrzeugdaten)
  const { unfallfrei, nichtraucher, scheckheftgepflegt, notes } = sheet.schaeden
  const hasSchaedenNotes = notes && notes.length > 0

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <FileCheck className="h-5 w-5 text-primary" />
          Datenblatt
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
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
      </CardContent>
    </Card>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function InseratDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const listings = useListingStore((state) => state.listings)
  const { id } = use(params)
  const listing = listings.find(l => l.id === id)

  const [activePhoto, setActivePhoto] = useState(0)
  const [showExport, setShowExport] = useState(false)
  const [exportStatus, setExportStatus] = useState<Record<string, ExportStatus>>({
    mobile_de: 'idle', autoscout24: 'idle', truckscout24: 'idle',
  })

  if (!listing) return notFound()

  const photos = listing.images.length > 0 ? listing.images : FALLBACK_PHOTOS
  const priceConfig = priceCategoryConfig[listing.priceCategory]
  const exportedCount = Object.values(exportStatus).filter(s => s === 'done').length
  const alreadyExported = exportedCount > 0

  const handleExport = (platformId: string) => {
    setExportStatus(prev => ({ ...prev, [platformId]: 'exporting' }))
    setTimeout(() => {
      setExportStatus(prev => ({ ...prev, [platformId]: 'done' }))
    }, 2200)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/inserate">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold">Inserat</h1>
            <p className="text-sm text-muted-foreground truncate">{listing.title}</p>
          </div>
        </div>
        <Badge className={`self-start sm:ml-auto sm:self-auto ${statusColors[listing.status]}`} variant="secondary">
          {statusLabels[listing.status]}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ─── Left: Images + Description ─────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">
          <Card className="overflow-hidden">
            {/* Hero image */}
            <div className="aspect-video bg-muted relative overflow-hidden">
              <img
                key={activePhoto}
                src={photos[activePhoto]}
                alt={listing.title}
                className="w-full h-full object-cover transition-opacity duration-300"
              />
              <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full backdrop-blur-sm">
                {activePhoto + 1} / {photos.length}
              </div>
            </div>

            {/* Thumbnail strip */}
            {photos.length > 1 && (
              <div className="flex gap-2 p-3 bg-muted/30 overflow-x-auto">
                {photos.map((photo, i) => (
                  <button
                    key={i}
                    onClick={() => setActivePhoto(i)}
                    className={`shrink-0 w-16 h-11 rounded-md overflow-hidden border-2 transition-all ${
                      i === activePhoto
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={photo} alt={`Bild ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            <CardContent className="p-4 space-y-4 sm:p-6">
              <h2 className="text-xl font-bold leading-snug">{listing.title}</h2>
              {listing.description ? (
                <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                  {listing.description}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground italic">Keine Beschreibung vorhanden</p>
              )}
            </CardContent>
          </Card>

          {listing.dataSheet && <DatasheetSection sheet={listing.dataSheet} listing={listing} />}
        </div>

        {/* ─── Right: Info + Actions ───────────────────────────────────── */}
        <div className="space-y-5">
          {/* Stats */}
          <Card>
            <CardContent className="pt-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Preis</span>
                <span className="text-2xl font-bold">{formatCurrency(listing.price)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Preiskategorie</span>
                <Badge variant="outline" className={`${priceConfig.bg} ${priceConfig.color} border-0`}>
                  {priceConfig.label}
                </Badge>
              </div>
              {listing.aiGenerated && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">KI-Konfidenz</span>
                  <span className="flex items-center gap-1 text-sm">
                    <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                    {listing.aiConfidence}%
                  </span>
                </div>
              )}
              {listing.status === 'live' && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Aufrufe</span>
                    <span className="flex items-center gap-1.5 text-sm">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      {listing.views}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Anfragen</span>
                    <span className="flex items-center gap-1.5 text-sm">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      {listing.inquiries}
                    </span>
                  </div>
                </>
              )}

              {/* Platform status */}
              <Separator />
              <div className="space-y-2">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Plattformen</span>
                {EXPORT_PLATFORMS.map(p => {
                  const status = exportStatus[p.id]
                  // listing already on this platform?
                  const alreadyLive = listing.platform.some(pl =>
                    pl.toLowerCase().replace(/\s/g, '').includes(p.id.replace('_', ''))
                  )
                  const isLive = status === 'done' || alreadyLive
                  return (
                    <div key={p.id} className="flex items-center gap-2">
                      <div style={{ width: 20, height: 20 }}>
                        <div
                          className={`rounded-md w-5 h-5 flex items-center justify-center ${!isLive ? 'bg-muted' : ''}`}
                          style={{ background: isLive ? (p.id === 'mobile_de' ? '#FF6600' : p.id === 'autoscout24' ? '#003F87' : '#009C3B') : undefined }}
                        >
                          {isLive ? (
                            <CheckCircle2 className="h-3 w-3 text-white" />
                          ) : (
                            <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                          )}
                        </div>
                      </div>
                      <span className={`text-xs ${isLive ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                        {p.name}
                      </span>
                      {isLive && (
                        <Badge className="ml-auto text-[10px] px-1.5 py-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0">
                          Live
                        </Badge>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardContent className="pt-5 space-y-2">
              {/* Primary export/publish CTA */}
              <Button
                className="w-full"
                onClick={() => setShowExport(true)}
              >
                <Upload className="h-4 w-4 mr-2" />
                {alreadyExported
                  ? 'Weitere Plattformen'
                  : listing.status === 'entwurf'
                  ? 'Veröffentlichen'
                  : 'Auf Plattformen exportieren'
                }
              </Button>

              {/* Quick platform links if already live */}
              {listing.status === 'live' && (
                <Button variant="outline" className="w-full" asChild>
                  <a href="https://www.mobile.de" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Auf mobile.de ansehen
                  </a>
                </Button>
              )}

              <Button variant="outline" className="w-full">Bearbeiten</Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ─── Export Dialog ──────────────────────────────────────────────────── */}
      <Dialog open={showExport} onOpenChange={setShowExport}>
        <DialogContent className="max-w-[calc(100vw-1rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              Inserat exportieren
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground -mt-1">
            Veröffentlichen Sie das Inserat auf Ihren Wunschplattformen.
          </p>

          <div className="space-y-3 mt-1">
            {EXPORT_PLATFORMS.map(platform => {
              const status = exportStatus[platform.id]
              const alreadyLive = listing.platform.some(pl =>
                pl.toLowerCase().replace(/\s/g, '').includes(platform.id.replace('_', ''))
              )
              const isDone = status === 'done' || alreadyLive

              return (
                <div
                  key={platform.id}
                  className={`flex flex-col items-start gap-3 p-3.5 rounded-xl border sm:flex-row sm:items-center ${platform.bgColor} ${platform.borderColor}`}
                >
                  {platform.icon}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground">{platform.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{platform.description}</p>
                  </div>
                  <Button
                    size="sm"
                    style={!isDone && status !== 'exporting' ? platform.btnStyle : undefined}
                    className={`w-full text-white border-0 hover:opacity-90 sm:w-auto sm:shrink-0 ${
                      isDone ? 'bg-emerald-600 hover:bg-emerald-600' : ''
                    }`}
                    onClick={() => !isDone && handleExport(platform.id)}
                    disabled={status === 'exporting' || isDone}
                  >
                    {status === 'exporting'
                      ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Exportiere</>
                      : isDone
                      ? <><CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />Live</>
                      : <><ExternalLink className="h-3.5 w-3.5 mr-1.5" />Exportieren</>
                    }
                  </Button>
                </div>
              )
            })}
          </div>

          {exportedCount > 0 && (
            <div className="mt-1 p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              {exportedCount} von {EXPORT_PLATFORMS.length} Plattformen erfolgreich exportiert
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

