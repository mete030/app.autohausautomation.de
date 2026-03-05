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
  Package, Send, Eye, Download, FileCheck, Clock, Printer,
} from 'lucide-react'
import type { KYCSubmission, CustomerType, Vehicle, DocumentBundleState } from '@/lib/types'

type DialogStep = 'form' | 'processing' | 'success' | 'link_sent'
type PrivatMethod = 'upload' | 'link'
type StepStatus = 'pending' | 'loading' | 'done' | 'error'
interface ProcessingStep { id: string; label: string; detail: string; status: StepStatus }
type PreviewDocType = 'kaufbestaetigung' | 'abholschein' | 'rechnung' | 'gelangensbestaetigung'
interface DocGenStepItem { id: string; label: string; detail: string; status: 'pending' | 'loading' | 'done' }

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

      {/* Document rows */}
      <div className="space-y-1.5">
        {DOC_ROWS.map(row => (
          <div
            key={row.type}
            className="flex items-center gap-3 rounded-lg border bg-muted/20 px-3 py-2.5"
          >
            <div className={'h-2 w-2 rounded-full shrink-0 ' + (isReady ? 'bg-emerald-500' : 'bg-muted-foreground/30')} />
            <FileCheck className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold">{row.label}</p>
              <p className="text-xs text-muted-foreground truncate">{row.desc}</p>
            </div>
            {isReady && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => onPreview(submission, row.type)}
              >
                <Eye className="h-3.5 w-3.5 mr-1" />Vorschau
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Generation animation */}
      {status === 'generating' && (
        <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 text-amber-600 dark:text-amber-400 animate-spin" />
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Dokumente werden erstellt…</p>
          </div>
          <div className="space-y-2.5">
            {docGenSteps.map(step => (
              <div
                key={step.id}
                className={'flex items-start gap-2.5 transition-all duration-300 ' + (step.status === 'pending' ? 'opacity-30' : 'opacity-100')}
              >
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

      {/* Sending animation */}
      {status === 'sending' && (
        <div className="rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-3 flex items-center gap-3">
          <Loader2 className="h-4 w-4 text-blue-600 dark:text-blue-400 animate-spin shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Wird gesendet…</p>
            <p className="text-xs text-blue-600 dark:text-blue-400">Dokumente werden an {submission.email} übermittelt</p>
          </div>
        </div>
      )}

      {/* Sent success banner */}
      {status === 'sent' && bundleState?.sentAt && (
        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 p-3 flex items-start gap-3">
          <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">Dokumente gesendet</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400">
              An {submission.email} gesendet · {formatDateTime(bundleState.sentAt)}
            </p>
          </div>
        </div>
      )}

      {/* Meta info when ready */}
      {(status === 'ready' || status === 'sending' || status === 'sent') && bundleState?.generatedAt && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>Erstellt: {formatDateTime(bundleState.generatedAt)}</span>
        </div>
      )}

      {/* Action buttons */}
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
  open,
  onClose,
  docType: initialDocType,
  submission,
}: {
  open: boolean
  onClose: () => void
  docType: PreviewDocType
  submission: KYCSubmission | null
}) {
  const [activeTab, setActiveTab] = useState<PreviewDocType>(initialDocType)

  useEffect(() => { setActiveTab(initialDocType) }, [initialDocType])

  if (!submission) return null

  const primaryVehicleId = submission.vehicleIds?.[0]
  const vehicle = primaryVehicleId ? mockVehicles.find(v => v.id === primaryVehicleId) : null
  const multiVehicle = (submission.vehicleIds?.length ?? 0) > 1
  const nr = vehicle ? vehicleInternalNr(vehicle.id) : null

  const today = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const invoiceNr = 'RE-2026-' + submission.id.toUpperCase().replace('KYC', '')

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[calc(100vw-1rem)] max-h-[90vh] p-0 overflow-hidden flex flex-col sm:max-w-2xl">
        {/* Chrome bar */}
        <div className="flex flex-col gap-2 border-b bg-muted/30 px-4 py-3 shrink-0 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold">Dokument-Vorschau</p>
            <p className="text-xs text-muted-foreground">{submission.customerName}</p>
          </div>
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <Button variant="outline" size="sm" className="h-7 flex-1 px-2 text-xs sm:flex-none">
              <Printer className="h-3.5 w-3.5 mr-1" />Drucken
            </Button>
            <Button variant="outline" size="sm" className="h-7 flex-1 px-2 text-xs sm:flex-none">
              <Download className="h-3.5 w-3.5 mr-1" />PDF
            </Button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex overflow-x-auto border-b shrink-0 px-4">
          {DOC_ROWS.map(row => (
            <button
              key={row.type}
              onClick={() => setActiveTab(row.type)}
              className={'px-3 py-2.5 text-xs font-medium border-b-2 transition-colors -mb-px ' +
                (activeTab === row.type
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground')}
            >
              {row.label}
            </button>
          ))}
        </div>

        {/* Document area */}
        <div className="flex-1 overflow-y-auto bg-slate-100 dark:bg-slate-900 p-3 sm:p-6">
          <div className="bg-white dark:bg-slate-950 rounded-lg shadow-sm max-w-xl mx-auto p-4 text-sm sm:p-8">

            {/* ── KAUFBESTÄTIGUNG ── */}
            {activeTab === 'kaufbestaetigung' && (
              <div className="space-y-6">
                {/* Letterhead */}
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-base">Wackenhut Autohaus GmbH</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Königstraße 1 · 70173 Stuttgart</p>
                    <p className="text-xs text-muted-foreground">Tel: +49 711 123456 · info@wackenhut.de</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-base">Kaufbestätigung</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Datum: {today}</p>
                    <p className="text-xs text-muted-foreground">Nr.: KB-2026-{submission.id.toUpperCase().replace('KYC', '')}</p>
                  </div>
                </div>

                <Separator />

                {/* Parties */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Verkäufer</p>
                    <p className="font-medium">Wackenhut Autohaus GmbH</p>
                    <p className="text-xs text-muted-foreground">Königstraße 1</p>
                    <p className="text-xs text-muted-foreground">70173 Stuttgart</p>
                    <p className="text-xs text-muted-foreground">USt-IdNr: DE987654321</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Käufer</p>
                    <p className="font-medium">{submission.customerName}</p>
                    {submission.address && <p className="text-xs text-muted-foreground">{submission.address}</p>}
                    <p className="text-xs text-muted-foreground">{submission.email}</p>
                    <p className="text-xs text-muted-foreground">{submission.phone}</p>
                  </div>
                </div>

                {/* Vehicle */}
                <div className="rounded-lg bg-slate-50 dark:bg-slate-900 p-4 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Kaufgegenstand</p>
                  {vehicle ? (
                    <>
                      <p className="font-semibold">{vehicle.make} {vehicle.model} · {vehicle.year}</p>
                      <div className="grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2 text-xs text-muted-foreground">
                        <span>FIN: <span className="font-mono">{vehicle.vin}</span></span>
                        <span>Kennzeichen: {vehicle.licensePlate}</span>
                        <span>Farbe: {vehicle.color}</span>
                        <span>Laufleistung: {formatMileage(vehicle.mileage)}</span>
                        <span>Kraftstoff: {vehicle.fuelType}</span>
                        <span>Getriebe: {vehicle.transmission}</span>
                      </div>
                      {multiVehicle && <p className="text-xs text-amber-600 dark:text-amber-400">+ {(submission.vehicleIds!.length - 1)} weiteres Fahrzeug — separate Dokumente empfohlen</p>}
                    </>
                  ) : (
                    <p className="text-muted-foreground text-xs">Kein Fahrzeug zugeordnet</p>
                  )}
                </div>

                {/* Price */}
                {vehicle && (
                  <div className="flex items-center justify-between py-2 border-t border-b">
                    <p className="font-semibold">Kaufpreis (inkl. MwSt.)</p>
                    <p className="font-bold text-lg">{formatCurrency(vehicle.price)}</p>
                  </div>
                )}

                {/* Signature */}
                <div className="grid grid-cols-1 gap-6 pt-4 sm:grid-cols-2 sm:gap-8">
                  {['Verkäufer', 'Käufer'].map(party => (
                    <div key={party}>
                      <div className="border-t-2 border-dashed pt-2">
                        <p className="text-xs text-muted-foreground">{party}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Ort, Datum · Unterschrift</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── ABHOLSCHEIN ── */}
            {activeTab === 'abholschein' && (
              <div className="space-y-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-base">Wackenhut Autohaus GmbH</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Königstraße 1 · 70173 Stuttgart</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-base">Abholschein / Übergabeprotokoll</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Datum: {today}</p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-900 p-3 space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Fahrzeug</p>
                    {vehicle ? (
                      <>
                        <p className="font-medium text-xs">{nr} · {vehicle.make} {vehicle.model}</p>
                        <p className="text-xs text-muted-foreground">FIN: <span className="font-mono">{vehicle.vin}</span></p>
                        <p className="text-xs text-muted-foreground">{vehicle.licensePlate} · {vehicle.color}</p>
                        <p className="text-xs text-muted-foreground">{formatMileage(vehicle.mileage)} km</p>
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground">Kein Fahrzeug zugeordnet</p>
                    )}
                  </div>
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-900 p-3 space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Käufer</p>
                    <p className="font-medium text-xs">{submission.customerName}</p>
                    {submission.address && <p className="text-xs text-muted-foreground">{submission.address}</p>}
                    <p className="text-xs text-muted-foreground">{submission.phone}</p>
                  </div>
                </div>

                {/* Checklist */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Übergabe-Checkliste</p>
                  <div className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
                    {[
                      'Fahrzeugschlüssel übergeben', 'Zulassungsbescheinigung Teil I',
                      'Zulassungsbescheinigung Teil II', 'Servicehefte übergeben',
                      'Reserverad / Notrad vorhanden', 'Warndreieck & Verbandskasten',
                      'Fahrzeuganleitung vorhanden', 'Tankanzeige geprüft',
                    ].map(item => (
                      <div key={item} className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded border-2 border-muted-foreground/40 shrink-0" />
                        <span className="text-xs">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Remarks */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Anmerkungen</p>
                  <div className="border rounded-lg h-16 bg-slate-50 dark:bg-slate-900" />
                </div>

                {/* Signatures */}
                <div className="grid grid-cols-1 gap-6 pt-4 sm:grid-cols-2 sm:gap-8">
                  {['Übergabe durch (Verkäufer)', 'Empfang bestätigt (Käufer)'].map(party => (
                    <div key={party}>
                      <div className="border-t-2 border-dashed pt-2">
                        <p className="text-xs text-muted-foreground">{party}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Ort, Datum · Unterschrift</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── RECHNUNG ── */}
            {activeTab === 'rechnung' && (
              <div className="space-y-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-base">Wackenhut Autohaus GmbH</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Königstraße 1 · 70173 Stuttgart</p>
                    <p className="text-xs text-muted-foreground">USt-IdNr: DE987654321</p>
                    <p className="text-xs text-muted-foreground">Steuernr: 99/815/08150</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-base">Rechnung</p>
                    <p className="text-xs font-mono text-muted-foreground mt-0.5">{invoiceNr}</p>
                    <p className="text-xs text-muted-foreground">Datum: {today}</p>
                  </div>
                </div>

                {/* Bill to */}
                <div className="rounded-lg border p-3 space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Rechnungsempfänger</p>
                  <p className="font-medium">{submission.customerName}</p>
                  {submission.address && <p className="text-xs text-muted-foreground">{submission.address}</p>}
                  {submission.ustIdNr && <p className="text-xs text-muted-foreground">USt-IdNr: {submission.ustIdNr}</p>}
                </div>

                {/* Line items */}
                {vehicle ? (
                  <div className="space-y-2">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[420px] text-xs">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-1.5 font-semibold text-muted-foreground">Pos.</th>
                            <th className="text-left py-1.5 font-semibold text-muted-foreground">Beschreibung</th>
                            <th className="text-right py-1.5 font-semibold text-muted-foreground">Betrag</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b">
                            <td className="py-2 align-top">1</td>
                            <td className="py-2 align-top">
                              <p className="font-medium">{vehicle.make} {vehicle.model} {vehicle.year}</p>
                              <p className="text-muted-foreground">FIN: {vehicle.vin} · {vehicle.licensePlate}</p>
                            </td>
                            <td className="py-2 align-top text-right">{formatCurrency(Math.round(vehicle.price / 1.19))}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="space-y-1 pt-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Nettobetrag</span>
                        <span>{formatCurrency(Math.round(vehicle.price / 1.19))}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Umsatzsteuer 19 %</span>
                        <span>{formatCurrency(vehicle.price - Math.round(vehicle.price / 1.19))}</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold border-t pt-1.5 mt-1">
                        <span>Gesamtbetrag</span>
                        <span>{formatCurrency(vehicle.price)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Kein Fahrzeug zugeordnet — keine Positionen</p>
                )}

                {/* Payment info */}
                <div className="rounded-lg bg-slate-50 dark:bg-slate-900 p-3 space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Zahlungsinformationen</p>
                  <p className="text-xs">Bankverbindung: Wackenhut Autohaus GmbH</p>
                  <p className="text-xs text-muted-foreground">IBAN: DE89 3704 0044 0532 0130 00 · BIC: COBADEFFXXX</p>
                  <p className="text-xs text-muted-foreground">Verwendungszweck: <span className="font-mono">{invoiceNr}</span></p>
                  <p className="text-xs text-muted-foreground">Zahlungsziel: 14 Tage netto</p>
                </div>
              </div>
            )}

            {/* ── GELANGENSBESTÄTIGUNG ── */}
            {activeTab === 'gelangensbestaetigung' && (
              <div className="space-y-6">
                {/* Letterhead */}
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-base">Wackenhut Autohaus GmbH</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Königstraße 1 · 70173 Stuttgart</p>
                    <p className="text-xs text-muted-foreground">USt-IdNr: DE987654321</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-base">Gelangensbestätigung</p>
                    <p className="text-xs text-muted-foreground mt-0.5">gem. § 17a UStDV</p>
                    <p className="text-xs text-muted-foreground">Datum: {today}</p>
                  </div>
                </div>

                <Separator />

                {/* Legal intro */}
                <div className="rounded-lg bg-slate-50 dark:bg-slate-900 p-3">
                  <p className="text-xs text-muted-foreground">
                    Hiermit bestätigt der Empfänger, dass der nachstehend bezeichnete Liefergegenstand
                    im Rahmen einer innergemeinschaftlichen Lieferung gemäß § 6a UStG in das übrige
                    Gemeinschaftsgebiet gelangt ist.
                  </p>
                </div>

                {/* Parties */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Lieferer (Verkäufer)</p>
                    <p className="font-medium text-xs">Wackenhut Autohaus GmbH</p>
                    <p className="text-xs text-muted-foreground">Königstraße 1, 70173 Stuttgart</p>
                    <p className="text-xs text-muted-foreground">USt-IdNr: DE987654321</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Empfänger (Käufer)</p>
                    <p className="font-medium text-xs">{submission.customerName}</p>
                    {submission.address && <p className="text-xs text-muted-foreground">{submission.address}</p>}
                    {submission.ustIdNr && <p className="text-xs text-muted-foreground">USt-IdNr: {submission.ustIdNr}</p>}
                    {submission.companyName && <p className="text-xs text-muted-foreground">{submission.companyName}</p>}
                  </div>
                </div>

                {/* Vehicle */}
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Liefergegenstand</p>
                  {vehicle ? (
                    <div className="rounded-lg border p-3 space-y-1">
                      <p className="font-medium text-xs">{vehicle.make} {vehicle.model} {vehicle.year} · {vehicle.color}</p>
                      <p className="text-xs text-muted-foreground">FIN: <span className="font-mono">{vehicle.vin}</span></p>
                      <p className="text-xs text-muted-foreground">Amtl. Kennzeichen: {vehicle.licensePlate}</p>
                      <p className="text-xs text-muted-foreground">Rechnungsnummer: <span className="font-mono">{invoiceNr}</span> · Rechnungsdatum: {today}</p>
                      {multiVehicle && <p className="text-xs text-amber-600 dark:text-amber-400">Hinweis: Weitere Fahrzeuge erfordern separate Gelangensbestätigungen.</p>}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Kein Fahrzeug zugeordnet</p>
                  )}
                </div>

                {/* Transport details */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Angaben zum Transport</p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Bestimmungsort (Ort, Land)</p>
                      <div className="border rounded-md h-8 bg-slate-50 dark:bg-slate-900" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Monat des Erhalts</p>
                      <div className="border rounded-md h-8 bg-slate-50 dark:bg-slate-900" />
                    </div>
                  </div>
                </div>

                {/* Declaration */}
                <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-3">
                  <p className="text-xs text-blue-700 dark:text-blue-400">
                    Ich / Wir bestätigen, dass obiger Liefergegenstand in das übrige Gemeinschaftsgebiet
                    gelangt ist und versichere/n die Richtigkeit dieser Angaben.
                    Eine falsche Bestätigung kann steuerrechtliche und strafrechtliche Konsequenzen haben.
                  </p>
                </div>

                {/* Signature */}
                <div className="grid grid-cols-1 gap-6 pt-2 sm:grid-cols-2 sm:gap-8">
                  <div>
                    <div className="border-t-2 border-dashed pt-2">
                      <p className="text-xs text-muted-foreground">Empfänger (Käufer)</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Ort, Datum · Unterschrift</p>
                    </div>
                  </div>
                  <div>
                    <div className="border-t-2 border-dashed pt-2">
                      <p className="text-xs text-muted-foreground">Firmenstempel (falls vorhanden)</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </DialogContent>
    </Dialog>
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

  // Document bundle state
  const [documentBundles, setDocumentBundles] = useState<Map<string, DocumentBundleState>>(
    () => {
      const m = new Map<string, DocumentBundleState>()
      mockKYCSubmissions.forEach(s => { if (s.documentBundle) m.set(s.id, { ...s.documentBundle }) })
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
      setDocumentBundles(prev => new Map(prev).set(sub.id, {
        status: 'ready',
        generatedAt: new Date().toISOString(),
      }))
    }, delay + 400)
    timers.push(tFinal)
    docGenTimerRef.current = timers
  }

  const handleSendDocs = (sub: KYCSubmission) => {
    setDocumentBundles(prev => new Map(prev).set(sub.id, {
      ...prev.get(sub.id),
      status: 'sending',
    }))
    const t = setTimeout(() => {
      setDocumentBundles(prev => new Map(prev).set(sub.id, {
        ...prev.get(sub.id),
        status: 'sent',
        sentAt: new Date().toISOString(),
      }))
    }, 2200)
    docGenTimerRef.current.push(t)
  }

  const handleOpenPreview = (sub: KYCSubmission, docType: PreviewDocType) => {
    setPreviewSubmission(sub)
    setPreviewDoc(docType)
    setPreviewOpen(true)
  }

  useEffect(() => { if (!newDialog) clearTimers() }, [newDialog])
  useEffect(() => { return () => { clearDocGenTimers() } }, [])

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold">Verifizierung</h1><p className="text-sm text-muted-foreground">KYC & Kundenverifizierung</p></div>
        <Button className="w-full sm:w-auto" onClick={handleOpenDialog}><Plus className="h-4 w-4 mr-2" />Neue Verifizierung</Button>
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
              return (
                <Card key={sub.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedSubmission(sub)}>
                  <CardContent className="p-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                          {sub.customerType === 'privat' ? <User className="h-4 w-4 text-muted-foreground" /> : <Building className="h-4 w-4 text-muted-foreground" />}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-sm truncate">{sub.customerName}</h3>
                          <p className="text-xs text-muted-foreground">{sub.customerType === 'privat' ? 'Privatkunde' : 'Gewerbekunde'}{' · '}{sub.email}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Eingereicht: {formatDateTime(sub.submittedAt)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 sm:self-start">
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

      <DocumentPreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        docType={previewDoc}
        submission={previewSubmission}
      />

      {/* Detail Dialog */}
      <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
        <DialogContent className="max-w-[calc(100vw-1rem)] max-h-[90vh] overflow-y-auto sm:max-w-lg">
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
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm">
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

              {selectedSubmission.status === 'verifiziert' && (<>
                <Separator />
                <DocumentSection
                  submission={selectedSubmission}
                  bundleState={documentBundles.get(selectedSubmission.id)}
                  docGenSteps={docGenSteps}
                  onGenerate={handleGenerateDocs}
                  onSend={handleSendDocs}
                  onPreview={handleOpenPreview}
                />
              </>)}

              {(selectedSubmission.status === 'eingereicht' || selectedSubmission.status === 'manuell_pruefen') && (<>
                <Separator />
                <div className="flex flex-col gap-2 sm:flex-row">
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
        <DialogContent className="max-w-[calc(100vw-1rem)] max-h-[90vh] overflow-y-auto sm:max-w-lg">

          {dialogStep === 'form' && (<>
            <DialogHeader><DialogTitle>Neue Verifizierung</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Kundentyp</Label>
                <Tabs value={customerType} onValueChange={v => setCustomerType(v as CustomerType)}>
                  <TabsList className="w-full overflow-x-auto whitespace-nowrap">
                    <TabsTrigger value="privat" className="flex-1"><User className="h-4 w-4 mr-2" />Privatkunde</TabsTrigger>
                    <TabsTrigger value="gewerbe" className="flex-1"><Building className="h-4 w-4 mr-2" />Gewerbekunde</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label>Name</Label><Input placeholder="Max Mustermann" /></div>
                <div className="space-y-2"><Label>E-Mail</Label><Input placeholder="email@beispiel.de" type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} /></div>
              </div>
              <div className="space-y-2"><Label>Telefon</Label><Input placeholder="+49 711 1234567" /></div>

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
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
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
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
