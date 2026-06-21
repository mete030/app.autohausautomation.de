import { NextRequest, NextResponse } from 'next/server'
import {
  CALLBACK_PERSISTENCE_UNAVAILABLE_MESSAGE,
  isCallbackPersistenceConfigured,
} from '@/lib/server/callback-persistence-config'
import { listKiReceptionCalls } from '@/lib/server/ki-reception-records'
import type { KiReceptionCategory, KiReceptionStatus } from '@/lib/ki-rezeptionist/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const STATUSES: KiReceptionStatus[] = ['offen', 'in_bearbeitung', 'erledigt']

export async function GET(req: NextRequest) {
  if (!isCallbackPersistenceConfigured()) {
    return NextResponse.json(
      { available: false, calls: [], error: CALLBACK_PERSISTENCE_UNAVAILABLE_MESSAGE },
      { status: 503 },
    )
  }

  try {
    const statusParam = req.nextUrl.searchParams.get('status')
    const categoryParam = req.nextUrl.searchParams.get('category')
    const status = STATUSES.includes(statusParam as KiReceptionStatus)
      ? (statusParam as KiReceptionStatus)
      : undefined

    const calls = await listKiReceptionCalls({
      status,
      category: (categoryParam as KiReceptionCategory) || undefined,
    })
    return NextResponse.json({ available: true, calls })
  } catch (error) {
    console.error('[ki-rezeptionist] list failed:', error)
    return NextResponse.json(
      { available: false, calls: [], error: CALLBACK_PERSISTENCE_UNAVAILABLE_MESSAGE },
      { status: 503 },
    )
  }
}
