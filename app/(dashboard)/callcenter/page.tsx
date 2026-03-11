'use client'

import dynamic from 'next/dynamic'

const CallcenterPageClient = dynamic(() => import('./callcenter-page-client'), {
  ssr: false,
  loading: () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="h-8 w-64 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-80 animate-pulse rounded-md bg-muted/70" />
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="h-24 animate-pulse rounded-xl border bg-muted/40" />
        <div className="h-24 animate-pulse rounded-xl border bg-muted/40" />
        <div className="h-24 animate-pulse rounded-xl border bg-muted/40" />
        <div className="h-24 animate-pulse rounded-xl border bg-muted/40" />
      </div>
      <div className="h-[28rem] animate-pulse rounded-xl border bg-muted/30" />
    </div>
  ),
})

export default function CallcenterPage() {
  return <CallcenterPageClient />
}
