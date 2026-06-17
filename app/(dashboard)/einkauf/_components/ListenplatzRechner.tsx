'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  GLC_LISTENPLATZ,
  GLC_LADDER,
  GLC_REPRICING_STRATEGY,
  GLC_DEFAULT_RULE,
  GLC_COMPARABLE_PRICES,
  slotForPrice,
  priceRangeForSlot,
  priceForRank,
  marginOf,
  marginPctOf,
  evaluateRule,
  type RepricingRule,
} from '@/lib/listenplatz-einkauf'
import { formatCurrency } from '@/lib/utils'
import { ListOrdered, Sparkles, ArrowRight, Minus, Plus, Bot, Zap, ChevronRight } from 'lucide-react'

interface ListenplatzRechnerProps {
  listPrice: number
  onListPriceChange: (p: number) => void
  sweetSpot: number
  onInserat: (price: number) => void
}

const m = GLC_LISTENPLATZ
const SLIDER_MIN = 41000
const SLIDER_MAX = 64000
const BAR_MIN = m.prices[0]
const BAR_MAX = m.prices[m.prices.length - 1]
const MAX_SEITE = Math.ceil(m.poolSize / m.pageSize)

function marginTone(price: number, sweetSpot: number): { text: string; dot: string } {
  const margin = marginOf(price, sweetSpot)
  const pct = marginPctOf(price, sweetSpot)
  if (margin <= 0) return { text: 'text-red-600 dark:text-red-400', dot: 'bg-red-500' }
  if (pct < 8) return { text: 'text-amber-600 dark:text-amber-400', dot: 'bg-amber-500' }
  return { text: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' }
}

const barPos = (price: number) => Math.max(0, Math.min(100, ((price - BAR_MIN) / (BAR_MAX - BAR_MIN)) * 100))

export function ListenplatzRechner({ listPrice, onListPriceChange, sweetSpot, onInserat }: ListenplatzRechnerProps) {
  const [calcMode, setCalcMode] = useState<'preis' | 'platz'>('preis')
  const [targetSeite, setTargetSeite] = useState(1)
  const [targetPlatz, setTargetPlatz] = useState(7)
  const [strategyActive, setStrategyActive] = useState(false)
  const [rule, setRule] = useState<RepricingRule>(GLC_DEFAULT_RULE)

  const slot = slotForPrice(listPrice)
  const margin = marginOf(listPrice, sweetSpot)
  const marginPct = marginPctOf(listPrice, sweetSpot)
  const tone = marginTone(listPrice, sweetSpot)
  const cheaperCount = Math.max(0, slot.rank - 1)
  const pricierCount = Math.max(0, m.poolSize - slot.rank + (slot.beyond ? 0 : 1))

  const range = priceRangeForSlot(targetSeite, targetPlatz)
  const rangeMid = range.max ? Math.round((range.min + range.max) / 2) : range.min
  const ruleEval = evaluateRule(rule)

  const expectedMargins = GLC_REPRICING_STRATEGY.steps.map((s) => s.margin)
  const corridorMin = Math.min(...expectedMargins)
  const corridorMax = Math.max(...expectedMargins)

  return (
    <Card className="border-border/60 overflow-hidden">
      {/* Gradient header */}
      <div className="relative px-5 pt-4 pb-3 bg-gradient-to-br from-indigo-50 via-card to-violet-50/40 dark:from-indigo-950/30 dark:via-card dark:to-violet-950/20 border-b border-border/60">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-sm shadow-indigo-500/20">
            <ListOrdered className="h-4 w-4 text-white" />
          </div>
          <h3 className="text-sm font-semibold">mobile.de Listenplatz-Rechner &amp; KI-Abpreisungsstrategie</h3>
          <Sparkles className="h-3.5 w-3.5 text-indigo-500 ml-auto" />
        </div>
        <p className="text-[11px] text-muted-foreground mt-1.5">
          {m.poolSize} vergleichbare {m.filterLabel} &middot; {m.pageSize} Inserate/Seite &middot; Sortierung: {m.sortLabel}
        </p>
      </div>

      <CardContent className="p-4 sm:p-5">
        <Tabs defaultValue="rechner">
          <TabsList className="mb-4">
            <TabsTrigger value="rechner">Rechner</TabsTrigger>
            <TabsTrigger value="strategie">KI-Strategie</TabsTrigger>
            <TabsTrigger value="automatik">Automatik</TabsTrigger>
          </TabsList>

          {/* ── RECHNER ── */}
          <TabsContent value="rechner" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(240px,0.8fr)] gap-5">
              {/* Left: simulator */}
              <div className="space-y-4">
                {/* Mode toggle */}
                <div className="flex w-full gap-1 rounded-lg border bg-muted p-1 sm:w-fit">
                  <button
                    onClick={() => setCalcMode('preis')}
                    className={`flex-1 sm:flex-none rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                      calcMode === 'preis' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Preis &rarr; Platz
                  </button>
                  <button
                    onClick={() => setCalcMode('platz')}
                    className={`flex-1 sm:flex-none rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                      calcMode === 'platz' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Platz &rarr; Preis
                  </button>
                </div>

                {calcMode === 'preis' ? (
                  <div className="space-y-3.5">
                    {/* Price + stepper */}
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Dein Verkaufspreis</Label>
                        <div className="relative mt-1 w-[160px]">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">€</span>
                          <Input
                            type="text"
                            inputMode="numeric"
                            value={listPrice.toLocaleString('de-DE')}
                            onChange={(e) => {
                              const n = Number(e.target.value.replace(/[^0-9]/g, ''))
                              if (n) onListPriceChange(n)
                            }}
                            className="pl-7 h-10 text-base font-bold tabular-nums"
                          />
                        </div>
                      </div>
                      <div className="flex gap-1.5">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          disabled={slot.rank <= 1}
                          onClick={() => onListPriceChange(priceForRank(slot.rank - 1))}
                          aria-label="Einen Platz nach oben (günstiger)"
                          title="Einen Listenplatz nach oben (günstiger)"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          disabled={slot.rank >= m.poolSize}
                          onClick={() => onListPriceChange(priceForRank(slot.rank + 1))}
                          aria-label="Einen Platz nach unten (teurer)"
                          title="Einen Listenplatz nach unten (teurer)"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Big readout */}
                    <div className="rounded-xl border border-border/60 bg-muted/30 p-4 text-center">
                      <p className="text-2xl font-bold tabular-nums">
                        {slot.beyond ? (
                          <>Seite {MAX_SEITE}+ &middot; hinter allen</>
                        ) : (
                          <>Seite {slot.seite} &middot; Platz {slot.platz}</>
                        )}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">von {MAX_SEITE} Seiten · Sortierung Preis aufsteigend</p>
                      <div className="mt-2 flex items-center justify-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${tone.dot}`} />
                        <span className={`text-sm font-semibold tabular-nums ${tone.text}`}>
                          Marge {margin >= 0 ? '+' : ''}{formatCurrency(margin)} ({marginPct.toFixed(1)}%)
                        </span>
                      </div>
                      {margin <= 0 && <p className="text-[10px] text-red-500 mt-1">Unter Einkaufspreis &mdash; Verlustgeschäft</p>}
                    </div>

                    {/* Markt-Leiste */}
                    <div>
                      <div className="relative h-6">
                        <div className="absolute top-1/2 left-0 right-0 h-1.5 -translate-y-1/2 rounded-full bg-gradient-to-r from-emerald-400 via-amber-300 to-red-400 opacity-60" />
                        {GLC_COMPARABLE_PRICES.map((p) => (
                          <span
                            key={p}
                            className="absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground/30 ring-1 ring-card"
                            style={{ left: `${barPos(p)}%` }}
                            title={`Vergleichsangebot ${formatCurrency(p)}`}
                          />
                        ))}
                        <span
                          className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600 ring-2 ring-card shadow"
                          style={{ left: `${barPos(listPrice)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-muted-foreground tabular-nums mt-1">
                        <span>{formatCurrency(BAR_MIN)}</span>
                        <span>{formatCurrency(BAR_MAX)}</span>
                      </div>
                      <input
                        type="range"
                        min={SLIDER_MIN}
                        max={SLIDER_MAX}
                        step={100}
                        value={Math.min(SLIDER_MAX, Math.max(SLIDER_MIN, listPrice))}
                        onChange={(e) => onListPriceChange(Number(e.target.value))}
                        className="mt-2 w-full accent-indigo-600"
                      />
                      <p className="text-[11px] text-muted-foreground mt-1">
                        <span className="tabular-nums">{cheaperCount}</span> günstiger vor dir &middot;{' '}
                        <span className="tabular-nums">{pricierCount}</span> teurer dahinter
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    <div className="flex items-end gap-3">
                      <div>
                        <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Ziel-Seite</Label>
                        <Select value={String(targetSeite)} onValueChange={(v) => setTargetSeite(Number(v))}>
                          <SelectTrigger className="mt-1 h-9 w-[110px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: MAX_SEITE }, (_, i) => i + 1).map((s) => (
                              <SelectItem key={s} value={String(s)}>Seite {s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Ziel-Platz</Label>
                        <Select value={String(targetPlatz)} onValueChange={(v) => setTargetPlatz(Number(v))}>
                          <SelectTrigger className="mt-1 h-9 w-[110px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: m.pageSize }, (_, i) => i + 1).map((p) => (
                              <SelectItem key={p} value={String(p)}>Platz {p}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="rounded-xl border border-border/60 bg-muted/30 p-4 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Verkaufspreis-Range</span>
                        <span className="text-sm font-bold tabular-nums">
                          {range.beyond ? `> ${formatCurrency(range.min)}` : `${formatCurrency(range.min)} – ${formatCurrency(range.max!)}`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Marge in Range</span>
                        <span className="text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                          {range.beyond
                            ? `> ${formatCurrency(marginOf(range.min, sweetSpot))}`
                            : `${formatCurrency(marginOf(range.min, sweetSpot))} – ${formatCurrency(marginOf(range.max!, sweetSpot))}`}
                        </span>
                      </div>
                      {targetPlatz <= 3 && targetSeite === 1 && (
                        <p className="text-[10px] text-muted-foreground">In diesem Preisbereich liegen viele Angebote dicht beieinander.</p>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-1"
                        onClick={() => onListPriceChange(rangeMid)}
                      >
                        Mittelwert {formatCurrency(rangeMid)} übernehmen
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Right: Staffelung-Leiter */}
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Staffelung</p>
                <div className="rounded-xl border border-border/60 divide-y divide-border/40 overflow-hidden">
                  {GLC_LADDER.map((rung) => {
                    const active = rung.price === listPrice
                    return (
                      <button
                        key={rung.price}
                        onClick={() => onListPriceChange(rung.price)}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-left text-xs transition-colors ${
                          active ? 'bg-primary/5 font-medium' : 'hover:bg-muted/50'
                        }`}
                      >
                        <span className="tabular-nums font-semibold w-[58px]">{formatCurrency(rung.price)}</span>
                        <span className="text-muted-foreground tabular-nums w-[78px]">
                          S{rung.seite}·Pl {rung.platz}
                        </span>
                        <span className="tabular-nums text-emerald-600 dark:text-emerald-400 flex-1 text-right">
                          +{formatCurrency(rung.margin)}
                        </span>
                        {active && <span className="text-[9px] text-primary shrink-0">aktuell</span>}
                      </button>
                    )
                  })}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1.5">Klick auf eine Stufe übernimmt den Preis.</p>
              </div>
            </div>
          </TabsContent>

          {/* ── KI-STRATEGIE ── */}
          <TabsContent value="strategie" className="mt-0">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-indigo-500" />
                <span className="text-sm font-medium">{GLC_REPRICING_STRATEGY.title}</span>
                <Badge className="text-[10px] border-0 bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                  <Sparkles className="h-2.5 w-2.5 mr-1" />KI-Empfehlung
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground">Strategie aktiv</Label>
                <Switch
                  checked={strategyActive}
                  onCheckedChange={(v) => {
                    setStrategyActive(v)
                    if (v) onListPriceChange(GLC_REPRICING_STRATEGY.steps[0].price)
                  }}
                />
              </div>
            </div>

            <div className="relative pl-5 space-y-4 before:absolute before:left-[7px] before:top-1.5 before:bottom-2 before:w-px before:bg-border">
              {GLC_REPRICING_STRATEGY.steps.map((step, i) => (
                <div key={step.day} className="relative">
                  <span className={`absolute -left-5 top-1 h-3.5 w-3.5 rounded-full ring-2 ring-card ${strategyActive ? 'bg-indigo-500' : 'bg-muted-foreground/40'}`} />
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-semibold">Tag {step.day}</span>
                      <span className="text-sm font-medium">{step.title}</span>
                    </div>
                    <span className="text-sm font-bold tabular-nums">{formatCurrency(step.price)}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                    <span className="text-[11px] text-muted-foreground tabular-nums">Seite {step.seite} · Platz {step.platz}</span>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 tabular-nums">
                      Marge +{formatCurrency(step.margin)} ({step.marginPct.toFixed(1)}%)
                    </span>
                    <button
                      onClick={() => onListPriceChange(step.price)}
                      className="text-[11px] font-medium text-primary hover:underline underline-offset-2 ml-auto inline-flex items-center gap-0.5"
                    >
                      {i === 0 ? 'Mit Startpreis inserieren' : 'Preis übernehmen'} <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Trigger: {step.trigger}</p>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground mt-4 pt-3 border-t border-border/40">
              Erwarteter Verkauf ~Tag {GLC_REPRICING_STRATEGY.expectedSaleDay} &middot; Marge-Korridor +{formatCurrency(corridorMin)} bis +{formatCurrency(corridorMax)}
            </p>
          </TabsContent>

          {/* ── AUTOMATIK ── */}
          <TabsContent value="automatik" className="mt-0">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium">Automatische Abpreisungs-Regel</span>
              <Badge variant="secondary" className="text-[10px]">Demo-Vorschau</Badge>
            </div>

            <div className="rounded-xl border border-border/60 bg-muted/30 p-4 space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span>Immer</span>
                <div className="relative w-[88px]">
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={rule.deltaEuro}
                    onChange={(e) => setRule((r) => ({ ...r, deltaEuro: Number(e.target.value.replace(/[^0-9]/g, '')) || 0 }))}
                    className="h-8 pr-6 text-sm tabular-nums"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">€</span>
                </div>
                <span>günstiger als</span>
                <Select value={String(rule.refPlatz)} onValueChange={(v) => setRule((r) => ({ ...r, refPlatz: Number(v) }))}>
                  <SelectTrigger className="h-8 w-[100px] text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: m.pageSize }, (_, i) => i + 1).map((p) => (
                      <SelectItem key={p} value={String(p)}>Platz {p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span>auf</span>
                <Select value={String(rule.refSeite)} onValueChange={(v) => setRule((r) => ({ ...r, refSeite: Number(v) }))}>
                  <SelectTrigger className="h-8 w-[100px] text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: MAX_SEITE }, (_, i) => i + 1).map((s) => (
                      <SelectItem key={s} value={String(s)}>Seite {s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                <span className="text-muted-foreground">Neu bewerten</span>
                <Select value={String(rule.reevalDays)} onValueChange={(v) => setRule((r) => ({ ...r, reevalDays: Number(v) }))}>
                  <SelectTrigger className="h-7 w-[120px] text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[7, 14, 30, 45].map((d) => (
                      <SelectItem key={d} value={String(d)}>alle {d} Tage</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="ml-auto flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">Regel aktiv</Label>
                  <Switch checked={rule.active} onCheckedChange={(v) => setRule((r) => ({ ...r, active: v }))} />
                </div>
              </div>

              <Separator />

              <p className="text-xs">
                <span className="text-muted-foreground">Aktuell ergäbe das: </span>
                <span className="font-semibold tabular-nums">{formatCurrency(ruleEval.price)}</span>
                <span className="text-muted-foreground"> &rarr; </span>
                <span className="tabular-nums">Seite {ruleEval.slot.seite} · Platz {ruleEval.slot.platz}</span>
                <span className="text-muted-foreground"> · </span>
                <span className="tabular-nums text-emerald-600 dark:text-emerald-400">Marge +{formatCurrency(ruleEval.margin)}</span>
              </p>
              <p className="text-[10px] text-muted-foreground">
                Referenzpreis Seite {rule.refSeite} · Platz {rule.refPlatz}: {formatCurrency(ruleEval.refPrice)} · Nächste Prüfung: in {rule.reevalDays} Tagen (Demo)
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer CTA — always visible */}
        <div className="mt-4 pt-3 border-t border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Gewählter Inseratspreis:{' '}
            <span className="font-semibold text-foreground tabular-nums">{formatCurrency(listPrice)}</span>{' '}
            &middot; Marge{' '}
            <span className={`font-semibold tabular-nums ${tone.text}`}>{margin >= 0 ? '+' : ''}{formatCurrency(margin)}</span>
          </p>
          <Button
            onClick={() => onInserat(listPrice)}
            size="sm"
            className="shrink-0 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white"
          >
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            Mit diesem Preis inserieren
            <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
