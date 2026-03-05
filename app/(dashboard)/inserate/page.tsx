'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useListingStore } from '@/lib/stores/listing-store'
import { formatCurrency } from '@/lib/utils'
import { priceCategoryConfig } from '@/lib/constants'
import { Plus, Eye, MessageSquare, Star } from 'lucide-react'
import Link from 'next/link'
import type { ListingStatus } from '@/lib/types'

// Dummy car photos per listing id (Unsplash)
const LISTING_PHOTOS: Record<string, string> = {
  l1: 'https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=320&q=80&fit=crop&auto=format',
  l2: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=320&q=80&fit=crop&auto=format',
  l3: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=320&q=80&fit=crop&auto=format',
  l4: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=320&q=80&fit=crop&auto=format',
}

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

const listingTabs = ['alle', 'live', 'entwurf', 'archiviert'] as const
type ListingTab = (typeof listingTabs)[number]
const tabsDomIdPrefix = 'inserate-tabs'

function triggerDomId(tab: ListingTab) {
  return `${tabsDomIdPrefix}-trigger-${tab}`
}

function contentDomId(tab: ListingTab) {
  return `${tabsDomIdPrefix}-content-${tab}`
}

export default function InseratePage() {
  const listings = useListingStore((state) => state.listings)

  const filterListings = (status: ListingTab) => {
    if (status === 'alle') return listings
    return listings.filter(l => l.status === status)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Inserate</h1>
          <p className="text-muted-foreground">{listings.length} Inserate gesamt</p>
        </div>
        <Link href="/inserate/neu">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Neues Inserat
          </Button>
        </Link>
      </div>

      <Tabs id="inserate-tabs-root" defaultValue="alle">
        <TabsList>
          <TabsTrigger value="alle" id={triggerDomId('alle')} aria-controls={contentDomId('alle')}>
            Alle ({listings.length})
          </TabsTrigger>
          <TabsTrigger value="live" id={triggerDomId('live')} aria-controls={contentDomId('live')}>
            Live ({filterListings('live').length})
          </TabsTrigger>
          <TabsTrigger value="entwurf" id={triggerDomId('entwurf')} aria-controls={contentDomId('entwurf')}>
            Entwürfe ({filterListings('entwurf').length})
          </TabsTrigger>
          <TabsTrigger value="archiviert" id={triggerDomId('archiviert')} aria-controls={contentDomId('archiviert')}>
            Archiviert ({filterListings('archiviert').length})
          </TabsTrigger>
        </TabsList>

        {listingTabs.map(tab => (
          <TabsContent
            key={tab}
            value={tab}
            id={contentDomId(tab)}
            aria-labelledby={triggerDomId(tab)}
            className="space-y-3 mt-4"
          >
            {filterListings(tab).map(listing => {
              const priceConfig = priceCategoryConfig[listing.priceCategory]
              return (
                <Link key={listing.id} href={`/inserate/${listing.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer mb-3">
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <div className="w-32 h-20 rounded-lg overflow-hidden bg-muted shrink-0">
                          {LISTING_PHOTOS[listing.id] ? (
                            <img
                              src={LISTING_PHOTOS[listing.id]}
                              alt={listing.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-muted" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold text-sm line-clamp-1">{listing.title}</h3>
                            <Badge className={statusColors[listing.status]} variant="secondary">
                              {statusLabels[listing.status]}
                            </Badge>
                          </div>
                          {listing.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2">{listing.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="font-semibold text-sm text-foreground">
                              {formatCurrency(listing.price)}
                            </span>
                            <Badge variant="outline" className={`${priceConfig.bg} ${priceConfig.color} border-0 text-[10px]`}>
                              {priceConfig.label}
                            </Badge>
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
                              <span>{listing.platform.join(', ')}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
