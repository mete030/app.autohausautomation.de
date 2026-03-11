'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { priceCategoryConfig } from '@/lib/constants'
import {
  einkaufVinMock,
  einkaufPricingResult as PRICING_RESULT,
  type EinkaufVehicleData,
  type EinkaufPricingResult,
} from '@/lib/mock-data-einkauf'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  ScanLine,
  Loader2,
  CheckCircle2,
  Car,
  Settings2,
  Sparkles,
  Clock,
  ShieldCheck,
  Globe,
  BarChart3,
  RefreshCw,
  Check,
  Hash,
  List,
  ChevronRight,
  Search,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts'

// ─── Types ───────────────────────────────────────────────────────────────────

type InputMode = 'choose' | 'vin' | 'kba' | 'manual'
type EinkaufStep = 'identify' | 'vehicle_confirm' | 'computing' | 'results'
type LookupStatus = 'idle' | 'loading' | 'found'
type Condition = 'sehr_gut' | 'gut' | 'maengel' | 'unfallschaden'
type ResultsView = 'empfehlung' | 'details'

// ─── Mock: Marke → Modell → Variante tree ────────────────────────────────────

const MAKE_MODEL_TREE: Record<string, Record<string, string[]>> = {
  'Mercedes-Benz': {
    'A-Klasse': ['A 180', 'A 200', 'A 250', 'A 250 e', 'A 35 AMG'],
    'C-Klasse': ['C 180', 'C 200', 'C 220 d', 'C 300', 'C 300 e', 'C 43 AMG'],
    'E-Klasse': ['E 200', 'E 220 d', 'E 300', 'E 300 e', 'E 400 d', 'E 53 AMG'],
    'GLA': ['GLA 200', 'GLA 250', 'GLA 250 e', 'GLA 35 AMG'],
    'GLB': ['GLB 200', 'GLB 250', 'GLB 250 4MATIC'],
    'GLC': ['GLC 200', 'GLC 220 d', 'GLC 300', 'GLC 300 4MATIC', 'GLC 300 e', 'GLC 400 e', 'GLC 43 AMG'],
    'GLE': ['GLE 300 d', 'GLE 350 d', 'GLE 400 d', 'GLE 450', 'GLE 53 AMG'],
    'CLA': ['CLA 200', 'CLA 220', 'CLA 250', 'CLA 35 AMG'],
    'EQA': ['EQA 250', 'EQA 250+', 'EQA 300 4MATIC', 'EQA 350 4MATIC'],
    'EQB': ['EQB 250+', 'EQB 300 4MATIC', 'EQB 350 4MATIC'],
    'EQE': ['EQE 300', 'EQE 350+', 'EQE 500 4MATIC', 'EQE 43 AMG'],
  },
  'BMW': {
    '1er': ['116i', '118i', '120i', '128ti', 'M135i'],
    '3er': ['318i', '320i', '320d', '330i', '330e', 'M340i'],
    '5er': ['520i', '520d', '530i', '530d', '540i', 'M550i'],
    'X1': ['sDrive18i', 'sDrive20i', 'xDrive25e', 'xDrive28i'],
    'X3': ['sDrive20i', 'xDrive20d', 'xDrive30i', 'xDrive30d', 'M40i'],
    'X5': ['xDrive40i', 'xDrive40d', 'xDrive45e', 'M50i'],
  },
  'Audi': {
    'A3': ['30 TFSI', '35 TFSI', '40 TFSI e', 'S3'],
    'A4': ['35 TFSI', '40 TFSI', '40 TDI', '45 TFSI', 'S4'],
    'A6': ['40 TDI', '45 TFSI', '50 TDI', '55 TFSI e', 'S6'],
    'Q3': ['35 TFSI', '40 TFSI', '45 TFSI e'],
    'Q5': ['40 TDI', '45 TFSI', '50 TFSI e', '55 TFSI e', 'SQ5'],
    'Q7': ['45 TDI', '50 TDI', '55 TFSI e', '60 TFSI e', 'SQ7'],
    'e-tron GT': ['e-tron GT', 'RS e-tron GT'],
  },
  'Volkswagen': {
    'Golf': ['1.0 TSI', '1.5 TSI', '2.0 TDI', 'GTE', 'GTI', 'R'],
    'Tiguan': ['1.5 TSI', '2.0 TDI', '2.0 TSI', 'eHybrid', 'R'],
    'Passat': ['1.5 TSI', '2.0 TDI', 'GTE'],
    'ID.3': ['Pure', 'Pro', 'Pro S', 'GTX'],
    'ID.4': ['Pure', 'Pro', 'Pro S', 'GTX'],
    'T-Roc': ['1.0 TSI', '1.5 TSI', '2.0 TDI', '2.0 TSI R'],
  },
  'Porsche': {
    'Cayenne': ['Cayenne', 'Cayenne S', 'Cayenne E-Hybrid', 'Cayenne GTS', 'Cayenne Turbo'],
    'Macan': ['Macan', 'Macan S', 'Macan GTS', 'Macan Turbo'],
    'Taycan': ['Taycan', 'Taycan 4S', 'Taycan GTS', 'Taycan Turbo', 'Taycan Turbo S'],
    '911': ['Carrera', 'Carrera S', 'Carrera 4S', 'Turbo', 'Turbo S', 'GT3'],
  },
}

const YEARS = Array.from({ length: 10 }, (_, i) => `${2026 - i}`)

const FUEL_TYPES = ['Benzin', 'Diesel', 'Elektro', 'Hybrid', 'Plug-in-Hybrid'] as const

// ─── Component ───────────────────────────────────────────────────────────────

export default function EinkaufPage() {
  // Input mode
  const [inputMode, setInputMode] = useState<InputMode>('choose')

  // Flow
  const [step, setStep] = useState<EinkaufStep>('identify')

  // VIN
  const [vin, setVin] = useState('')
  const [lookupStatus, setLookupStatus] = useState<LookupStatus>('idle')

  // KBA / HSN/TSN
  const [hsn, setHsn] = useState('')
  const [tsn, setTsn] = useState('')

  // Manual selection
  const [selectedMake, setSelectedMake] = useState('')
  const [selectedModel, setSelectedModel] = useState('')
  const [selectedVariant, setSelectedVariant] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  const [selectedFuelType, setSelectedFuelType] = useState('')
  const [manualMileage, setManualMileage] = useState('')

  // Vehicle
  const [vehicleData, setVehicleData] = useState<EinkaufVehicleData | null>(null)
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([])
  const [condition, setCondition] = useState<Condition>('gut')
  const [mileage, setMileage] = useState(0)

  // Computing
  const [computeProgress, setComputeProgress] = useState(0)
  const [computePhase, setComputePhase] = useState('')

  // Results
  const [pricingResult, setPricingResult] = useState<EinkaufPricingResult | null>(null)
  const [resultsView, setResultsView] = useState<ResultsView>('empfehlung')

  // ─── Derived ───────────────────────────────────────────────────────────────

  const models = selectedMake ? Object.keys(MAKE_MODEL_TREE[selectedMake] || {}) : []
  const variants = selectedMake && selectedModel ? (MAKE_MODEL_TREE[selectedMake]?.[selectedModel] || []) : []

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const resolveVehicle = () => {
    setLookupStatus('loading')
    setTimeout(() => {
      setVehicleData(einkaufVinMock)
      setSelectedEquipment([...einkaufVinMock.sonderausstattung])
      setMileage(inputMode === 'manual' && manualMileage ? Number(manualMileage) : einkaufVinMock.mileage)
      setLookupStatus('found')
      setStep('vehicle_confirm')
    }, 2200)
  }

  const toggleEquipment = (item: string) => {
    setSelectedEquipment(prev =>
      prev.includes(item) ? prev.filter(e => e !== item) : [...prev, item]
    )
  }

  const handleComputePricing = () => {
    setStep('computing')
    setComputeProgress(0)
    setComputePhase('Historische Verkaufsdaten werden analysiert...')

    setTimeout(() => {
      setComputeProgress(35)
      setComputePhase('DAT/Schwacke-Bewertung wird abgerufen...')
    }, 1000)

    setTimeout(() => {
      setComputeProgress(70)
      setComputePhase('mobile.de Marktdaten werden verglichen...')
    }, 2000)

    setTimeout(() => {
      setComputeProgress(100)
      setComputePhase('Preisempfehlung wird erstellt...')
    }, 2800)

    setTimeout(() => {
      setPricingResult(PRICING_RESULT)
      setStep('results')
    }, 3500)
  }

  const handleReset = () => {
    setInputMode('choose')
    setStep('identify')
    setVin('')
    setLookupStatus('idle')
    setHsn('')
    setTsn('')
    setSelectedMake('')
    setSelectedModel('')
    setSelectedVariant('')
    setSelectedYear('')
    setSelectedFuelType('')
    setManualMileage('')
    setVehicleData(null)
    setSelectedEquipment([])
    setCondition('gut')
    setMileage(0)
    setComputeProgress(0)
    setComputePhase('')
    setPricingResult(null)
    setResultsView('empfehlung')
  }

  const switchMode = (mode: InputMode) => {
    setInputMode(mode)
    setLookupStatus('idle')
    setVehicleData(null)
    setStep('identify')
  }

  // ─── Validation ────────────────────────────────────────────────────────────

  const canLookupVin = vin.length >= 5 && lookupStatus === 'idle'
  const canLookupKba = hsn.length === 4 && tsn.length >= 3 && lookupStatus === 'idle'
  const canLookupManual = !!selectedMake && !!selectedModel && !!selectedVariant && lookupStatus === 'idle'

  // ─── Chart data ────────────────────────────────────────────────────────────

  const chartData = pricingResult
    ? [
        { source: 'Historisch (Ø EK)', value: pricingResult.historical.averagePurchasePrice },
        { source: 'DAT bereinigt', value: pricingResult.dat.adjustedValue },
        { source: 'mobile.de Median', value: pricingResult.mobileDe.medianPrice },
        { source: 'Empfehlung (EK)', value: pricingResult.sweetSpot },
      ]
    : []

  const chartColors = ['#2563eb', '#10b981', '#f97316', '#7c3aed']

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Einkauf</h1>
        <p className="text-sm text-muted-foreground mt-1">
          KI-gestützte Fahrzeugbewertung für den Ankauf
        </p>
      </div>

      {/* ═══ Mode Chooser ═══ */}
      {inputMode === 'choose' && (
        <div className="max-w-3xl mx-auto py-6">
          <p className="text-center text-muted-foreground text-sm mb-8">
            Wie möchten Sie das Fahrzeug identifizieren?
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
              onClick={() => setInputMode('kba')}
              className="group relative p-6 rounded-2xl border-2 border-border bg-card hover:border-primary hover:shadow-lg transition-all text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Hash className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-1.5">Schlüsselnummer</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Identifikation über HSN/TSN aus dem Fahrzeugschein
              </p>
              <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/30 group-hover:text-primary transition-colors" />
            </button>

            <button
              onClick={() => setInputMode('manual')}
              className="group relative p-6 rounded-2xl border-2 border-border bg-card hover:border-primary hover:shadow-lg transition-all text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <List className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-1.5">Manuelle Auswahl</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Marke, Modell und Variante manuell auswählen
              </p>
              <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/30 group-hover:text-primary transition-colors" />
            </button>
          </div>
        </div>
      )}

      {/* ═══ Identification Form ═══ */}
      {inputMode !== 'choose' && step === 'identify' && (
        <div className="space-y-5 animate-in fade-in duration-300">
          {/* Mode Switcher */}
          <div className="flex w-full gap-1 rounded-lg border bg-muted p-1 sm:w-fit">
            <button
              onClick={() => switchMode('vin')}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all sm:flex-none ${
                inputMode === 'vin'
                  ? 'bg-card shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ScanLine className="h-3.5 w-3.5" />
              VIN
            </button>
            <button
              onClick={() => switchMode('kba')}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all sm:flex-none ${
                inputMode === 'kba'
                  ? 'bg-card shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Hash className="h-3.5 w-3.5" />
              HSN / TSN
            </button>
            <button
              onClick={() => switchMode('manual')}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all sm:flex-none ${
                inputMode === 'manual'
                  ? 'bg-card shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <List className="h-3.5 w-3.5" />
              Manuell
            </button>
          </div>

          {/* ── VIN Mode ── */}
          {inputMode === 'vin' && (
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
                    disabled={lookupStatus === 'loading'}
                  />
                  <Button
                    onClick={resolveVehicle}
                    disabled={!canLookupVin}
                    className="shrink-0"
                  >
                    {lookupStatus === 'loading' ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Abfragen...</>
                    ) : (
                      <><Search className="h-4 w-4 mr-2" />Fahrzeug identifizieren</>
                    )}
                  </Button>
                </div>
                {lookupStatus === 'loading' && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Fahrzeugdaten werden abgerufen...
                    </div>
                    <Progress value={66} className="h-1" />
                  </div>
                )}
                {lookupStatus === 'idle' && (
                  <p className="text-xs text-muted-foreground">
                    17-stellige Fahrgestellnummer eingeben. Zu finden im Fahrzeugschein (Feld E) oder an der Windschutzscheibe.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* ── KBA / HSN/TSN Mode ── */}
          {inputMode === 'kba' && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Hash className="h-4 w-4 text-primary" />
                  Schlüsselnummer (HSN / TSN)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-muted-foreground">
                  Aus dem Fahrzeugschein (Zulassungsbescheinigung Teil I): HSN = Feld 2.1, TSN = Feld 2.2
                </p>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">HSN (4-stellig)</Label>
                    <Input
                      placeholder="z.B. 1313"
                      value={hsn}
                      onChange={e => setHsn(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                      className="mt-1 font-mono text-sm tracking-wider"
                      maxLength={4}
                      disabled={lookupStatus === 'loading'}
                    />
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">TSN (mind. 3-stellig)</Label>
                    <Input
                      placeholder="z.B. CKL"
                      value={tsn}
                      onChange={e => setTsn(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7))}
                      className="mt-1 font-mono text-sm tracking-wider"
                      maxLength={7}
                      disabled={lookupStatus === 'loading'}
                    />
                  </div>
                  <Button
                    onClick={resolveVehicle}
                    disabled={!canLookupKba}
                    className="shrink-0"
                  >
                    {lookupStatus === 'loading' ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Abfragen...</>
                    ) : (
                      <><Search className="h-4 w-4 mr-2" />Fahrzeug identifizieren</>
                    )}
                  </Button>
                </div>
                {lookupStatus === 'loading' && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      KBA-Datenbank wird abgefragt...
                    </div>
                    <Progress value={66} className="h-1" />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ── Manual Selection Mode ── */}
          {inputMode === 'manual' && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <List className="h-4 w-4 text-primary" />
                  Fahrzeug manuell auswählen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Marke */}
                  <div>
                    <Label className="text-xs text-muted-foreground">Marke</Label>
                    <Select
                      value={selectedMake}
                      onValueChange={v => {
                        setSelectedMake(v)
                        setSelectedModel('')
                        setSelectedVariant('')
                      }}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Marke wählen" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(MAKE_MODEL_TREE).map(make => (
                          <SelectItem key={make} value={make}>{make}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Modell */}
                  <div>
                    <Label className="text-xs text-muted-foreground">Modell</Label>
                    <Select
                      value={selectedModel}
                      onValueChange={v => {
                        setSelectedModel(v)
                        setSelectedVariant('')
                      }}
                      disabled={!selectedMake}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Modell wählen" />
                      </SelectTrigger>
                      <SelectContent>
                        {models.map(model => (
                          <SelectItem key={model} value={model}>{model}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Variante */}
                  <div>
                    <Label className="text-xs text-muted-foreground">Variante</Label>
                    <Select
                      value={selectedVariant}
                      onValueChange={setSelectedVariant}
                      disabled={!selectedModel}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Variante wählen" />
                      </SelectTrigger>
                      <SelectContent>
                        {variants.map(variant => (
                          <SelectItem key={variant} value={variant}>{variant}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Erweiterte Details */}
                {selectedVariant && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-border/40 animate-in fade-in duration-300">
                    <div>
                      <Label className="text-xs text-muted-foreground">Erstzulassung / Baujahr</Label>
                      <Select value={selectedYear} onValueChange={setSelectedYear}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Jahr wählen" />
                        </SelectTrigger>
                        <SelectContent>
                          {YEARS.map(y => (
                            <SelectItem key={y} value={y}>{y}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Kraftstoff</Label>
                      <Select value={selectedFuelType} onValueChange={setSelectedFuelType}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Kraftstoff" />
                        </SelectTrigger>
                        <SelectContent>
                          {FUEL_TYPES.map(f => (
                            <SelectItem key={f} value={f}>{f}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Kilometerstand</Label>
                      <Input
                        type="number"
                        placeholder="z.B. 32400"
                        value={manualMileage}
                        onChange={e => setManualMileage(e.target.value)}
                        className="mt-1 font-mono"
                      />
                    </div>
                  </div>
                )}

                {/* Action */}
                <div className="flex items-center justify-between pt-2">
                  <p className="text-xs text-muted-foreground">
                    {!selectedMake
                      ? 'Wählen Sie Marke, Modell und Variante aus.'
                      : !selectedModel
                        ? 'Modell auswählen...'
                        : !selectedVariant
                          ? 'Variante auswählen...'
                          : 'Fahrzeug kann identifiziert werden.'}
                  </p>
                  <Button
                    onClick={resolveVehicle}
                    disabled={!canLookupManual}
                    className="shrink-0"
                  >
                    {lookupStatus === 'loading' ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Suche...</>
                    ) : (
                      <><Search className="h-4 w-4 mr-2" />Fahrzeug identifizieren</>
                    )}
                  </Button>
                </div>
                {lookupStatus === 'loading' && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Fahrzeugdaten werden zusammengestellt...
                    </div>
                    <Progress value={66} className="h-1" />
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ═══ Step 2: Vehicle Confirmation + Equipment ═══ */}
      {step === 'vehicle_confirm' && vehicleData && (
        <div className="space-y-5 animate-in fade-in slide-in-from-top-3 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Left: Vehicle Summary */}
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Car className="h-4 w-4 text-primary" />
                    Fahrzeug erkannt
                  </CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-500" />
                    Verifiziert
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="aspect-[16/9] rounded-lg overflow-hidden bg-muted">
                  <img
                    src={vehicleData.imageUrl}
                    alt={`${vehicleData.make} ${vehicleData.model}`}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="grid grid-cols-2 gap-x-6 gap-y-0 text-sm">
                  {([
                    ['Marke / Modell', `${vehicleData.make} ${vehicleData.model}`],
                    ['Baujahr', `${vehicleData.modelYear}`],
                    ['Erstzulassung', vehicleData.firstRegistration],
                    ['Leistung', `${vehicleData.power} PS`],
                    ['Getriebe', vehicleData.transmission],
                    ['Kraftstoff', vehicleData.fuelType],
                    ['Hubraum', `${vehicleData.displacement.toLocaleString('de-DE')} ccm`],
                    ['Farbe', vehicleData.color],
                  ] as const).map(([label, value]) => (
                    <div key={label} className="flex justify-between py-1.5 border-b border-border/40">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-medium text-right">{value}</span>
                    </div>
                  ))}
                </div>

                <Separator />
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Aktueller Kilometerstand</Label>
                    <Input
                      type="number"
                      value={mileage}
                      onChange={e => setMileage(Number(e.target.value))}
                      className="mt-1 font-mono"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Fahrzeugzustand</Label>
                    <Select value={condition} onValueChange={(v) => setCondition(v as Condition)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sehr_gut">Sehr gut &mdash; Keine Mängel</SelectItem>
                        <SelectItem value="gut">Gut &mdash; Leichte Gebrauchsspuren</SelectItem>
                        <SelectItem value="maengel">Mängel vorhanden</SelectItem>
                        <SelectItem value="unfallschaden">Unfallschaden</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Right: Sonderausstattung */}
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Settings2 className="h-4 w-4 text-primary" />
                    Sonderausstattung prüfen
                  </CardTitle>
                  <span className="text-xs text-muted-foreground">
                    {selectedEquipment.length} von {vehicleData.sonderausstattung.length} ausgewählt
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-4">
                  Bitte prüfen Sie die erkannte Ausstattung. Entfernen Sie Haken bei fehlenden oder defekten Optionen.
                </p>
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                  {vehicleData.sonderausstattung.map((item) => (
                    <label
                      key={item}
                      className="flex items-center gap-3 rounded-lg border border-border/60 px-3 py-2.5 cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedEquipment.includes(item)}
                        onChange={() => toggleEquipment(item)}
                        className="h-4 w-4 rounded border-border accent-primary"
                      />
                      <span className="text-sm">{item}</span>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* CTA */}
          <div className="flex justify-end">
            <Button
              size="lg"
              onClick={handleComputePricing}
              className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white px-8"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              KI-Preisanalyse starten
            </Button>
          </div>
        </div>
      )}

      {/* ═══ Step 3: Computing Animation ═══ */}
      {step === 'computing' && (
        <Card className="border-border/60">
          <CardContent className="py-12">
            <div className="max-w-md mx-auto text-center space-y-6">
              <div className="relative mx-auto w-16 h-16">
                <div className="absolute inset-0 rounded-2xl bg-primary/10 animate-ping" />
                <div className="relative w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-7 w-7 text-primary animate-pulse" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Preisanalyse wird berechnet</h3>
                <p className="text-sm text-muted-foreground mt-1" key={computePhase}>
                  {computePhase}
                </p>
              </div>
              <div className="space-y-2">
                <Progress value={computeProgress} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span className={computeProgress >= 35 ? 'text-primary font-medium' : ''}>Historische Daten</span>
                  <span className={computeProgress >= 70 ? 'text-primary font-medium' : ''}>DAT-Bewertung</span>
                  <span className={computeProgress >= 100 ? 'text-primary font-medium' : ''}>mobile.de</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══ Step 4: Results ═══ */}
      {step === 'results' && pricingResult && (
        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* View toggle */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Ergebnis: Preisanalyse</h2>
            <div className="flex gap-1 rounded-lg border bg-muted p-1">
              <button
                onClick={() => setResultsView('empfehlung')}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                  resultsView === 'empfehlung'
                    ? 'bg-card shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Preisempfehlung
              </button>
              <button
                onClick={() => setResultsView('details')}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                  resultsView === 'details'
                    ? 'bg-card shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Detailanalyse
              </button>
            </div>
          </div>

          {/* ── Recommendation View ── */}
          {resultsView === 'empfehlung' && (
            <div className="space-y-5 animate-in fade-in duration-300">
              {/* Hero Price Card */}
              <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card">
                <CardContent className="p-6 sm:p-8">
                  <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-6 items-center">
                    <div className="text-center lg:text-left">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                        Empfohlener Einkaufspreis
                      </p>
                      <div className="flex items-baseline gap-2 justify-center lg:justify-start">
                        <span className="text-4xl sm:text-5xl font-bold tracking-tight tabular-nums">
                          {formatCurrency(pricingResult.sweetSpot)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Bandbreite: {formatCurrency(pricingResult.recommendedMin)} &ndash; {formatCurrency(pricingResult.recommendedMax)}
                      </p>
                      <div className="flex items-center gap-2 mt-3 justify-center lg:justify-start">
                        <Badge variant="secondary" className="text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                          {pricingResult.confidence}% Konfidenz
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {pricingResult.marketPosition.label}
                        </Badge>
                      </div>
                    </div>

                    <Separator orientation="vertical" className="hidden lg:block h-24" />
                    <Separator className="lg:hidden" />

                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Erwart. Verkaufspreis</p>
                        <p className="text-xl font-bold tabular-nums mt-0.5">
                          {formatCurrency(pricingResult.mobileDe.medianPrice)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Erwart. Marge</p>
                        <p className="text-xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400 mt-0.5">
                          {formatCurrency(pricingResult.mobileDe.medianPrice - pricingResult.sweetSpot)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Ø Marge (historisch)</p>
                        <p className="text-xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400 mt-0.5">
                          {pricingResult.historical.averageMarginPercent.toFixed(1)}%
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Ø Standzeit</p>
                        <p className="text-xl font-bold tabular-nums mt-0.5">
                          {pricingResult.historical.averageDaysOnLot.toFixed(0)} Tage
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Three Source Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border-border/60 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
                        <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <span className="text-xs font-medium">Historische Daten</span>
                        <p className="text-[10px] text-muted-foreground">{pricingResult.historical.sales.length} Verkäufe</p>
                      </div>
                    </div>
                    <div className="text-2xl font-bold tabular-nums">
                      {formatCurrency(pricingResult.historical.averageSalePrice)}
                    </div>
                    <p className="text-xs text-muted-foreground">Ø Verkaufspreis</p>
                    <div className="mt-3 pt-2.5 border-t border-border/40">
                      <span className="text-xs text-muted-foreground">
                        Ø {pricingResult.historical.averageDaysOnLot.toFixed(0)} Tage Standzeit
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/60 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
                        <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <span className="text-xs font-medium">DAT / Schwacke</span>
                        <p className="text-[10px] text-muted-foreground">Offiziell</p>
                      </div>
                    </div>
                    <div className="text-2xl font-bold tabular-nums">
                      {formatCurrency(pricingResult.dat.adjustedValue)}
                    </div>
                    <p className="text-xs text-muted-foreground">Bereinigter Marktwert</p>
                    <div className="mt-3 pt-2.5 border-t border-border/40">
                      <span className="text-xs text-muted-foreground">
                        Basis {formatCurrency(pricingResult.dat.baseValue)} + {pricingResult.dat.adjustments.length} Korrekturen
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/60 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-8 w-8 rounded-lg bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center">
                        <Globe className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div>
                        <span className="text-xs font-medium">mobile.de</span>
                        <p className="text-[10px] text-muted-foreground">{pricingResult.mobileDe.count} Angebote</p>
                      </div>
                    </div>
                    <div className="text-2xl font-bold tabular-nums">
                      {formatCurrency(pricingResult.mobileDe.medianPrice)}
                    </div>
                    <p className="text-xs text-muted-foreground">Median-Preis</p>
                    <div className="mt-3 pt-2.5 border-t border-border/40">
                      <span className="text-xs text-muted-foreground">
                        {formatCurrency(pricingResult.mobileDe.lowestPrice)} &ndash; {formatCurrency(pricingResult.mobileDe.highestPrice)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Chart */}
              <Card className="border-border/60">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    Preisvergleich
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      layout="vertical"
                      margin={{ left: 10, right: 30, top: 10, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                      <XAxis
                        type="number"
                        tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                        tick={{ fontSize: 11 }}
                        domain={[35000, 60000]}
                      />
                      <YAxis type="category" dataKey="source" tick={{ fontSize: 11 }} width={130} />
                      <RechartsTooltip formatter={(v) => formatCurrency(Number(v))} labelStyle={{ fontWeight: 600 }} />
                      <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={32}>
                        {chartData.map((_, index) => (
                          <Cell key={index} fill={chartColors[index]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ── Detail View ── */}
          {resultsView === 'details' && (
            <div className="space-y-5 animate-in fade-in duration-300">
              {/* Historical */}
              <Card className="border-border/60">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    Eigene Verkaufshistorie ({pricingResult.historical.sales.length} vergleichbare Fahrzeuge)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-muted-foreground">
                          <th className="pb-2 pr-4 font-medium">Datum</th>
                          <th className="pb-2 pr-4 font-medium">Fahrzeug</th>
                          <th className="pb-2 pr-4 font-medium text-right">km</th>
                          <th className="pb-2 pr-4 font-medium text-right">EK</th>
                          <th className="pb-2 pr-4 font-medium text-right">VK</th>
                          <th className="pb-2 pr-4 font-medium text-right">Marge</th>
                          <th className="pb-2 font-medium text-right">Tage</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pricingResult.historical.sales.map(sale => (
                          <tr key={sale.id} className="border-b border-border/40">
                            <td className="py-2.5 pr-4 tabular-nums whitespace-nowrap">{formatDate(sale.date)}</td>
                            <td className="py-2.5 pr-4 text-xs max-w-[200px] truncate">{sale.vehicleDescription}</td>
                            <td className="py-2.5 pr-4 text-right tabular-nums">{sale.mileageAtSale.toLocaleString('de-DE')}</td>
                            <td className="py-2.5 pr-4 text-right tabular-nums">{formatCurrency(sale.purchasePrice)}</td>
                            <td className="py-2.5 pr-4 text-right tabular-nums">{formatCurrency(sale.salePrice)}</td>
                            <td className="py-2.5 pr-4 text-right tabular-nums text-emerald-600 dark:text-emerald-400 font-medium whitespace-nowrap">
                              {formatCurrency(sale.margin)} ({sale.marginPercent.toFixed(1)}%)
                            </td>
                            <td className="py-2.5 text-right tabular-nums">{sale.daysOnLot}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-border font-medium">
                          <td className="pt-2.5 pr-4">Durchschnitt</td>
                          <td className="pt-2.5 pr-4" />
                          <td className="pt-2.5 pr-4 text-right tabular-nums">&mdash;</td>
                          <td className="pt-2.5 pr-4 text-right tabular-nums">{formatCurrency(pricingResult.historical.averagePurchasePrice)}</td>
                          <td className="pt-2.5 pr-4 text-right tabular-nums">{formatCurrency(pricingResult.historical.averageSalePrice)}</td>
                          <td className="pt-2.5 pr-4 text-right tabular-nums text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                            {formatCurrency(pricingResult.historical.averageMargin)} ({pricingResult.historical.averageMarginPercent.toFixed(1)}%)
                          </td>
                          <td className="pt-2.5 text-right tabular-nums">{pricingResult.historical.averageDaysOnLot.toFixed(0)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* DAT */}
              <Card className="border-border/60">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    DAT / Schwacke Bewertung
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  <div className="flex justify-between items-center text-sm py-2.5 border-b border-border/40">
                    <span className="font-medium">Grundwert (DAT)</span>
                    <span className="font-bold tabular-nums">{formatCurrency(pricingResult.dat.baseValue)}</span>
                  </div>
                  {pricingResult.dat.adjustments.map((adj, i) => (
                    <div key={i} className="flex justify-between items-center text-sm py-2 border-b border-border/20">
                      <div>
                        <span>{adj.label}</span>
                        <p className="text-[10px] text-muted-foreground">{adj.reason}</p>
                      </div>
                      <span className={`font-medium tabular-nums shrink-0 ml-4 ${adj.amount >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                        {adj.amount >= 0 ? '+' : ''}{formatCurrency(adj.amount)}
                      </span>
                    </div>
                  ))}
                  <Separator className="my-2" />
                  <div className="flex justify-between items-center text-sm py-2.5">
                    <span className="font-semibold">Bereinigter Marktwert</span>
                    <span className="text-lg font-bold tabular-nums">{formatCurrency(pricingResult.dat.adjustedValue)}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground pt-1">
                    Zustand: {pricingResult.dat.condition} &middot; Schwacke-ID: {pricingResult.dat.schwackeId} &middot; Stand: {formatDate(pricingResult.dat.valuationDate)}
                  </p>
                </CardContent>
              </Card>

              {/* mobile.de */}
              <Card className="border-border/60">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Globe className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    mobile.de Vergleichsangebote ({pricingResult.mobileDe.count})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {pricingResult.mobileDe.comparables.map(comp => {
                      const cat = priceCategoryConfig[comp.priceCategory]
                      return (
                        <div key={comp.id} className="rounded-lg border border-border/60 p-3 hover:shadow-sm transition-shadow">
                          <p className="text-sm font-medium line-clamp-2 mb-2 min-h-[2.5rem]">{comp.title}</p>
                          <div className="text-xl font-bold tabular-nums mb-1">{formatCurrency(comp.price)}</div>
                          <div className="flex flex-wrap gap-x-1.5 text-[10px] text-muted-foreground">
                            <span>{comp.mileage.toLocaleString('de-DE')} km</span>
                            <span>&middot;</span>
                            <span>EZ {comp.firstRegistration}</span>
                            <span>&middot;</span>
                            <span>{comp.location}</span>
                          </div>
                          <div className="mt-2.5 flex items-center justify-between">
                            <Badge variant="secondary" className={`${cat.bg} ${cat.color} text-[10px]`}>
                              {cat.label}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">{comp.daysListed}d online</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Action Bar */}
          <Card className="border-border/60 bg-muted/30">
            <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Bereit zum Ankauf?</p>
                <p className="text-xs text-muted-foreground">
                  Empfohlener Einkaufspreis: {formatCurrency(pricingResult.sweetSpot)}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleReset}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Neue Bewertung
                </Button>
                <Button>
                  <Check className="h-4 w-4 mr-2" />
                  Ankauf einleiten
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
