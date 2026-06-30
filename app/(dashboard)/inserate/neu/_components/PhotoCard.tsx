'use client'

import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  photoStatusMeta,
  toneClasses,
  type BeautyPosition,
  type PhotoStatus,
} from '@/lib/inserate-foto-mock'
import { Loader2, RefreshCw, ArrowLeftRight } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PhotoCardProps {
  position: BeautyPosition
  status: PhotoStatus
  showAfter: boolean
  /** stagger index → animation delay so cards cascade in */
  index?: number
  onToggleAfter: () => void
  onRetry: () => void
}

const RAW_FILTER: React.CSSProperties = {
  filter: 'brightness(.7) contrast(.9) saturate(.6)',
}

// ─── Component ──────────────────────────────────────────────────────────────────

export function PhotoCard({
  position,
  status,
  showAfter,
  index = 0,
  onToggleAfter,
  onRetry,
}: PhotoCardProps) {
  const meta = photoStatusMeta[status]
  const tone = toneClasses[meta.tone]

  const isBusy = status === 'uploading' || status === 'processing'
  const isDone = status === 'done'
  const isError = status === 'error'
  // Interiors have no studio counterpart → no before/after toggle.
  const hasFreistellung = position.studio !== position.lot
  const canToggle = isDone && hasFreistellung

  // The underline tone mirrors Autofox' thin coloured progress bar.
  const underline =
    isDone ? 'bg-emerald-500'
    : isError ? 'bg-red-500'
    : status === 'processing' ? 'bg-amber-500'
    : status === 'uploading' ? 'bg-sky-500'
    : 'bg-muted-foreground/30'

  return (
    <Card
      className={cn(
        'group relative gap-0 overflow-hidden rounded-xl p-0',
        'animate-in fade-in slide-in-from-bottom-2 duration-500',
      )}
      style={{ animationDelay: `${index * 40}ms`, animationFillMode: 'both' }}
    >
      {/* ─── Image ──────────────────────────────────────────────────────────── */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {/* AFTER (clean studio) */}
        <img
          src={position.studio}
          alt={`${position.label} – freigestellt`}
          className={cn(
            'absolute inset-0 h-full w-full object-cover transition-opacity duration-500',
            isDone && (showAfter || !hasFreistellung) ? 'opacity-100' : 'opacity-0',
          )}
        />
        {/* BEFORE (raw lot) — also the placeholder while not yet done */}
        <img
          src={position.lot}
          alt={`${position.label} – Original`}
          className={cn(
            'absolute inset-0 h-full w-full object-cover transition-opacity duration-500',
            isDone && hasFreistellung && !showAfter ? 'opacity-100'
            : isDone ? 'opacity-0'
            : 'opacity-100',
          )}
          style={isDone && (showAfter || !hasFreistellung) ? undefined : RAW_FILTER}
        />

        {/* Before/After indicator chip */}
        {canToggle && (
          <div className="pointer-events-none absolute left-2 top-2 z-10">
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider backdrop-blur-sm',
                showAfter
                  ? 'bg-emerald-500/90 text-white'
                  : 'bg-black/55 text-white',
              )}
            >
              {showAfter ? 'Nachher' : 'Vorher'}
            </span>
          </div>
        )}

        {/* Before/After toggle button */}
        {canToggle && (
          <button
            type="button"
            onClick={onToggleAfter}
            className={cn(
              'absolute bottom-2 right-2 z-10 inline-flex items-center gap-1 rounded-lg',
              'bg-black/55 px-2.5 py-1.5 text-[11px] font-medium text-white backdrop-blur-sm',
              'opacity-80 transition-all duration-200 hover:bg-black/75 hover:opacity-100 focus-visible:opacity-100',
            )}
            aria-label="Vorher/Nachher umschalten"
          >
            <ArrowLeftRight className="h-3 w-3" />
            Vorher/Nachher
          </button>
        )}

        {/* Processing overlay */}
        {isBusy && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200">
            <span className="relative flex h-9 w-9 items-center justify-center">
              <span className="absolute inset-0 rounded-full border-2 border-white/25" />
              <Loader2 className="h-9 w-9 animate-spin text-white" strokeWidth={2} />
            </span>
            <span className="text-[11px] font-medium text-white">{meta.label}</span>
          </div>
        )}

        {/* Error overlay */}
        {isError && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-red-950/55 backdrop-blur-[2px] animate-in fade-in duration-200">
            <span className="text-[11px] font-medium text-white">{meta.label}</span>
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-red-700 shadow-sm transition-colors hover:bg-white"
            >
              <RefreshCw className="h-3 w-3" />
              Erneut
            </button>
          </div>
        )}
      </div>

      {/* ─── Bottom bar ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <span className="truncate text-xs font-medium text-foreground">{position.label}</span>
        <span
          className={cn(
            'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium',
            tone.bg,
            tone.text,
            tone.border,
          )}
        >
          <span className={cn('h-1.5 w-1.5 rounded-full', tone.dot, isBusy && 'animate-pulse')} />
          {meta.label}
        </span>
      </div>

      {/* Thin coloured progress underline (Autofox style) */}
      <div className="h-0.5 w-full bg-border/40">
        <div
          className={cn('h-full transition-all duration-500', underline)}
          style={{
            width:
              isDone || isError ? '100%'
              : status === 'processing' ? '75%'
              : status === 'uploading' ? '35%'
              : '0%',
          }}
        />
      </div>
    </Card>
  )
}
