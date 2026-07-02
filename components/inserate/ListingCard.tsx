'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MarketComparisonCard } from '@/components/inserate/MarketComparisonCard'
import { DatasheetBody } from '@/components/inserate/DatasheetSection'
import {
  EXPORT_PLATFORMS, platformIconById, listingOnPlatform,
} from '@/components/inserate/platform-icons'
import { getMarketSignal } from '@/lib/market-analysis'
import { mercedesInventoryVehicles } from '@/lib/mercedes-inventory'
import { formatCurrency } from '@/lib/utils'
import { priceCategoryConfig } from '@/lib/constants'
import { cn } from '@/lib/utils'
import {
  ChevronDown, Eye, MessageSquare, Star, TrendingDown, Check, CheckCircle2,
  LayoutDashboard, FileCheck, Images, FileText, TrendingUp, BarChart3, Tag,
  ExternalLink, Loader2, Calendar, Gauge, Fuel, Settings2, Cog, Zap,
  Palette, Armchair, CalendarDays,
} from 'lucide-react'
import type { Listing, ListingStatus } from '@/lib/types'

// ─── Status config ─────────────────────────────────────────────────────────────

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

type ExportStatus = 'idle' | 'exporting' | 'done'

// Captured once at module load so "Standtage" stays pure during render (no
// Date.now() in the component body). Only shown in the expanded view, which is
// client-only, so there is no SSR hydration mismatch.
const NOW_MS = Date.now()

// ─── Deterministic per-channel demo stats (derived from views/inquiries) ──────

const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
const WEEKDAY_SHARE = [0.11, 0.12, 0.09, 0.13, 0.17, 0.21, 0.17]

function deriveChannelStats(listing: Listing) {
  const platforms = EXPORT_PLATFORMS.filter((p) => listingOnPlatform(listing.platform, p.id))
  const shares = platforms.length === 1 ? [1] : [0.62, 0.38, 0.2]
  return platforms.map((p, i) => {
    const share = shares[i] ?? 0.2
    return {
      platform: p,
      clicks: Math.round(listing.views * share),
      emails: Math.round(listing.inquiries * share * 0.7),
      parkings: Math.round(listing.views * share * 0.06),
      calls: Math.round(listing.inquiries * share * 0.3),
    }
  })
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function ListingCard({ listing }: { listing: Listing }) {
  const [open, setOpen] = useState(false)
  const [activePhoto, setActivePhoto] = useState(0)
  const [exportStatus, setExportStatus] = useState<Record<string, ExportStatus>>({
    mobile_de: 'idle', autoscout24: 'idle', truckscout24: 'idle',
  })

  const priceConfig = priceCategoryConfig[listing.priceCategory]
  const marketSignal = getMarketSignal(listing)
  const previewImage = listing.images[0]
  const sheet = listing.dataSheet
  const vin = useMemo(
    () => mercedesInventoryVehicles.find((v) => v.id === listing.vehicleId)?.vin,
    [listing.vehicleId],
  )

  const standtage = useMemo(() => {
    const created = new Date(listing.createdAt).getTime()
    return Math.max(0, Math.floor((NOW_MS - created) / 86_400_000))
  }, [listing.createdAt])

  const channelStats = useMemo(() => deriveChannelStats(listing), [listing])

  const liveCount = EXPORT_PLATFORMS.filter(
    (p) => listingOnPlatform(listing.platform, p.id) || exportStatus[p.id] === 'done',
  ).length

  const ausstattungenCount = sheet ? sheet.serienausstattung.length + sheet.sonderausstattung.length : 0

  const handleExport = (platformId: string) => {
    setExportStatus((prev) => ({ ...prev, [platformId]: 'exporting' }))
    setTimeout(() => {
      setExportStatus((prev) => ({ ...prev, [platformId]: 'done' }))
    }, 2200)
  }

  // ─── Key facts for the Übersicht tab ────────────────────────────────────────
  const keyFacts = sheet
    ? [
        { icon: Calendar, label: 'Erstzulassung', value: sheet.fahrzeugdaten.erstzulassung },
        { icon: Gauge, label: 'Kilometerstand', value: `${new Intl.NumberFormat('de-DE').format(sheet.fahrzeugdaten.kilometerstand)} km` },
        { icon: Fuel, label: 'Kraftstoff', value: sheet.fahrzeugdaten.kraftstoff },
        { icon: Settings2, label: 'Getriebe', value: sheet.fahrzeugdaten.getriebe },
        { icon: Zap, label: 'Leistung', value: `${sheet.fahrzeugdaten.leistungKW} kW (${sheet.fahrzeugdaten.leistungPS} PS)` },
        { icon: Cog, label: 'Antrieb', value: sheet.fahrzeugdaten.antrieb },
        { icon: Palette, label: 'Außenfarbe', value: sheet.fahrzeugdaten.aussenfarbe },
        { icon: Armchair, label: 'Türen / Sitze', value: `${sheet.fahrzeugdaten.tueren} / ${sheet.fahrzeugdaten.sitze}` },
      ]
    : []

  return (
    <Card className={cn('mb-3 transition-shadow', open ? 'shadow-md ring-1 ring-primary/10' : 'hover:shadow-md')}>
      {/* ─── Collapsed header (click to expand) ─────────────────────────────── */}
      <div
        role="button"
        tabIndex={0}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setOpen((o) => !o)
          }
        }}
        className="cursor-pointer rounded-xl p-4 outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
          <div className="h-44 w-full rounded-lg overflow-hidden bg-muted shrink-0 sm:h-20 sm:w-32">
            {previewImage ? (
              <img src={previewImage} alt={listing.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-muted" />
            )}
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h3 className="font-semibold text-sm line-clamp-1">{listing.title}</h3>
              <span className="flex items-center gap-2">
                <Badge className={statusColors[listing.status]} variant="secondary">
                  {statusLabels[listing.status]}
                </Badge>
                <ChevronDown
                  className={cn('h-4 w-4 text-muted-foreground transition-transform', open && 'rotate-180')}
                />
              </span>
            </div>
            {!open && listing.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">{listing.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="font-semibold text-sm text-foreground">
                {formatCurrency(listing.price)}
              </span>
              <Badge variant="outline" className={`${priceConfig.bg} ${priceConfig.color} border-0 text-[10px]`}>
                {priceConfig.label}
              </Badge>
              {marketSignal.abpreisung ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  <TrendingDown className="h-3 w-3" />
                  Abpreisung empfohlen
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                  <Check className="h-3 w-3" />
                  Marktgerecht
                </span>
              )}
              {listing.aiGenerated && (
                <span className="flex items-center gap-1">
                  <Star className="h-3 w-3 text-amber-500" />
                  KI {listing.aiConfidence}%
                </span>
              )}
              {listing.status === 'live' && (
                <>
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {listing.views}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    {listing.inquiries}
                  </span>
                </>
              )}
              {listing.platform.length > 0 && (
                <span className="truncate">{listing.platform.join(', ')}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Expanded: CarGate-style tabs ───────────────────────────────────── */}
      {open && (
        <CardContent className="border-t border-border/60 p-4 pt-3 sm:p-5 sm:pt-3 animate-in fade-in slide-in-from-top-1">
          <Tabs defaultValue="uebersicht">
            <TabsList className="h-9 w-full justify-start overflow-x-auto whitespace-nowrap">
              <TabsTrigger value="uebersicht" className="gap-1.5 px-3 text-xs">
                <LayoutDashboard className="h-3.5 w-3.5" />
                Übersicht
              </TabsTrigger>
              <TabsTrigger value="datenblatt" className="gap-1.5 px-3 text-xs">
                <FileCheck className="h-3.5 w-3.5" />
                Datenblatt
              </TabsTrigger>
              <TabsTrigger value="bilder" className="gap-1.5 px-3 text-xs">
                <Images className="h-3.5 w-3.5" />
                Bilder
                <Badge variant="secondary" className="ml-0.5 h-4 rounded-full px-1 text-[9px] font-normal tabular-nums">
                  {listing.images.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="beschreibung" className="gap-1.5 px-3 text-xs">
                <FileText className="h-3.5 w-3.5" />
                Beschreibung
              </TabsTrigger>
              <TabsTrigger value="markt" className="gap-1.5 px-3 text-xs">
                <TrendingUp className="h-3.5 w-3.5" />
                Preis &amp; Markt
              </TabsTrigger>
              <TabsTrigger value="statistik" className="gap-1.5 px-3 text-xs">
                <BarChart3 className="h-3.5 w-3.5" />
                Statistik
              </TabsTrigger>
              <TabsTrigger value="boersen" className="gap-1.5 px-3 text-xs">
                <Tag className="h-3.5 w-3.5" />
                Börsen
              </TabsTrigger>
            </TabsList>

            {/* ── Übersicht ── */}
            <TabsContent value="uebersicht" className="mt-4">
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
                <div className="lg:col-span-3">
                  <dl className="grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
                    {keyFacts.map((f) => (
                      <div key={f.label} className="flex items-center justify-between gap-3 border-b border-border/40 py-1.5 last:border-0 sm:[&:nth-last-child(2)]:border-0">
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <f.icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
                          {f.label}
                        </span>
                        <span className="text-right text-sm font-medium">{f.value}</span>
                      </div>
                    ))}
                  </dl>
                </div>
                <div className="space-y-3 lg:col-span-2">
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-muted-foreground">Preis</span>
                      <span className="text-2xl font-bold">{formatCurrency(listing.price)}</span>
                    </div>
                    <div className="mt-1.5 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Marktpreis (Ø)</span>
                      <span className="text-xs">{formatCurrency(listing.marketPrice)}</span>
                    </div>
                    <Badge variant="outline" className={`${priceConfig.bg} ${priceConfig.color} mt-2 border-0 text-[10px]`}>
                      {priceConfig.label}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg border px-2.5 py-2">
                      <span className="flex items-center gap-1 text-muted-foreground"><CalendarDays className="h-3 w-3" />Standtage</span>
                      <span className="mt-0.5 block text-sm font-semibold tabular-nums">{standtage}</span>
                    </div>
                    <div className="rounded-lg border px-2.5 py-2">
                      <span className="flex items-center gap-1 text-muted-foreground"><Eye className="h-3 w-3" />Aufrufe</span>
                      <span className="mt-0.5 block text-sm font-semibold tabular-nums">{listing.views}</span>
                    </div>
                    <div className="rounded-lg border px-2.5 py-2">
                      <span className="flex items-center gap-1 text-muted-foreground"><MessageSquare className="h-3 w-3" />Anfragen</span>
                      <span className="mt-0.5 block text-sm font-semibold tabular-nums">{listing.inquiries}</span>
                    </div>
                    <div className="rounded-lg border px-2.5 py-2">
                      <span className="flex items-center gap-1 text-muted-foreground"><Star className="h-3 w-3" />KI-Konfidenz</span>
                      <span className="mt-0.5 block text-sm font-semibold tabular-nums">
                        {listing.aiGenerated ? `${listing.aiConfidence}%` : '—'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* ── Datenblatt ── */}
            <TabsContent value="datenblatt" className="mt-4">
              {sheet ? (
                <DatasheetBody sheet={sheet} listing={listing} />
              ) : (
                <p className="text-sm italic text-muted-foreground">Kein Datenblatt vorhanden.</p>
              )}
            </TabsContent>

            {/* ── Bilder ── */}
            <TabsContent value="bilder" className="mt-4 space-y-2">
              {listing.images.length > 0 ? (
                <>
                  <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
                    <img
                      key={activePhoto}
                      src={listing.images[Math.min(activePhoto, listing.images.length - 1)]}
                      alt={`${listing.title} – Bild ${activePhoto + 1}`}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute bottom-2 right-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] text-white backdrop-blur-sm">
                      {Math.min(activePhoto, listing.images.length - 1) + 1} / {listing.images.length}
                    </div>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {listing.images.map((photo, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setActivePhoto(i)}
                        className={cn(
                          'h-12 w-[4.5rem] shrink-0 overflow-hidden rounded-md border-2 transition-all',
                          i === activePhoto ? 'border-primary ring-2 ring-primary/20' : 'border-transparent opacity-70 hover:opacity-100',
                        )}
                      >
                        <img src={photo} alt={`Bild ${i + 1}`} className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-sm italic text-muted-foreground">Noch keine Bilder vorhanden.</p>
              )}
            </TabsContent>

            {/* ── Beschreibung ── */}
            <TabsContent value="beschreibung" className="mt-4">
              {listing.description ? (
                <p className="max-h-96 overflow-y-auto whitespace-pre-line rounded-lg border bg-muted/20 p-3 text-sm leading-relaxed text-foreground/90">
                  {listing.description}
                </p>
              ) : (
                <p className="text-sm italic text-muted-foreground">Keine Beschreibung vorhanden.</p>
              )}
            </TabsContent>

            {/* ── Preis & Markt ── */}
            <TabsContent value="markt" className="mt-4">
              <MarketComparisonCard listing={listing} />
            </TabsContent>

            {/* ── Statistik ── */}
            <TabsContent value="statistik" className="mt-4">
              {listing.status === 'live' && channelStats.length > 0 ? (
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
                  {/* Channel table */}
                  <div className="lg:col-span-3">
                    <div className="overflow-x-auto rounded-lg border">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/40 text-left text-[10px] uppercase tracking-widest text-muted-foreground">
                            <th className="px-3 py-2 font-medium">Kanal</th>
                            <th className="px-3 py-2 text-right font-medium">Klicks</th>
                            <th className="px-3 py-2 text-right font-medium">E-Mail</th>
                            <th className="px-3 py-2 text-right font-medium">Parkings</th>
                            <th className="px-3 py-2 text-right font-medium">Calls</th>
                          </tr>
                        </thead>
                        <tbody>
                          {channelStats.map(({ platform, clicks, emails, parkings, calls }) => {
                            const Icon = platformIconById[platform.id]
                            return (
                              <tr key={platform.id} className="border-b last:border-0">
                                <td className="px-3 py-2">
                                  <span className="flex items-center gap-2 font-medium">
                                    <Icon size={20} />
                                    {platform.name}
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-right tabular-nums">{clicks}</td>
                                <td className="px-3 py-2 text-right tabular-nums">{emails}</td>
                                <td className="px-3 py-2 text-right tabular-nums">{parkings}</td>
                                <td className="px-3 py-2 text-right tabular-nums">{calls}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                    <p className="mt-1.5 text-[10px] text-muted-foreground">
                      Letzte Aktualisierung heute · Demo-Daten
                    </p>
                  </div>

                  {/* Weekday distribution */}
                  <div className="lg:col-span-2">
                    <p className="mb-2 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                      Klicks nach Wochentag
                    </p>
                    <div className="flex h-28 items-end gap-1.5">
                      {WEEKDAYS.map((day, i) => {
                        const value = Math.round(listing.views * WEEKDAY_SHARE[i])
                        const maxShare = Math.max(...WEEKDAY_SHARE)
                        return (
                          <div key={day} className="flex flex-1 flex-col items-center gap-1">
                            <span className="text-[9px] tabular-nums text-muted-foreground">{value}</span>
                            <div
                              className="w-full rounded-t bg-primary/70"
                              style={{ height: `${(WEEKDAY_SHARE[i] / maxShare) * 76}px` }}
                            />
                            <span className="text-[9px] text-muted-foreground">{day}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm italic text-muted-foreground">
                  Noch keine Plattform-Daten – das Inserat ist {listing.status === 'entwurf' ? 'ein Entwurf' : 'nicht live'}.
                </p>
              )}
            </TabsContent>

            {/* ── Börsen ── */}
            <TabsContent value="boersen" className="mt-4 space-y-3">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{liveCount} von {EXPORT_PLATFORMS.length}</span> Börsen aktiviert
              </p>
              {EXPORT_PLATFORMS.map((platform) => {
                const Icon = platformIconById[platform.id]
                const status = exportStatus[platform.id]
                const alreadyLive = listingOnPlatform(listing.platform, platform.id)
                const isLive = alreadyLive || status === 'done'
                return (
                  <div
                    key={platform.id}
                    className={`flex items-center gap-3 rounded-xl border p-3 ${platform.bgColor} ${platform.borderColor}`}
                  >
                    <Icon size={38} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{platform.name}</p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">{platform.description}</p>
                    </div>
                    {isLive ? (
                      <span className="flex items-center gap-2">
                        <Badge className="border-0 bg-emerald-100 text-[10px] text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                          <CheckCircle2 className="mr-1 h-2.5 w-2.5" />
                          Live
                        </Badge>
                        <a
                          href={platform.viewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-primary underline-offset-2 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="h-3 w-3" />
                          Ansehen
                        </a>
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        className="shrink-0 border-0 text-white hover:opacity-90"
                        style={{ background: platform.color }}
                        disabled={status === 'exporting'}
                        onClick={() => handleExport(platform.id)}
                      >
                        {status === 'exporting'
                          ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Exportiere</>
                          : <><ExternalLink className="mr-1.5 h-3.5 w-3.5" />Exportieren</>}
                      </Button>
                    )}
                  </div>
                )
              })}
            </TabsContent>
          </Tabs>

          {/* ─── CarGate-style summary footer ─────────────────────────────────── */}
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg bg-muted/60 px-3 py-2 text-[11px] text-muted-foreground">
            <span>
              Σ Ausstattungen: <span className="font-semibold text-foreground tabular-nums">{ausstattungenCount}</span>
            </span>
            <span className="text-border">|</span>
            <span>
              Börsen: <span className="font-semibold text-foreground tabular-nums">{liveCount} von {EXPORT_PLATFORMS.length}</span> aktiviert
            </span>
            {vin && (
              <>
                <span className="text-border">|</span>
                <span className="flex items-center gap-1">
                  VIN <Check className="h-3 w-3 text-emerald-500" />
                  <span className="font-mono text-[10px]">{vin}</span>
                </span>
              </>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  )
}
