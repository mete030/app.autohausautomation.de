'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { mercedesListingCreationVinMock as VIN_MOCK } from '@/lib/mercedes-inventory'
import { POSITION_COUNT } from '@/lib/inserate-foto-mock'
import {
  ArrowLeft, ScanLine, Pencil, ChevronRight, ShoppingCart,
  CheckCircle2, FileText, Images, Loader2, Sparkles,
} from 'lucide-react'
import { DatenTab } from './_components/DatenTab'
import { FotosTab } from './_components/FotosTab'

type InputMode = 'choose' | 'vin' | 'manual'
type VinStatus = 'idle' | 'loading' | 'found'

export default function NeuesInseratPage() {
  const [inputMode, setInputMode] = useState<InputMode>('choose')
  const [tab, setTab] = useState<'daten' | 'fotos'>('daten')

  // Vehicle identification (lifted here so it survives Daten↔Fotos tab switches).
  const [vin, setVin] = useState('')
  const [vinStatus, setVinStatus] = useState<VinStatus>('idle')
  const [vinData, setVinData] = useState<typeof VIN_MOCK | null>(null)

  const [fromEinkauf, setFromEinkauf] = useState<{
    suggestedPrice?: string
    mileage?: number
  } | null>(null)

  // Prefill from the Einkauf flow (handed over via sessionStorage) → straight to
  // an identified vehicle so the Daten/Fotos tabs appear immediately.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const raw = sessionStorage.getItem('inserat-prefill')
    if (!raw) return
    try {
      const data = JSON.parse(raw) as {
        source?: string
        suggestedPrice?: string
        mileage?: number
        createdAt?: number
      }
      if (data.source !== 'einkauf' || !data.createdAt || Date.now() - data.createdAt > 5 * 60 * 1000) {
        sessionStorage.removeItem('inserat-prefill')
        return
      }
      /* eslint-disable react-hooks/set-state-in-effect -- one-time sessionStorage hydration (browser-only) */
      setFromEinkauf({ suggestedPrice: data.suggestedPrice, mileage: data.mileage })
      setInputMode('vin')
      setVin(VIN_MOCK.vin)
      setVinStatus('found')
      setVinData(VIN_MOCK)
      /* eslint-enable react-hooks/set-state-in-effect */
      sessionStorage.removeItem('inserat-prefill')
    } catch {
      sessionStorage.removeItem('inserat-prefill')
    }
  }, [])

  const handleVinLookup = () => {
    setVinStatus('loading')
    setTimeout(() => {
      setVinData(VIN_MOCK)
      setVinStatus('found')
      setTab('daten')
    }, 2200)
  }

  const resetVin = () => {
    setVinStatus('idle')
    setVinData(null)
    setVin('')
    setTab('daten')
  }

  const selectMode = (m: 'vin' | 'manual') => {
    setInputMode(m)
    setTab('daten')
    if (m === 'vin') resetVin()
  }

  // A vehicle is "identified" → reveal the Daten/Fotos tabs.
  const identified = inputMode === 'manual' || (inputMode === 'vin' && vinStatus === 'found')
  const showModeSwitcher = inputMode === 'manual' || (inputMode === 'vin' && vinStatus !== 'found')
  const showVinLookup = inputMode === 'vin' && vinStatus !== 'found'

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/inserate"
          className="group inline-flex h-10 items-center gap-1.5 rounded-lg border border-border/60 bg-card pl-2 pr-3 text-sm font-medium text-muted-foreground shadow-sm transition-all hover:border-primary/40 hover:bg-primary/[0.04] hover:text-primary hover:shadow-md"
          aria-label="Zurück zu Inserate"
        >
          <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
          <span className="hidden sm:inline">Zurück</span>
        </Link>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold leading-tight tracking-tight">Neues Inserat</h1>
          <p className="text-sm text-muted-foreground">KI-unterstützte Inserat-Erstellung</p>
        </div>
      </div>

      {/* Prefill banner from Einkauf */}
      {fromEinkauf && (
        <div className="rounded-xl border border-indigo-200/70 bg-gradient-to-r from-indigo-50 via-card to-violet-50/40 px-4 py-3 dark:border-indigo-900/50 dark:from-indigo-950/30 dark:via-card dark:to-violet-950/20 animate-in fade-in slide-in-from-top-2 duration-500">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 shadow-sm">
              <ShoppingCart className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium leading-tight">Aus der Einkauf-Bewertung übernommen</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Fahrzeugdaten &amp; Ausstattung sind vorausgefüllt &middot; Vorgeschlagener Preis:{' '}
                <span className="font-medium text-foreground">€&nbsp;{fromEinkauf.suggestedPrice ? Number(fromEinkauf.suggestedPrice).toLocaleString('de-DE') : '—'}</span>
              </p>
            </div>
            <Badge variant="secondary" className="hidden shrink-0 border-0 bg-emerald-50 text-[10px] font-normal text-emerald-700 sm:inline-flex dark:bg-emerald-950/30 dark:text-emerald-400">
              <CheckCircle2 className="mr-1 h-2.5 w-2.5" />
              Vorausgefüllt
            </Badge>
          </div>
        </div>
      )}

      {/* ─── Step 1: choose input mode ────────────────────────────────────── */}
      {inputMode === 'choose' && (
        <div className="mx-auto max-w-xl py-10">
          <p className="mb-8 text-center text-sm text-muted-foreground">
            Wie möchten Sie die Fahrzeugdaten erfassen?
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <button
              onClick={() => selectMode('vin')}
              className="group relative rounded-2xl border-2 border-border bg-card p-6 text-left transition-all hover:border-primary hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                <ScanLine className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-1.5 font-semibold">VIN-Abfrage</h3>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Fahrzeugdaten automatisch per Fahrgestellnummer abrufen
              </p>
              <ChevronRight className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/30 transition-colors group-hover:text-primary" />
            </button>

            <button
              onClick={() => selectMode('manual')}
              className="group relative rounded-2xl border-2 border-border bg-card p-6 text-left transition-all hover:border-primary hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                <Pencil className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-1.5 font-semibold">Manuell eingeben</h3>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Fahrzeugdaten, Ausstattung und Details selbst erfassen
              </p>
              <ChevronRight className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/30 transition-colors group-hover:text-primary" />
            </button>
          </div>
        </div>
      )}

      {/* ─── Step 2: identify (VIN) then Daten / Fotos tabs ───────────────── */}
      {inputMode !== 'choose' && (
        <div className="space-y-5">

          {/* Mode switcher (hidden once a VIN vehicle is identified) */}
          {showModeSwitcher && (
            <div className="flex w-full gap-1 rounded-lg border bg-muted p-1 sm:w-fit">
              <button
                onClick={() => selectMode('vin')}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all sm:flex-none ${
                  inputMode === 'vin' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <ScanLine className="h-3.5 w-3.5" />
                VIN-Abfrage
              </button>
              <button
                onClick={() => selectMode('manual')}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all sm:flex-none ${
                  inputMode === 'manual' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Pencil className="h-3.5 w-3.5" />
                Manuell
              </button>
            </div>
          )}

          {/* VIN lookup — the step BEFORE the tabs appear */}
          {showVinLookup && (
            <Card className="animate-in fade-in slide-in-from-top-2">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <ScanLine className="h-4 w-4 text-primary" />
                  VIN / Fahrgestellnummer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    placeholder="z.B. W1N2546021F789012"
                    value={vin}
                    onChange={e => setVin(e.target.value.toUpperCase())}
                    className="font-mono text-sm tracking-wider"
                    maxLength={17}
                    disabled={vinStatus === 'loading'}
                  />
                  <Button
                    onClick={handleVinLookup}
                    disabled={vin.length < 5 || vinStatus === 'loading'}
                    className="shrink-0"
                  >
                    {vinStatus === 'loading'
                      ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Abfragen...</>
                      : <><ScanLine className="mr-2 h-4 w-4" />Abfragen</>}
                  </Button>
                </div>
                {vinStatus === 'loading' && (
                  <div className="space-y-2 animate-in fade-in">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Fahrzeugdaten werden abgerufen...
                    </div>
                    <Progress value={66} className="h-1" />
                  </div>
                )}
                {vinStatus === 'idle' && (
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground">
                      Demo: Geben Sie min. 5 Zeichen ein und klicken Sie auf Abfragen.
                    </p>
                    <button
                      type="button"
                      onClick={() => setVin(VIN_MOCK.vin)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-primary underline-offset-2 hover:underline"
                    >
                      <Sparkles className="h-3 w-3" />
                      Demo-VIN nutzen
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Daten / Fotos tabs — only once a vehicle is identified.
              forceMount keeps both panels mounted so their state (VIN data,
              description, equipment, photos) survives switching tabs. */}
          {identified && (
            <Tabs
              value={tab}
              onValueChange={v => setTab(v as 'daten' | 'fotos')}
              className="gap-6 animate-in fade-in slide-in-from-top-2"
            >
              <TabsList className="h-10 w-full justify-start sm:w-fit">
                <TabsTrigger value="daten" className="gap-1.5 px-4">
                  <FileText className="h-4 w-4" />
                  Fahrzeugdaten
                </TabsTrigger>
                <TabsTrigger value="fotos" className="gap-1.5 px-4">
                  <Images className="h-4 w-4" />
                  Fotos
                  <Badge variant="secondary" className="ml-1 h-5 rounded-full px-1.5 text-[10px] font-normal tabular-nums">
                    {POSITION_COUNT}
                  </Badge>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="daten" forceMount className="data-[state=inactive]:hidden">
                <DatenTab
                  mode={inputMode === 'manual' ? 'manual' : 'vin'}
                  vinData={vinData}
                  fromEinkauf={fromEinkauf}
                  onResetVin={resetVin}
                />
              </TabsContent>

              <TabsContent value="fotos" forceMount className="data-[state=inactive]:hidden">
                <FotosTab />
              </TabsContent>
            </Tabs>
          )}
        </div>
      )}
    </div>
  )
}
