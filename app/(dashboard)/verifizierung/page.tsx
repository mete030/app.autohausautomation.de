'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { mockKYCSubmissions, mockVehicles } from '@/lib/mock-data'
import { kycStatusConfig } from '@/lib/constants'
import { formatDateTime, formatCurrency, formatMileage } from '@/lib/utils'
import {
  ShieldCheck, Upload, CheckCircle, XCircle, AlertCircle, User, Building,
  FileText, Plus, Car, Loader2, Link2, Mail, Copy, ExternalLink,
  ChevronRight, Fuel, Gauge, Calendar, MapPin, Hash, ChevronDown, X,
} from 'lucide-react'
import type { KYCSubmission, CustomerType, Vehicle } from '@/lib/types'

type DialogStep = 'form' | 'processing' | 'success' | 'link_sent'
type PrivatMethod = 'upload' | 'link'
type StepStatus = 'pending' | 'loading' | 'done' | 'error'
interface ProcessingStep { id: string; label: string; detail: string; status: StepStatus }

function vehicleInternalNr(id: string) {
  const idx = mockVehicles.findIndex(v => v.id === id)
  return idx >= 0 ? '#V' + String(idx + 1).padStart(3, '0') : ''
}

// ─── Multi-vehicle select ──────────────────────────────────────────────────────

function VehicleMultiSelect({
  selected,
  onChange,
}: {
  selected: string[]
  onChange: (ids: string[]) => void
}) {
  const [open, setOpen] = useState(false)

  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id])
  }

  const label = selected.length === 0
    ? 'Fahrzeuge auswählen…'
    : selected.length === 1
      ? (() => { const v = mockVehicles.find(x => x.id === selected[0]); return v ? vehicleInternalNr(v.id) + ' · ' + v.make + ' ' + v.model : '1 Fahrzeug' })()
      : selected.length + ' Fahrzeuge ausgewählt'

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs hover:bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <span className={selected.length === 0 ? 'text-muted-foreground' : 'text-foreground'}>{label}</span>
            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <div className="max-h-56 overflow-y-auto">
            {mockVehicles.map((v, i) => {
              const checked = selected.includes(v.id)
              const nr = '#V' + String(i + 1).padStart(3, '0')
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => toggle(v.id)}
                  className={'flex items-center gap-3 w-full px-3 py-2.5 text-left hover:bg-muted/60 transition-colors ' + (checked ? 'bg-primary/5' : '')}
                >
                  {/* Checkbox */}
                  <div className={'h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ' + (checked ? 'border-primary bg-primary' : 'border-muted-foreground/40')}>
                    {checked && <CheckCircle className="h-3 w-3 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-mono text-muted-foreground">{nr}</span>
                      <span className="text-xs font-semibold truncate">{v.make} {v.model}</span>
                      <span className="text-xs text-muted-foreground">{v.year}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-xs text-muted-foreground">{v.licensePlate}</span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs font-medium">{formatCurrency(v.price)}</span>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </PopoverContent>
      </Popover>

      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map(id => {
            const v = mockVehicles.find(x => x.id === id)
            if (!v) return null
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1.5 rounded-md bg-muted border px-2 py-1 text-xs font-medium"
              >
                <Car className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="font-mono text-muted-foreground">{vehicleInternalNr(id)}</span>
                <span>{v.make} {v.model}</span>
                <button
                  type="button"
                  onClick={() => toggle(id)}
                  className="text-muted-foreground hover:text-foreground transition-colors ml-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Vehicle Mini Card ─────────────────────────────────────────────────────────

function VehicleMiniCard({ vehicleId, onClick }: { vehicleId: string; onClick: (v: Vehicle) => void }) {
  const vehicle = mockVehicles.find(v => v.id === vehicleId)
  if (!vehicle) return null
  const nr = vehicleInternalNr(vehicleId)
  return (
    <button onClick={e => { e.stopPropagation(); onClick(vehicle) }} className="mt-2 w-full text-left group">
      <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2 hover:bg-muted/60 transition-all">
        <div className="h-7 w-7 rounded-md bg-muted flex items-center justify-center shrink-0">
          <Car className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-mono text-muted-foreground">{nr}</span>
            <span className="text-xs font-semibold truncate">{vehicle.make} {vehicle.model}</span>
            <span className="text-xs text-muted-foreground">{vehicle.year}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-xs text-muted-foreground">{vehicle.licensePlate}</span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs font-medium">{formatCurrency(vehicle.price)}</span>
          </div>
        </div>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
      </div>
    </button>
  )
}

// ─── Vehicle Detail Modal ──────────────────────────────────────────────────────

function VehicleDetailModal({ vehicle, open, onClose }: { vehicle: Vehicle | null; open: boolean; onClose: () => void }) {
  if (!vehicle) return null
  const nr = vehicleInternalNr(vehicle.id)
  const statusColors: Record<string, string> = {
    eingang: 'bg-slate-100 text-slate-700', inspektion: 'bg-blue-100 text-blue-700',
    werkstatt: 'bg-amber-100 text-amber-700', aufbereitung: 'bg-purple-100 text-purple-700',
    verkaufsbereit: 'bg-emerald-100 text-emerald-700', verkauft: 'bg-gray-100 text-gray-500',
  }
  const statusLabels: Record<string, string> = {
    eingang: 'Eingang', inspektion: 'Inspektion', werkstatt: 'Werkstatt',
    aufbereitung: 'Aufbereitung', verkaufsbereit: 'Verkaufsbereit', verkauft: 'Verkauft',
  }
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <div className="relative h-48 bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={vehicle.imageUrl} alt={vehicle.make + ' ' + vehicle.model} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
            <div>
              <p className="text-white/70 text-xs font-mono">{nr} · {vehicle.licensePlate}</p>
              <h2 className="text-white font-bold text-lg leading-tight">{vehicle.make} {vehicle.model}</h2>
              <p className="text-white/80 text-sm">{vehicle.year} · {vehicle.color}</p>
            </div>
            <p className="text-white font-bold text-xl">{formatCurrency(vehicle.price)}</p>
          </div>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <Badge className={statusColors[vehicle.status]} variant="secondary">{statusLabels[vehicle.status]}</Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> {vehicle.location}</span>
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2"><Gauge className="h-4 w-4 text-muted-foreground shrink-0" /><div><p className="text-xs text-muted-foreground">Kilometerstand</p><p className="font-medium">{formatMileage(vehicle.mileage)}</p></div></div>
            <div className="flex items-center gap-2"><Fuel className="h-4 w-4 text-muted-foreground shrink-0" /><div><p className="text-xs text-muted-foreground">Kraftstoff</p><p className="font-medium">{vehicle.fuelType}</p></div></div>
            <div className="flex items-center gap-2"><Car className="h-4 w-4 text-muted-foreground shrink-0" /><div><p className="text-xs text-muted-foreground">Leistung</p><p className="font-medium">{vehicle.power} PS</p></div></div>
            <div className="flex items-center gap-2"><Hash className="h-4 w-4 text-muted-foreground shrink-0" /><div><p className="text-xs text-muted-foreground">Getriebe</p><p className="font-medium">{vehicle.transmission}</p></div></div>
            <div className="col-span-2 flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground shrink-0" /><div><p className="text-xs text-muted-foreground">FIN</p><p className="font-medium font-mono text-xs">{vehicle.vin}</p></div></div>
          </div>
          {vehicle.notes && (<><Separator /><p className="text-xs text-muted-foreground">{vehicle.notes}</p></>)}
          <Button variant="outline" className="w-full" size="sm" onClick={onClose}>Schließen</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Processing Step ──────────────────────────────────────────────────────────

function ProcessingStepItem({ step }: { step: ProcessingStep }) {
  return (
    <div className={'flex items-start gap-3 transition-all duration-300 ' + (step.status === 'pending' ? 'opacity-30' : 'opacity-100')}>
      <div className="mt-0.5 shrink-0">
        {step.status === 'loading' && <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />}
        {step.status === 'done' && <CheckCircle className="h-4 w-4 text-emerald-500" />}
        {step.status === 'error' && <XCircle className="h-4 w-4 text-red-500" />}
        {step.status === 'pending' && <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />}
      </div>
      <div>
        <p className={'text-sm font-medium ' + (step.status === 'loading' ? 'text-blue-600 dark:text-blue-400' : step.status === 'done' ? 'text-emerald-700 dark:text-emerald-400' : '')}>{step.label}</p>
        {step.status !== 'pending' && <p className="text-xs text-muted-foreground mt-0.5">{step.detail}</p>}
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function VerifizierungPage() {
  const [submissions] = useState(mockKYCSubmissions)
  const [selectedSubmission, setSelectedSubmission] = useState<KYCSubmission | null>(null)
  const [vehicleModal, setVehicleModal] = useState<Vehicle | null>(null)
  const [newDialog, setNewDialog] = useState(false)
  const [dialogStep, setDialogStep] = useState<DialogStep>('form')
  const [customerType, setCustomerType] = useState<CustomerType>('privat')
  const [privatMethod, setPrivatMethod] = useState<PrivatMethod>('upload')
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([])
  const [formEmail, setFormEmail] = useState('anna.mustermann@email.de')
  const [formVehicleIds, setFormVehicleIds] = useState<string[]>([])
  const [formUstId, setFormUstId] = useState('DE123456789')
  const [formHRB, setFormHRB] = useState('HRB 123456')
  const [linkCopied, setLinkCopied] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const filterByStatus = (status: string) => status === 'alle' ? submissions : submissions.filter(s => s.status === status)
  const statCounts = {
    eingereicht: submissions.filter(s => s.status === 'eingereicht').length,
    in_pruefung: submissions.filter(s => s.status === 'in_pruefung').length,
    verifiziert: submissions.filter(s => s.status === 'verifiziert').length,
    abgelehnt: submissions.filter(s => s.status === 'abgelehnt').length,
  }

  const clearTimers = () => { timerRef.current.forEach(clearTimeout); timerRef.current = [] }

  const handleOpenDialog = () => {
    setDialogStep('form'); setCustomerType('privat'); setPrivatMethod('upload')
    setFormVehicleIds([]); setLinkCopied(false); setProcessingSteps([]); setNewDialog(true)
  }
  const handleCloseDialog = () => { clearTimers(); setNewDialog(false) }

  const buildSteps = (type: CustomerType, method: PrivatMethod): ProcessingStep[] => {
    if (type === 'gewerbe') return [
      { id: 's1', label: 'Einreichung wird verarbeitet', detail: 'Daten werden übermittelt…', status: 'pending' },
      { id: 's2', label: 'USt-IdNr. ' + formUstId + ' wird geprüft', detail: 'VIES-Datenbankabfrage läuft…', status: 'pending' },
      { id: 's3', label: 'Handelsregister ' + formHRB + ' wird geprüft', detail: 'Bundesanzeiger-Abfrage läuft…', status: 'pending' },
      { id: 's4', label: 'Firmendaten werden abgeglichen', detail: 'Name, Sitz & Rechtsform werden validiert…', status: 'pending' },
    ]
    if (method === 'link') return [
      { id: 's1', label: 'Verifizierungslink wird erstellt', detail: 'Sicherer Token wird generiert…', status: 'pending' },
      { id: 's2', label: 'E-Mail wird gesendet an ' + formEmail, detail: 'Link läuft in 24 Stunden ab…', status: 'pending' },
    ]
    return [
      { id: 's1', label: 'Dokument wird hochgeladen', detail: 'Sichere Ende-zu-Ende-Verschlüsselung…', status: 'pending' },
      { id: 's2', label: 'Dokument wird analysiert', detail: 'OCR & Sicherheitsmerkmale werden geprüft…', status: 'pending' },
      { id: 's3', label: 'Identität wird verifiziert', detail: 'Biometrischer Abgleich läuft…', status: 'pending' },
    ]
  }

  const runProcessing = (steps: ProcessingStep[], type: CustomerType, method: PrivatMethod) => {
    clearTimers()
    const timers: ReturnType<typeof setTimeout>[] = []
    let delay = 300
    steps.forEach((_, index) => {
      const t1 = setTimeout(() => setProcessingSteps(prev => prev.map((s, i) => i === index ? { ...s, status: 'loading' } : s)), delay)
      timers.push(t1); delay += 1600
      const t2 = setTimeout(() => setProcessingSteps(prev => prev.map((s, i) => i === index ? { ...s, status: 'done' } : s)), delay)
      timers.push(t2); delay += 400
    })
    const tFinal = setTimeout(() => setDialogStep(type === 'privat' && method === 'link' ? 'link_sent' : 'success'), delay + 300)
    timers.push(tFinal); timerRef.current = timers
  }

  const handleSubmit = () => {
    const steps = buildSteps(customerType, privatMethod)
    setProcessingSteps(steps); setDialogStep('processing')
    runProcessing(steps, customerType, privatMethod)
  }

  useEffect(() => { if (!newDialog) clearTimers() }, [newDialog])

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold">Verifizierung</h1><p className="text-sm text-muted-foreground">KYC & Kundenverifizierung</p></div>
        <Button onClick={handleOpenDialog}><Plus className="h-4 w-4 mr-2" />Neue Verifizierung</Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {[
          { icon: FileText, bg: 'bg-blue-50 dark:bg-blue-950/30', color: 'text-blue-500', count: statCounts.eingereicht, label: 'Eingereicht' },
          { icon: AlertCircle, bg: 'bg-amber-50 dark:bg-amber-950/30', color: 'text-amber-500', count: statCounts.in_pruefung, label: 'In Prüfung' },
          { icon: CheckCircle, bg: 'bg-emerald-50 dark:bg-emerald-950/30', color: 'text-emerald-500', count: statCounts.verifiziert, label: 'Verifiziert' },
          { icon: XCircle, bg: 'bg-red-50 dark:bg-red-950/30', color: 'text-red-500', count: statCounts.abgelehnt, label: 'Abgelehnt' },
        ].map(({ icon: Icon, bg, color, count, label }) => (
          <Card key={label}><CardContent className="p-3 flex items-center gap-3">
            <div className={'h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ' + bg}>
              <Icon className={'h-4 w-4 ' + color} />
            </div>
            <div>
              <div className="text-xl font-bold leading-none">{count}</div>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          </CardContent></Card>
        ))}
      </div>

      <Tabs defaultValue="alle">
        <TabsList>
          <TabsTrigger value="alle">Alle ({submissions.length})</TabsTrigger>
          <TabsTrigger value="eingereicht">Eingereicht</TabsTrigger>
          <TabsTrigger value="in_pruefung">In Prüfung</TabsTrigger>
          <TabsTrigger value="verifiziert">Verifiziert</TabsTrigger>
          <TabsTrigger value="abgelehnt">Abgelehnt</TabsTrigger>
          <TabsTrigger value="manuell_pruefen">Manuell prüfen</TabsTrigger>
        </TabsList>
        {['alle', 'eingereicht', 'in_pruefung', 'verifiziert', 'abgelehnt', 'manuell_pruefen'].map(tab => (
          <TabsContent key={tab} value={tab} className="space-y-2.5 mt-2.5">
            {filterByStatus(tab).map(sub => {
              const config = kycStatusConfig[sub.status]
              return (
                <Card key={sub.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedSubmission(sub)}>
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                          {sub.customerType === 'privat' ? <User className="h-4 w-4 text-muted-foreground" /> : <Building className="h-4 w-4 text-muted-foreground" />}
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm">{sub.customerName}</h3>
                          <p className="text-xs text-muted-foreground">{sub.customerType === 'privat' ? 'Privatkunde' : 'Gewerbekunde'}{' · '}{sub.email}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Eingereicht: {formatDateTime(sub.submittedAt)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {sub.vehicleIds && sub.vehicleIds.length > 1 && (
                          <span className="text-xs text-muted-foreground font-medium">{sub.vehicleIds.length} Fzg.</span>
                        )}
                        <Badge className={config.color} variant="secondary">{config.label}</Badge>
                      </div>
                    </div>
                    {/* Vehicle mini cards */}
                    {sub.vehicleIds && sub.vehicleIds.length > 0 && (
                      <div className="mt-1 space-y-0">
                        {sub.vehicleIds.map(vid => (
                          <VehicleMiniCard key={vid} vehicleId={vid} onClick={v => setVehicleModal(v)} />
                        ))}
                      </div>
                    )}
                    {sub.checkResults && sub.checkResults.length > 0 && (
                      <div className="mt-3 flex gap-2 flex-wrap">
                        {sub.checkResults.map((check, i) => (
                          <Badge key={i} variant="outline"
                            className={check.passed ? 'border-emerald-200 text-emerald-700 dark:border-emerald-800 dark:text-emerald-400' : 'border-red-200 text-red-700 dark:border-red-800 dark:text-red-400'}>
                            {check.passed ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}{check.check}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </TabsContent>
        ))}
      </Tabs>

      <VehicleDetailModal vehicle={vehicleModal} open={!!vehicleModal} onClose={() => setVehicleModal(null)} />

      {/* Detail Dialog */}
      <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" />Verifizierung: {selectedSubmission?.customerName}</DialogTitle>
          </DialogHeader>
          {selectedSubmission && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className={kycStatusConfig[selectedSubmission.status].color} variant="secondary">{kycStatusConfig[selectedSubmission.status].label}</Badge>
                <span className="text-sm text-muted-foreground">{selectedSubmission.customerType === 'privat' ? 'Privatkunde' : 'Gewerbekunde'}</span>
                {selectedSubmission.vehicleIds && selectedSubmission.vehicleIds.length > 0 && (
                  <span className="text-xs text-muted-foreground ml-auto">{selectedSubmission.vehicleIds.length} Fahrzeug{selectedSubmission.vehicleIds.length > 1 ? 'e' : ''}</span>
                )}
              </div>
              {selectedSubmission.vehicleIds && selectedSubmission.vehicleIds.length > 0 && (
                <div className="space-y-0">
                  {selectedSubmission.vehicleIds.map(vid => (
                    <VehicleMiniCard key={vid} vehicleId={vid} onClick={v => { setSelectedSubmission(null); setVehicleModal(v) }} />
                  ))}
                </div>
              )}
              <Separator />
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">E-Mail</span><p className="font-medium">{selectedSubmission.email}</p></div>
                <div><span className="text-muted-foreground">Telefon</span><p className="font-medium">{selectedSubmission.phone}</p></div>
                {selectedSubmission.customerType === 'privat' && (<>
                  {selectedSubmission.documentType && <div><span className="text-muted-foreground">Dokumenttyp</span><p className="font-medium capitalize">{selectedSubmission.documentType}</p></div>}
                  {selectedSubmission.documentNumber && <div><span className="text-muted-foreground">Dokumentnr.</span><p className="font-medium">{selectedSubmission.documentNumber}</p></div>}
                  {selectedSubmission.dateOfBirth && <div><span className="text-muted-foreground">Geburtsdatum</span><p className="font-medium">{selectedSubmission.dateOfBirth}</p></div>}
                  {selectedSubmission.address && <div className="col-span-2"><span className="text-muted-foreground">Adresse</span><p className="font-medium">{selectedSubmission.address}</p></div>}
                  {selectedSubmission.privacyMethod && <div><span className="text-muted-foreground">Prüfmethode</span><p className="font-medium">{selectedSubmission.privacyMethod === 'upload' ? 'Dokument hochgeladen' : 'Link gesendet'}</p></div>}
                </>)}
                {selectedSubmission.customerType === 'gewerbe' && (<>
                  {selectedSubmission.companyName && <div className="col-span-2"><span className="text-muted-foreground">Firma</span><p className="font-medium">{selectedSubmission.companyName}</p></div>}
                  {selectedSubmission.handelsregisterNr && <div><span className="text-muted-foreground">Handelsregister</span><p className="font-medium">{selectedSubmission.handelsregisterNr}</p></div>}
                  {selectedSubmission.ustIdNr && <div><span className="text-muted-foreground">USt-IdNr.</span><p className="font-medium">{selectedSubmission.ustIdNr}</p></div>}
                </>)}
              </div>
              {selectedSubmission.checkResults && selectedSubmission.checkResults.length > 0 && (<>
                <Separator />
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Prüfergebnisse</h4>
                  {selectedSubmission.checkResults.map((check, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      {check.passed ? <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" /> : <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />}
                      <div><p className="font-medium">{check.check}</p><p className="text-xs text-muted-foreground">{check.detail}</p></div>
                    </div>
                  ))}
                </div>
              </>)}
              {selectedSubmission.notes && (<><Separator /><div><h4 className="font-semibold text-sm mb-1">Notizen</h4><p className="text-sm text-muted-foreground">{selectedSubmission.notes}</p></div></>)}
              {(selectedSubmission.status === 'eingereicht' || selectedSubmission.status === 'manuell_pruefen') && (<>
                <Separator />
                <div className="flex gap-2">
                  <Button className="flex-1" variant="default"><CheckCircle className="h-4 w-4 mr-2" />Verifizieren</Button>
                  <Button className="flex-1" variant="destructive"><XCircle className="h-4 w-4 mr-2" />Ablehnen</Button>
                </div>
              </>)}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* New Verification Dialog */}
      <Dialog open={newDialog} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">

          {dialogStep === 'form' && (<>
            <DialogHeader><DialogTitle>Neue Verifizierung</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Kundentyp</Label>
                <Tabs value={customerType} onValueChange={v => setCustomerType(v as CustomerType)}>
                  <TabsList className="w-full">
                    <TabsTrigger value="privat" className="flex-1"><User className="h-4 w-4 mr-2" />Privatkunde</TabsTrigger>
                    <TabsTrigger value="gewerbe" className="flex-1"><Building className="h-4 w-4 mr-2" />Gewerbekunde</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Name</Label><Input placeholder="Max Mustermann" /></div>
                <div className="space-y-2"><Label>E-Mail</Label><Input placeholder="email@beispiel.de" type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} /></div>
              </div>
              <div className="space-y-2"><Label>Telefon</Label><Input placeholder="+49 711 1234567" /></div>

              {/* Multi-vehicle select */}
              <div className="space-y-2">
                <Label>
                  Fahrzeuge
                  <span className="ml-1.5 text-xs font-normal text-muted-foreground">(optional · Mehrfachauswahl)</span>
                </Label>
                <VehicleMultiSelect selected={formVehicleIds} onChange={setFormVehicleIds} />
              </div>

              {customerType === 'privat' && (<>
                <div className="space-y-2">
                  <Label>Dokumenttyp</Label>
                  <Select><SelectTrigger><SelectValue placeholder="Auswählen" /></SelectTrigger>
                    <SelectContent><SelectItem value="personalausweis">Personalausweis</SelectItem><SelectItem value="reisepass">Reisepass</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>ID-Prüfung Methode</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      { method: 'upload' as PrivatMethod, Icon: Upload, label: 'Dokument hochladen', sub: 'Jetzt direkt' },
                      { method: 'link' as PrivatMethod, Icon: Link2, label: 'Link senden', sub: 'Per E-Mail' },
                    ]).map(({ method, Icon, label, sub }) => (
                      <button key={method} onClick={() => setPrivatMethod(method)}
                        className={'flex flex-col items-center gap-2 rounded-lg border-2 p-3 text-sm transition-all ' +
                          (privatMethod === method ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:border-muted-foreground')}>
                        <Icon className="h-5 w-5" />
                        <span className="font-medium">{label}</span>
                        <span className="text-xs opacity-70">{sub}</span>
                      </button>
                    ))}
                  </div>
                </div>
                {privatMethod === 'upload' && (
                  <div className="border-2 border-dashed rounded-xl p-5 text-center">
                    <Upload className="h-7 w-7 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">Ausweis oder Reisepass hochladen</p>
                    <Button variant="outline" size="sm"><Upload className="h-4 w-4 mr-2" />Datei auswählen</Button>
                  </div>
                )}
                {privatMethod === 'link' && (
                  <div className="rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-4">
                    <div className="flex items-start gap-3">
                      <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium text-blue-800 dark:text-blue-200">Link per E-Mail senden</p>
                        <p className="text-blue-600 dark:text-blue-400 text-xs mt-0.5">Der Kunde erhält einen sicheren Link an <strong>{formEmail || 'die angegebene E-Mail'}</strong>. Gültig für 24 Stunden.</p>
                      </div>
                    </div>
                  </div>
                )}
              </>)}

              {customerType === 'gewerbe' && (<>
                <div className="space-y-2"><Label>Firmenname</Label><Input placeholder="Musterfirma GmbH" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Handelsregisternr.</Label><Input placeholder="HRB 123456" value={formHRB} onChange={e => setFormHRB(e.target.value)} /></div>
                  <div className="space-y-2"><Label>USt-IdNr.</Label><Input placeholder="DE123456789" value={formUstId} onChange={e => setFormUstId(e.target.value)} /></div>
                </div>
                <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3">
                  <p className="text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2">
                    <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    USt-IdNr. und Handelsregisternummer werden automatisch über externe Datenbanken geprüft.
                  </p>
                </div>
              </>)}

              <Button className="w-full" onClick={handleSubmit}><ShieldCheck className="h-4 w-4 mr-2" />Verifizierung einreichen</Button>
            </div>
          </>)}

          {dialogStep === 'processing' && (
            <div className="py-4">
              <div className="text-center mb-6">
                <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-3">
                  <Loader2 className="h-6 w-6 text-blue-600 dark:text-blue-400 animate-spin" />
                </div>
                <h3 className="font-semibold">{customerType === 'gewerbe' ? 'Gewerbliche Prüfung läuft' : 'Identitätsprüfung läuft'}</h3>
                <p className="text-sm text-muted-foreground mt-1">Bitte warten Sie einen Moment…</p>
              </div>
              <div className="space-y-4 bg-muted/30 rounded-xl p-4">
                {processingSteps.map(step => <ProcessingStepItem key={step.id} step={step} />)}
              </div>
            </div>
          )}

          {dialogStep === 'success' && (
            <div className="py-4 text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto">
                <CheckCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="font-bold text-lg">{customerType === 'gewerbe' ? 'Gewerbe verifiziert' : 'Identität bestätigt'}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {customerType === 'gewerbe' ? 'USt-IdNr. und Handelsregister wurden erfolgreich geprüft.' : 'Ausweis wurde erfolgreich analysiert und Identität bestätigt.'}
                </p>
              </div>
              <div className="bg-muted/40 rounded-xl p-4 text-left space-y-2">
                {processingSteps.map(step => (
                  <div key={step.id} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span className="font-medium">{step.label}</span>
                  </div>
                ))}
              </div>
              <Button className="w-full" onClick={handleCloseDialog}>Fertig</Button>
            </div>
          )}

          {dialogStep === 'link_sent' && (
            <div className="py-4 text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto">
                <Mail className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Link gesendet</h3>
                <p className="text-sm text-muted-foreground mt-1">Ein sicherer Verifizierungslink wurde an <strong>{formEmail}</strong> gesendet.</p>
              </div>
              <div className="rounded-xl border bg-muted/30 p-3 text-left space-y-2">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Verifizierungslink</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-background rounded px-2 py-1 border truncate">verify.wackenhut.de/id-check?token=wh-demo-abc123</code>
                  <Button variant="outline" size="sm" className="shrink-0" onClick={() => { setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2000) }}>
                    {linkCopied ? <CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Gültig für 24 Stunden · Ende-zu-Ende verschlüsselt</p>
              </div>
              <Button variant="outline" className="w-full" onClick={() => window.open('/id-check', '_blank')}>
                <ExternalLink className="h-4 w-4 mr-2" />ID-Prüfung Demo öffnen
              </Button>
              <Button className="w-full" onClick={handleCloseDialog}>Fertig</Button>
            </div>
          )}

        </DialogContent>
      </Dialog>
    </div>
  )
}
