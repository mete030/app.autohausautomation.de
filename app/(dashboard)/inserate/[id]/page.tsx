'use client'

import { use, useState } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { useListingStore } from '@/lib/stores/listing-store'
import { formatCurrency } from '@/lib/utils'
import { priceCategoryConfig } from '@/lib/constants'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Eye, MessageSquare, Star, ExternalLink } from 'lucide-react'
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

// Multiple dummy photos per listing (hero + gallery thumbnails)
const DETAIL_PHOTOS: Record<string, string[]> = {
  l1: [
    'https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=1200&q=85&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1542362567-b07e54358753?w=400&q=80&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&q=80&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=400&q=80&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400&q=80&fit=crop&auto=format',
  ],
  l2: [
    'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=1200&q=85&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1571607388263-1044f9ea01fb?w=400&q=80&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=400&q=80&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=400&q=80&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1526726538690-5cbf956ae2fd?w=400&q=80&fit=crop&auto=format',
  ],
  l3: [
    'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=1200&q=85&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1549317661-cf369843b03a?w=400&q=80&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=400&q=80&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1583121274602-3e2422c46f28?w=400&q=80&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&q=80&fit=crop&auto=format',
  ],
  l4: [
    'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1200&q=85&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=400&q=80&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1583121274602-3e2422c46f28?w=400&q=80&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1542362567-b07e54358753?w=400&q=80&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=400&q=80&fit=crop&auto=format',
  ],
}

const FALLBACK_PHOTOS = [
  'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1200&q=85&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=400&q=80&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1583121274602-3e2422c46f28?w=400&q=80&fit=crop&auto=format',
]

export default function InseratDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const listings = useListingStore((state) => state.listings)
  const { id } = use(params)
  const listing = listings.find(l => l.id === id)

  const [activePhoto, setActivePhoto] = useState(0)

  if (!listing) return notFound()

  const photos = DETAIL_PHOTOS[listing.id] ?? FALLBACK_PHOTOS
  const priceConfig = priceCategoryConfig[listing.priceCategory]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/inserate">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Inserat</h1>
          <p className="text-sm text-muted-foreground">{listing.title}</p>
        </div>
        <Badge className={`ml-auto ${statusColors[listing.status]}`} variant="secondary">
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
              {/* Photo counter */}
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
                    <img
                      src={photo}
                      alt={`Bild ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            <CardContent className="p-6 space-y-4">
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
        </div>

        {/* ─── Right: Info + Actions ───────────────────────────────────── */}
        <div className="space-y-5">
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
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Plattformen</span>
                <span className="text-sm text-right max-w-[160px]">
                  {listing.platform.join(', ') || '—'}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 space-y-2">
              {listing.status === 'entwurf' && (
                <Button className="w-full">Veröffentlichen</Button>
              )}
              {listing.status === 'live' && (
                <Button variant="outline" className="w-full">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Auf mobile.de ansehen
                </Button>
              )}
              <Button variant="outline" className="w-full">Bearbeiten</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
