'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  einkaufVinMock,
  einkaufVinMockAuktion,
  einkaufPricingResult as PRICING_RESULT,
  einkaufAuktionPricingResult as PRICING_RESULT_AUKTION,
  evaluateChannel,
  channelLabels,
  type EinkaufVehicleData,
  type EinkaufPricingResult,
  type ChannelDecision,
  type VerwertungChannel,
  type VehicleType,
} from '@/lib/mock-data-einkauf'
import { einkaufTransporterVinMock, einkaufTransporterPricingResult } from '@/lib/mock-data-einkauf-transporter'
import {
  parsePaketTranscript,
  type EinkaufPackageVehicle,
  type PaketVehicleOrigin,
} from '@/lib/mock-data-paket'
import { SingleVehicleResult } from './_components/SingleVehicleResult'
import { RoutingBanner } from './_components/RoutingBanner'
import { ListenplatzRechner } from './_components/ListenplatzRechner'
import { VehicleIdentify } from './_components/VehicleIdentify'
import { PaketConfirm } from './_components/PaketConfirm'
import { PaketResult } from './_components/PaketResult'
import { formatCurrency } from '@/lib/utils'
import {
  Loader2,
  CheckCircle2,
  Car,
  Settings2,
  Sparkles,
  RefreshCw,
  Check,
  FileText,
  ArrowRight,
  Pencil,
  Rocket,
  TrendingUp,
  Gavel,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

type InputMode = 'vin' | 'paket' // interner Flow-Flag (Einzel vs. Paket), kein Chooser mehr
type EinkaufStep = 'identify' | 'vehicle_confirm' | 'computing' | 'results'
type LookupStatus = 'idle' | 'loading' | 'found'
type Condition = 'sehr_gut' | 'gut' | 'maengel' | 'unfallschaden'
type ResultsView = 'empfehlung' | 'details'



// ─── Component ───────────────────────────────────────────────────────────────

export default function EinkaufPage() {
  const router = useRouter()

  // Input mode
  const [inputMode, setInputMode] = useState<InputMode>('vin')

  // G1: Fahrzeugart PKW ⇄ Transporter (eigene Nischenlogik im Transporter-Modus)
  const [vehicleType, setVehicleType] = useState<VehicleType>('pkw')

  // Flow
  const [step, setStep] = useState<EinkaufStep>('identify')

  const [lookupStatus, setLookupStatus] = useState<LookupStatus>('idle')

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

  // Verwertungskanal (Endkunde vs. Auktion/Remarketing)
  const [channelDecision, setChannelDecision] = useState<ChannelDecision | null>(null)
  const [overrideChannel, setOverrideChannel] = useState<VerwertungChannel | null>(null)
  const [overrideNote, setOverrideNote] = useState('')

  // Listenplatz-Rechner: gewählter Inseratspreis (Feature 1)
  const [listPrice, setListPrice] = useState<number>(PRICING_RESULT.mobileDe.medianPrice)

  // Paket-/Konvolut-Bewertung (Feature 3)
  const [paketVehicles, setPaketVehicles] = useState<EinkaufPackageVehicle[]>([])

  // Inserat creation modal
  const [showInseratModal, setShowInseratModal] = useState(false)
  const [inseratPrice, setInseratPrice] = useState<string>('')
  const [creatingInserat, setCreatingInserat] = useState(false)
  const [inseratCreated, setInseratCreated] = useState(false)

  // ─── Derived ───────────────────────────────────────────────────────────────

  // Effektiver Verwertungskanal (Engine-Empfehlung, ggf. manuell übersteuert)
  const recommendedChannel: VerwertungChannel = channelDecision?.recommendedChannel ?? 'endkunde'
  const channel: VerwertungChannel = overrideChannel ?? recommendedChannel
  const isAuction = channel === 'auktion'
  const L = channelLabels[channel]
  const effectiveSellPrice = pricingResult
    ? isAuction
      ? pricingResult.auction?.expectedHammerPrice ?? pricingResult.mobileDe.medianPrice
      : pricingResult.mobileDe.medianPrice
    : 0

  // ─── Browser-Zurück = Schritt zurück im Assistenten (statt Tab verlassen) ────
  // Die Einkaufsmaske ist ein Single-URL-Assistent; ohne diesen Guard würde der
  // Zurück-Button die ganze Seite verlassen (z.B. zurück zu /inserate).
  const stepRef = useRef(step)
  const backGuardRef = useRef(false)

  useEffect(() => {
    stepRef.current = step
  }, [step])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const inFlow = step !== 'identify'
    if (inFlow && !backGuardRef.current) {
      window.history.pushState({ einkaufGuard: true }, '')
      backGuardRef.current = true
    } else if (!inFlow) {
      backGuardRef.current = false
    }
  }, [step])

  useEffect(() => {
    const onPop = () => {
      if (!backGuardRef.current) return // kein aktiver Flow → Seite normal verlassen
      backGuardRef.current = false // dieser Guard-Eintrag ist verbraucht
      const s = stepRef.current
      if (s === 'results' || s === 'computing') setStep('vehicle_confirm')
      else setStep('identify')
      // Der Install-Effekt setzt bei Bedarf einen neuen Guard.
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  // ─── Handlers ──────────────────────────────────────────────────────────────

  // Einheitliche Erfassung: 1 VIN → Einzelfahrzeug-Flow, mehrere VINs → Paket-Flow.
  const handleRecognize = (vinText: string, origin: PaketVehicleOrigin) => {
    const tokens = vinText.split(/[\n,;]+/).map((t) => t.trim()).filter(Boolean).slice(0, 16)
    setLookupStatus('loading')
    if (tokens.length <= 1) {
      // Einzelfahrzeug — wie die klassische VIN-Abfrage.
      setInputMode('vin')
      const token = (tokens[0] ?? '').toUpperCase()
      const isTransporter = vehicleType === 'transporter' || token === einkaufTransporterVinMock.vin
      const isAuktionVin = !isTransporter && token === einkaufVinMockAuktion.vin
      const mock = isTransporter ? einkaufTransporterVinMock : isAuktionVin ? einkaufVinMockAuktion : einkaufVinMock
      setTimeout(() => {
        setVehicleData(mock)
        setSelectedEquipment([...mock.sonderausstattung])
        // Der Auktions-GLC hat leichte Mängel (Hagel/Steinschlag) — passend zur DAT-Bewertung.
        setCondition(isAuktionVin ? 'maengel' : 'gut')
        setMileage(mock.mileage)
        setLookupStatus('found')
        setStep('vehicle_confirm')
      }, 2200)
    } else {
      // Mehrere VINs → Paket/Konvolut.
      setInputMode('paket')
      setTimeout(() => {
        setPaketVehicles(parsePaketTranscript(vinText, origin))
        setLookupStatus('found')
        setStep('vehicle_confirm')
      }, 2200)
    }
  }

  // G1: PKW ⇄ Transporter umschalten — Flow zurücksetzen, damit das passende
  // Demo-Fahrzeug + die passende Nischenlogik geladen werden.
  const switchVehicleType = (t: VehicleType) => {
    if (t === vehicleType) return
    setVehicleType(t)
    setVehicleData(null)
    setPricingResult(null)
    setChannelDecision(null)
    setLookupStatus('idle')
    setInputMode('vin')
    setStep('identify')
  }

  const toggleEquipment = (item: string) => {
    setSelectedEquipment(prev =>
      prev.includes(item) ? prev.filter(e => e !== item) : [...prev, item]
    )
  }

  const handleCreatePaketInserat = (vehicle: EinkaufPackageVehicle) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(
        'inserat-prefill',
        JSON.stringify({
          source: 'einkauf',
          vin: vehicle.id,
          suggestedPrice: String(vehicle.expectedSalePrice),
          mileage: vehicle.mileage,
          condition: vehicle.condition,
          equipment: [],
          channel: vehicle.channel,
          createdAt: Date.now(),
        }),
      )
    }
    router.push('/inserate/neu')
  }

  const handleComputePricing = () => {
    const paket = inputMode === 'paket'
    const isAuktionVin = vehicleData?.vin === einkaufVinMockAuktion.vin
    setStep('computing')
    setComputeProgress(0)
    setComputePhase(
      paket
        ? `${paketVehicles.length} Fahrzeuge werden identifiziert...`
        : 'Historische Verkaufsdaten werden analysiert...',
    )

    setTimeout(() => {
      setComputeProgress(35)
      setComputePhase(paket ? 'Historische Verkaufsdaten je Fahrzeug werden analysiert...' : 'DAT/Schwacke-Bewertung wird abgerufen...')
    }, 1000)

    setTimeout(() => {
      setComputeProgress(70)
      setComputePhase(
        paket
          ? 'Markt- & Verwertungskanal je Fahrzeug werden bestimmt...'
          : isAuktionVin
            ? 'B2B-Auktionsbenchmarks (BCA / Autobid.de / MB Remarketing) werden verglichen...'
            : 'mobile.de Marktdaten werden verglichen...',
      )
    }, 2000)

    setTimeout(() => {
      setComputeProgress(100)
      setComputePhase(paket ? 'Paket-Kalkulation wird erstellt...' : 'Verwertungskanal & Preisempfehlung werden erstellt...')
    }, 2800)

    setTimeout(() => {
      if (paket) {
        setStep('results')
        return
      }
      const isTransporter = vehicleData?.vin === einkaufTransporterVinMock.vin
      const result = isTransporter ? einkaufTransporterPricingResult : isAuktionVin ? PRICING_RESULT_AUKTION : PRICING_RESULT
      const decision = evaluateChannel(
        vehicleData ?? einkaufVinMock,
        mileage,
        condition,
        isAuktionVin ? 4 : 1,
      )
      setPricingResult(result)
      setChannelDecision(decision)
      setOverrideChannel(null)
      setOverrideNote('')
      setListPrice(result.mobileDe.medianPrice)
      setStep('results')
    }, 3500)
  }

  const handleReset = () => {
    setInputMode('vin')
    setStep('identify')
    setLookupStatus('idle')
    setVehicleData(null)
    setSelectedEquipment([])
    setCondition('gut')
    setMileage(0)
    setComputeProgress(0)
    setComputePhase('')
    setPricingResult(null)
    setResultsView('empfehlung')
    setChannelDecision(null)
    setOverrideChannel(null)
    setOverrideNote('')
    setListPrice(PRICING_RESULT.mobileDe.medianPrice)
    setPaketVehicles([])
    setShowInseratModal(false)
    setInseratPrice('')
    setCreatingInserat(false)
    setInseratCreated(false)
  }

  const handleOpenInseratModal = (price?: number) => {
    const seed = price ?? effectiveSellPrice
    if (seed) setInseratPrice(String(Math.round(seed)))
    setInseratCreated(false)
    setShowInseratModal(true)
  }

  const handleCreateInseratExpress = () => {
    setCreatingInserat(true)
    setTimeout(() => {
      setCreatingInserat(false)
      setInseratCreated(true)
    }, 1600)
  }

  const handleOpenInseratEditor = () => {
    if (typeof window !== 'undefined' && vehicleData && pricingResult) {
      sessionStorage.setItem(
        'inserat-prefill',
        JSON.stringify({
          source: 'einkauf',
          vin: vehicleData.vin,
          suggestedPrice: inseratPrice || String(Math.round(effectiveSellPrice)),
          mileage,
          condition,
          equipment: selectedEquipment,
          channel,
          createdAt: Date.now(),
        }),
      )
    }
    router.push('/inserate/neu')
  }

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

      {/* ═══ Identifikation: eine Maske — eine VIN (Einzel) oder mehrere VINs (Paket) ═══ */}
      {/* G1: Fahrzeugart-Umschalter PKW ⇄ Transporter sitzt jetzt in der Maske selbst */}
      {step === 'identify' && (
        <div className="animate-in fade-in duration-300">
          <VehicleIdentify
            vehicleType={vehicleType}
            onVehicleTypeChange={switchVehicleType}
            onSubmit={handleRecognize}
            busy={lookupStatus === 'loading'}
          />
        </div>
      )}

      {/* ═══ Step 2 (Paket): Erkannte Fahrzeuge bestätigen ═══ */}
      {step === 'vehicle_confirm' && inputMode === 'paket' && (
        <div className="animate-in fade-in slide-in-from-top-3 duration-500">
          <PaketConfirm vehicles={paketVehicles} onChange={setPaketVehicles} onCompute={handleComputePricing} />
        </div>
      )}

      {/* ═══ Step 2: Vehicle Confirmation + Equipment ═══ */}
      {step === 'vehicle_confirm' && inputMode !== 'paket' && vehicleData && (
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

      {/* ═══ Step 4 (Paket): Paket-Ergebnis ═══ */}
      {step === 'results' && inputMode === 'paket' && (
        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h2 className="text-lg font-semibold">Ergebnis: Paket-Bewertung</h2>
          <PaketResult vehicles={paketVehicles} onReset={handleReset} onCreateInserat={handleCreatePaketInserat} />
        </div>
      )}

      {/* ═══ Step 4: Results ═══ */}
      {step === 'results' && inputMode !== 'paket' && pricingResult && (
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

          {/* ── Verwertungskanal-Banner (spannt Empfehlung + Detailanalyse) ── */}
          {channelDecision && (
            <RoutingBanner
              decision={channelDecision}
              overrideChannel={overrideChannel}
              onOverrideChange={setOverrideChannel}
              note={overrideNote}
              onNoteChange={setOverrideNote}
            />
          )}

          {/* ── Einzelfahrzeug-Ergebnis (Empfehlung + Detailanalyse) ── */}
          {/* Listenplatz-Rechner nur für Endkunden-Fahrzeuge (eine B2B-Auktion hat keinen mobile.de-Listenplatz) */}
          <SingleVehicleResult
            result={pricingResult}
            resultsView={resultsView}
            channel={channel}
            empfehlungInsert={
              channel === 'endkunde' && vehicleType !== 'transporter' ? (
                <ListenplatzRechner
                  listPrice={listPrice}
                  onListPriceChange={setListPrice}
                  sweetSpot={pricingResult.sweetSpot}
                  onInserat={(p) => handleOpenInseratModal(p)}
                />
              ) : undefined
            }
          />

          {/* Action Bar */}
          <Card className="border-border/60 bg-gradient-to-r from-muted/40 via-muted/20 to-primary/[0.04]">
            <CardContent className="p-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium">Nächster Schritt</p>
                <p className="text-xs text-muted-foreground">
                  Ankauf zu {formatCurrency(pricingResult.sweetSpot)} &middot; {L.nextLabel} zu ~{formatCurrency(effectiveSellPrice)} &middot; {L.spreadLabel} {formatCurrency(effectiveSellPrice - pricingResult.sweetSpot)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 sm:flex-nowrap">
                <Button variant="ghost" onClick={handleReset} className="shrink-0">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Neue Bewertung
                </Button>
                <Button variant="outline" className="shrink-0">
                  <Check className="h-4 w-4 mr-2" />
                  Ankauf einleiten
                </Button>
                <Button
                  onClick={() => handleOpenInseratModal()}
                  className="shrink-0 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-md shadow-indigo-500/20"
                >
                  {isAuction ? <Gavel className="h-4 w-4 mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                  {L.cta}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ═══ Floating Action Button (FAB) — only on results step ═══ */}
      {/* Positioned to avoid overlap with the global voice mic button */}
      {step === 'results' && inputMode !== 'paket' && pricingResult && !showInseratModal && (
        <button
          onClick={() => handleOpenInseratModal()}
          className="group fixed right-3 bottom-[calc(var(--mobile-float-offset,1rem)+4rem)] z-40 flex items-center gap-2.5 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3.5 text-sm font-semibold text-white shadow-xl shadow-indigo-500/30 ring-1 ring-white/10 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/40 hover:scale-[1.03] active:scale-[0.98] animate-in fade-in slide-in-from-bottom-4 sm:right-[5.25rem] sm:bottom-6"
          aria-label={`${L.cta} aus dieser Bewertung`}
        >
          <span className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-60" />
          <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm">
            {isAuction ? <Gavel className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
          </span>
          <span className="relative">{L.cta}</span>
          <ArrowRight className="relative h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
        </button>
      )}

      {/* ═══ Inserat Creation Modal ═══ */}
      <Dialog
        open={showInseratModal}
        onOpenChange={(open) => {
          setShowInseratModal(open)
          if (!open) {
            setInseratCreated(false)
            setCreatingInserat(false)
          }
        }}
      >
        <DialogContent className="max-w-[calc(100vw-1rem)] sm:max-w-2xl p-0 overflow-hidden gap-0">
          {!inseratCreated ? (
            <>
              {/* Header with gradient accent */}
              <div className="relative px-6 pt-6 pb-5 bg-gradient-to-br from-indigo-50 via-card to-violet-50/40 dark:from-indigo-950/30 dark:via-card dark:to-violet-950/20 border-b border-border/60">
                <DialogHeader>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-500/20">
                      <Sparkles className="h-4 w-4 text-white" />
                    </div>
                    <DialogTitle className="text-base font-semibold">
                      Inserat aus Bewertung erstellen
                    </DialogTitle>
                  </div>
                  <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
                    Alle Fahrzeugdaten, Ausstattungen und Preise werden automatisch übernommen. Wählen Sie Ihren bevorzugten Weg.
                  </DialogDescription>
                </DialogHeader>
              </div>

              {/* Vehicle Preview */}
              {vehicleData && pricingResult && (
                <div className="px-6 py-5 space-y-4">
                  <div className="flex gap-4 items-start">
                    <div className="h-20 w-28 sm:h-24 sm:w-32 rounded-lg overflow-hidden bg-muted shrink-0 ring-1 ring-border/60">
                      <img
                        src={vehicleData.imageUrl}
                        alt={`${vehicleData.make} ${vehicleData.model}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold leading-tight">
                        {vehicleData.make} {vehicleData.model}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        EZ {vehicleData.firstRegistration} &middot; {mileage.toLocaleString('de-DE')} km &middot; {vehicleData.power} PS
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        <Badge variant="secondary" className="text-[10px] font-normal">
                          {vehicleData.fuelType}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px] font-normal">
                          {vehicleData.transmission}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px] font-normal">
                          {selectedEquipment.length} Sonderausst.
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Suggested price — editable */}
                  <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                        Vorgeschlagener Verkaufspreis
                      </Label>
                      <Badge className="text-[10px] font-normal bg-emerald-50 text-emerald-700 border-0 dark:bg-emerald-950/30 dark:text-emerald-400">
                        <TrendingUp className="h-2.5 w-2.5 mr-1" />
                        Marktbasiert
                      </Badge>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-base font-medium">€</span>
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={inseratPrice}
                        onChange={(e) => setInseratPrice(e.target.value.replace(/[^0-9]/g, ''))}
                        className="pl-8 text-lg font-bold tabular-nums h-11 bg-card"
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
                      Basis: {isAuction ? 'Ø Zuschlag' : 'mobile.de Median'} ({formatCurrency(effectiveSellPrice)}) &middot; Erwartete {isAuction ? 'Spread' : 'Marge'} bei EK {formatCurrency(pricingResult.sweetSpot)}: <span className="text-emerald-600 dark:text-emerald-400 font-medium">{formatCurrency(Number(inseratPrice || 0) - pricingResult.sweetSpot)}</span>
                    </p>
                  </div>

                  {/* Auto-imported summary */}
                  <div className="rounded-xl border border-border/60 bg-card p-3.5 space-y-2">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                      Wird automatisch übernommen
                    </p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                      {[
                        ['Fahrzeugdaten', `${vehicleData.make} ${vehicleData.model}`],
                        ['VIN', vehicleData.vin],
                        ['Erstzulassung', vehicleData.firstRegistration],
                        ['Kilometerstand', `${mileage.toLocaleString('de-DE')} km`],
                        ['Leistung / Hubraum', `${vehicleData.power} PS / ${vehicleData.displacement} ccm`],
                        ['Farbe', vehicleData.color],
                        ['Serienausstattung', `${vehicleData.serienausstattung.length} Merkmale`],
                        ['Sonderausstattung', `${selectedEquipment.length} Extras`],
                      ].map(([label, value]) => (
                        <div key={label} className="flex items-center gap-1.5 min-w-0">
                          <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                          <span className="text-muted-foreground shrink-0">{label}:</span>
                          <span className="font-medium truncate">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Two paths */}
              <div className="px-6 pb-6 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Path 1: Editor */}
                  <button
                    onClick={handleOpenInseratEditor}
                    disabled={creatingInserat}
                    className="group relative rounded-xl border border-border bg-card p-3.5 text-left transition-all hover:border-primary/40 hover:shadow-sm disabled:opacity-50"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <Pencil className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                      <span className="text-sm font-semibold">Im Editor anpassen</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Bilder hochladen, KI-Beschreibung generieren, Plausibilitätsprüfung &amp; Plattform-Export.
                    </p>
                    <ArrowRight className="absolute right-3 top-3.5 h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  </button>

                  {/* Path 2: Express */}
                  <button
                    onClick={handleCreateInseratExpress}
                    disabled={creatingInserat}
                    className="group relative rounded-xl border-2 border-primary/30 bg-gradient-to-br from-indigo-50/50 to-violet-50/50 dark:from-indigo-950/20 dark:to-violet-950/20 p-3.5 text-left transition-all hover:border-primary/60 hover:shadow-md disabled:opacity-50"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      {creatingInserat ? (
                        <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />
                      ) : (
                        <Rocket className="h-3.5 w-3.5 text-primary" />
                      )}
                      <span className="text-sm font-semibold">
                        {creatingInserat ? 'Wird erstellt...' : 'Express erstellen'}
                      </span>
                      <Badge className="ml-auto text-[9px] font-normal bg-primary/10 text-primary border-0 px-1.5 py-0">
                        Schnell
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      KI generiert Titel, Beschreibung &amp; Qualitätscheck automatisch. Direkt veröffentlichungsbereit.
                    </p>
                  </button>
                </div>
              </div>
            </>
          ) : (
            // Success state
            <div className="px-6 py-10 text-center animate-in fade-in zoom-in-95 duration-300">
              <div className="relative mx-auto w-16 h-16 mb-4">
                <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
                <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <Check className="h-8 w-8 text-white" strokeWidth={3} />
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-1.5">Inserat erfolgreich erstellt</h3>
              <p className="text-sm text-muted-foreground mb-5 max-w-sm mx-auto leading-relaxed">
                Das Inserat ist bereit. Sie können es jetzt im Editor öffnen oder direkt auf Ihren Plattformen veröffentlichen.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button variant="outline" onClick={() => setShowInseratModal(false)}>
                  Schließen
                </Button>
                <Button
                  onClick={handleOpenInseratEditor}
                  className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Inserat öffnen
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
