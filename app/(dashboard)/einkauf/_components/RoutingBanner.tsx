'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { channelLabels, type ChannelDecision, type VerwertungChannel } from '@/lib/mock-data-einkauf'
import { Gavel, ShieldCheck, AlertTriangle } from 'lucide-react'

interface RoutingBannerProps {
  decision: ChannelDecision
  overrideChannel: VerwertungChannel | null
  onOverrideChange: (c: VerwertungChannel | null) => void
  note: string
  onNoteChange: (s: string) => void
}

// Nur die 2–3 entscheidenden FAKTEN, die den Kanal bestimmen — kein volles
// Regel-Ledger, keine Konfidenz, keine Bewertungsprosa.
//  • Ausgelöste Regeln (hart vor weich) liefern die Gründe fürs Auktions-Routing.
//  • Ist nichts ausgelöst (Endkunde), zeigen wir die beiden Gate-Fakten Alter & km,
//    die das Fahrzeug im Endkunden-Profil halten.
function decisiveReasons(decision: ChannelDecision): string[] {
  const triggered = decision.triggeredRules
    .filter((r) => r.triggered)
    .sort((a, b) => (a.severity === b.severity ? 0 : a.severity === 'hard' ? -1 : 1))
    .map((r) => `${r.label}: ${r.actualText}`)
  if (triggered.length) return triggered.slice(0, 3)
  const r1 = decision.triggeredRules.find((r) => r.id === 'R1')
  const r2 = decision.triggeredRules.find((r) => r.id === 'R2')
  return [r1?.actualText, r2?.actualText].filter(Boolean).slice(0, 3) as string[]
}

export function RoutingBanner({ decision, overrideChannel, onOverrideChange, note, onNoteChange }: RoutingBannerProps) {
  const effective: VerwertungChannel = overrideChannel ?? decision.recommendedChannel
  const isOverridden = overrideChannel !== null && overrideChannel !== decision.recommendedChannel
  const isAuction = effective === 'auktion'
  const L = channelLabels[effective]
  const reasons = decisiveReasons(decision)

  return (
    <Card className="border border-border/60">
      <CardContent className="p-4 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Kanal + entscheidende Fakten */}
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            {isAuction ? (
              <Gavel className="h-4 w-4 shrink-0 text-muted-foreground" />
            ) : (
              <ShieldCheck className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
              Verwertungskanal
            </span>
            <Badge className="text-xs border-0 bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300">
              {L.tag}
            </Badge>
            {isOverridden && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                <AlertTriangle className="h-3 w-3" />
                Manuell übersteuert
              </span>
            )}
            {reasons.map((r, i) => (
              <Badge
                key={i}
                variant="outline"
                className="max-w-[15rem] truncate text-[11px] border-border/60 font-normal text-muted-foreground"
                title={r}
              >
                {r}
              </Badge>
            ))}
          </div>

          {/* Kanal übersteuern */}
          <div className="flex items-center gap-2 shrink-0">
            <Label className="text-xs text-muted-foreground whitespace-nowrap">Kanal übersteuern</Label>
            <Select
              value={effective}
              onValueChange={(v) => {
                const next = v as VerwertungChannel
                onOverrideChange(next === decision.recommendedChannel ? null : next)
              }}
            >
              <SelectTrigger className="h-8 w-[140px] text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="endkunde">Endkunde</SelectItem>
                <SelectItem value="auktion">Auktion</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isOverridden && (
          <div className="space-y-1.5">
            <Input
              value={note}
              onChange={(e) => onNoteChange(e.target.value)}
              placeholder="Begründung (Pflicht) — z.B. Käufer vor Ort, lokaler VK geplant"
              className={`h-8 text-sm ${note.trim() ? '' : 'ring-1 ring-red-400/60 border-red-400/60'}`}
            />
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Hinweis: Die Kennzahlen unten basieren weiterhin auf der ursprünglichen Bewertung &mdash; bei manuellem
              Kanalwechsel als Schätzung verstehen.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
