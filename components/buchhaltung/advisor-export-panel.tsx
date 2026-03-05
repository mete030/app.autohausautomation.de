'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { cn, formatCurrency, formatDateTime } from '@/lib/utils'
import type { AccountingDocument, AccountingExportBatch, VehicleAccountingCase } from '@/lib/types'
import { AlertTriangle, CheckCircle2, Download, FileArchive, FileText, Loader2, Mail } from 'lucide-react'

type StepStatus = 'pending' | 'loading' | 'done'

interface StepState {
  id: string
  label: string
  status: StepStatus
}

interface AdvisorExportPanelProps {
  month: string
  documents: AccountingDocument[]
  vehicleCases: VehicleAccountingCase[]
  exportBatches: AccountingExportBatch[]
  onFinalizeExport: (month: string) => void
}

export function AdvisorExportPanel({
  month,
  documents,
  vehicleCases,
  exportBatches,
  onFinalizeExport,
}: AdvisorExportPanelProps) {
  const [steps, setSteps] = useState<StepState[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [isDone, setIsDone] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const monthDocuments = useMemo(
    () => documents.filter((document) => document.month === month),
    [documents, month]
  )
  const monthCases = useMemo(
    () => vehicleCases.filter((item) => item.month === month),
    [vehicleCases, month]
  )

  const unresolvedCritical = monthDocuments.filter((document) =>
    document.flags.some((flag) => flag.severity === 'critical' && !flag.resolved)
  ).length
  const nonReadyDocuments = monthDocuments.filter((document) => (
    document.status !== 'freigegeben' && document.status !== 'gebucht'
  )).length
  const blockingCases = monthCases.filter((item) => item.blockers.length > 0).length

  const canExport = monthDocuments.length > 0 &&
    unresolvedCritical === 0 &&
    nonReadyDocuments === 0 &&
    blockingCases === 0

  const latestBatch = exportBatches
    .filter((batch) => batch.month === month)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
  const emailHref = `mailto:steuerberater@wackenhut.demo?subject=Buchhaltung%20${month}&body=Guten%20Tag,%20anbei%20das%20Exportpaket%20f%C3%BCr%20${month}.`

  const progressValue = steps.length === 0
    ? 0
    : Math.round((steps.filter((step) => step.status === 'done').length / steps.length) * 100)

  const clearTimers = () => {
    timerRef.current.forEach(clearTimeout)
    timerRef.current = []
  }

  const runSimulation = () => {
    if (!canExport || isRunning) return

    setIsRunning(true)
    setIsDone(false)

    const initialSteps: StepState[] = [
      { id: 's1', label: 'Belegvollständigkeit prüfen', status: 'pending' },
      { id: 's2', label: 'Buchungssätze validieren', status: 'pending' },
      { id: 's3', label: 'DATEV CSV erzeugen', status: 'pending' },
      { id: 's4', label: 'Belegpaket zusammenstellen', status: 'pending' },
    ]
    setSteps(initialSteps)

    clearTimers()
    let delay = 120
    initialSteps.forEach((_, index) => {
      const loadingTimer = setTimeout(() => {
        setSteps((prev) => prev.map((step, i) => (
          i === index ? { ...step, status: 'loading' } : step
        )))
      }, delay)
      timerRef.current.push(loadingTimer)

      delay += 850
      const doneTimer = setTimeout(() => {
        setSteps((prev) => prev.map((step, i) => (
          i === index ? { ...step, status: 'done' } : step
        )))
      }, delay)
      timerRef.current.push(doneTimer)

      delay += 220
    })

    const finalTimer = setTimeout(() => {
      onFinalizeExport(month)
      setIsRunning(false)
      setIsDone(true)
    }, delay + 240)
    timerRef.current.push(finalTimer)
  }

  useEffect(() => () => clearTimers(), [])

  const monthTotals = monthDocuments.reduce(
    (acc, document) => ({
      net: acc.net + document.netAmount,
      vat: acc.vat + document.vatAmount,
      gross: acc.gross + document.grossAmount,
    }),
    { net: 0, vat: 0, gross: 0 }
  )

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Abschluss-Checklist</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span>Kritische Flags</span>
            {unresolvedCritical === 0 ? (
              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">OK</Badge>
            ) : (
              <Badge variant="destructive">{unresolvedCritical} offen</Badge>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span>Freigabestatus Belege</span>
            {nonReadyDocuments === 0 ? (
              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">OK</Badge>
            ) : (
              <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">{nonReadyDocuments} offen</Badge>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span>Fahrzeugfälle ohne Blocker</span>
            {blockingCases === 0 ? (
              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">OK</Badge>
            ) : (
              <Badge variant="destructive">{blockingCases} kritisch</Badge>
            )}
          </div>

          {!canExport && (
            <p className="text-xs text-red-600 dark:text-red-400 flex items-start gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              Export blockiert. Bitte offene Prüfungen oder kritische Konflikte zuerst klären.
            </p>
          )}

          <Separator />

          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>Netto gesamt</span>
              <span className="font-medium text-foreground">{formatCurrency(monthTotals.net)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>USt gesamt</span>
              <span className="font-medium text-foreground">{formatCurrency(monthTotals.vat)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Brutto gesamt</span>
              <span className="font-semibold text-foreground">{formatCurrency(monthTotals.gross)}</span>
            </div>
          </div>

          <Button onClick={runSimulation} disabled={!canExport || isRunning} className="w-full">
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Export läuft…
              </>
            ) : (
              <>
                <FileArchive className="h-4 w-4 mr-2" />
                DATEV-Paket erstellen
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Steuerberater-Übergabe</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {steps.length > 0 && (
            <div className="space-y-3">
              <Progress value={progressValue} />
              <div className="space-y-2">
                {steps.map((step) => (
                  <div key={step.id} className="flex items-center gap-2 text-sm">
                    {step.status === 'done' && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                    {step.status === 'loading' && <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />}
                    {step.status === 'pending' && <div className="h-4 w-4 rounded-full border border-muted-foreground/40" />}
                    <span className={cn(step.status === 'done' && 'text-emerald-600 dark:text-emerald-400')}>
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {latestBatch ? (
            <div className="rounded-lg border border-border/60 p-3 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">Batch {latestBatch.month}</p>
                  <p className="text-xs text-muted-foreground">Erstellt: {formatDateTime(latestBatch.createdAt)}</p>
                </div>
                <Badge variant={latestBatch.status === 'erstellt' ? 'default' : 'secondary'}>
                  {latestBatch.status === 'erstellt' ? 'Erstellt' : 'Bereit'}
                </Badge>
              </div>
              <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-3">
                <div>
                  <p className="text-muted-foreground">Belege</p>
                  <p className="font-semibold">{latestBatch.documentCount}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Netto</p>
                  <p className="font-semibold">{formatCurrency(latestBatch.totals.net)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">USt</p>
                  <p className="font-semibold">{formatCurrency(latestBatch.totals.vat)}</p>
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <Button asChild size="sm" variant="outline">
                  <a href={latestBatch.datevCsvUrl} download>
                    <FileText className="h-3.5 w-3.5 mr-1.5" />
                    DATEV CSV
                  </a>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <a href={latestBatch.belegZipUrl} download>
                    <Download className="h-3.5 w-3.5 mr-1.5" />
                    Beleg ZIP
                  </a>
                </Button>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <Button asChild size="sm" variant="outline">
                  <a href={latestBatch.protocolUrl ?? latestBatch.datevCsvUrl} download>
                    <FileText className="h-3.5 w-3.5 mr-1.5" />
                    PDF Zusammenfassung
                  </a>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <a href={emailHref}>
                    <Mail className="h-3.5 w-3.5 mr-1.5" />
                    E-Mail Steuerberater
                  </a>
                </Button>
              </div>
              {latestBatch.protocolUrl && (
                <Button asChild size="sm" variant="ghost" className="w-full">
                  <a href={latestBatch.protocolUrl} download>
                    Prüfprotokoll herunterladen
                  </a>
                </Button>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Noch kein Export-Batch für den gewählten Monat vorhanden.</p>
          )}

          {isDone && (
            <p className="text-xs text-emerald-600 dark:text-emerald-400">
              Exportlauf erfolgreich simuliert. Dateien können jetzt heruntergeladen werden.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
