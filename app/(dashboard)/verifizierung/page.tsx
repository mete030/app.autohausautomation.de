'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { mockVehicles } from '@/lib/mock-data'
import { kycStatusConfig } from '@/lib/constants'
import { cn, formatDateTime, formatCurrency, formatMileage } from '@/lib/utils'
import { useKYCStore } from '@/lib/stores/kyc-store'
import { getSegmentConfig, getDocumentsForSegment, kycSegments } from '@/lib/kyc-config'
import { SegmentSelector } from '@/components/verifizierung/SegmentSelector'
import { DocumentRequirementsList } from '@/components/verifizierung/DocumentRequirementsList'
import { VerificationProgressBar } from '@/components/verifizierung/VerificationProgressBar'
import {
  ShieldCheck, Upload, CheckCircle, XCircle, AlertCircle, User, Building,
  FileText, Plus, Car, Loader2, Link2, Mail, Copy, ExternalLink,
  ChevronRight, Fuel, Gauge, Calendar, MapPin, Hash, ChevronDown, X,
  Package, Send, Eye, Download, FileCheck, Clock, Printer,
  Truck, Handshake, Globe, Crown,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { KYCSubmission, KYCDocumentSubmission, CustomerSegment, Vehicle, DocumentBundleState } from '@/lib/types'

type DialogStep = 'form' | 'processing' | 'success' | 'link_sent'
type PrivatMethod = 'upload' | 'link'
type StepStatus = 'pending' | 'loading' | 'done' | 'error'
interface ProcessingStep { id: string; label: string; detail: string; status: StepStatus }
type PreviewDocType = 'kaufbestaetigung' | 'abholschein' | 'rechnung' | 'gelangensbestaetigung'
interface DocGenStepItem { id: string; label: string; detail: string; status: 'pending' | 'loading' | 'done' }

const segmentIconMap: Record<string, LucideIcon> = {
  User, Building, Truck, Handshake, Globe, Crown,
}

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
          <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div className="flex items-center gap-2"><Gauge className="h-4 w-4 text-muted-foreground shrink-0" /><div><p className="text-xs text-muted-foreground">Kilometerstand</p><p className="font-medium">{formatMileage(vehicle.mileage)}</p></div></div>
            <div className="flex items-center gap-2"><Fuel className="h-4 w-4 text-muted-foreground shrink-0" /><div><p className="text-xs text-muted-foreground">Kraftstoff</p><p className="font-medium">{vehicle.fuelType}</p></div></div>
            <div className="flex items-center gap-2"><Car className="h-4 w-4 text-muted-foreground shrink-0" /><div><p className="text-xs text-muted-foreground">Leistung</p><p className="font-medium">{vehicle.power} PS</p></div></div>
            <div className="flex items-center gap-2"><Hash className="h-4 w-4 text-muted-foreground shrink-0" /><div><p className="text-xs text-muted-foreground">Getriebe</p><p className="font-medium">{vehicle.transmission}</p></div></div>
            <div className="col-span-1 flex items-center gap-2 sm:col-span-2"><Calendar className="h-4 w-4 text-muted-foreground shrink-0" /><div><p className="text-xs text-muted-foreground">FIN</p><p className="font-medium font-mono text-xs">{vehicle.vin}</p></div></div>
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

// ─── Document Section ─────────────────────────────────────────────────────────

const DOC_ROWS: { type: PreviewDocType; label: string; desc: string }[] = [
  { type: 'kaufbestaetigung', label: 'Kaufbestätigung', desc: 'Vertragsbestätigung mit Käufer- & Fahrzeugdaten' },
  { type: 'abholschein', label: 'Abholschein', desc: 'Übergabeprotokoll mit Checkliste' },
  { type: 'rechnung', label: 'Rechnung', desc: 'Steuerrechnung mit MwSt.-Aufschlüsselung' },
  { type: 'gelangensbestaetigung', label: 'Gelangensbestätigung', desc: 'Bestätigung des Erhalts gem. § 17a UStDV' },
]

function DocumentSection({
  submission,
  bundleState,
  docGenSteps,
  onGenerate,
  onSend,
  onPreview,
}: {
  submission: KYCSubmission
  bundleState: DocumentBundleState | undefined
  docGenSteps: DocGenStepItem[]
  onGenerate: (sub: KYCSubmission) => void
  onSend: (sub: KYCSubmission) => void
  onPreview: (sub: KYCSubmission, docType: PreviewDocType) => void
}) {
  const status = bundleState?.status ?? 'idle'
  const isReady = status === 'ready' || status === 'sending' || status === 'sent'

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Package className="h-4 w-4 text-muted-foreground" />
        <h4 className="font-semibold text-sm">Dokument-Paket</h4>
      </div>

      <div className="space-y-1.5">
        {DOC_ROWS.map(row => (
          <div key={row.type} className="flex items-center gap-3 rounded-lg border bg-muted/20 px-3 py-2.5">
            <div className={'h-2 w-2 rounded-full shrink-0 ' + (isReady ? 'bg-emerald-500' : 'bg-muted-foreground/30')} />
            <FileCheck className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold">{row.label}</p>
              <p className="text-xs text-muted-foreground truncate">{row.desc}</p>
            </div>
            {isReady && (
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => onPreview(submission, row.type)}>
                <Eye className="h-3.5 w-3.5 mr-1" />Vorschau
              </Button>
            )}
          </div>
        ))}
      </div>

      {status === 'generating' && (
        <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 text-amber-600 dark:text-amber-400 animate-spin" />
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Dokumente werden erstellt…</p>
          </div>
          <div className="space-y-2.5">
            {docGenSteps.map(step => (
              <div key={step.id} className={'flex items-start gap-2.5 transition-all duration-300 ' + (step.status === 'pending' ? 'opacity-30' : 'opacity-100')}>
                <div className="mt-0.5 shrink-0">
                  {step.status === 'loading' && <Loader2 className="h-3.5 w-3.5 text-amber-600 animate-spin" />}
                  {step.status === 'done' && <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />}
                  {step.status === 'pending' && <div className="h-3.5 w-3.5 rounded-full border-2 border-muted-foreground/30" />}
                </div>
                <div>
                  <p className={'text-xs font-medium ' + (step.status === 'loading' ? 'text-amber-700 dark:text-amber-400' : step.status === 'done' ? 'text-emerald-700 dark:text-emerald-400' : 'text-muted-foreground')}>{step.label}</p>
                  {step.status !== 'pending' && <p className="text-xs text-muted-foreground mt-0.5">{step.detail}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {status === 'sending' && (
        <div className="rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-3 flex items-center gap-3">
          <Loader2 className="h-4 w-4 text-blue-600 dark:text-blue-400 animate-spin shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Wird gesendet…</p>
            <p className="text-xs text-blue-600 dark:text-blue-400">Dokumente werden an {submission.email} übermittelt</p>
          </div>
        </div>
      )}

      {status === 'sent' && bundleState?.sentAt && (
        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 p-3 flex items-start gap-3">
          <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">Dokumente gesendet</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400">An {submission.email} gesendet · {formatDateTime(bundleState.sentAt)}</p>
          </div>
        </div>
      )}

      {(status === 'ready' || status === 'sending' || status === 'sent') && bundleState?.generatedAt && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>Erstellt: {formatDateTime(bundleState.generatedAt)}</span>
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        {status === 'idle' && (
          <Button variant="outline" className="flex-1" onClick={() => onGenerate(submission)}>
            <Package className="h-4 w-4 mr-2" />Dokumente erstellen
          </Button>
        )}
        {(status === 'ready' || status === 'sending') && (
          <Button className="flex-1" disabled={status === 'sending'} onClick={() => onSend(submission)}>
            {status === 'sending'
              ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Wird gesendet…</>
              : <><Send className="h-4 w-4 mr-2" />Dokument-Paket senden</>}
          </Button>
        )}
        {status === 'sent' && (
          <Button variant="outline" className="flex-1" onClick={() => onGenerate(submission)}>
            <Package className="h-4 w-4 mr-2" />Erneut erstellen
          </Button>
        )}
      </div>
    </div>
  )
}

// ─── Document Preview Modal ────────────────────────────────────────────────────

function DocumentPreviewModal({
  open, onClose, docType: initialDocType, submission,
}: {
  open: boolean; onClose: () => void; docType: PreviewDocType; submission: KYCSubmission | null
}) {
  const [activeTab, setActiveTab] = useState<PreviewDocType>(initialDocType)
  useEffect(() => { setActiveTab(initialDocType) }, [initialDocType])
  if (!submission) return null

  const primaryVehicleId = submission.vehicleIds?.[0]
  const vehicle = primaryVehicleId ? mockVehicles.find(v => v.id === primaryVehicleId) : null
  const multiVehicle = (submission.vehicleIds?.length ?? 0) > 1
  const today = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const invoiceNr = 'RE-2026-' + submission.id.toUpperCase().replace('KYC', '')

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[calc(100vw-1rem)] max-h-[90vh] p-0 overflow-hidden flex flex-col sm:max-w-2xl">
        <div className="flex flex-col gap-2 border-b bg-muted/30 px-4 py-3 shrink-0 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold">Dokument-Vorschau</p>
            <p className="text-xs text-muted-foreground">{submission.customerName}</p>
          </div>
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <Button variant="outline" size="sm" className="h-7 flex-1 px-2 text-xs sm:flex-none"><Printer className="h-3.5 w-3.5 mr-1" />Drucken</Button>
            <Button variant="outline" size="sm" className="h-7 flex-1 px-2 text-xs sm:flex-none"><Download className="h-3.5 w-3.5 mr-1" />PDF</Button>
          </div>
        </div>
        <div className="flex overflow-x-auto border-b shrink-0 px-4">
          {DOC_ROWS.map(row => (
            <button key={row.type} onClick={() => setActiveTab(row.type)}
              className={'px-3 py-2.5 text-xs font-medium border-b-2 transition-colors -mb-px ' +
                (activeTab === row.type ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground')}>
              {row.label}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto bg-slate-100 dark:bg-slate-900 p-3 sm:p-6">
          <div className="bg-white dark:bg-slate-950 rounded-lg shadow-sm max-w-xl mx-auto p-4 text-sm sm:p-8">
            {/* Kaufbestätigung */}
            {activeTab === 'kaufbestaetigung' && (
              <div className="space-y-6">
                <div className="flex items-start justify-between">
                  <div><p className="font-bold text-base">Wackenhut Autohaus GmbH</p><p className="text-xs text-muted-foreground mt-0.5">Königstraße 1 · 70173 Stuttgart</p><p className="text-xs text-muted-foreground">Tel: +49 711 123456 · info@wackenhut.de</p></div>
                  <div className="text-right"><p className="font-bold text-base">Kaufbestätigung</p><p className="text-xs text-muted-foreground mt-0.5">Datum: {today}</p><p className="text-xs text-muted-foreground">Nr.: KB-2026-{submission.id.toUpperCase().replace('KYC', '')}</p></div>
                </div>
                <Separator />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1"><p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Verkäufer</p><p className="font-medium">Wackenhut Autohaus GmbH</p><p className="text-xs text-muted-foreground">Königstraße 1</p><p className="text-xs text-muted-foreground">70173 Stuttgart</p></div>
                  <div className="space-y-1"><p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Käufer</p><p className="font-medium">{submission.customerName}</p>{submission.address && <p className="text-xs text-muted-foreground">{submission.address}</p>}<p className="text-xs text-muted-foreground">{submission.email}</p></div>
                </div>
                {vehicle && (
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-900 p-4 space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Kaufgegenstand</p>
                    <p className="font-semibold">{vehicle.make} {vehicle.model} · {vehicle.year}</p>
                    <div className="grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2 text-xs text-muted-foreground">
                      <span>FIN: <span className="font-mono">{vehicle.vin}</span></span>
                      <span>Kennzeichen: {vehicle.licensePlate}</span>
                      <span>Farbe: {vehicle.color}</span>
                      <span>Laufleistung: {formatMileage(vehicle.mileage)}</span>
                    </div>
                    {multiVehicle && <p className="text-xs text-amber-600 dark:text-amber-400">+ {(submission.vehicleIds!.length - 1)} weiteres Fahrzeug</p>}
                  </div>
                )}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Kaufpreis</p>
                  {vehicle && (<>
                    <div className="flex justify-between"><span>Netto</span><span className="font-medium">{formatCurrency(vehicle.price / 1.19)}</span></div>
                    <div className="flex justify-between text-muted-foreground"><span>zzgl. 19% MwSt.</span><span>{formatCurrency(vehicle.price - vehicle.price / 1.19)}</span></div>
                    <Separator />
                    <div className="flex justify-between font-bold"><span>Gesamtbetrag</span><span>{formatCurrency(vehicle.price)}</span></div>
                  </>)}
                </div>
                <div className="grid grid-cols-2 gap-8 pt-8 border-t">
                  <div className="text-center"><div className="border-t border-foreground pt-2 mt-10"><p className="text-xs text-muted-foreground">Unterschrift Verkäufer</p></div></div>
                  <div className="text-center"><div className="border-t border-foreground pt-2 mt-10"><p className="text-xs text-muted-foreground">Unterschrift Käufer</p></div></div>
                </div>
              </div>
            )}
            {/* Abholschein */}
            {activeTab === 'abholschein' && (
              <div className="space-y-6">
                <div className="flex items-start justify-between">
                  <div><p className="font-bold text-base">Wackenhut Autohaus GmbH</p><p className="text-xs text-muted-foreground mt-0.5">Königstraße 1 · 70173 Stuttgart</p></div>
                  <div className="text-right"><p className="font-bold text-base">Abholschein</p><p className="text-xs text-muted-foreground mt-0.5">Datum: {today}</p></div>
                </div>
                <Separator />
                <div className="space-y-1"><p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Käufer / Abholer</p><p className="font-medium">{submission.customerName}</p></div>
                {vehicle && (<div className="rounded-lg bg-slate-50 dark:bg-slate-900 p-4 space-y-2"><p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Fahrzeug</p><p className="font-semibold">{vehicle.make} {vehicle.model} · {vehicle.year}</p><p className="text-xs text-muted-foreground">FIN: {vehicle.vin} · Kennzeichen: {vehicle.licensePlate}</p></div>)}
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Übergabe-Checkliste</p>
                  {['Fahrzeugschlüssel (2 Stk.)', 'Bordbuch / Betriebsanleitung', 'Serviceheft', 'Zulassungsbescheinigung Teil I + II', 'TÜV-Bericht', 'Fahrzeugzustand dokumentiert'].map(item => (
                    <label key={item} className="flex items-center gap-2 text-sm"><div className="h-4 w-4 rounded border-2 border-muted-foreground/40 shrink-0" /><span>{item}</span></label>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-8 pt-8 border-t"><div className="text-center"><div className="border-t border-foreground pt-2 mt-10"><p className="text-xs text-muted-foreground">Übergeber</p></div></div><div className="text-center"><div className="border-t border-foreground pt-2 mt-10"><p className="text-xs text-muted-foreground">Empfänger</p></div></div></div>
              </div>
            )}
            {/* Rechnung */}
            {activeTab === 'rechnung' && (
              <div className="space-y-6">
                <div className="flex items-start justify-between">
                  <div><p className="font-bold text-base">Wackenhut Autohaus GmbH</p><p className="text-xs text-muted-foreground mt-0.5">Königstraße 1 · 70173 Stuttgart</p><p className="text-xs text-muted-foreground">USt-IdNr: DE987654321</p></div>
                  <div className="text-right"><p className="font-bold text-base">Rechnung</p><p className="text-xs text-muted-foreground mt-0.5">Nr.: {invoiceNr}</p><p className="text-xs text-muted-foreground">Datum: {today}</p></div>
                </div>
                <Separator />
                <div className="space-y-1"><p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Rechnungsempfänger</p><p className="font-medium">{submission.customerName}</p>{submission.address && <p className="text-xs text-muted-foreground">{submission.address}</p>}{submission.ustIdNr && <p className="text-xs text-muted-foreground">USt-IdNr: {submission.ustIdNr}</p>}</div>
                {vehicle && (<>
                  <div className="border rounded-lg overflow-hidden"><div className="bg-muted/50 px-3 py-2 text-xs font-semibold grid grid-cols-12 gap-2"><span className="col-span-1">Pos.</span><span className="col-span-7">Bezeichnung</span><span className="col-span-4 text-right">Betrag</span></div><div className="px-3 py-2.5 text-sm grid grid-cols-12 gap-2 border-t"><span className="col-span-1 text-muted-foreground">1</span><div className="col-span-7"><p className="font-medium">{vehicle.make} {vehicle.model} ({vehicle.year})</p><p className="text-xs text-muted-foreground">FIN: {vehicle.vin}</p></div><span className="col-span-4 text-right font-medium">{formatCurrency(vehicle.price / 1.19)}</span></div></div>
                  <div className="space-y-1 text-sm"><div className="flex justify-between"><span className="text-muted-foreground">Nettobetrag</span><span>{formatCurrency(vehicle.price / 1.19)}</span></div><div className="flex justify-between"><span className="text-muted-foreground">zzgl. 19% USt.</span><span>{formatCurrency(vehicle.price - vehicle.price / 1.19)}</span></div><Separator /><div className="flex justify-between font-bold text-base"><span>Rechnungsbetrag</span><span>{formatCurrency(vehicle.price)}</span></div></div>
                </>)}
                <div className="rounded-lg bg-slate-50 dark:bg-slate-900 p-3 space-y-1 text-xs text-muted-foreground"><p className="font-semibold text-foreground">Zahlungsinformationen</p><p>IBAN: DE89 3704 0044 0532 0130 00</p><p>BIC: COBADEFFXXX · Commerzbank AG</p><p>Zahlungsziel: 14 Tage netto</p></div>
              </div>
            )}
            {/* Gelangensbestätigung */}
            {activeTab === 'gelangensbestaetigung' && (
              <div className="space-y-6">
                <div className="flex items-start justify-between">
                  <div><p className="font-bold text-base">Gelangensbestätigung</p><p className="text-xs text-muted-foreground mt-0.5">gem. § 17a Abs. 2 Nr. 2 UStDV</p></div>
                  <div className="text-right"><p className="text-xs text-muted-foreground">Datum: {today}</p></div>
                </div>
                <Separator />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1"><p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Lieferant</p><p className="font-medium">Wackenhut Autohaus GmbH</p><p className="text-xs text-muted-foreground">Königstraße 1, 70173 Stuttgart</p><p className="text-xs text-muted-foreground">USt-IdNr: DE987654321</p></div>
                  <div className="space-y-1"><p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Empfänger</p><p className="font-medium">{submission.customerName}</p>{submission.address && <p className="text-xs text-muted-foreground">{submission.address}</p>}{submission.ustIdNr && <p className="text-xs text-muted-foreground">USt-IdNr: {submission.ustIdNr}</p>}</div>
                </div>
                {vehicle && (<div className="rounded-lg bg-slate-50 dark:bg-slate-900 p-4 space-y-2"><p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Liefergegenstand</p><p className="font-semibold">{vehicle.make} {vehicle.model} ({vehicle.year})</p><p className="text-xs text-muted-foreground">FIN: {vehicle.vin}</p><p className="text-xs text-muted-foreground">Menge: 1 Fahrzeug</p></div>)}
                <div className="border-2 border-dashed rounded-lg p-4 space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Bestätigung</p>
                  <p className="text-sm">Hiermit bestätige ich, dass der oben genannte Liefergegenstand im Bestimmungsmitgliedstaat der Europäischen Union eingetroffen ist.</p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div><p className="text-xs text-muted-foreground">Bestimmungsort</p><div className="border-b border-dashed mt-4" /></div>
                    <div><p className="text-xs text-muted-foreground">Monat des Erhalts</p><div className="border-b border-dashed mt-4" /></div>
                  </div>
                </div>
                <div className="text-center"><div className="border-t border-foreground pt-2 mt-10 max-w-xs mx-auto"><p className="text-xs text-muted-foreground">Unterschrift / Firmenstempel Empfänger</p></div></div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Segment Label Helper ──────────────────────────────────────────────────────

function getSegmentLabel(segment: CustomerSegment): string {
  const config = getSegmentConfig(segment)
  return config?.label ?? segment
}

function getSegmentIcon(segment: CustomerSegment): LucideIcon {
  const config = getSegmentConfig(segment)
  return segmentIconMap[config?.icon ?? 'User'] ?? User
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main Page
// ═══════════════════════════════════════════════════════════════════════════════

export default function VerifizierungPage() {
  const { submissions, addSubmission, updateDocumentStatus, setDocumentFieldValues, uploadDocument } = useKYCStore()
  const [selectedSubmission, setSelectedSubmission] = useState<KYCSubmission | null>(null)
  const [vehicleModal, setVehicleModal] = useState<Vehicle | null>(null)
  const [newDialog, setNewDialog] = useState(false)
  const [dialogStep, setDialogStep] = useState<DialogStep>('form')
  const [customerSegment, setCustomerSegment] = useState<CustomerSegment | null>(null)
  const [privatMethod, setPrivatMethod] = useState<PrivatMethod>('upload')
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([])
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('anna.mustermann@email.de')
  const [formPhone, setFormPhone] = useState('')
  const [formVehicleIds, setFormVehicleIds] = useState<string[]>([])
  const [formCompanyName, setFormCompanyName] = useState('')
  const [formDocFieldValues, setFormDocFieldValues] = useState<Record<string, Record<string, string>>>({})
  const [formDocSubmissions, setFormDocSubmissions] = useState<KYCDocumentSubmission[]>([])
  const [linkCopied, setLinkCopied] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>[]>([])

  // Document bundle state
  const [documentBundles, setDocumentBundles] = useState<Map<string, DocumentBundleState>>(
    () => {
      const m = new Map<string, DocumentBundleState>()
      submissions.forEach(s => { if (s.documentBundle) m.set(s.id, { ...s.documentBundle }) })
      return m
    }
  )
  const [docGenSteps, setDocGenSteps] = useState<DocGenStepItem[]>([])
  const docGenTimerRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewDoc, setPreviewDoc] = useState<PreviewDocType>('kaufbestaetigung')
  const [previewSubmission, setPreviewSubmission] = useState<KYCSubmission | null>(null)

  const filterByStatus = (status: string) => status === 'alle' ? submissions : submissions.filter(s => s.status === status)
  const statCounts = {
    eingereicht: submissions.filter(s => s.status === 'eingereicht').length,
    in_pruefung: submissions.filter(s => s.status === 'in_pruefung').length,
    verifiziert: submissions.filter(s => s.status === 'verifiziert').length,
    abgelehnt: submissions.filter(s => s.status === 'abgelehnt').length,
  }

  const clearTimers = () => { timerRef.current.forEach(clearTimeout); timerRef.current = [] }
  const clearDocGenTimers = () => { docGenTimerRef.current.forEach(clearTimeout); docGenTimerRef.current = [] }

  const handleOpenDialog = () => {
    setDialogStep('form'); setCustomerSegment(null); setPrivatMethod('upload')
    setFormName(''); setFormEmail('anna.mustermann@email.de'); setFormPhone('')
    setFormCompanyName(''); setFormVehicleIds([]); setLinkCopied(false)
    setProcessingSteps([]); setFormDocFieldValues({}); setFormDocSubmissions([]); setNewDialog(true)
  }
  const handleCloseDialog = () => { clearTimers(); setNewDialog(false) }

  const handleSegmentChange = (segment: CustomerSegment) => {
    setCustomerSegment(segment)
    setFormDocSubmissions([])
    // Auto-fill demo data based on segment
    const demoData: Record<CustomerSegment, { name: string; email: string; phone: string; company: string; fields: Record<string, Record<string, string>> }> = {
      privat: { name: 'Anna Mustermann', email: 'anna.mustermann@email.de', phone: '+49 711 9876543', company: '', fields: { personalausweis: { documentType: 'personalausweis', documentNumber: 'L01X00T47', dateOfBirth: '1985-06-15' } } },
      gewerbe: { name: 'Thomas Müller', email: 't.mueller@autoservice-mueller.de', phone: '+49 711 4567890', company: 'Autoservice Müller GmbH', fields: { handelsregister: { handelsregisterNr: 'HRB 750123', registergericht: 'Stuttgart' }, transparenzregister: { companyName: 'Autoservice Müller GmbH' }, ust_id: { ustIdNr: 'DE298765432' } } },
      flotte: { name: 'Sabine Weber', email: 's.weber@fleetcar.de', phone: '+49 711 3334455', company: 'FleetCar GmbH', fields: { handelsregister: { handelsregisterNr: 'HRB 891234', registergericht: 'Stuttgart' }, transparenzregister: { companyName: 'FleetCar GmbH' }, ust_id: { ustIdNr: 'DE312345678' } } },
      haendler: { name: 'Michael Braun', email: 'm.braun@autohaus-sued.de', phone: '+49 711 5556677', company: 'Autohaus Süd e.K.', fields: { handelsregister: { handelsregisterNr: 'HRA 445566', registergericht: 'Stuttgart' }, transparenzregister: { companyName: 'Autohaus Süd e.K.' }, ust_id: { ustIdNr: 'DE287654321' } } },
      export: { name: 'Pierre Dubois', email: 'p.dubois@automobile-paris.fr', phone: '+33 1 42 68 53 00', company: '', fields: { personalausweis: { documentType: 'reisepass', documentNumber: '16AF04521', dateOfBirth: '1978-03-22' } } },
      diplomat: { name: 'H.E. James Thompson', email: 'j.thompson@embassy.gov', phone: '+49 30 8305 0', company: '', fields: {} },
    }
    const data = demoData[segment]
    setFormName(data.name)
    setFormEmail(data.email)
    setFormPhone(data.phone)
    setFormCompanyName(data.company)
    setFormDocFieldValues(data.fields)
  }

  const handleDocFieldChange = (docId: string, fieldValues: Record<string, string>) => {
    setFormDocFieldValues(prev => ({
      ...prev,
      [docId]: { ...(prev[docId] ?? {}), ...fieldValues },
    }))
  }

  const handleMockFileUpload = (docId: string, file: File) => {
    // Set status to 'hochgeladen' with fileName
    setFormDocSubmissions(prev => {
      const existing = prev.filter(d => d.documentConfigId !== docId)
      return [...existing, {
        documentConfigId: docId,
        status: 'hochgeladen' as const,
        fileName: file.name,
        uploadedAt: new Date().toISOString(),
        fieldValues: formDocFieldValues[docId],
      }]
    })
  }

  const handleMockRunCheck = (docId: string) => {
    // Set status to 'wird_geprueft'
    setFormDocSubmissions(prev => {
      const existing = prev.filter(d => d.documentConfigId !== docId)
      const current = prev.find(d => d.documentConfigId === docId)
      return [...existing, {
        documentConfigId: docId,
        status: 'wird_geprueft' as const,
        fieldValues: current?.fieldValues ?? formDocFieldValues[docId],
      }]
    })

    // After delay: set to 'verifiziert' with mock check result
    const doc = customerSegment ? getDocumentsForSegment(customerSegment).find(d => d.id === docId) : null
    const mockResults: Record<string, { check: string; detail: string }> = {
      personalausweis: { check: 'ID-Dokument gültig', detail: 'OCR-Erkennung & Sicherheitsmerkmale bestätigt' },
      handelsregister: { check: 'Handelsregister bestätigt', detail: 'Bundesanzeiger: Eintragung aktiv, Vertretungsberechtigung bestätigt' },
      transparenzregister: { check: 'Wirtschaftlich Berechtigter identifiziert', detail: 'Transparenzregister: Angaben plausibel' },
      ust_id: { check: 'USt-IdNr. gültig', detail: 'VIES-Datenbank: Nummer aktiv und zugeordnet' },
    }
    const result = mockResults[docId] ?? { check: `${doc?.name ?? 'Dokument'} geprüft`, detail: 'Automatische Prüfung erfolgreich' }

    const t = setTimeout(() => {
      setFormDocSubmissions(prev => {
        const existing = prev.filter(d => d.documentConfigId !== docId)
        const current = prev.find(d => d.documentConfigId === docId)
        return [...existing, {
          documentConfigId: docId,
          status: 'verifiziert' as const,
          fieldValues: current?.fieldValues ?? formDocFieldValues[docId],
          verifiedAt: new Date().toISOString(),
          checkResult: { ...result, passed: true },
        }]
      })
    }, 1800)
    timerRef.current.push(t)
  }

  const buildStepsForSegment = (): ProcessingStep[] => {
    if (!customerSegment) return []
    const docs = getDocumentsForSegment(customerSegment)
    const automatedDocs = docs.filter(d => d.verificationMethod === 'automated' || d.verificationMethod === 'hybrid')

    if (customerSegment === 'privat' && privatMethod === 'link') {
      return [
        { id: 's1', label: 'Verifizierungslink wird erstellt', detail: 'Sicherer Token wird generiert…', status: 'pending' },
        { id: 's2', label: 'E-Mail wird gesendet an ' + formEmail, detail: 'Link läuft in 24 Stunden ab…', status: 'pending' },
      ]
    }

    const steps: ProcessingStep[] = [
      { id: 's0', label: 'Einreichung wird verarbeitet', detail: 'Daten werden übermittelt…', status: 'pending' },
    ]

    automatedDocs.forEach((doc, i) => {
      const fieldVals = formDocFieldValues[doc.id] ?? {}
      let detail = ''
      if (doc.automationSource === 'vies') detail = `VIES-Datenbankabfrage für ${fieldVals['ustIdNr'] || 'USt-IdNr.'}…`
      else if (doc.automationSource === 'bundesanzeiger') detail = `Bundesanzeiger-Abfrage für ${fieldVals['handelsregisterNr'] || 'HR-Nr.'}…`
      else if (doc.automationSource === 'transparenzregister') detail = `Wirtschaftlich Berechtigter wird geprüft…`
      else if (doc.automationSource === 'ocr_security') detail = 'OCR & Sicherheitsmerkmale werden geprüft…'

      steps.push({
        id: `s${i + 1}`,
        label: `${doc.name} wird geprüft`,
        detail,
        status: 'pending',
      })
    })

    return steps
  }

  const runProcessing = (steps: ProcessingStep[]) => {
    clearTimers()
    const timers: ReturnType<typeof setTimeout>[] = []
    let delay = 300
    steps.forEach((_, index) => {
      const t1 = setTimeout(() => setProcessingSteps(prev => prev.map((s, i) => i === index ? { ...s, status: 'loading' } : s)), delay)
      timers.push(t1); delay += 1600
      const t2 = setTimeout(() => setProcessingSteps(prev => prev.map((s, i) => i === index ? { ...s, status: 'done' } : s)), delay)
      timers.push(t2); delay += 400
    })
    const tFinal = setTimeout(() => setDialogStep(customerSegment === 'privat' && privatMethod === 'link' ? 'link_sent' : 'success'), delay + 300)
    timers.push(tFinal); timerRef.current = timers
  }

  const handleSubmit = () => {
    if (!customerSegment) return
    const steps = buildStepsForSegment()
    setProcessingSteps(steps); setDialogStep('processing')
    runProcessing(steps)
  }

  const handleGenerateDocs = (sub: KYCSubmission) => {
    clearDocGenTimers()
    const steps: DocGenStepItem[] = [
      { id: 'd1', label: 'Kaufbestätigung', detail: 'Käufer- & Fahrzeugdaten werden eingetragen…', status: 'pending' },
      { id: 'd2', label: 'Abholschein', detail: 'Übergabe-Checkliste wird erstellt…', status: 'pending' },
      { id: 'd3', label: 'Rechnung', detail: 'Steuerrechnung mit MwSt.-Aufschlüsselung…', status: 'pending' },
      { id: 'd4', label: 'Gelangensbestätigung', detail: 'Empfangsbestätigung gem. § 17a UStDV…', status: 'pending' },
    ]
    setDocGenSteps(steps)
    setDocumentBundles(prev => new Map(prev).set(sub.id, { status: 'generating' }))
    const timers: ReturnType<typeof setTimeout>[] = []
    let delay = 300
    steps.forEach((_, index) => {
      const t1 = setTimeout(() => setDocGenSteps(prev => prev.map((s, i) => i === index ? { ...s, status: 'loading' } : s)), delay)
      timers.push(t1); delay += 1400
      const t2 = setTimeout(() => setDocGenSteps(prev => prev.map((s, i) => i === index ? { ...s, status: 'done' } : s)), delay)
      timers.push(t2); delay += 300
    })
    const tFinal = setTimeout(() => {
      setDocumentBundles(prev => new Map(prev).set(sub.id, { status: 'ready', generatedAt: new Date().toISOString() }))
    }, delay + 400)
    timers.push(tFinal)
    docGenTimerRef.current = timers
  }

  const handleSendDocs = (sub: KYCSubmission) => {
    setDocumentBundles(prev => new Map(prev).set(sub.id, { ...prev.get(sub.id), status: 'sending' }))
    const t = setTimeout(() => {
      setDocumentBundles(prev => new Map(prev).set(sub.id, { ...prev.get(sub.id), status: 'sent', sentAt: new Date().toISOString() }))
    }, 2200)
    docGenTimerRef.current.push(t)
  }

  const handleOpenPreview = (sub: KYCSubmission, docType: PreviewDocType) => {
    setPreviewSubmission(sub); setPreviewDoc(docType); setPreviewOpen(true)
  }

  useEffect(() => { if (!newDialog) clearTimers() }, [newDialog])
  useEffect(() => { return () => { clearDocGenTimers() } }, [])

  // Keep selectedSubmission in sync with store
  const currentSelected = useMemo(() => {
    if (!selectedSubmission) return null
    return submissions.find(s => s.id === selectedSubmission.id) ?? null
  }, [selectedSubmission, submissions])

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold">Verifizierung</h1><p className="text-sm text-muted-foreground">KYC & Kundenverifizierung</p></div>
        <Button className="w-full sm:w-auto" onClick={handleOpenDialog}><Plus className="h-4 w-4 mr-2" />Neue Verifizierung</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {[
          { icon: FileText, bg: 'bg-blue-50 dark:bg-blue-950/30', color: 'text-blue-500', count: statCounts.eingereicht, label: 'Eingereicht' },
          { icon: AlertCircle, bg: 'bg-amber-50 dark:bg-amber-950/30', color: 'text-amber-500', count: statCounts.in_pruefung, label: 'In Prüfung' },
          { icon: CheckCircle, bg: 'bg-emerald-50 dark:bg-emerald-950/30', color: 'text-emerald-500', count: statCounts.verifiziert, label: 'Verifiziert' },
          { icon: XCircle, bg: 'bg-red-50 dark:bg-red-950/30', color: 'text-red-500', count: statCounts.abgelehnt, label: 'Abgelehnt' },
        ].map(({ icon: Icon, bg, color, count, label }) => (
          <Card key={label}><CardContent className="p-3 flex items-center gap-3">
            <div className={'h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ' + bg}><Icon className={'h-4 w-4 ' + color} /></div>
            <div><div className="text-xl font-bold leading-none">{count}</div><p className="text-xs text-muted-foreground mt-0.5">{label}</p></div>
          </CardContent></Card>
        ))}
      </div>

      {/* Tabs + List */}
      <Tabs defaultValue="alle">
        <TabsList className="w-full justify-start overflow-x-auto whitespace-nowrap">
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
              const SegIcon = getSegmentIcon(sub.customerType)
              const segConfig = getSegmentConfig(sub.customerType)
              const docSubs = sub.documentSubmissions ?? []
              const verifiedCount = docSubs.filter(d => d.status === 'verifiziert').length
              const totalDocs = docSubs.length

              return (
                <Card key={sub.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedSubmission(sub)}>
                  <CardContent className="p-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={'h-9 w-9 rounded-full flex items-center justify-center shrink-0 ' + (segConfig?.accentBg ?? 'bg-muted')}>
                          <SegIcon className={'h-4 w-4 ' + (segConfig?.color ?? 'text-muted-foreground')} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-sm truncate">{sub.customerName}</h3>
                          <p className="text-xs text-muted-foreground">{getSegmentLabel(sub.customerType)}{' · '}{sub.email}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Eingereicht: {formatDateTime(sub.submittedAt)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 sm:self-start">
                        {totalDocs > 0 && (
                          <span className="text-xs text-muted-foreground font-medium tabular-nums">{verifiedCount}/{totalDocs} Dok.</span>
                        )}
                        {sub.vehicleIds && sub.vehicleIds.length > 1 && (
                          <span className="text-xs text-muted-foreground font-medium">{sub.vehicleIds.length} Fzg.</span>
                        )}
                        <Badge className={config.color} variant="secondary">{config.label}</Badge>
                      </div>
                    </div>
                    {sub.vehicleIds && sub.vehicleIds.length > 0 && (
                      <div className="mt-1 space-y-0">
                        {sub.vehicleIds.map(vid => (
                          <VehicleMiniCard key={vid} vehicleId={vid} onClick={v => setVehicleModal(v)} />
                        ))}
                      </div>
                    )}
                    {/* Legacy check results badges */}
                    {sub.checkResults && sub.checkResults.length > 0 && !sub.documentSubmissions && (
                      <div className="mt-3 flex gap-2 flex-wrap">
                        {sub.checkResults.map((check, i) => (
                          <Badge key={i} variant="outline"
                            className={check.passed ? 'border-emerald-200 text-emerald-700 dark:border-emerald-800 dark:text-emerald-400' : 'border-red-200 text-red-700 dark:border-red-800 dark:text-red-400'}>
                            {check.passed ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}{check.check}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {/* New document submission badges */}
                    {sub.documentSubmissions && sub.documentSubmissions.length > 0 && (
                      <div className="mt-3 flex gap-2 flex-wrap">
                        {sub.documentSubmissions.filter(d => d.checkResult).map((doc, i) => (
                          <Badge key={i} variant="outline"
                            className={doc.checkResult!.passed ? 'border-emerald-200 text-emerald-700 dark:border-emerald-800 dark:text-emerald-400' : 'border-red-200 text-red-700 dark:border-red-800 dark:text-red-400'}>
                            {doc.checkResult!.passed ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}{doc.checkResult!.check}
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
      <DocumentPreviewModal open={previewOpen} onClose={() => setPreviewOpen(false)} docType={previewDoc} submission={previewSubmission} />

      {/* ─── Detail Dialog ──────────────────────────────────────────────────── */}
      <Dialog open={!!currentSelected} onOpenChange={() => setSelectedSubmission(null)}>
        <DialogContent className="max-w-[calc(100vw-1rem)] max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" />Verifizierung: {currentSelected?.customerName}</DialogTitle>
          </DialogHeader>
          {currentSelected && (() => {
            const sub = currentSelected
            const segConfig = getSegmentConfig(sub.customerType)
            const SegIcon = getSegmentIcon(sub.customerType)
            const hasDocSubmissions = sub.documentSubmissions && sub.documentSubmissions.length > 0
            const docSubs = sub.documentSubmissions ?? []
            const verifiedCount = docSubs.filter(d => d.status === 'verifiziert').length
            const failedCount = docSubs.filter(d => d.status === 'abgelehnt').length

            return (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge className={kycStatusConfig[sub.status].color} variant="secondary">{kycStatusConfig[sub.status].label}</Badge>
                  <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <SegIcon className={'h-3.5 w-3.5 ' + (segConfig?.color ?? '')} />
                    {getSegmentLabel(sub.customerType)}
                  </span>
                  {sub.vehicleIds && sub.vehicleIds.length > 0 && (
                    <span className="text-xs text-muted-foreground ml-auto">{sub.vehicleIds.length} Fahrzeug{sub.vehicleIds.length > 1 ? 'e' : ''}</span>
                  )}
                </div>

                {/* Document progress for new-style submissions */}
                {hasDocSubmissions && (
                  <VerificationProgressBar total={docSubs.length} verified={verifiedCount} failed={failedCount} />
                )}

                {sub.vehicleIds && sub.vehicleIds.length > 0 && (
                  <div className="space-y-0">
                    {sub.vehicleIds.map(vid => (
                      <VehicleMiniCard key={vid} vehicleId={vid} onClick={v => { setSelectedSubmission(null); setVehicleModal(v) }} />
                    ))}
                  </div>
                )}
                <Separator />

                {/* Contact info */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm">
                  <div><span className="text-muted-foreground">E-Mail</span><p className="font-medium">{sub.email}</p></div>
                  <div><span className="text-muted-foreground">Telefon</span><p className="font-medium">{sub.phone}</p></div>
                </div>

                {/* New: Document requirements list for new-style submissions */}
                {hasDocSubmissions && (
                  <>
                    <Separator />
                    <DocumentRequirementsList
                      segment={sub.customerType}
                      documentSubmissions={sub.documentSubmissions}
                      mode="review"
                    />
                  </>
                )}

                {/* Legacy: field-by-field display for old submissions */}
                {!hasDocSubmissions && (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm">
                    {sub.customerType === 'privat' && (<>
                      {sub.documentType && <div><span className="text-muted-foreground">Dokumenttyp</span><p className="font-medium capitalize">{sub.documentType}</p></div>}
                      {sub.documentNumber && <div><span className="text-muted-foreground">Dokumentnr.</span><p className="font-medium">{sub.documentNumber}</p></div>}
                      {sub.dateOfBirth && <div><span className="text-muted-foreground">Geburtsdatum</span><p className="font-medium">{sub.dateOfBirth}</p></div>}
                      {sub.address && <div className="col-span-2"><span className="text-muted-foreground">Adresse</span><p className="font-medium">{sub.address}</p></div>}
                      {sub.privacyMethod && <div><span className="text-muted-foreground">Prüfmethode</span><p className="font-medium">{sub.privacyMethod === 'upload' ? 'Dokument hochgeladen' : 'Link gesendet'}</p></div>}
                    </>)}
                    {sub.customerType === 'gewerbe' && (<>
                      {sub.companyName && <div className="col-span-2"><span className="text-muted-foreground">Firma</span><p className="font-medium">{sub.companyName}</p></div>}
                      {sub.handelsregisterNr && <div><span className="text-muted-foreground">Handelsregister</span><p className="font-medium">{sub.handelsregisterNr}</p></div>}
                      {sub.ustIdNr && <div><span className="text-muted-foreground">USt-IdNr.</span><p className="font-medium">{sub.ustIdNr}</p></div>}
                    </>)}
                  </div>
                )}

                {/* Legacy check results */}
                {sub.checkResults && sub.checkResults.length > 0 && !hasDocSubmissions && (<>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Prüfergebnisse</h4>
                    {sub.checkResults.map((check, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        {check.passed ? <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" /> : <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />}
                        <div><p className="font-medium">{check.check}</p><p className="text-xs text-muted-foreground">{check.detail}</p></div>
                      </div>
                    ))}
                  </div>
                </>)}

                {sub.notes && (<><Separator /><div><h4 className="font-semibold text-sm mb-1">Notizen</h4><p className="text-sm text-muted-foreground">{sub.notes}</p></div></>)}

                {sub.status === 'verifiziert' && (<>
                  <Separator />
                  <DocumentSection
                    submission={sub}
                    bundleState={documentBundles.get(sub.id)}
                    docGenSteps={docGenSteps}
                    onGenerate={handleGenerateDocs}
                    onSend={handleSendDocs}
                    onPreview={handleOpenPreview}
                  />
                </>)}

                {(sub.status === 'eingereicht' || sub.status === 'manuell_pruefen') && (<>
                  <Separator />
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button className="flex-1" variant="default"><CheckCircle className="h-4 w-4 mr-2" />Verifizieren</Button>
                    <Button className="flex-1" variant="destructive"><XCircle className="h-4 w-4 mr-2" />Ablehnen</Button>
                  </div>
                </>)}
              </div>
            )
          })()}
        </DialogContent>
      </Dialog>

      {/* ─── New Verification Dialog ────────────────────────────────────────── */}
      <Dialog open={newDialog} onOpenChange={handleCloseDialog}>
        <DialogContent className={cn(
          'max-w-[calc(100vw-1rem)] max-h-[90vh] p-0 overflow-hidden flex flex-col',
          dialogStep === 'form' && customerSegment ? 'sm:max-w-4xl' : 'sm:max-w-lg',
        )}>

          {dialogStep === 'form' && (<>
            <div className="px-6 pt-5 pb-0 shrink-0">
              <DialogHeader><DialogTitle>Neue Verifizierung</DialogTitle></DialogHeader>
            </div>

            {!customerSegment ? (
              /* ── Step 1: Just segment selection ── */
              <div className="px-6 pb-6 pt-4">
                <SegmentSelector value={customerSegment} onChange={handleSegmentChange} />
              </div>
            ) : (
              /* ── Step 2: Two-column layout ── */
              <div className="flex flex-col sm:flex-row flex-1 min-h-0">
                {/* Left column: Segment + Customer Info */}
                <div className="sm:w-[45%] px-6 pb-5 pt-4 space-y-4 sm:border-r sm:overflow-y-auto">
                  <SegmentSelector value={customerSegment} onChange={handleSegmentChange} compact />

                  <Separator />

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5"><Label className="text-xs">Name</Label><Input className="h-8 text-sm" placeholder="Max Mustermann" value={formName} onChange={e => setFormName(e.target.value)} /></div>
                    <div className="space-y-1.5"><Label className="text-xs">E-Mail</Label><Input className="h-8 text-sm" placeholder="email@beispiel.de" type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} /></div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5"><Label className="text-xs">Telefon</Label><Input className="h-8 text-sm" placeholder="+49 711 1234567" value={formPhone} onChange={e => setFormPhone(e.target.value)} /></div>
                    {customerSegment !== 'privat' && customerSegment !== 'export' && customerSegment !== 'diplomat' ? (
                      <div className="space-y-1.5"><Label className="text-xs">Firmenname</Label><Input className="h-8 text-sm" placeholder="Musterfirma GmbH" value={formCompanyName} onChange={e => setFormCompanyName(e.target.value)} /></div>
                    ) : <div />}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Fahrzeuge <span className="ml-1 text-xs font-normal text-muted-foreground">(optional)</span></Label>
                    <VehicleMultiSelect selected={formVehicleIds} onChange={setFormVehicleIds} />
                  </div>

                  {/* Privat: ID method selection */}
                  {customerSegment === 'privat' && (
                    <div className="space-y-1.5">
                      <Label className="text-xs">ID-Prüfung Methode</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {([
                          { method: 'upload' as PrivatMethod, Icon: Upload, label: 'Hochladen', sub: 'Jetzt direkt' },
                          { method: 'link' as PrivatMethod, Icon: Link2, label: 'Link senden', sub: 'Per E-Mail' },
                        ]).map(({ method, Icon, label, sub }) => (
                          <button key={method} onClick={() => setPrivatMethod(method)}
                            className={'flex items-center gap-2 rounded-lg border-2 px-3 py-2 text-sm transition-all ' +
                              (privatMethod === method ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:border-muted-foreground')}>
                            <Icon className="h-4 w-4 shrink-0" />
                            <div className="text-left">
                              <span className="font-medium text-xs block">{label}</span>
                              <span className="text-xs opacity-70 block">{sub}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {customerSegment === 'privat' && privatMethod === 'link' && (
                    <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-3">
                      <div className="flex items-start gap-2">
                        <Mail className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                        <div className="text-xs">
                          <p className="font-medium text-blue-800 dark:text-blue-200">Link per E-Mail senden</p>
                          <p className="text-blue-600 dark:text-blue-400 mt-0.5">Sicherer Link an <strong>{formEmail || 'E-Mail'}</strong>. 24h gültig.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <Button className="w-full" size="sm" onClick={handleSubmit}>
                    <ShieldCheck className="h-4 w-4 mr-2" />Verifizierung einreichen
                  </Button>
                </div>

                {/* Right column: Document Requirements */}
                <div className="sm:w-[55%] px-6 pb-5 pt-4 sm:overflow-y-auto bg-muted/20">
                  {customerSegment === 'privat' && privatMethod === 'link' ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-8">
                      <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-3">
                        <Link2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <p className="text-sm font-medium">Verifizierung per Link</p>
                      <p className="text-xs text-muted-foreground mt-1 max-w-xs">Der Kunde wird gebeten, seine Identität über den sicheren Link selbst zu verifizieren.</p>
                    </div>
                  ) : (
                    <DocumentRequirementsList
                      segment={customerSegment}
                      documentSubmissions={(() => {
                        // Merge field values into submissions, keeping existing submission status
                        const docs = getDocumentsForSegment(customerSegment)
                        return docs.map(doc => {
                          const existing = formDocSubmissions.find(s => s.documentConfigId === doc.id)
                          if (existing) return { ...existing, fieldValues: { ...(existing.fieldValues ?? {}), ...(formDocFieldValues[doc.id] ?? {}) } }
                          const fv = formDocFieldValues[doc.id]
                          if (fv) return { documentConfigId: doc.id, status: 'nicht_eingereicht' as const, fieldValues: fv }
                          return { documentConfigId: doc.id, status: 'nicht_eingereicht' as const }
                        })
                      })()}
                      onFieldChange={handleDocFieldChange}
                      onFileUpload={(docId, file) => handleMockFileUpload(docId, file)}
                      onRunCheck={(docId) => handleMockRunCheck(docId)}
                      mode="create"
                    />
                  )}
                </div>
              </div>
            )}
          </>)}

          {dialogStep === 'processing' && (
            <div className="px-6 py-8">
              <div className="text-center mb-6">
                <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-3">
                  <Loader2 className="h-6 w-6 text-blue-600 dark:text-blue-400 animate-spin" />
                </div>
                <h3 className="font-semibold">{getSegmentLabel(customerSegment ?? 'privat')} – Prüfung läuft</h3>
                <p className="text-sm text-muted-foreground mt-1">Automatische Verifizierung über externe Schnittstellen…</p>
              </div>
              <div className="space-y-4 bg-muted/30 rounded-xl p-4 max-w-md mx-auto">
                {processingSteps.map(step => <ProcessingStepItem key={step.id} step={step} />)}
              </div>
            </div>
          )}

          {dialogStep === 'success' && (
            <div className="px-6 py-8 text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto">
                <CheckCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="font-bold text-lg">{getSegmentLabel(customerSegment ?? 'privat')} verifiziert</h3>
                <p className="text-sm text-muted-foreground mt-1">Alle automatischen Prüfungen wurden erfolgreich abgeschlossen.</p>
              </div>
              <div className="bg-muted/40 rounded-xl p-4 text-left space-y-2 max-w-md mx-auto">
                {processingSteps.map(step => (
                  <div key={step.id} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span className="font-medium">{step.label}</span>
                  </div>
                ))}
              </div>
              <Button className="w-full max-w-md mx-auto" onClick={handleCloseDialog}>Fertig</Button>
            </div>
          )}

          {dialogStep === 'link_sent' && (
            <div className="px-6 py-8 text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto">
                <Mail className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Link gesendet</h3>
                <p className="text-sm text-muted-foreground mt-1">Ein sicherer Verifizierungslink wurde an <strong>{formEmail}</strong> gesendet.</p>
              </div>
              <div className="rounded-xl border bg-muted/30 p-3 text-left space-y-2 max-w-md mx-auto">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Verifizierungslink</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-background rounded px-2 py-1 border truncate">verify.wackenhut.de/id-check?token=wh-demo-abc123</code>
                  <Button variant="outline" size="sm" className="shrink-0" onClick={() => { setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2000) }}>
                    {linkCopied ? <CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Gültig für 24 Stunden · Ende-zu-Ende verschlüsselt</p>
              </div>
              <div className="max-w-md mx-auto space-y-2">
                <Button variant="outline" className="w-full" onClick={() => window.open('/id-check', '_blank')}>
                  <ExternalLink className="h-4 w-4 mr-2" />ID-Prüfung Demo öffnen
                </Button>
                <Button className="w-full" onClick={handleCloseDialog}>Fertig</Button>
              </div>
            </div>
          )}

        </DialogContent>
      </Dialog>
    </div>
  )
}
