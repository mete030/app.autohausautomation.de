'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
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
import { cn } from '@/lib/utils'
import { mercedesListingCreationAiMock as MOCK_AI } from '@/lib/mercedes-inventory'
import { equipmentGroups } from '@/lib/inserate-foto-mock'
import {
  Sparkles,
  Wand2,
  Loader2,
  CheckCircle2,
  Check,
  RefreshCw,
  ListPlus,
  Star,
} from 'lucide-react'

const PLACEHOLDER =
  'Beschreiben Sie das Fahrzeug – Zustand, Highlights, Ausstattung und Verkaufsargumente. ' +
  'Oder lassen Sie die KI eine überzeugende Beschreibung generieren und fügen Sie passende ' +
  'Ausstattung mit einem Klick ein.'

const CONFIDENCE_STARS = Math.round(MOCK_AI.confidence / 20)

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

  const appendItem = (name: string) => {
    setDesc(prev => `${prev}• ${name}\n`)
    setImproved(false)
  }

  const appendGroup = (title: string, names: string[]) => {
    const block = `\n${title}:\n${names.map(n => `• ${n}`).join('\n')}\n`
    setDesc(prev => `${prev}${block}`)
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
            <Badge className="text-[10px] font-normal bg-emerald-50 text-emerald-700 border-0 dark:bg-emerald-950/30 dark:text-emerald-400 animate-in fade-in slide-in-from-top-1">
              <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
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
            onChange={e => setDesc(e.target.value)}
            placeholder={PLACEHOLDER}
            disabled={busy}
            className={cn(
              'min-h-[260px] leading-relaxed text-sm whitespace-pre-wrap resize-y',
              generated && 'animate-in fade-in',
            )}
          />
          {busy && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-md bg-card/70 backdrop-blur-[1px] animate-in fade-in">
              <Loader2 className="h-5 w-5 text-primary animate-spin" />
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
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Generiere…
              </>
            ) : generated ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                Neu generieren
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                KI-Beschreibung generieren
              </>
            )}
          </Button>

          <Button
            onClick={handleImprove}
            disabled={busy || desc.trim().length === 0}
            size="sm"
            variant="outline"
            className={cn(
              'h-8',
              improved && 'text-emerald-600 border-emerald-300 dark:border-emerald-800',
            )}
          >
            {improving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Verbessere…
              </>
            ) : improved ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                Verbessert
              </>
            ) : (
              <>
                <Wand2 className="h-3.5 w-3.5 mr-1.5" />
                Verbessern
              </>
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" disabled={busy} className="h-8">
                <ListPlus className="h-3.5 w-3.5 mr-1.5" />
                Ausstattung einfügen
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-60 max-w-[calc(100vw-1.5rem)]">
              <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-muted-foreground">
                In Beschreibung einfügen
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {equipmentGroups.map(group => {
                const names = group.items.map(i => i.name)
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
                        <ListPlus className="h-3.5 w-3.5 mr-2" />
                        Alle einfügen
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {group.items.map(item => (
                        <DropdownMenuItem
                          key={item.name}
                          onSelect={() => appendItem(item.name)}
                        >
                          <Check className="h-3.5 w-3.5 mr-2 text-muted-foreground/50" />
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

        {/* Footer: confidence + character count */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3">
          <div className="flex items-center gap-2">
            <div className="flex">
              {[1, 2, 3, 4, 5].map(i => (
                <Star
                  key={i}
                  className={cn(
                    'h-3.5 w-3.5',
                    i <= CONFIDENCE_STARS
                      ? 'text-amber-500 fill-amber-500'
                      : 'text-muted-foreground/30',
                  )}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">
              {MOCK_AI.confidence}% Konfidenz
            </span>
          </div>
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground tabular-nums">
            {desc.length.toLocaleString('de-DE')} Zeichen
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
