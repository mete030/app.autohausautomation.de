'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { priceCategoryConfig } from '@/lib/constants'
import {
  mercedesExtraOptions as EXTRA_OPTIONS,
  mercedesListingCreationAiMock as MOCK_AI,
  mercedesListingCreationImageSlots as IMAGE_SLOTS,
  mercedesListingCreationVinMock as VIN_MOCK,
  mercedesSeriesOptions as SERIES_OPTIONS,
} from '@/lib/mercedes-inventory'
import { formatCurrency } from '@/lib/utils'
import {
  ArrowLeft, Sparkles, RefreshCw, Check, Star, Upload, ImagePlus,
  ScanLine, Pencil, Loader2, X, Wand2,
  Scissors, Zap, ExternalLink, CheckCircle2, ChevronRight, Plus,
  Camera, Images,
} from 'lucide-react'

// ─── Platform Brand Icons ────────────────────────────────────────────────────

const MobileDeIcon = ({ size = 40 }: { size?: number }) => (
  <div
    className="rounded-2xl flex items-center justify-center shrink-0"
    style={{ width: size, height: size, background: '#FF6600' }}
  >
    <svg viewBox="0 0 24 24" style={{ width: size * 0.58, height: size * 0.58 }} fill="white">
      <path d="M18.92 6.01L15 2H9L5.08 6.01C4.4 6.73 4 7.7 4 8.75V19c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8.75c0-1.05-.4-2.02-1.08-2.74zM12 17.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 12.5 12 12.5s2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5zM9.5 7l1.5-3h2l1.5 3h-5z" />
    </svg>
  </div>
)

const AutoScout24Icon = ({ size = 40 }: { size?: number }) => (
  <div
    className="rounded-2xl flex items-center justify-center shrink-0"
    style={{ width: size, height: size, background: '#003F87' }}
  >
    <svg viewBox="0 0 24 24" style={{ width: size * 0.58, height: size * 0.58 }} fill="none">
      <circle cx="10.5" cy="10" r="6" stroke="white" strokeWidth="2" />
      <line x1="15" y1="14.5" x2="21" y2="20.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M7.5 10.5h6M8.5 8.5l.9-1.5h2.2l.9 1.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9.2" cy="11.8" r="0.9" fill="white" />
      <circle cx="12.8" cy="11.8" r="0.9" fill="white" />
    </svg>
  </div>
)

const TruckScout24Icon = ({ size = 40 }: { size?: number }) => (
  <div
    className="rounded-2xl flex items-center justify-center shrink-0"
    style={{ width: size, height: size, background: '#009C3B' }}
  >
    <svg viewBox="0 0 24 24" style={{ width: size * 0.58, height: size * 0.58 }} fill="white">
      <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9 1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
    </svg>
  </div>
)

const EXPORT_PLATFORMS = [
  {
    id: 'mobile_de',
    name: 'mobile.de',
    description: 'Größter deutscher Automarkt',
    icon: <MobileDeIcon size={44} />,
    borderColor: 'border-orange-200 dark:border-orange-800',
    bgColor: 'bg-orange-50 dark:bg-orange-950/30',
    btnStyle: { background: '#FF6600' } as React.CSSProperties,
    btnHoverClass: 'hover:opacity-90',
  },
  {
    id: 'autoscout24',
    name: 'AutoScout24',
    description: 'Europäisches Automarktportal',
    icon: <AutoScout24Icon size={44} />,
    borderColor: 'border-blue-200 dark:border-blue-900',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    btnStyle: { background: '#003F87' } as React.CSSProperties,
    btnHoverClass: 'hover:opacity-90',
  },
  {
    id: 'truckscout24',
    name: 'TruckScout24',
    description: 'Nutzfahrzeuge & Transporter',
    icon: <TruckScout24Icon size={44} />,
    borderColor: 'border-emerald-200 dark:border-emerald-800',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    btnStyle: { background: '#009C3B' } as React.CSSProperties,
    btnHoverClass: 'hover:opacity-90',
  },
]

const EXTRA_OPTIONS_LIST: readonly string[] = EXTRA_OPTIONS

// ─── Types ────────────────────────────────────────────────────────────────────

type InputMode = 'choose' | 'vin' | 'manual'
type VinStatus = 'idle' | 'loading' | 'found'
type EnhancementType = 'cutout' | 'background' | 'quality'
type SlotState = 'original' | EnhancementType
type ExportStatus = 'idle' | 'exporting' | 'done'

// ─── Component ────────────────────────────────────────────────────────────────

export default function NeuesInseratPage() {
  // Mode
  const [inputMode, setInputMode] = useState<InputMode>('choose')

  // VIN
  const [vin, setVin] = useState('')
  const [vinStatus, setVinStatus] = useState<VinStatus>('idle')
  const [vinData, setVinData] = useState<typeof VIN_MOCK | null>(null)

  // Manual form
  const [formData, setFormData] = useState({
    make: '', model: '', year: '', mileage: '', power: '', displacement: '',
    fuelType: '', transmission: '', color: '', doors: '', seats: '',
    firstRegistration: '', hu: '', licensePlate: '', price: '',
  })
  const [selectedSeries, setSelectedSeries] = useState<string[]>([])
  const [selectedExtras, setSelectedExtras] = useState<string[]>([])
  const [customExtra, setCustomExtra] = useState('')

  // AI
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)
  const [activeDescription, setActiveDescription] = useState('')
  const [improvingDesc, setImprovingDesc] = useState(false)
  const [descImproved, setDescImproved] = useState(false)
  const [kycScore, setKycScore] = useState<number>(MOCK_AI.kycScore)
  const [improvingKyc, setImprovingKyc] = useState(false)
  const [kycImproved, setKycImproved] = useState(false)

  // Images — which version is currently showing per slot
  const [slotStates, setSlotStates] = useState<Record<number, SlotState>>({
    0: 'original', 1: 'original', 2: 'original',
  })
  const [processingSlot, setProcessingSlot] = useState<Record<number, EnhancementType | null>>({
    0: null, 1: null, 2: null,
  })

  // Export
  const [inseratCreated, setInseratCreated] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [exportStatus, setExportStatus] = useState<Record<string, ExportStatus>>({
    mobile_de: 'idle', autoscout24: 'idle', truckscout24: 'idle',
  })

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleVinLookup = () => {
    setVinStatus('loading')
    setTimeout(() => {
      setVinData(VIN_MOCK)
      setVinStatus('found')
    }, 2200)
  }

  const handleGenerate = () => {
    setGenerating(true)
    setTimeout(() => {
      setGenerating(false)
      setGenerated(true)
      setActiveDescription(MOCK_AI.description)
    }, 2200)
  }

  const handleImproveDescription = () => {
    setImprovingDesc(true)
    setTimeout(() => {
      setImprovingDesc(false)
      setDescImproved(true)
      setActiveDescription(MOCK_AI.improvedDescription)
    }, 1800)
  }

  const handleImproveKyc = () => {
    setImprovingKyc(true)
    setTimeout(() => {
      setImprovingKyc(false)
      setKycImproved(true)
      setKycScore(MOCK_AI.improvedKycScore)
    }, 1500)
  }

  const handleEnhance = (imageId: number, type: EnhancementType) => {
    if (processingSlot[imageId] !== null) return
    setProcessingSlot(prev => ({ ...prev, [imageId]: type }))
    setTimeout(() => {
      setSlotStates(prev => ({ ...prev, [imageId]: type }))
      setProcessingSlot(prev => ({ ...prev, [imageId]: null }))
    }, 1600)
  }

  const handleCreateInserat = () => {
    setInseratCreated(true)
    setShowExport(true)
  }

  const handleExport = (platformId: string) => {
    setExportStatus(prev => ({ ...prev, [platformId]: 'exporting' }))
    setTimeout(() => {
      setExportStatus(prev => ({ ...prev, [platformId]: 'done' }))
    }, 2200)
  }

  const toggleSeries = (item: string) =>
    setSelectedSeries(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item])

  const toggleExtra = (item: string) =>
    setSelectedExtras(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item])

  const addCustomExtra = () => {
    const val = customExtra.trim()
    if (val && !selectedExtras.includes(val)) {
      setSelectedExtras(prev => [...prev, val])
      setCustomExtra('')
    }
  }

  const setField = (key: keyof typeof formData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setFormData(prev => ({ ...prev, [key]: e.target.value }))

  const showFormContent = inputMode === 'manual' || (inputMode === 'vin' && vinStatus === 'found')

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/inserate">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Neues Inserat</h1>
          <p className="text-sm text-muted-foreground">KI-unterstützte Inserat-Erstellung</p>
        </div>
      </div>

      {/* ─── Step 1: Choose Input Mode ──────────────────────────────────────── */}
      {inputMode === 'choose' && (
        <div className="max-w-xl mx-auto py-10">
          <p className="text-center text-muted-foreground text-sm mb-8">
            Wie möchten Sie die Fahrzeugdaten erfassen?
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <button
              onClick={() => setInputMode('vin')}
              className="group relative p-6 rounded-2xl border-2 border-border bg-card hover:border-primary hover:shadow-lg transition-all text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <ScanLine className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-1.5">VIN-Abfrage</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Fahrzeugdaten automatisch per Fahrgestellnummer abrufen
              </p>
              <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/30 group-hover:text-primary transition-colors" />
            </button>

            <button
              onClick={() => setInputMode('manual')}
              className="group relative p-6 rounded-2xl border-2 border-border bg-card hover:border-primary hover:shadow-lg transition-all text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Pencil className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-1.5">Manuell eingeben</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Fahrzeugdaten, Ausstattung und Details selbst erfassen
              </p>
              <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/30 group-hover:text-primary transition-colors" />
            </button>
          </div>
        </div>
      )}

      {/* ─── Main Form ──────────────────────────────────────────────────────── */}
      {inputMode !== 'choose' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* ─── Left Column ────────────────────────────────────────────────── */}
          <div className="lg:col-span-3 space-y-5">

            {/* Mode switcher */}
            <div className="flex w-full gap-1 rounded-lg border bg-muted p-1 sm:w-fit">
              <button
                onClick={() => { setInputMode('vin'); setVinStatus('idle'); setVinData(null) }}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all sm:flex-none ${
                  inputMode === 'vin'
                    ? 'bg-card shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <ScanLine className="h-3.5 w-3.5" />
                VIN-Abfrage
              </button>
              <button
                onClick={() => setInputMode('manual')}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all sm:flex-none ${
                  inputMode === 'manual'
                    ? 'bg-card shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Pencil className="h-3.5 w-3.5" />
                Manuell
              </button>
            </div>

            {/* ─── VIN Mode ───────────────────────────────────────────────── */}
            {inputMode === 'vin' && (
              <>
                <Card>
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
                        disabled={vinStatus === 'loading' || vinStatus === 'found'}
                      />
                      <Button
                        onClick={handleVinLookup}
                        disabled={vin.length < 5 || vinStatus === 'loading' || vinStatus === 'found'}
                        className="shrink-0"
                      >
                        {vinStatus === 'loading'
                          ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Abfragen...</>
                          : <><ScanLine className="h-4 w-4 mr-2" />Abfragen</>
                        }
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
                      <p className="text-xs text-muted-foreground">
                        Demo: Geben Sie min. 5 Zeichen ein und klicken Sie auf Abfragen.
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* VIN Results */}
                {vinStatus === 'found' && vinData && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span className="text-sm text-emerald-600 font-medium">
                        Fahrzeug gefunden: {vinData.make} {vinData.model}
                      </span>
                      <button
                        onClick={() => { setVinStatus('idle'); setVinData(null); setVin('') }}
                        className="ml-auto text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
                      >
                        Neue Abfrage
                      </button>
                    </div>

                    {/* Fahrzeugdaten */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Fahrzeugdaten</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 gap-x-8 gap-y-0 text-sm sm:grid-cols-2">
                          {[
                            ['Marke', vinData.make], ['Modell', vinData.model],
                            ['Baujahr', vinData.year], ['Erstzulassung', vinData.firstRegistration],
                            ['Kilometerstand', `${vinData.mileage} km`], ['HU bis', vinData.hu],
                            ['Kraftstoff', 'Benzin'], ['Getriebe', 'Automatik (9G-TRONIC)'],
                            ['Leistung', `${vinData.power} PS`], ['Hubraum', `${vinData.displacement} ccm`],
                            ['Farbe', vinData.color], ['Türen / Sitze', `${vinData.doors} / ${vinData.seats}`],
                          ].map(([label, value]) => (
                            <div key={label} className="flex justify-between py-2 border-b border-border/40 last:border-0">
                              <span className="text-muted-foreground">{label}</span>
                              <span className="font-medium text-right">{value}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Serienausstattung */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center justify-between">
                          Serienausstattung
                          <Badge variant="secondary" className="text-[10px] font-normal">
                            {vinData.serienausstattung.length} Merkmale
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-1.5">
                          {vinData.serienausstattung.map(item => (
                            <Badge key={item} variant="secondary" className="text-xs font-normal">
                              {item}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Sonderausstattung */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center justify-between">
                          Sonderausstattung
                          <Badge className="text-[10px] font-normal bg-primary/10 text-primary border-0">
                            {vinData.sonderausstattung.length} Extras
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-1.5">
                          {vinData.sonderausstattung.map(item => (
                            <Badge key={item} className="text-xs font-normal bg-primary/10 text-primary hover:bg-primary/20 border-0 cursor-default">
                              {item}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Price override */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Verkaufspreis festlegen</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                          <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">€</span>
                            <Input className="pl-7" defaultValue={vinData.price} />
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">Marktpreis ~€ 54.800</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </>
            )}

            {/* ─── Manual Mode ────────────────────────────────────────────── */}
            {inputMode === 'manual' && (
              <div className="space-y-4">

                {/* Grunddaten */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Grunddaten</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Marke</Label>
                        <Input placeholder="z.B. Mercedes-Benz" value={formData.make} onChange={setField('make')} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Modell</Label>
                        <Input placeholder="z.B. GLC 300 4MATIC AMG Line" value={formData.model} onChange={setField('model')} />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Baujahr</Label>
                        <Input placeholder="2021" value={formData.year} onChange={setField('year')} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Erstzulassung</Label>
                        <Input placeholder="03.2021" value={formData.firstRegistration} onChange={setField('firstRegistration')} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">HU bis</Label>
                        <Input placeholder="03.2025" value={formData.hu} onChange={setField('hu')} />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Kilometerstand</Label>
                        <Input placeholder="62.400" value={formData.mileage} onChange={setField('mileage')} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Kennzeichen</Label>
                        <Input placeholder="KA-WH 1234" value={formData.licensePlate} onChange={setField('licensePlate')} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Verkaufspreis (€)</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">€</span>
                        <Input className="pl-7" placeholder="38.900" value={formData.price} onChange={setField('price')} />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Technische Daten */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Technische Daten</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Kraftstoff</Label>
                        <Select value={formData.fuelType} onValueChange={v => setFormData(prev => ({ ...prev, fuelType: v }))}>
                          <SelectTrigger><SelectValue placeholder="Auswählen" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="benzin">Benzin</SelectItem>
                            <SelectItem value="diesel">Diesel</SelectItem>
                            <SelectItem value="elektro">Elektro</SelectItem>
                            <SelectItem value="hybrid">Hybrid</SelectItem>
                            <SelectItem value="plug_in_hybrid">Plug-in-Hybrid</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Getriebe</Label>
                        <Select value={formData.transmission} onValueChange={v => setFormData(prev => ({ ...prev, transmission: v }))}>
                          <SelectTrigger><SelectValue placeholder="Auswählen" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="automatik">Automatik</SelectItem>
                            <SelectItem value="schaltung">Schaltgetriebe</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Leistung (PS)</Label>
                        <Input placeholder="190" value={formData.power} onChange={setField('power')} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Hubraum (ccm)</Label>
                        <Input placeholder="1.995" value={formData.displacement} onChange={setField('displacement')} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Farbe</Label>
                        <Input placeholder="Silber Metallic" value={formData.color} onChange={setField('color')} />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Türen</Label>
                        <Select value={formData.doors} onValueChange={v => setFormData(prev => ({ ...prev, doors: v }))}>
                          <SelectTrigger><SelectValue placeholder="Auswählen" /></SelectTrigger>
                          <SelectContent>
                            {['2', '3', '4', '5'].map(d => <SelectItem key={d} value={d}>{d} Türen</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Sitzplätze</Label>
                        <Select value={formData.seats} onValueChange={v => setFormData(prev => ({ ...prev, seats: v }))}>
                          <SelectTrigger><SelectValue placeholder="Auswählen" /></SelectTrigger>
                          <SelectContent>
                            {['2', '4', '5', '6', '7', '8', '9'].map(s => <SelectItem key={s} value={s}>{s} Sitze</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Serienausstattung */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center justify-between">
                      Serienausstattung
                      {selectedSeries.length > 0 && (
                        <Badge variant="secondary" className="text-[10px] font-normal">
                          {selectedSeries.length} ausgewählt
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {SERIES_OPTIONS.map(item => {
                        const active = selectedSeries.includes(item)
                        return (
                          <button
                            key={item}
                            onClick={() => toggleSeries(item)}
                            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                              active
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground'
                            }`}
                          >
                            {active && <Check className="inline h-2.5 w-2.5 mr-1 -mt-0.5" />}
                            {item}
                          </button>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Sonderausstattung */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center justify-between">
                      Sonderausstattung
                      {selectedExtras.length > 0 && (
                        <Badge className="text-[10px] font-normal bg-primary/10 text-primary border-0">
                          {selectedExtras.length} Extras
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {EXTRA_OPTIONS.map(item => {
                        const active = selectedExtras.includes(item)
                        return (
                          <button
                            key={item}
                            onClick={() => toggleExtra(item)}
                            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                              active
                                ? 'bg-primary/10 text-primary border-primary/40'
                                : 'bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'
                            }`}
                          >
                            {active && <Check className="inline h-2.5 w-2.5 mr-1 -mt-0.5" />}
                            {item}
                          </button>
                        )
                      })}
                    </div>
                    <div className="flex flex-col gap-2 pt-1 sm:flex-row">
                      <Input
                        placeholder="Eigenes Extra hinzufügen..."
                        value={customExtra}
                        onChange={e => setCustomExtra(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addCustomExtra()}
                        className="text-sm h-8"
                      />
                      <Button size="sm" variant="outline" onClick={addCustomExtra} className="h-8 px-3">
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    {selectedExtras.filter(e => !EXTRA_OPTIONS_LIST.includes(e)).length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {selectedExtras.filter(e => !EXTRA_OPTIONS_LIST.includes(e)).map(item => (
                          <span key={item} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                            {item}
                            <button onClick={() => toggleExtra(item)} className="hover:text-destructive transition-colors">
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ─── Bilder ─────────────────────────────────────────────────── */}
            {showFormContent && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <span>Bilder</span>
                    <Badge variant="outline" className="text-xs font-normal">
                      {IMAGE_SLOTS.length} / 20
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {IMAGE_SLOTS.map(slot => {
                      const state = slotStates[slot.id]
                      const processing = processingSlot[slot.id]
                      const isOriginal = state === 'original'
                      const activeUrl = slot[state]

                      const stateLabel = {
                        original:   slot.label,
                        cutout:     '✓ Freigestellt',
                        background: '✓ Hintergrund',
                        quality:    '✓ Qualität',
                      }[state]

                      const stateLabelColor = {
                        original:   'text-muted-foreground',
                        cutout:     'text-blue-600 dark:text-blue-400',
                        background: 'text-purple-600 dark:text-purple-400',
                        quality:    'text-amber-600 dark:text-amber-400',
                      }[state]

                      return (
                        <div key={slot.id}>
                          {/* Photo */}
                          <div className="aspect-[4/3] rounded-xl overflow-hidden bg-muted relative">
                            <img
                              src={activeUrl}
                              alt={slot.label}
                              className="w-full h-full object-cover transition-all duration-500"
                              style={isOriginal
                                ? { filter: 'brightness(0.58) contrast(0.82) saturate(0.32) blur(0.7px)' }
                                : undefined
                              }
                            />
                            {/* Processing overlay */}
                            {processing && (
                              <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2">
                                <Loader2 className="h-5 w-5 text-white animate-spin" />
                                <span className="text-white text-[11px] font-medium">KI verarbeitet…</span>
                              </div>
                            )}
                          </div>

                          {/* State label */}
                          <p className={`text-[10px] text-center mt-1.5 mb-2 font-medium transition-colors ${stateLabelColor}`}>
                            {stateLabel}
                          </p>

                          {/* Enhancement buttons */}
                          <div className="space-y-1">
                            {([
                              {
                                type: 'cutout' as const,
                                icon: Scissors,
                                label: 'Freistellen',
                                activeClass: 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
                              },
                              {
                                type: 'background' as const,
                                icon: Wand2,
                                label: 'Hintergrund',
                                activeClass: 'bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800',
                              },
                              {
                                type: 'quality' as const,
                                icon: Zap,
                                label: 'Qualität',
                                activeClass: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
                              },
                            ]).map(({ type, icon: Icon, label, activeClass }) => {
                              const isActive = state === type
                              const isProcessing = processing === type
                              return (
                                <button
                                  key={type}
                                  onClick={() => !isActive && !processing && handleEnhance(slot.id, type)}
                                  disabled={!!processing}
                                  className={`w-full flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium border transition-all ${
                                    isActive
                                      ? activeClass
                                      : isProcessing
                                      ? 'bg-primary/5 text-primary border-primary/20 cursor-not-allowed'
                                      : 'bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-foreground cursor-pointer'
                                  }`}
                                >
                                  {isProcessing
                                    ? <Loader2 className="h-3 w-3 animate-spin shrink-0" />
                                    : isActive
                                    ? <CheckCircle2 className="h-3 w-3 shrink-0" />
                                    : <Icon className="h-3 w-3 shrink-0" />
                                  }
                                  {isProcessing ? 'KI verarbeitet…' : label}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Upload more — Desktop */}
                  <div className="hidden sm:block border-2 border-dashed rounded-xl p-5 text-center">
                    <ImagePlus className="h-7 w-7 mx-auto text-muted-foreground/40 mb-2" />
                    <p className="text-xs text-muted-foreground">Weitere Bilder hochladen</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">JPG, PNG bis 10MB, max. 20 Bilder</p>
                    <Button variant="outline" size="sm" className="mt-3 h-7 text-xs" asChild>
                      <label className="cursor-pointer">
                        <Upload className="h-3 w-3 mr-1.5" />
                        Bilder auswählen
                        <input type="file" accept="image/*" multiple className="sr-only" />
                      </label>
                    </Button>
                  </div>

                  {/* Upload more — Mobile: Camera + Gallery */}
                  <div className="sm:hidden space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      {/* Camera */}
                      <label className="group relative flex flex-col items-center gap-2.5 rounded-2xl border-2 border-dashed border-border bg-muted/30 p-5 cursor-pointer active:scale-[0.97] transition-all duration-150 active:bg-muted/60">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-background shadow-sm ring-1 ring-border/60 group-active:shadow-none transition-shadow">
                          <Camera className="h-5 w-5 text-foreground" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-semibold leading-tight">Aufnehmen</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">Kamera öffnen</p>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="sr-only"
                        />
                      </label>

                      {/* Gallery */}
                      <label className="group relative flex flex-col items-center gap-2.5 rounded-2xl border-2 border-dashed border-border bg-muted/30 p-5 cursor-pointer active:scale-[0.97] transition-all duration-150 active:bg-muted/60">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-background shadow-sm ring-1 ring-border/60 group-active:shadow-none transition-shadow">
                          <Images className="h-5 w-5 text-foreground" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-semibold leading-tight">Galerie</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">Fotos auswählen</p>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="sr-only"
                        />
                      </label>
                    </div>
                    <p className="text-center text-[10px] text-muted-foreground/60">
                      JPG, PNG · max. 10 MB · bis zu 20 Bilder
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* ─── Right Column: KI-Assistent ─────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-5">
            {showFormContent && (
              <Card className="border-primary/20 bg-primary/[0.025]">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    KI-Assistent
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">

                  {/* Generate button */}
                  <Button
                    className="w-full"
                    onClick={handleGenerate}
                    disabled={generating || inseratCreated}
                  >
                    {generating
                      ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generiere...</>
                      : generated
                      ? <><RefreshCw className="h-4 w-4 mr-2" />Neu generieren</>
                      : <><Sparkles className="h-4 w-4 mr-2" />KI-Beschreibung generieren</>
                    }
                  </Button>

                  {generated && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2">

                      {/* Confidence */}
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map(i => (
                            <Star
                              key={i}
                              className={`h-3.5 w-3.5 ${i <= Math.round(MOCK_AI.confidence / 20) ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground/30'}`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">Konfidenz {MOCK_AI.confidence}%</span>
                      </div>

                      {/* Title */}
                      <div className="space-y-1.5">
                        <Label className="text-[10px] text-muted-foreground uppercase tracking-widest">Titel</Label>
                        <div className="p-2.5 bg-card rounded-lg border text-xs font-medium leading-snug">
                          {MOCK_AI.title}
                        </div>
                        <Button size="sm" variant="outline" className="w-full h-7 text-xs">
                          <Check className="h-3 w-3 mr-1" />
                          Titel übernehmen
                        </Button>
                      </div>

                      <Separator />

                      {/* Description */}
                      <div className="space-y-1.5">
                        <Label className="text-[10px] text-muted-foreground uppercase tracking-widest">Beschreibung</Label>
                        <div className="p-2.5 bg-card rounded-lg border text-xs whitespace-pre-line max-h-44 overflow-y-auto leading-relaxed">
                          {activeDescription}
                        </div>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <Button size="sm" variant="outline" className="h-7 text-xs">
                            <Check className="h-3 w-3 mr-1" />
                            Übernehmen
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className={`h-7 text-xs ${
                              descImproved
                                ? 'text-emerald-600 border-emerald-300 dark:border-emerald-800'
                                : 'text-primary border-primary/30'
                            }`}
                            onClick={handleImproveDescription}
                            disabled={improvingDesc || inseratCreated}
                          >
                            {improvingDesc
                              ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Verbessere...</>
                              : descImproved
                              ? <><CheckCircle2 className="h-3 w-3 mr-1" />Verbessert</>
                              : <><Wand2 className="h-3 w-3 mr-1" />Verbessern</>
                            }
                          </Button>
                        </div>
                      </div>

                      <Separator />

                      {/* Inserat-Qualität (KYC) */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-[10px] text-muted-foreground uppercase tracking-widest">
                            Inserat-Qualität
                          </Label>
                          <span className={`text-sm font-bold tabular-nums ${
                            kycScore >= 90 ? 'text-emerald-600' : kycScore >= 70 ? 'text-amber-600' : 'text-red-500'
                          }`}>
                            {kycScore}%
                          </span>
                        </div>
                        <Progress value={kycScore} className="h-1.5" />
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                          <span>
                            {kycScore >= 90 ? 'Ausgezeichnet' : kycScore >= 70 ? 'Gut' : 'Verbesserungspotential'}
                          </span>
                          {!kycImproved && (
                            <span className="text-primary">{MOCK_AI.improvedKycScore}% möglich</span>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className={`w-full h-7 text-xs ${
                            kycImproved
                              ? 'text-emerald-600 border-emerald-300 dark:border-emerald-800'
                              : 'text-primary border-primary/30'
                          }`}
                          onClick={handleImproveKyc}
                          disabled={improvingKyc || kycImproved || inseratCreated}
                        >
                          {improvingKyc
                            ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Optimiere...</>
                            : kycImproved
                            ? <><CheckCircle2 className="h-3 w-3 mr-1" />Qualität optimiert</>
                            : <><Sparkles className="h-3 w-3 mr-1" />KI-Qualität verbessern</>
                          }
                        </Button>
                      </div>

                      <Separator />

                      {/* Price Analysis */}
                      <div className="space-y-2">
                        <Label className="text-[10px] text-muted-foreground uppercase tracking-widest">
                          Preisanalyse
                        </Label>
                        <div className="p-3 bg-card rounded-lg border space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground">Ihr Preis</span>
                            <span className="text-sm font-bold">{formatCurrency(MOCK_AI.priceAnalysis.suggestion)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground">Marktpreis (Ø)</span>
                            <span className="text-xs">{formatCurrency(MOCK_AI.priceAnalysis.marketPrice)}</span>
                          </div>
                          <Badge
                            variant="outline"
                            className={`${priceCategoryConfig[MOCK_AI.priceAnalysis.category].bg} ${priceCategoryConfig[MOCK_AI.priceAnalysis.category].color} border-0 text-xs`}
                          >
                            {priceCategoryConfig[MOCK_AI.priceAnalysis.category].label}
                          </Badge>
                          <div className="pt-0.5 space-y-1">
                            {MOCK_AI.priceAnalysis.thresholds.map((t, i) => (
                              <div key={i} className="flex justify-between text-[10px] text-muted-foreground">
                                <span>{t.label}</span>
                                <span>bis {formatCurrency(t.max)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Create / Export */}
                      {!inseratCreated ? (
                        <Button className="w-full" onClick={handleCreateInserat}>
                          <Check className="h-4 w-4 mr-2" />
                          Inserat erstellen
                        </Button>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 p-2.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                            <span className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">
                              Inserat erstellt!
                            </span>
                          </div>
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => setShowExport(true)}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Auf Plattformen exportieren
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* ─── Export Dialog ──────────────────────────────────────────────────── */}
      <Dialog open={showExport} onOpenChange={setShowExport}>
        <DialogContent className="max-w-[calc(100vw-1rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5 text-primary" />
              Inserat exportieren
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground -mt-1">
            Veröffentlichen Sie das Inserat auf Ihren Wunschplattformen.
          </p>
          <div className="space-y-3 mt-1">
            {EXPORT_PLATFORMS.map(platform => {
              const status = exportStatus[platform.id]
              return (
                <div
                  key={platform.id}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border ${platform.bgColor} ${platform.borderColor}`}
                >
                  {platform.icon}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground">{platform.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{platform.description}</p>
                  </div>
                  <Button
                    size="sm"
                    style={status === 'idle' || status === 'exporting' ? platform.btnStyle : undefined}
                    className={`text-white border-0 shrink-0 ${platform.btnHoverClass} ${
                      status === 'done' ? 'bg-emerald-600 hover:bg-emerald-600' : ''
                    }`}
                    onClick={() => status === 'idle' && handleExport(platform.id)}
                    disabled={status === 'exporting' || status === 'done'}
                  >
                    {status === 'exporting'
                      ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Exportiere</>
                      : status === 'done'
                      ? <><CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />Live</>
                      : <><ExternalLink className="h-3.5 w-3.5 mr-1.5" />Exportieren</>
                    }
                  </Button>
                </div>
              )
            })}
          </div>

          {Object.values(exportStatus).some(s => s === 'done') && (
            <div className="mt-1 p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              {Object.values(exportStatus).filter(s => s === 'done').length} von {EXPORT_PLATFORMS.length} Plattformen erfolgreich exportiert
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
