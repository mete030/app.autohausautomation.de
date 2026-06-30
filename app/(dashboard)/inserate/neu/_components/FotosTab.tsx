'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  beautyPositions,
  POSITION_COUNT,
  CAPTURE_VIN,
  CAPTURE_VEHICLE,
  type PhotoStatus,
} from '@/lib/inserate-foto-mock'
import { PhotoCard } from './PhotoCard'
import { MobileCaptureFlow } from './MobileCaptureFlow'
import {
  Images,
  Smartphone,
  Sparkles,
  UploadCloud,
  CheckCircle2,
  Loader2,
  AlertTriangle,
} from 'lucide-react'

// ─── State model ──────────────────────────────────────────────────────────────

interface PhotoState {
  status: PhotoStatus
  showAfter: boolean
}

type PhotoMap = Record<string, PhotoState>

/** One specific position fails freistellung → exposes a "Erneut" retry. */
const ERROR_POSITION_ID = 'hinten_rechts'

// Status-cycle timings (ms). uploading → processing → done.
const UPLOAD_MS = 700
const PROCESS_MS = 1400
const STAGGER_MS = 120

// ─── Component ──────────────────────────────────────────────────────────────────

export function FotosTab() {
  const [photos, setPhotos] = useState<PhotoMap>({})
  const [captureOpen, setCaptureOpen] = useState(false)
  const [ftp, setFtp] = useState<'idle' | 'uploading' | 'done'>('idle')
  // Track timers so unmount / re-trigger never leaks setState after teardown.
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  const schedule = useCallback((fn: () => void, ms: number) => {
    const t = setTimeout(fn, ms)
    timers.current.push(t)
  }, [])

  // Clear pending timers on unmount so no setState fires after teardown.
  useEffect(() => {
    const list = timers.current
    return () => { list.forEach(clearTimeout); timers.current = [] }
  }, [])

  const setPhoto = useCallback((id: string, patch: Partial<PhotoState>) => {
    setPhotos((prev) => {
      const base: PhotoState = prev[id] ?? { status: 'pending', showAfter: true }
      return { ...prev, [id]: { ...base, ...patch } }
    })
  }, [])

  // Run a single position through uploading → processing → done|error.
  const runCycle = useCallback(
    (id: string, allowError: boolean) => {
      setPhoto(id, { status: 'uploading', showAfter: true })
      schedule(() => setPhoto(id, { status: 'processing' }), UPLOAD_MS)
      schedule(() => {
        const fail = allowError && id === ERROR_POSITION_ID
        setPhoto(id, { status: fail ? 'error' : 'done' })
      }, UPLOAD_MS + PROCESS_MS)
    },
    [schedule, setPhoto],
  )

  // "Dummy-Bilder laden": cards appear staggered, each running its own cycle.
  const handleLoadDummy = useCallback(() => {
    setFtp('idle')
    beautyPositions.forEach((pos, i) => {
      schedule(() => {
        setPhoto(pos.id, { status: 'pending', showAfter: true })
        runCycle(pos.id, true)
      }, i * STAGGER_MS)
    })
  }, [runCycle, schedule, setPhoto])

  // "Alle hochladen (FTP)": simulate the FTP transfer with progress feedback.
  const handleUploadAll = useCallback(() => {
    setFtp('uploading')
    schedule(() => setFtp('done'), 1900)
  }, [schedule])

  // Retry a failed card → straight to done.
  const handleRetry = useCallback(
    (id: string) => {
      setPhoto(id, { status: 'processing' })
      schedule(() => setPhoto(id, { status: 'done' }), PROCESS_MS)
    },
    [schedule, setPhoto],
  )

  const handleToggleAfter = useCallback(
    (id: string) => {
      setPhotos((prev) => {
        const cur = prev[id]
        if (!cur) return prev
        return { ...prev, [id]: { ...cur, showAfter: !cur.showAfter } }
      })
    },
    [],
  )

  // MobileCaptureFlow landed: present ALL positions and cycle them to done.
  const handleCaptureComplete = useCallback(() => {
    beautyPositions.forEach((pos, i) => {
      schedule(() => {
        setPhoto(pos.id, { status: 'pending', showAfter: true })
        runCycle(pos.id, false)
      }, i * STAGGER_MS)
    })
    // Keep the overlay open on its success screen; the user closes it via
    // "Zur Desktop-Ansicht" (onClose). Desktop already populates in the background.
  }, [runCycle, schedule, setPhoto])

  // ─── Derived counts ───────────────────────────────────────────────────────
  const present = Object.keys(photos).length
  const hasPhotos = present > 0
  const counts = Object.values(photos).reduce(
    (acc, p) => {
      if (p.status === 'done') acc.done += 1
      else if (p.status === 'uploading' || p.status === 'processing') acc.busy += 1
      else if (p.status === 'error') acc.error += 1
      return acc
    },
    { done: 0, busy: 0, error: 0 },
  )

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* ─── Header strip ──────────────────────────────────────────────────── */}
      <Card className="gap-0 rounded-xl p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Left: VIN chip + vehicle + count */}
          <div className="flex min-w-0 flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-md border border-border bg-muted px-2 py-0.5 font-mono text-[11px] tracking-wider text-muted-foreground">
                {CAPTURE_VIN}
              </span>
              <span className="text-sm font-semibold text-foreground">{CAPTURE_VEHICLE}</span>
              <span className="text-xs text-muted-foreground">
                Bilder{' '}
                <span className="font-medium tabular-nums text-foreground">{present}</span>
                <span className="text-muted-foreground">/{POSITION_COUNT}</span>
              </span>
            </div>
            {/* Overall status line */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
              {hasPhotos ? (
                <>
                  <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" />
                    {counts.done} fertig
                  </span>
                  <span className="text-muted-foreground/40">·</span>
                  <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400">
                    <Loader2 className={cn('h-3 w-3', counts.busy > 0 && 'animate-spin')} />
                    {counts.busy} in Bearbeitung
                  </span>
                  <span className="text-muted-foreground/40">·</span>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1',
                      counts.error > 0
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-muted-foreground',
                    )}
                  >
                    <AlertTriangle className="h-3 w-3" />
                    {counts.error} Fehler
                  </span>
                </>
              ) : (
                <span className="text-muted-foreground">
                  Noch keine Fotos – Aufnahme starten oder Demo-Bilder laden.
                </span>
              )}
            </div>
          </div>

          {/* Right: actions */}
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={() => setCaptureOpen(true)}>
              <Smartphone className="h-4 w-4" />
              Mobil-Aufnahme starten
            </Button>
            <Button size="sm" variant="outline" onClick={handleLoadDummy}>
              <Sparkles className="h-4 w-4" />
              Dummy-Bilder laden
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={!hasPhotos || ftp === 'uploading'}
              onClick={handleUploadAll}
              className={cn(ftp === 'done' && 'border-emerald-300 text-emerald-600 dark:border-emerald-800')}
            >
              {ftp === 'uploading' ? (
                <><Loader2 className="h-4 w-4 animate-spin" />Überträgt…</>
              ) : ftp === 'done' ? (
                <><CheckCircle2 className="h-4 w-4" />Auf FTP übertragen</>
              ) : (
                <><UploadCloud className="h-4 w-4" />Alle hochladen (FTP)</>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* ─── Empty state ───────────────────────────────────────────────────── */}
      {!hasPhotos ? (
        <div className="animate-in fade-in slide-in-from-top-2 duration-500">
          <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-border bg-muted/20 px-6 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-background shadow-sm ring-1 ring-border/60">
              <Images className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <div className="space-y-1">
              <p className="text-base font-semibold">Noch keine Fotos</p>
              <p className="mx-auto max-w-md text-sm text-muted-foreground">
                Fotografieren Sie das Fahrzeug bequem per Smartphone – die Aufnahmen landen
                automatisch hier und werden freigestellt. Oder laden Sie zum Testen Demo-Bilder.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <Button onClick={() => setCaptureOpen(true)}>
                <Smartphone className="h-4 w-4" />
                Aufnahme starten
              </Button>
              <Button variant="outline" onClick={handleLoadDummy}>
                <Sparkles className="h-4 w-4" />
                Dummy-Bilder laden
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* ─── Gallery grid ─────────────────────────────────────────────────── */
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {beautyPositions.map((pos, i) => {
            const state = photos[pos.id]
            if (!state) return null
            return (
              <PhotoCard
                key={pos.id}
                position={pos}
                status={state.status}
                showAfter={state.showAfter}
                index={i}
                onToggleAfter={() => handleToggleAfter(pos.id)}
                onRetry={() => handleRetry(pos.id)}
              />
            )
          })}
        </div>
      )}

      {/* ─── Mobile capture overlay ────────────────────────────────────────── */}
      {captureOpen && (
        <MobileCaptureFlow
          open
          onClose={() => setCaptureOpen(false)}
          onComplete={handleCaptureComplete}
        />
      )}
    </div>
  )
}
