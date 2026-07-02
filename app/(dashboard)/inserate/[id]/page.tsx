'use client'

import { use, useState } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { useListingStore } from '@/lib/stores/listing-store'
import { mercedesMedia } from '@/lib/mercedes-inventory'
import { formatCurrency } from '@/lib/utils'
import { priceCategoryConfig } from '@/lib/constants'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { MarketComparisonCard } from '@/components/inserate/MarketComparisonCard'
import { DatasheetSection } from '@/components/inserate/DatasheetSection'
import {
  EXPORT_PLATFORMS, platformIconById, listingOnPlatform,
} from '@/components/inserate/platform-icons'
import {
  ArrowLeft, Eye, MessageSquare, Star, ExternalLink, Upload, Loader2,
  CheckCircle2, Send,
} from 'lucide-react'
import type { ListingStatus } from '@/lib/types'

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
                  const alreadyLive = listingOnPlatform(listing.platform, p.id)
                  const isLive = status === 'done' || alreadyLive
                  return (
                    <div key={p.id} className="flex items-center gap-2">
                      <div style={{ width: 20, height: 20 }}>
                        <div
                          className={`rounded-md w-5 h-5 flex items-center justify-center ${!isLive ? 'bg-muted' : ''}`}
                          style={{ background: isLive ? p.color : undefined }}
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

          {/* Marktabgleich · mobile.de — tagesaktuelles Preis-Radar */}
          <MarketComparisonCard listing={listing} />

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
              const alreadyLive = listingOnPlatform(listing.platform, platform.id)
              const isDone = status === 'done' || alreadyLive
              const Icon = platformIconById[platform.id]

              return (
                <div
                  key={platform.id}
                  className={`flex flex-col items-start gap-3 p-3.5 rounded-xl border sm:flex-row sm:items-center ${platform.bgColor} ${platform.borderColor}`}
                >
                  <Icon size={44} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground">{platform.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{platform.description}</p>
                  </div>
                  <Button
                    size="sm"
                    style={!isDone && status !== 'exporting' ? { background: platform.color } : undefined}
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

