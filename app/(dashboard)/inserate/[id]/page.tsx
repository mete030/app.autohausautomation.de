'use client'

import { use } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { useListingStore } from '@/lib/stores/listing-store'
import { formatCurrency } from '@/lib/utils'
import { priceCategoryConfig } from '@/lib/constants'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Eye, MessageSquare, Star, ExternalLink, Car } from 'lucide-react'
import type { ListingStatus } from '@/lib/types'

const statusLabels: Record<ListingStatus, string> = {
  entwurf: 'Entwurf',
  live: 'Live',
  archiviert: 'Archiviert',
}

export default function InseratDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const listings = useListingStore((state) => state.listings)
  const { id } = use(params)
  const listing = listings.find(l => l.id === id)

  if (!listing) return notFound()

  const priceConfig = priceCategoryConfig[listing.priceCategory]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/inserate">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Inserat bearbeiten</h1>
          <p className="text-muted-foreground">{listing.title}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="aspect-video bg-muted rounded-t-xl flex items-center justify-center">
              <Car className="h-20 w-20 text-muted-foreground/20" />
            </div>
            <CardContent className="p-6 space-y-4">
              <h2 className="text-xl font-bold">{listing.title}</h2>
              {listing.description ? (
                <p className="text-sm text-muted-foreground whitespace-pre-line">{listing.description}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">Keine Beschreibung vorhanden</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant="secondary">{statusLabels[listing.status]}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Preis</span>
                <span className="text-xl font-bold">{formatCurrency(listing.price)}</span>
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
                    <span className="flex items-center gap-1 text-sm">
                      <Eye className="h-4 w-4" /> {listing.views}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Anfragen</span>
                    <span className="flex items-center gap-1 text-sm">
                      <MessageSquare className="h-4 w-4" /> {listing.inquiries}
                    </span>
                  </div>
                </>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Plattformen</span>
                <span className="text-sm">{listing.platform.join(', ') || '—'}</span>
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
