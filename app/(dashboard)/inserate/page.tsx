'use client'

import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useListingStore } from '@/lib/stores/listing-store'
import { ListingCard } from '@/components/inserate/ListingCard'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import type { ListingStatus } from '@/lib/types'

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
    return listings.filter(l => l.status === (status as ListingStatus))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Inserate</h1>
          <p className="text-muted-foreground">{listings.length} Inserate gesamt</p>
        </div>
        <Link href="/inserate/neu">
          <Button className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Neues Inserat
          </Button>
        </Link>
      </div>

      <Tabs id="inserate-tabs-root" defaultValue="alle">
        <TabsList className="w-full justify-start overflow-x-auto whitespace-nowrap">
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
            {/* Klick klappt das Inserat inline auf (CarGate-Stil) — kein Seitenwechsel. */}
            {filterListings(tab).map(listing => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
