'use client'

import { useState } from 'react'
import { Phone, Copy, Check, Info, ExternalLink } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const AGENT_PHONE = '+1 318 599 6049'
const AGENT_PHONE_TEL = 'tel:+13185996049'

export function CallcenterVoiceTestDialog() {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText('+13185996049')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 border-violet-200 text-violet-700 hover:bg-violet-50 hover:text-violet-800 dark:border-violet-800 dark:text-violet-400 dark:hover:bg-violet-950/30">
          <Phone className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">KI Voice Agent Test</span>
          <span className="sm:hidden">Voice Test</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-violet-100 dark:bg-violet-950/30">
              <Phone className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            </div>
            KI Voice Agent — Testanruf
          </DialogTitle>
          <DialogDescription>
            Testen Sie unseren KI Voice Agent, indem Sie die folgende Nummer anrufen.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Phone number display */}
          <div className="rounded-xl border-2 border-violet-200 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-950/20 p-5 text-center">
            <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide mb-2">
              Testnummer anrufen
            </p>
            <div className="flex items-center justify-center gap-2.5">
              <span className="text-xl" title="USA">🇺🇸</span>
              <p className="text-2xl font-bold text-violet-700 dark:text-violet-300 tracking-wide font-mono">
                {AGENT_PHONE}
              </p>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Vereinigte Staaten (USA)</p>
            <div className="flex items-center justify-center gap-2 mt-3">
              {/* Mobile: call button */}
              <a href={AGENT_PHONE_TEL} className="sm:hidden">
                <Button size="sm" className="gap-2 bg-violet-600 hover:bg-violet-700">
                  <Phone className="h-3.5 w-3.5" />
                  Jetzt anrufen
                </Button>
              </a>
              {/* Desktop + Mobile: copy button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="gap-2"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    Kopiert
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Nummer kopieren
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Cost info */}
          <div className="rounded-lg border bg-card p-3.5 space-y-2.5">
            <div className="flex items-center gap-2">
              <Info className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              <p className="text-xs font-semibold">Anrufkosten (DE → USA)</p>
            </div>
            <div className="overflow-hidden rounded-md border">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left px-3 py-1.5 font-medium text-muted-foreground">Dauer</th>
                    <th className="text-right px-3 py-1.5 font-medium text-muted-foreground">Festnetz</th>
                    <th className="text-right px-3 py-1.5 font-medium text-muted-foreground">Mobilfunk</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr>
                    <td className="px-3 py-1.5">1 Minute</td>
                    <td className="px-3 py-1.5 text-right font-medium">ca. 0,09 €</td>
                    <td className="px-3 py-1.5 text-right font-medium">ca. 0,49 €</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-1.5">3 Minuten</td>
                    <td className="px-3 py-1.5 text-right font-medium">ca. 0,27 €</td>
                    <td className="px-3 py-1.5 text-right font-medium">ca. 1,47 €</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-1.5">5 Minuten</td>
                    <td className="px-3 py-1.5 text-right font-medium">ca. 0,45 €</td>
                    <td className="px-3 py-1.5 text-right font-medium">ca. 2,45 €</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Durchschnitt über gängige Anbieter (Telekom, Vodafone, O2). Festnetz ca. 3–9 ct/Min., Mobilfunk ca. 9–109 ct/Min.
              Viele Flatrate-Tarife beinhalten USA-Gespräche bereits kostenlos.
            </p>
          </div>

          {/* Test notice */}
          <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 px-3.5 py-2.5">
            <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
              <span className="font-semibold">Hinweis:</span> Dies ist eine US-Testnummer für die Demo.
              Für den Produktivbetrieb wird der KI Voice Agent mit Ihrer hauseigenen deutschen Rufnummer verbunden —
              Ihre Kunden rufen dann wie gewohnt Ihre lokale Nummer an.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
