'use client'

import { create } from 'zustand'
import { mockListings } from '@/lib/mock-data'
import type { Listing, ListingStatus } from '@/lib/types'

const initialListings = mockListings.map((listing) => ({ ...listing }))

interface ListingStoreState {
  listings: Listing[]
  updateListingStatus: (listingId: string, status: ListingStatus) => void
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
}))
