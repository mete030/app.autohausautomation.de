'use client'

import { create } from 'zustand'
import { mercedesInventoryListings } from '@/lib/mercedes-inventory'
import { computePriceCategory } from '@/lib/market-analysis'
import type { Listing, ListingStatus } from '@/lib/types'

const initialListings = mercedesInventoryListings.map((listing) => ({ ...listing, images: [...listing.images] }))

interface ListingStoreState {
  listings: Listing[]
  updateListingStatus: (listingId: string, status: ListingStatus) => void
  updateListingPrice: (listingId: string, price: number) => void
}

export const useListingStore = create<ListingStoreState>((set) => ({
  listings: initialListings,

  updateListingStatus: (listingId, status) => {
    set((state) => ({
      listings: state.listings.map((listing) =>
        listing.id === listingId
          ? { ...listing, status, updatedAt: new Date().toISOString() }
          : listing
      ),
    }))
  },

  // Übernimmt eine Abpreisungsempfehlung aus dem Marktabgleich. Die
  // Preisbewertung wird live aus dem neuen Preis vs. Marktpreis neu berechnet,
  // damit Strip & Badge sofort konsistent reagieren.
  updateListingPrice: (listingId, price) => {
    set((state) => ({
      listings: state.listings.map((listing) =>
        listing.id === listingId
          ? {
              ...listing,
              price,
              priceCategory: computePriceCategory(price, listing.marketPrice),
              updatedAt: new Date().toISOString(),
            }
          : listing
      ),
    }))
  },
}))
