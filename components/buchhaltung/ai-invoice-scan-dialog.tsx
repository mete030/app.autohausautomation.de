'use client'

import { useEffect, useRef, useState } from 'react'
import { Sparkles, Upload, CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { AccountingTaxMode, Vehicle } from '@/lib/types'

type ScanStep = 'upload' | 'analyzing' | 'review'

interface ScanReviewForm {
  partnerName: string
  invoiceNumber: string
  invoiceDate: string
  netAmount: string
  vatRate: '19' | '0'
  grossAmount: string
  taxMode: AccountingTaxMode
  vehicleId: string
}

interface AIInvoiceScanDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  month: string
  vehicles: Vehicle[]
  onSave: (payload: {
    month: string
    partnerName: string
    invoiceNumber: string
    invoiceDate: string
    netAmount: number
    vatAmount: number
    grossAmount: number
    taxMode: AccountingTaxMode
    vehicleId: string | null
    pdfUrl: string
  }) => void
}

export function AIInvoiceScanDialog({
  open,
  onOpenChange,
  month,
  vehicles,
  onSave,
}: AIInvoiceScanDialogProps) {
  const defaultVehicleId = vehicles[0]?.id ?? ''
  const createDefaultForm = (): ScanReviewForm => ({
    partnerName: 'BMW Group AG',
    invoiceNumber: `ER-${month.replace('-', '')}-8847`,
    invoiceDate: `${month}-01`,
    netAmount: '31.000,00',
    vatRate: '19',
    grossAmount: '36.890,00',
    taxMode: 'regelbesteuerung_19',
    vehicleId: defaultVehicleId,
  })

  const [step, setStep] = useState<ScanStep>('upload')
  const [progress, setProgress] = useState(0)
  const [fileName, setFileName] = useState<string | null>(null)
  const [form, setForm] = useState<ScanReviewForm>(() => createDefaultForm())
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
  }

  const resetState = (includeForm = false) => {
    setStep('upload')
    setProgress(0)
    setFileName(null)
    if (includeForm) {
      setForm(createDefaultForm())
    }
  }

  useEffect(() => () => clearTimers(), [])

  const handleDialogChange = (nextOpen: boolean) => {
    clearTimers()
    if (nextOpen) {
      resetState(true)
    } else {
      resetState(false)
    }
    onOpenChange(nextOpen)
  }

  const startAnalyze = (name: string) => {
    setFileName(name)
    setStep('analyzing')
    setProgress(14)

    const t1 = setTimeout(() => setProgress(39), 350)
    const t2 = setTimeout(() => setProgress(68), 800)
    const t3 = setTimeout(() => setProgress(92), 1300)
    const t4 = setTimeout(() => {
      setProgress(100)
      setStep('review')
    }, 1800)
    timersRef.current = [t1, t2, t3, t4]
  }

  const parseEuro = (value: string) => {
    const normalized = value.replace(/\./g, '').replace(',', '.').trim()
    const num = Number.parseFloat(normalized)
    return Number.isFinite(num) ? num : 0
  }

  const handleSave = () => {
    const net = parseEuro(form.netAmount)
    const gross = parseEuro(form.grossAmount)
    const vatAmount = form.vatRate === '19' ? Math.max(0, gross - net) : 0

    onSave({
      month,
      partnerName: form.partnerName,
      invoiceNumber: form.invoiceNumber,
      invoiceDate: form.invoiceDate,
      netAmount: net,
      vatAmount,
      grossAmount: gross,
      taxMode: form.taxMode,
      vehicleId: form.vehicleId || null,
      pdfUrl: '/demo-docs/eingangsrechnung-bmw.pdf',
    })
    handleDialogChange(false)
  }

  const currentVehicle = vehicles.find((vehicle) => vehicle.id === form.vehicleId)

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-violet-500" />
            KI-Rechnung scannen
          </DialogTitle>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-3">
            <label className="block rounded-xl border-2 border-dashed border-violet-300/70 bg-violet-50/35 dark:bg-violet-950/15 p-8 text-center cursor-pointer hover:border-violet-400 transition-colors">
              <Upload className="h-8 w-8 mx-auto text-violet-500 mb-3" />
              <p className="text-sm font-medium">PDF hierher ziehen oder Datei auswählen</p>
              <p className="text-xs text-muted-foreground mt-1">Unterstützt: PDF, JPG, PNG (max. 10 MB)</p>
              <input
                type="file"
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (!file) return
                  startAnalyze(file.name)
                  event.target.value = ''
                }}
              />
            </label>
            <div className="flex justify-end">
              <Button variant="ghost" onClick={() => handleDialogChange(false)}>Abbrechen</Button>
            </div>
          </div>
        )}

        {step === 'analyzing' && (
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Loader2 className="h-4 w-4 text-violet-500 animate-spin" />
              KI analysiert Rechnung…
            </div>
            <div className="rounded-md bg-muted/40 p-3 text-xs space-y-1">
              <p className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />Lieferant erkannt</p>
              <p className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />Rechnungsbetrag gefunden</p>
              <p className="flex items-center gap-2"><Loader2 className="h-3.5 w-3.5 text-blue-500 animate-spin" />Fahrzeug wird zugeordnet…</p>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-violet-500 transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs text-muted-foreground">{fileName ? `Datei: ${fileName}` : ''}</p>
          </div>
        )}

        {step === 'review' && (
          <div className="space-y-4">
            <div className="rounded-md border border-violet-200/70 bg-violet-50/35 dark:bg-violet-950/10 p-3">
              <p className="text-sm font-medium flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-violet-500" />
                KI-Ergebnis (bitte prüfen)
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Lieferant</Label>
                <Input
                  className="bg-violet-50/50 dark:bg-violet-950/20"
                  value={form.partnerName}
                  onChange={(event) => setForm((prev) => ({ ...prev, partnerName: event.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Belegnummer</Label>
                <Input
                  className="bg-violet-50/50 dark:bg-violet-950/20"
                  value={form.invoiceNumber}
                  onChange={(event) => setForm((prev) => ({ ...prev, invoiceNumber: event.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Datum</Label>
                <Input
                  type="date"
                  className="bg-violet-50/50 dark:bg-violet-950/20"
                  value={form.invoiceDate}
                  onChange={(event) => setForm((prev) => ({ ...prev, invoiceDate: event.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Netto</Label>
                <Input
                  className="bg-violet-50/50 dark:bg-violet-950/20"
                  value={form.netAmount}
                  onChange={(event) => setForm((prev) => ({ ...prev, netAmount: event.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>USt-Satz</Label>
                <Select value={form.vatRate} onValueChange={(value: '19' | '0') => setForm((prev) => ({ ...prev, vatRate: value }))}>
                  <SelectTrigger className="bg-violet-50/50 dark:bg-violet-950/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="19">19%</SelectItem>
                    <SelectItem value="0">0% (§25a)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Brutto</Label>
                <Input
                  className="bg-violet-50/50 dark:bg-violet-950/20"
                  value={form.grossAmount}
                  onChange={(event) => setForm((prev) => ({ ...prev, grossAmount: event.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Besteuerungsart</Label>
                <Select
                  value={form.taxMode}
                  onValueChange={(value: AccountingTaxMode) => setForm((prev) => ({ ...prev, taxMode: value }))}
                >
                  <SelectTrigger className="bg-violet-50/50 dark:bg-violet-950/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="regelbesteuerung_19">Regelbesteuerung</SelectItem>
                    <SelectItem value="differenzbesteuerung_25a">Differenzbesteuerung §25a</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Fahrzeug</Label>
                <Select value={form.vehicleId} onValueChange={(value) => setForm((prev) => ({ ...prev, vehicleId: value }))}>
                  <SelectTrigger className="bg-violet-50/50 dark:bg-violet-950/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.make} {vehicle.model} ({vehicle.licensePlate})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {currentVehicle && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400">
                ✓ Auto-matched: {currentVehicle.make} {currentVehicle.model}
              </p>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => handleDialogChange(false)}>Abbrechen</Button>
              <Button onClick={handleSave}>
                <CheckCircle2 className="h-4 w-4 mr-1.5" />
                Rechnung speichern
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
