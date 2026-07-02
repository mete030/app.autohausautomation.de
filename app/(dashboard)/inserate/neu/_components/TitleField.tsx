'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { platformTitleLimits } from '@/lib/inserate-ki-mock'
import { Heading, Sparkles } from 'lucide-react'

// Monospace so 1 character === 1ch: markers sit at an exact character offset with
// no measuring. Input + marker layers share this size so their `ch` matches.
// 12px keeps all 65 characters (carzilla's limit) visible inside the card.
const FONT: React.CSSProperties = { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 12 }
const markerLeft = (limit: number) => `calc(0.625rem + 1px + ${limit}ch)` // input px-2.5 + border

/**
 * Editable listing title, modelled on the mobile.de "Modellzusatz" +
 * "Kopfzeilen-Tool": a fixed Hersteller/Modell prefix plus a free-text add-on on
 * a single full-width line. One vertical marker per portal sits exactly where
 * that portal truncates the title, so the user sees how far they may type.
 */
export function TitleField({
  prefix,
  defaultZusatz,
  suggestion,
}: {
  prefix: string
  defaultZusatz: string
  /** KI-suggested Modellzusatz (the "übernehmen" shortcut) */
  suggestion: string
}) {
  const [zusatz, setZusatz] = useState(defaultZusatz)
  const len = zusatz.length

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between gap-2 text-sm">
          <span className="flex items-center gap-2">
            <Heading className="h-4 w-4 text-primary" />
            Titel &amp; Kopfzeile
          </span>
          <button
            type="button"
            onClick={() => setZusatz(suggestion)}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-primary underline-offset-2 hover:underline"
          >
            <Sparkles className="h-3 w-3" />
            KI-Vorschlag
          </button>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-2.5">
        {/* Hersteller + Modell (fixed prefix) */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Hersteller · Modell</span>
          <span className="rounded-md border border-border/70 bg-muted/50 px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {prefix}
          </span>
        </div>

        {/* Modellzusatz — single full-width line with per-portal cut-off markers */}
        <div>
          <label className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground" htmlFor="modellzusatz">
            Modellzusatz
          </label>
          <div className="relative overflow-hidden">
            <input
              id="modellzusatz"
              value={zusatz}
              onChange={(e) => setZusatz(e.target.value)}
              placeholder="Modellzusatz eingeben …"
              style={FONT}
              className="h-9 w-full rounded-md border border-input bg-transparent px-2.5 py-1 tracking-tight shadow-xs outline-none transition-[box-shadow] placeholder:font-sans placeholder:text-[13px] placeholder:tracking-normal placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30"
            />
            {/* vertical cut-off markers, one per portal */}
            <div className="pointer-events-none absolute inset-0" style={FONT} aria-hidden>
              {platformTitleLimits.map((p) => {
                const over = len > p.limit
                return (
                  <span
                    key={p.id}
                    className="absolute top-1.5 bottom-1.5 w-px rounded-full"
                    style={{ left: markerLeft(p.limit), background: over ? '#ef4444' : p.color, opacity: over ? 1 : 0.65 }}
                  />
                )
              })}
            </div>
          </div>

          {/* labels centred under each marker */}
          <div className="relative mt-1 h-3.5 overflow-hidden" style={FONT} aria-hidden>
            {platformTitleLimits.map((p) => {
              const over = len > p.limit
              return (
                <span
                  key={p.id}
                  className="absolute inline-block -translate-x-1/2 whitespace-nowrap"
                  style={{ left: markerLeft(p.limit) }}
                >
                  <span
                    className="text-[9px] font-medium leading-none tabular-nums"
                    style={{ fontFamily: 'system-ui, sans-serif', color: over ? '#ef4444' : p.color }}
                  >
                    {p.name}
                  </span>
                </span>
              )
            })}
          </div>
        </div>

        {/* one-line hint + live count */}
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Die Markierungen zeigen, wo jede Plattform den Titel abschneidet – mobile.de bei 48, carzilla.de bei 65 Zeichen,
          AutoScout24 pixelbasiert. Aktuell{' '}
          <span className={cn('font-medium tabular-nums', len > 48 ? 'text-red-600 dark:text-red-400' : 'text-foreground')}>
            {len} Zeichen
          </span>
          .
        </p>
      </CardContent>
    </Card>
  )
}
