'use client'

import { useState, type JSX } from 'react'
import { Badge } from '@/components/ui/badge'
import { priceCategoryConfig } from '@/lib/constants'
import type { MobileDeComparable } from '@/lib/mock-data-einkauf'
import { formatCurrency, cn } from '@/lib/utils'
import { ChevronDown, ChevronRight, Car, ExternalLink, MapPin, Clock } from 'lucide-react'

interface InserateTableProps {
  comparables: MobileDeComparable[]
  radiusKm: number
  location: string
  subjectModel?: string
  /** Im aufgeklappten Row passende Ausstattung hervorheben. */
  subjectEquipment?: string[]
  /** true => B2B-Auktionsreferenzen-Wording statt mobile.de. */
  isAuction?: boolean
}

type SortKey = 'preis' | 'km' | 'standtage'

const formatKm = (km: number) => `${km.toLocaleString('de-DE')} km`

// Preisbewertungs-Badge (mobile.de-Wording) aus priceCategoryConfig.
function PriceBadge({ category }: { category: MobileDeComparable['priceCategory'] }) {
  const cfg = priceCategoryConfig[category]
  return (
    <Badge variant="ghost" className={cn('font-medium', cfg.bg, cfg.color)}>
      {cfg.label}
    </Badge>
  )
}

// Kompaktes Thumbnail mit Fallback-Platzhalter (Car-Icon), wenn kein Bild da ist.
function Thumb({ src, alt, className }: { src?: string; alt: string; className: string }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className={cn('object-cover', className)} />
  }
  return (
    <div className={cn('flex items-center justify-center bg-muted', className)}>
      <Car className="h-5 w-5 text-muted-foreground/60" />
    </div>
  )
}

export function InserateTable({
  comparables,
  radiusKm,
  location,
  subjectModel,
  subjectEquipment,
  isAuction = false,
}: InserateTableProps): JSX.Element {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [sort, setSort] = useState<SortKey>('preis')

  const subjectEq = new Set((subjectEquipment ?? []).map((e) => e.toLowerCase()))

  const rows = [...comparables].sort((a, b) => {
    if (sort === 'km') return a.mileage - b.mileage
    if (sort === 'standtage') return a.daysListed - b.daysListed
    return a.price - b.price
  })

  const sortOptions: { key: SortKey; label: string }[] = [
    { key: 'preis', label: 'Preis' },
    { key: 'km', label: 'km' },
    { key: 'standtage', label: 'Standtage' },
  ]

  const title = isAuction
    ? `B2B-Auktionsreferenzen (${comparables.length})`
    : `Vergleichbare Inserate im Umkreis (${comparables.length})`

  return (
    <div className="space-y-3">
      {/* Header: Titel + dezenter Umkreis-Hinweis */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
          <MapPin className="h-3.5 w-3.5" />
          {radiusKm} km · {location}
        </span>
      </div>

      {/* Schlichte Sortier-Umschalter */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span>Sortieren:</span>
        {sortOptions.map((opt) => (
          <button
            key={opt.key}
            type="button"
            onClick={() => setSort(opt.key)}
            className={cn(
              'rounded-md px-2 py-0.5 transition-colors',
              sort === opt.key
                ? 'bg-primary/10 font-medium text-primary'
                : 'hover:bg-muted hover:text-foreground',
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Tabelle (Excel-Gefühl): Header-Zeile + klickbare Zeilen */}
      <div className="overflow-hidden rounded-lg border border-border/60">
        {/* Header */}
        <div className="grid grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3 border-b border-border/60 bg-muted/40 px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground sm:grid-cols-[44px_minmax(0,1fr)_120px_92px_72px_132px_88px_24px]">
          <span />
          <span>Fahrzeug</span>
          <span className="text-right sm:text-left">Preis</span>
          <span className="hidden text-right sm:block">km</span>
          <span className="hidden sm:block">EZ</span>
          <span className="hidden sm:block">Entfernung</span>
          <span className="hidden text-right sm:block">Standtage</span>
          <span className="hidden sm:block" />
        </div>

        {/* Zeilen */}
        <ul className="divide-y divide-border/60">
          {rows.map((c) => {
            const isOpen = expandedId === c.id
            const chips = (c.equipment ?? []).slice(0, 2)
            const toggle = () => setExpandedId(isOpen ? null : c.id)
            return (
              <li key={c.id}>
                {/* Klickbare Zeile */}
                <div
                  role="button"
                  tabIndex={0}
                  aria-expanded={isOpen}
                  onClick={toggle}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      toggle()
                    }
                  }}
                  className={cn(
                    'grid cursor-pointer grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3 px-3 py-2.5 text-sm outline-none transition-colors hover:bg-muted/40 focus-visible:bg-muted/50 sm:grid-cols-[44px_minmax(0,1fr)_120px_92px_72px_132px_88px_24px]',
                    isOpen && 'bg-muted/40',
                  )}
                >
                  {/* Thumbnail */}
                  <Thumb src={c.imageUrl} alt={c.title} className="h-9 w-11 rounded-md" />

                  {/* Fahrzeug: Titel + 1–2 Ausstattungs-Chips */}
                  <div className="min-w-0">
                    <p className="truncate font-medium">{c.title}</p>
                    {chips.length > 0 && (
                      <div className="mt-0.5 flex flex-wrap items-center gap-1">
                        {chips.map((chip) => (
                          <Badge
                            key={chip}
                            variant="outline"
                            className="px-1.5 py-0 text-[10px] font-normal text-muted-foreground"
                          >
                            {chip}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Preis + Preisbewertung */}
                  <div className="flex flex-col items-end gap-0.5 sm:items-start">
                    <span className="font-semibold tabular-nums">{formatCurrency(c.price)}</span>
                    <PriceBadge category={c.priceCategory} />
                  </div>

                  {/* km */}
                  <span className="hidden text-right text-muted-foreground tabular-nums sm:block">
                    {formatKm(c.mileage)}
                  </span>

                  {/* EZ */}
                  <span className="hidden text-muted-foreground tabular-nums sm:block">
                    {c.firstRegistration}
                  </span>

                  {/* Entfernung */}
                  <span className="hidden text-muted-foreground sm:block">
                    {c.distanceKm != null ? (
                      <span className="tabular-nums">
                        {c.distanceKm} km · {c.location}
                      </span>
                    ) : (
                      c.location
                    )}
                  </span>

                  {/* Standtage */}
                  <span className="hidden items-center justify-end gap-1 text-right text-muted-foreground tabular-nums sm:flex">
                    <Clock className="h-3 w-3" />
                    {c.daysListed} d
                  </span>

                  {/* Chevron */}
                  <span className="hidden items-center justify-center text-muted-foreground sm:flex">
                    {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </span>
                </div>

                {/* Detail-Panel (inline, animiert) */}
                {isOpen && (
                  <div className="animate-in fade-in border-t border-border/60 bg-muted/20 px-3 py-4">
                    <div className="grid gap-4 sm:grid-cols-[200px_minmax(0,1fr)]">
                      {/* Größeres Fahrzeugbild */}
                      <Thumb
                        src={c.imageUrl}
                        alt={c.title}
                        className="h-40 w-full rounded-lg border border-border/60"
                      />

                      <div className="min-w-0 space-y-3">
                        {/* Eckdaten */}
                        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
                          {c.fuelType && <DetailItem label="Kraftstoff" value={c.fuelType} />}
                          {c.transmission && <DetailItem label="Getriebe" value={c.transmission} />}
                          {c.power != null && <DetailItem label="Leistung" value={`${c.power} PS`} />}
                          {c.color && <DetailItem label="Farbe" value={c.color} />}
                          <DetailItem label={isAuction ? 'Plattform' : 'Händler'} value={c.dealerName} />
                          <DetailItem
                            label={isAuction ? 'Tage gelistet' : 'Standtage'}
                            value={`${c.daysListed} Tage online`}
                          />
                        </dl>

                        {/* Preisbewertung */}
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">Preisbewertung:</span>
                          <PriceBadge category={c.priceCategory} />
                        </div>

                        {/* Ausstattung — Matches zur eigenen Ausstattung hervorgehoben */}
                        {c.equipment && c.equipment.length > 0 && (
                          <div className="space-y-1.5">
                            <p className="text-xs text-muted-foreground">Ausstattung</p>
                            <div className="flex flex-wrap gap-1.5">
                              {c.equipment.map((feat) => {
                                const match = subjectEq.has(feat.toLowerCase())
                                return (
                                  <Badge
                                    key={feat}
                                    variant="ghost"
                                    className={cn(
                                      'font-normal',
                                      match
                                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                                        : 'bg-muted text-muted-foreground',
                                    )}
                                  >
                                    {feat}
                                  </Badge>
                                )
                              })}
                            </div>
                          </div>
                        )}

                        {/* Zum Inserat */}
                        {c.url && (
                          <a
                            href={c.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                          >
                            {isAuction ? 'Zur Auktion' : 'Zum Inserat'}
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </div>

      {subjectModel && (
        <p className="text-[11px] text-muted-foreground">
          Vergleichsbasis: {subjectModel}
        </p>
      )}
    </div>
  )
}

// Kleines Label/Wert-Paar für die Eckdaten im Detail-Panel.
function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="truncate font-medium">{value}</dd>
    </div>
  )
}
