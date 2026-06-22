'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

/** Aktuelle Zeit, aktualisiert jede Sekunde (isolierter Re-Render). */
function useNowTick(): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  return now
}

/** Live hochzählende Wartezeit seit Anrufeingang, eingefärbt nach Anliegen-Zielzeit. */
export function WaitingSince({
  receivedAt,
  slaMinutes,
}: {
  receivedAt: string
  slaMinutes: number
}) {
  const now = useNowTick()
  const totalSec = Math.max(0, Math.floor((now - new Date(receivedAt).getTime()) / 1000))
  const d = Math.floor(totalSec / 86400)
  const h = Math.floor((totalSec % 86400) / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60

  const parts: string[] = []
  if (d > 0) parts.push(`${d} Tg.`)
  if (d > 0 || h > 0) parts.push(`${h} Std.`)
  if (d > 0 || h > 0 || m > 0) parts.push(`${m} Min.`)
  parts.push(`${s.toString().padStart(2, '0')} Sek.`)

  const ratio = slaMinutes > 0 ? totalSec / 60 / slaMinutes : 0
  const color =
    ratio >= 1
      ? 'text-red-600 dark:text-red-400'
      : ratio >= 0.5
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-foreground'

  return (
    <span className={cn('tabular-nums font-semibold', color)} title={`Zielzeit: ${slaMinutes} Min.`}>
      {parts.join(' ')}
    </span>
  )
}
