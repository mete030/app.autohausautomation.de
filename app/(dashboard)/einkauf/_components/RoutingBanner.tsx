'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
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

export function RoutingBanner({ decision, overrideChannel, onOverrideChange, note, onNoteChange }: RoutingBannerProps) {
  const effective: VerwertungChannel = overrideChannel ?? decision.recommendedChannel
  const isOverridden = overrideChannel !== null && overrideChannel !== decision.recommendedChannel
  const isAuction = effective === 'auktion'
  const L = channelLabels[effective]

  const headerAccent = isOverridden
    ? 'from-amber-50 via-card to-amber-50/30 dark:from-amber-950/20 dark:via-card dark:to-amber-950/10 border-amber-300/50 dark:border-amber-800/40'
    : isAuction
      ? 'from-slate-50 via-card to-slate-50/30 dark:from-slate-900/40 dark:via-card dark:to-slate-900/20 border-slate-300/50 dark:border-slate-700/40'
      : 'from-emerald-50 via-card to-emerald-50/30 dark:from-emerald-950/20 dark:via-card dark:to-emerald-950/10 border-emerald-300/50 dark:border-emerald-800/40'

  const tagClass = isOverridden
    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
    : isAuction
      ? 'bg-slate-200 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300'
      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'

  return (
    <Card className={`border bg-gradient-to-br ${headerAccent}`}>
      <CardContent className="p-4 sm:p-5 space-y-3.5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-9 w-9 rounded-lg bg-card/70 ring-1 ring-border/60 flex items-center justify-center shrink-0">
              {isAuction ? (
                <Gavel className="h-[18px] w-[18px] text-slate-600 dark:text-slate-300" />
              ) : (
                <ShieldCheck className="h-[18px] w-[18px] text-emerald-600 dark:text-emerald-400" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Verwertungskanal</p>
              <div className="flex flex-wrap items-center gap-2 mt-0.5">
                <Badge className={`text-xs border-0 ${tagClass}`}>{L.tag}</Badge>
                {isOverridden && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 dark:text-amber-400">
                    <AlertTriangle className="h-3 w-3" />
                    Manuell übersteuert
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[10px] text-muted-foreground">Routing-Konfidenz</p>
            <p className="text-sm font-semibold tabular-nums">{decision.confidence}%</p>
          </div>
        </div>

        {/* Rationale */}
        <p className="text-xs text-muted-foreground leading-relaxed">
          {isOverridden
            ? `Manuell auf „${L.tag}" gesetzt. Engine-Empfehlung war: ${channelLabels[decision.recommendedChannel].tag}.`
            : decision.rationale}
        </p>

        {/* Rule ledger */}
        <div className="rounded-lg border border-border/60 bg-card/50 divide-y divide-border/40">
          {decision.triggeredRules.map((rule) => {
            const dotClass = rule.triggered
              ? rule.severity === 'hard'
                ? 'bg-slate-500'
                : 'bg-amber-400'
              : 'bg-border'
            return (
              <div key={rule.id} className="flex items-center gap-2.5 px-3 py-1.5 text-xs">
                <span className={`h-2 w-2 rounded-full shrink-0 ${dotClass}`} />
                <span className="font-medium shrink-0 w-[3rem] sm:w-auto sm:min-w-[12rem]">{rule.label}</span>
                <span className="text-muted-foreground tabular-nums flex-1 truncate">{rule.actualText}</span>
                {rule.triggered ? (
                  rule.severity === 'hard' ? (
                    <Badge variant="secondary" className="text-[10px] bg-slate-200 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300 border-0 shrink-0">
                      Pflicht-Routing
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-0 shrink-0">
                      Risiko +1
                    </Badge>
                  )
                ) : (
                  <span className="text-[10px] text-muted-foreground shrink-0">&mdash;</span>
                )}
              </div>
            )
          })}
        </div>

        <Separator />

        {/* Override row */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground whitespace-nowrap">Kanal übersteuern</Label>
            <Select
              value={effective}
              onValueChange={(v) => {
                const next = v as VerwertungChannel
                onOverrideChange(next === decision.recommendedChannel ? null : next)
              }}
            >
              <SelectTrigger className="h-8 w-[150px] text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="endkunde">Endkunde</SelectItem>
                <SelectItem value="auktion">Auktion</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {isOverridden && (
            <div className="flex-1">
              <Input
                value={note}
                onChange={(e) => onNoteChange(e.target.value)}
                placeholder="Begründung (Pflicht) — z.B. Käufer vor Ort, lokaler VK geplant"
                className={`h-8 text-sm ${note.trim() ? '' : 'ring-1 ring-red-400/60 border-red-400/60'}`}
              />
            </div>
          )}
        </div>
        {isOverridden && (
          <p className="text-[10px] text-amber-700/80 dark:text-amber-400/80 leading-relaxed">
            Hinweis: Die Kennzahlen unten basieren weiterhin auf der ursprünglichen Bewertung &mdash; bei manuellem Kanalwechsel als Schätzung verstehen.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
