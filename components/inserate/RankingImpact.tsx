import { ArrowUp, ListOrdered } from 'lucide-react'

interface Props {
  currentRank: number
  projectedRank: number
  totalListings: number
  showLabel?: boolean
}

// Platzierung bei Sortierung nach Preis (aufsteigend): Platz 1 = günstigstes
// Fahrzeug = ganz oben/links. Günstiger werden = nach links rutschen.
// Deterministisch aus den realen Vergleichspreisen abgeleitet — keine Prognose.
export function RankingImpact({ currentRank, projectedRank, totalListings, showLabel = true }: Props) {
  const improves = projectedRank < currentRank
  const denom = Math.max(1, totalListings - 1)
  const toPct = (rank: number) => ((rank - 1) / denom) * 100
  const curPct = toPct(currentRank)
  const projPct = toPct(projectedRank)
  const left = Math.min(curPct, projPct)
  // Mindestbreite, damit der Sprung auch bei kleinem Δ sichtbar bleibt
  const width = improves ? Math.max(Math.abs(curPct - projPct), 6) : 0

  return (
    <div>
      {showLabel && (
        <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          <ListOrdered className="h-3.5 w-3.5" />
          Platzierung im Umkreis
        </p>
      )}

      {/* Zahlen */}
      <div className="flex items-baseline gap-2">
        {improves ? (
          <>
            <span className="text-lg font-bold tabular-nums text-muted-foreground line-through">
              Platz {currentRank}
            </span>
            <ArrowUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
              Platz {projectedRank}
            </span>
          </>
        ) : (
          <span className="text-2xl font-bold tabular-nums">Platz {currentRank}</span>
        )}
        <span className="text-xs text-muted-foreground">von {totalListings}</span>
      </div>

      {/* Skala: links = Platz 1 (günstigster) */}
      <div className="relative mt-2 h-2 rounded-full bg-muted">
        {improves && (
          <div
            className="absolute top-0 h-2 rounded-full bg-emerald-500/30"
            style={{ left: `${left}%`, width: `${width}%` }}
          />
        )}
        {/* aktuelle Position */}
        <div
          className="absolute top-1/2 z-10 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background bg-muted-foreground/70"
          style={{ left: `${curPct}%` }}
        />
        {/* Zielposition */}
        {improves && (
          <div
            className="absolute top-1/2 z-20 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background bg-emerald-500 ring-2 ring-emerald-500/25"
            style={{ left: `${projPct}%` }}
          />
        )}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
        <span>Platz 1 · günstigster</span>
        <span>Platz {totalListings}</span>
      </div>
    </div>
  )
}
