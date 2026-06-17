import { formatCurrency } from '@/lib/utils'
import { priceCategoryConfig } from '@/lib/constants'
import type { PriceCategory } from '@/lib/types'

const CATEGORY_HEX: Record<PriceCategory, string> = {
  sehr_gut: '#059669',
  gut: '#16a34a',
  zufriedenstellend: '#d97706',
  erhoht: '#ea580c',
  stark_erhoht: '#dc2626',
}

interface Props {
  min: number
  max: number
  median: number
  yourPrice: number
  ticks: number[]
  category: PriceCategory
}

// Verteilungs-Strip: Wettbewerber als feine Ticks, Median-Linie und ein
// prominenter "Du"-Pin mit Chip + Zeiger auf die exakte Position. Bewusst als
// CSS gebaut (kein Chart-Lib) für volle Pixelkontrolle in der Sidebar.
export function PriceDistributionStrip({ min, max, median, yourPrice, ticks, category }: Props) {
  const lo = Math.min(min, yourPrice)
  const hi = Math.max(max, yourPrice)
  const pad = (hi - lo) * 0.06 || 1
  const domLo = lo - pad
  const domHi = hi + pad
  const span = Math.max(1, domHi - domLo)
  const pct = (v: number) => ((v - domLo) / span) * 100

  const cfg = priceCategoryConfig[category]
  const hex = CATEGORY_HEX[category]
  const yourPct = pct(yourPrice)
  // Chip-Text am Rand nicht abschneiden; der Zeiger sitzt weiterhin exakt.
  const labelLeft = Math.min(85, Math.max(15, yourPct))

  return (
    <div>
      {/* Chip-Reihe */}
      <div className="relative h-6">
        <div className="absolute bottom-0 z-30 -translate-x-1/2" style={{ left: `${labelLeft}%` }}>
          <span
            className={`inline-flex items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-semibold shadow-sm ${cfg.bg} ${cfg.color}`}
            style={{ borderColor: hex }}
          >
            Du · {formatCurrency(yourPrice)}
          </span>
        </div>
      </div>

      {/* Track-Reihe */}
      <div className="relative h-9">
        {/* Zeiger auf die exakte Position */}
        <div className="absolute -top-1 z-30 -translate-x-1/2" style={{ left: `${yourPct}%` }}>
          <div
            style={{
              width: 0,
              height: 0,
              borderLeft: '5px solid transparent',
              borderRight: '5px solid transparent',
              borderTop: `6px solid ${hex}`,
            }}
          />
        </div>

        {/* Wettbewerber-Ticks */}
        {ticks.map((t, i) => (
          <span
            key={i}
            className="absolute top-1 h-4 w-px bg-muted-foreground/30"
            style={{ left: `${pct(t)}%` }}
          />
        ))}

        {/* Bewertungs-Track (günstig → teuer) */}
        <div className="absolute left-0 right-0 top-6 h-2 rounded-full bg-gradient-to-r from-emerald-400 via-amber-300 to-red-400" />

        {/* Median-Marker */}
        <div className="absolute top-5 z-10 -translate-x-1/2" style={{ left: `${pct(median)}%` }}>
          <div className="h-4 w-0.5 rounded-full bg-foreground/70" />
        </div>

        {/* "Du"-Linie */}
        <div className="absolute top-3.5 z-20 -translate-x-1/2" style={{ left: `${yourPct}%` }}>
          <div className="h-7 w-1.5 rounded-full ring-2 ring-background" style={{ background: hex }} />
        </div>
      </div>

      {/* Skala */}
      <div className="mt-1.5 flex items-center justify-between text-[10px] text-muted-foreground">
        <span>{formatCurrency(min)}</span>
        <span className="font-medium text-foreground/70">Median {formatCurrency(median)}</span>
        <span>{formatCurrency(max)}</span>
      </div>
    </div>
  )
}
