'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useListingStore } from '@/lib/stores/listing-store'
import { formatCurrency } from '@/lib/utils'
import { priceCategoryConfig } from '@/lib/constants'
import { Plus, Eye, MessageSquare, Star, Car } from 'lucide-react'
import Link from 'next/link'
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

export default function InseratePage() {
  const listings = useListingStore((state) => state.listings)

  const filterListings = (status: string) => {
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

      <Tabs defaultValue="alle">
        <TabsList>
          <TabsTrigger value="alle">Alle ({listings.length})</TabsTrigger>
          <TabsTrigger value="live">Live ({filterListings('live').length})</TabsTrigger>
          <TabsTrigger value="entwurf">Entwürfe ({filterListings('entwurf').length})</TabsTrigger>
          <TabsTrigger value="archiviert">Archiviert ({filterListings('archiviert').length})</TabsTrigger>
        </TabsList>

        {['alle', 'live', 'entwurf', 'archiviert'].map(tab => (
          <TabsContent key={tab} value={tab} className="space-y-3 mt-4">
            {filterListings(tab).map(listing => {
              const priceConfig = priceCategoryConfig[listing.priceCategory]
              return (
                <Link key={listing.id} href={`/inserate/${listing.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer mb-3">
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <div className="w-32 h-20 bg-muted rounded-lg flex items-center justify-center shrink-0">
                          <Car className="h-8 w-8 text-muted-foreground/30" />
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
