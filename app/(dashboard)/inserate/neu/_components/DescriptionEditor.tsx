'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu'
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { mercedesListingCreationAiMock as MOCK_AI } from '@/lib/mercedes-inventory'
import { equipmentGroups } from '@/lib/inserate-foto-mock'
import {
  ausstattungCategories,
  ausstattungVariants,
  ausstattungPositions,
  buildAusstattungBlock,
  insertAusstattungBlock,
  confidenceBreakdown,
  type AusstattungCategory,
  type AusstattungVariant,
  type InsertPosition,
} from '@/lib/inserate-ki-mock'
import {
  Sparkles,
  Wand2,
  Loader2,
  CheckCircle2,
  Check,
  RefreshCw,
  ListPlus,
  Star,
  ChevronRight,
} from 'lucide-react'

const PLACEHOLDER =
  'Beschreiben Sie das Fahrzeug – Zustand, Highlights, Ausstattung und Verkaufsargumente. ' +
  'Oder lassen Sie die KI eine überzeugende Beschreibung generieren und fügen Sie passende ' +
  'Ausstattung mit einem Klick ein.'

// floor, not round: 94 % must not fill all 5 stars (that reads as a perfect score).
const CONFIDENCE_STARS = Math.floor(MOCK_AI.confidence / 20)

export function DescriptionEditor() {
  const [desc, setDesc] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)
  const [improving, setImproving] = useState(false)
  const [improved, setImproved] = useState(false)

  const handleGenerate = () => {
    setGenerating(true)
    setImproved(false)
    setTimeout(() => {
      setDesc(MOCK_AI.description)
      setGenerating(false)
      setGenerated(true)
    }, 2200)
  }

  const handleImprove = () => {
    setImproving(true)
    setTimeout(() => {
      setDesc(MOCK_AI.improvedDescription)
      setImproving(false)
      setImproved(true)
    }, 1800)
  }

  // Granular single-item / whole-group insert (kept from the original toolbar).
  const appendItem = (name: string) => {
    setDesc((prev) => {
      const sep = prev && !prev.endsWith('\n') ? '\n' : ''
      return `${prev}${sep}• ${name}\n`
    })
    setImproved(false)
  }
  const appendGroup = (title: string, names: string[]) => {
    const block = `${title}:\n${names.map((n) => `• ${n}`).join('\n')}`
    setDesc((prev) => insertAusstattungBlock(prev, block, 'ende'))
    setImproved(false)
  }

  // DAT-Ausstattung block insert (Kategorie → Bereinigung → Position).
  const insertDat = (
    category: AusstattungCategory,
    variant: AusstattungVariant,
    position: InsertPosition,
  ) => {
    const block = buildAusstattungBlock(category, variant)
    setDesc((prev) => insertAusstattungBlock(prev, block, position))
    setImproved(false)
  }

  const busy = generating || improving

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between gap-2 text-sm">
          <span className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Beschreibung
          </span>
          {improved && !improving && (
            <Badge className="animate-in fade-in slide-in-from-top-1 border-0 bg-emerald-50 text-[10px] font-normal text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
              <CheckCircle2 className="mr-1 h-2.5 w-2.5" />
              Verbessert
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Editor */}
        <div className="relative">
          <Textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder={PLACEHOLDER}
            aria-label="Fahrzeugbeschreibung"
            disabled={busy}
            className={cn(
              'min-h-[260px] resize-y whitespace-pre-wrap text-sm leading-relaxed',
              generated && 'animate-in fade-in',
            )}
          />
          {busy && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-md bg-card/70 backdrop-blur-[1px] animate-in fade-in">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-xs font-medium text-muted-foreground">
                {generating ? 'KI erstellt eine Beschreibung…' : 'Text wird verbessert…'}
              </span>
            </div>
          )}
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleGenerate} disabled={busy} size="sm" className="h-8">
            {generating ? (
              <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Generiere…</>
            ) : generated ? (
              <><RefreshCw className="mr-1.5 h-3.5 w-3.5" />Neu generieren</>
            ) : (
              <><Sparkles className="mr-1.5 h-3.5 w-3.5" />KI-Beschreibung generieren</>
            )}
          </Button>

          <Button
            onClick={handleImprove}
            disabled={busy || desc.trim().length === 0}
            size="sm"
            variant="outline"
            className={cn('h-8', improved && 'border-emerald-300 text-emerald-600 dark:border-emerald-800')}
          >
            {improving ? (
              <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Verbessere…</>
            ) : improved ? (
              <><CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />Verbessert</>
            ) : (
              <><Wand2 className="mr-1.5 h-3.5 w-3.5" />Verbessern</>
            )}
          </Button>

          {/* DAT-Ausstattung — Kategorie → Bereinigung → Position */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" disabled={busy} className="h-8">
                <ListPlus className="mr-1.5 h-3.5 w-3.5" />
                Ausstattung einfügen
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64 max-w-[calc(100vw-1.5rem)]">
              <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-muted-foreground">
                DAT Ausstattungen
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              {ausstattungCategories.map((cat) => (
                <DropdownMenuSub key={cat.key}>
                  <DropdownMenuSubTrigger>
                    <span className="flex-1 truncate">{cat.label}</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-60">
                    {ausstattungVariants.map((variant) => (
                      <DropdownMenuSub key={variant.key}>
                        <DropdownMenuSubTrigger>
                          <span className="flex-1 truncate">{variant.label}</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="w-52">
                          {ausstattungPositions.map((pos) => (
                            <DropdownMenuItem
                              key={pos.key}
                              onSelect={() => insertDat(cat.key, variant.key, pos.key)}
                            >
                              <ChevronRight className="mr-2 h-3.5 w-3.5 text-muted-foreground/50" />
                              {pos.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              ))}

              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Einzelne Positionen
              </DropdownMenuLabel>
              {equipmentGroups.map((group) => {
                const names = group.items.map((i) => i.name)
                return (
                  <DropdownMenuSub key={group.key}>
                    <DropdownMenuSubTrigger>
                      <span className="flex-1 truncate">{group.title}</span>
                      <Badge variant="secondary" className="ml-2 text-[10px] font-normal">
                        {names.length}
                      </Badge>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="max-h-72 w-64 overflow-y-auto">
                      <DropdownMenuItem
                        onSelect={() => appendGroup(group.title, names)}
                        className="font-semibold text-primary"
                      >
                        <ListPlus className="mr-2 h-3.5 w-3.5" />
                        Alle einfügen
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {group.items.map((item) => (
                        <DropdownMenuItem key={item.name} onSelect={() => appendItem(item.name)}>
                          <Check className="mr-2 h-3.5 w-3.5 text-muted-foreground/50" />
                          <span className="truncate">{item.name}</span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Footer: confidence (with breakdown popover) + character count */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3">
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="group flex items-center gap-2 rounded-md px-1 py-0.5 -mx-1 transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                aria-label="Warum diese Konfidenz?"
              >
                <span className="flex">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className={cn(
                        'h-3.5 w-3.5',
                        i <= CONFIDENCE_STARS ? 'fill-amber-500 text-amber-500' : 'text-muted-foreground/30',
                      )}
                    />
                  ))}
                </span>
                <span className="text-xs text-muted-foreground underline decoration-dotted decoration-muted-foreground/40 underline-offset-4 group-hover:text-foreground">
                  {MOCK_AI.confidence}% Konfidenz
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-80">
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">KI-Konfidenz {confidenceBreakdown.score}%</p>
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Beschreibung</span>
                  </div>
                  <Progress value={confidenceBreakdown.score} className="mt-1.5 h-1.5" />
                </div>

                <div className="space-y-1.5">
                  <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Wodurch abgesichert</p>
                  {confidenceBreakdown.solid.map((f) => (
                    <div key={f.label} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                      <p className="text-xs leading-snug">
                        <span className="font-medium">{f.label}.</span>{' '}
                        <span className="text-muted-foreground">{f.detail}</span>
                      </p>
                    </div>
                  ))}
                </div>

                <div className="space-y-1.5">
                  <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Was die Konfidenz begrenzt</p>
                  {confidenceBreakdown.limits.map((f) => (
                    <div key={f.label} className="flex items-start gap-2">
                      <span className="mt-0.5 flex h-3.5 w-6 shrink-0 items-center justify-center rounded bg-amber-100 text-[9px] font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                        −{f.impact}
                      </span>
                      <p className="text-xs leading-snug">
                        <span className="font-medium">{f.label}.</span>{' '}
                        <span className="text-muted-foreground">{f.detail}</span>
                      </p>
                    </div>
                  ))}
                </div>

                <p className="rounded-md bg-primary/5 px-2.5 py-2 text-[11px] leading-relaxed text-foreground/80">
                  {confidenceBreakdown.toReach100}
                </p>
              </div>
            </PopoverContent>
          </Popover>

          <span className="text-[10px] uppercase tracking-widest text-muted-foreground tabular-nums">
            {desc.length.toLocaleString('de-DE')} Zeichen
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
