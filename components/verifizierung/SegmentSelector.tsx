'use client'

import { cn } from '@/lib/utils'
import { kycSegments } from '@/lib/kyc-config'
import type { CustomerSegment } from '@/lib/types'
import {
  User, Building, Truck, Handshake, Globe, Crown,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const iconMap: Record<string, LucideIcon> = {
  User, Building, Truck, Handshake, Globe, Crown,
}

interface SegmentSelectorProps {
  value: CustomerSegment | null
  onChange: (segment: CustomerSegment) => void
  disabled?: boolean
  compact?: boolean
}

export function SegmentSelector({ value, onChange, disabled, compact }: SegmentSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Kundensegment</label>
      {compact ? (
        <div className="flex flex-wrap gap-1.5">
          {kycSegments.map((seg) => {
            const Icon = iconMap[seg.icon]
            const isSelected = value === seg.segment
            return (
              <button
                key={seg.segment}
                type="button"
                disabled={disabled}
                onClick={() => onChange(seg.segment)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-xs font-medium transition-all duration-200 whitespace-nowrap',
                  'hover:shadow-sm hover:border-muted-foreground/30',
                  isSelected
                    ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20'
                    : 'border-border bg-card',
                  disabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                {Icon && <Icon className={cn('h-3.5 w-3.5 shrink-0 transition-colors',
                  isSelected ? seg.color : 'text-muted-foreground'
                )} />}
                <span className={cn(
                  'transition-colors',
                  isSelected ? 'text-foreground' : 'text-foreground/80'
                )}>{seg.label}</span>
              </button>
            )
          })}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {kycSegments.map((seg) => {
            const Icon = iconMap[seg.icon]
            const isSelected = value === seg.segment
            return (
              <button
                key={seg.segment}
                type="button"
                disabled={disabled}
                onClick={() => onChange(seg.segment)}
                className={cn(
                  'group relative flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all duration-200',
                  'hover:shadow-md hover:border-muted-foreground/30',
                  isSelected
                    ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20'
                    : 'border-border bg-card',
                  disabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary animate-in fade-in zoom-in duration-200" />
                )}

                <div className={cn(
                  'h-10 w-10 rounded-lg flex items-center justify-center transition-colors',
                  isSelected ? seg.accentBg : 'bg-muted'
                )}>
                  {Icon && <Icon className={cn('h-5 w-5 transition-colors',
                    isSelected ? seg.color : 'text-muted-foreground'
                  )} />}
                </div>

                <div>
                  <p className={cn(
                    'text-sm font-semibold transition-colors',
                    isSelected ? 'text-foreground' : 'text-foreground/80'
                  )}>{seg.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-tight">
                    {seg.shortDescription}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
