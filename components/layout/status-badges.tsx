'use client'

import { useEffect, useRef, useState } from 'react'
import { ShieldCheck, RefreshCw } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

function PulseDot({ tone = 'emerald' }: { tone?: 'emerald' | 'amber' }) {
  const baseColor = tone === 'emerald' ? 'bg-emerald-500' : 'bg-amber-500'
  const ringColor = tone === 'emerald' ? 'bg-emerald-400' : 'bg-amber-400'
  return (
    <span className="relative inline-flex h-1.5 w-1.5 shrink-0">
      <span className={cn('absolute inline-flex h-full w-full animate-ping rounded-full opacity-75', ringColor)} />
      <span className={cn('relative inline-flex h-1.5 w-1.5 rounded-full', baseColor)} />
    </span>
  )
}

function formatSecondsAgo(seconds: number): string {
  if (seconds < 5) return 'gerade eben'
  if (seconds < 60) return `vor ${seconds} Sek.`
  const minutes = Math.floor(seconds / 60)
  if (minutes === 1) return 'vor 1 Min.'
  if (minutes < 60) return `vor ${minutes} Min.`
  const hours = Math.floor(minutes / 60)
  return `vor ${hours} Std.`
}

function useLiveSyncTicker(intervalRangeSec: [number, number] = [18, 45]) {
  const [secondsAgo, setSecondsAgo] = useState(7)
  const nextResetAtRef = useRef<number>(30)

  useEffect(() => {
    const [minInterval, maxInterval] = intervalRangeSec
    const pickNextReset = () => minInterval + Math.floor(Math.random() * (maxInterval - minInterval))
    nextResetAtRef.current = pickNextReset()

    const tick = () => {
      setSecondsAgo((current) => {
        if (current + 1 >= nextResetAtRef.current) {
          nextResetAtRef.current = pickNextReset()
          return 0
        }
        return current + 1
      })
    }
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [intervalRangeSec])

  return secondsAgo
}

interface StatusBadgesProps {
  collapsed?: boolean
}

export function StatusBadges({ collapsed = false }: StatusBadgesProps) {
  const customerOneSeconds = useLiveSyncTicker()

  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-1.5 py-2">
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border/60 bg-muted/40 text-[13px] leading-none transition-colors hover:bg-muted/70"
              aria-label="Auf Servern in Deutschland — mehr erfahren"
            >
              <span aria-hidden="true">🇩🇪</span>
            </button>
          </PopoverTrigger>
          <PopoverContent side="right" align="end" className="w-80">
            <HostedInGermanyContent />
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border/60 bg-muted/40 transition-colors hover:bg-muted/70"
              aria-label="Mit CustomerOne verbunden — mehr erfahren"
            >
              <PulseDot tone="emerald" />
            </button>
          </PopoverTrigger>
          <PopoverContent side="right" align="end" className="w-80">
            <CustomerOneContent secondsAgo={customerOneSeconds} />
          </PopoverContent>
        </Popover>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1 px-1 py-1.5">
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="inline-flex w-full items-center gap-1.5 rounded-md border border-border/50 bg-muted/30 px-2 py-1 text-[10.5px] font-medium text-foreground/75 transition-colors hover:bg-muted/60 hover:text-foreground"
          >
            <span aria-hidden="true" className="text-[11px] leading-none">🇩🇪</span>
            <span className="truncate">Auf Servern in Deutschland</span>
          </button>
        </PopoverTrigger>
        <PopoverContent side="right" align="end" className="w-80">
          <HostedInGermanyContent />
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="inline-flex w-full items-center gap-1.5 rounded-md border border-border/50 bg-muted/30 px-2 py-1 text-[10.5px] font-medium text-foreground/75 transition-colors hover:bg-muted/60 hover:text-foreground"
          >
            <PulseDot tone="emerald" />
            <span className="truncate">Mit CustomerOne verbunden</span>
          </button>
        </PopoverTrigger>
        <PopoverContent side="right" align="end" className="w-80">
          <CustomerOneContent secondsAgo={customerOneSeconds} />
        </PopoverContent>
      </Popover>
    </div>
  )
}

function HostedInGermanyContent() {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 ring-1 ring-emerald-200 dark:bg-emerald-950/50 dark:ring-emerald-900/60">
          <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-tight">Auf Servern in Deutschland</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">DSGVO- & BDSG-konform</p>
        </div>
      </div>

      <p className="text-[12.5px] leading-relaxed text-muted-foreground">
        Sämtliche Daten werden ausschließlich in deutschen Rechenzentren verarbeitet
        und gespeichert. Kein Datentransfer in Drittstaaten, keine US-Cloud-Abhängigkeit.
      </p>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-border/60 bg-muted/30 px-2.5 py-2">
          <p className="text-[9.5px] font-medium uppercase tracking-wider text-muted-foreground">Standort</p>
          <p className="mt-0.5 text-[12px] font-semibold">Frankfurt a. M.</p>
        </div>
        <div className="rounded-lg border border-border/60 bg-muted/30 px-2.5 py-2">
          <p className="text-[9.5px] font-medium uppercase tracking-wider text-muted-foreground">Compliance</p>
          <p className="mt-0.5 text-[12px] font-semibold">DSGVO · BDSG</p>
        </div>
      </div>
    </div>
  )
}

function CustomerOneContent({ secondsAgo }: { secondsAgo: number }) {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 ring-1 ring-emerald-200 dark:bg-emerald-950/50 dark:ring-emerald-900/60">
          <RefreshCw className="h-5 w-5 animate-[spin_4s_linear_infinite] text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-tight">CustomerOne-Anbindung</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">Dealer-Management-System der Wackenhut-Gruppe</p>
        </div>
      </div>

      <p className="text-[12.5px] leading-relaxed text-muted-foreground">
        Die Plattform ist bereits an CustomerOne angebunden. Aktuell läuft die
        Pilot-Phase mit bidirektionalem Echtzeit-Abgleich von Kunden-, Fahrzeug-
        und Auftragsdaten. Der produktive Roll-out ist für den 01.11.2026 geplant.
      </p>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-border/60 bg-muted/30 px-2.5 py-2">
          <p className="text-[9.5px] font-medium uppercase tracking-wider text-muted-foreground">Phase</p>
          <p className="mt-0.5 text-[12px] font-semibold">Pilot-Betrieb</p>
        </div>
        <div className="rounded-lg border border-border/60 bg-muted/30 px-2.5 py-2">
          <p className="text-[9.5px] font-medium uppercase tracking-wider text-muted-foreground">Produktiv-Start</p>
          <p className="mt-0.5 text-[12px] font-semibold tabular-nums">01.11.2026</p>
        </div>
      </div>

      <div className="rounded-lg border border-emerald-200/80 bg-emerald-50/70 px-3 py-2 dark:border-emerald-900/50 dark:bg-emerald-950/30">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-emerald-700 dark:text-emerald-400">
            <PulseDot tone="emerald" />
            Pilot-Abgleich aktiv
          </span>
          <span className="tabular-nums text-[11px] text-emerald-700/80 dark:text-emerald-500/80">
            Letzter Abgleich: {formatSecondsAgo(secondsAgo)}
          </span>
        </div>
      </div>
    </div>
  )
}
