'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import type { AccountingDocument, AccountingDocumentStatus } from '@/lib/types'
import { AlertTriangle, CheckCircle2, FileText, ReceiptText, ShieldCheck } from 'lucide-react'

const statusLabel: Record<AccountingDocumentStatus, string> = {
  neu: 'Neu',
  ki_extrahiert: 'KI extrahiert',
  freigabe_noetig: 'Freigabe nötig',
  freigegeben: 'Freigegeben',
  gebucht: 'Gebucht',
  fehler: 'Fehler',
}

function confidenceClass(confidence: number) {
  if (confidence >= 95) return 'text-emerald-600 dark:text-emerald-400'
  if (confidence >= 85) return 'text-amber-600 dark:text-amber-400'
  return 'text-red-600 dark:text-red-400'
}

interface DocumentReviewPanelProps {
  document: AccountingDocument | null
  onStatusChange: (status: AccountingDocumentStatus) => boolean
  onFlagResolved: (flagId: string, resolved: boolean) => void
}

export function DocumentReviewPanel({
  document,
  onStatusChange,
  onFlagResolved,
}: DocumentReviewPanelProps) {
  const [actionError, setActionError] = useState<string | null>(null)

  if (!document) {
    return (
      <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 min-h-[320px] sm:min-h-[460px] grid place-items-center text-center p-8">
        <div>
          <ReceiptText className="h-8 w-8 mx-auto text-muted-foreground/60 mb-3" />
          <p className="text-sm font-medium">Kein Beleg ausgewählt</p>
          <p className="text-xs text-muted-foreground mt-1">Wähle links einen Beleg aus der Inbox.</p>
        </div>
      </div>
    )
  }

  const openCriticalFlags = document.flags.filter((flag) => flag.severity === 'critical' && !flag.resolved)

  const tryChangeStatus = (status: AccountingDocumentStatus) => {
    const ok = onStatusChange(status)
    if (!ok) {
      setActionError('Buchung blockiert: Kritische Flags müssen zuerst gelöst werden.')
      return
    }
    setActionError(null)
  }

  return (
    <div className="rounded-xl border border-border/60">
      <div className="p-4 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Belegdetails</p>
            <h3 className="text-sm font-semibold">{document.invoiceNumber}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatDate(document.invoiceDate)} · {document.partnerName}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold">{formatCurrency(document.grossAmount)}</p>
            <p className="text-xs text-muted-foreground">KI {document.aiConfidence}%</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{document.type === 'eingangsrechnung' ? 'Eingangsrechnung' : 'Ausgangsrechnung'}</Badge>
          <Badge variant="outline">{document.taxMode === 'regelbesteuerung_19' ? 'Regel 19%' : 'Differenz §25a'}</Badge>
          <Badge variant="secondary">{statusLabel[document.status]}</Badge>
          {openCriticalFlags.length > 0 && (
            <Badge variant="destructive">{openCriticalFlags.length} kritisch</Badge>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => tryChangeStatus('freigegeben')}>
            <ShieldCheck className="h-3.5 w-3.5 mr-1.5" />
            Freigeben
          </Button>
          <Button size="sm" variant="secondary" onClick={() => tryChangeStatus('freigabe_noetig')}>
            Zur Prüfung
          </Button>
          <Button
            size="sm"
            variant={openCriticalFlags.length > 0 ? 'outline' : 'default'}
            onClick={() => tryChangeStatus('gebucht')}
          >
            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
            Als gebucht markieren
          </Button>
        </div>
        {actionError && (
          <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
            <AlertTriangle className="h-3.5 w-3.5" />
            {actionError}
          </p>
        )}
      </div>

      <Separator />

      <Tabs defaultValue="dokument" className="p-4">
        <TabsList className="w-full justify-start overflow-x-auto whitespace-nowrap">
          <TabsTrigger value="dokument">
            <FileText className="h-3.5 w-3.5 mr-1.5" />
            Dokument
          </TabsTrigger>
          <TabsTrigger value="extraktion">KI-Extraktion</TabsTrigger>
          <TabsTrigger value="buchung">Buchung</TabsTrigger>
        </TabsList>

        <TabsContent value="dokument" className="mt-3">
          <div className="rounded-lg border border-border/60 overflow-hidden bg-background">
            <iframe
              src={document.pdfUrl}
              title={`PDF Vorschau ${document.invoiceNumber}`}
              className="h-[320px] w-full sm:h-[420px]"
            />
          </div>
        </TabsContent>

        <TabsContent value="extraktion" className="mt-3 space-y-4">
          <div className="space-y-2">
            {document.extractionFields.map((field) => (
              <div key={field.key} className="rounded-lg border border-border/50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </p>
                  <p className={cn('text-xs font-semibold', confidenceClass(field.confidence))}>
                    {field.confidence}%
                  </p>
                </div>
                <p className="text-sm mt-1">{field.value}</p>
              </div>
            ))}
          </div>

          {document.flags.length > 0 && (
            <div className="rounded-lg border border-border/60 p-3 space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Prüfflags</p>
              {document.flags.map((flag) => (
                <div key={flag.id} className="flex items-start justify-between gap-3 rounded-md bg-muted/35 p-2.5">
                  <div>
                    <p className="text-sm font-medium">{flag.code}</p>
                    <p className="text-xs text-muted-foreground">{flag.message}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={flag.severity === 'critical' ? 'destructive' : 'outline'}
                      className={flag.severity === 'warn' ? 'text-amber-700 border-amber-300 dark:text-amber-400 dark:border-amber-700' : ''}
                    >
                      {flag.severity}
                    </Badge>
                    <Switch checked={flag.resolved} onCheckedChange={(value) => onFlagResolved(flag.id, value)} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="buchung" className="mt-3 space-y-3">
          <div className="grid grid-cols-1 gap-2.5 text-sm sm:grid-cols-2">
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Konto Soll</p>
              <p className="font-medium mt-1">{document.bookingProposal.kontoSoll}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Konto Haben</p>
              <p className="font-medium mt-1">{document.bookingProposal.kontoHaben}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Steuerschlüssel</p>
              <p className="font-medium mt-1">{document.bookingProposal.steuerSchluessel}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Steuerart</p>
              <p className="font-medium mt-1">{document.taxMode === 'regelbesteuerung_19' ? 'Regelbesteuerung 19%' : 'Differenzbesteuerung §25a'}</p>
            </div>
          </div>

          <div className="rounded-lg border border-border/60 p-3">
            <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">Netto</p>
                <p className="font-semibold">{formatCurrency(document.bookingProposal.netto)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">USt</p>
                <p className="font-semibold">{formatCurrency(document.bookingProposal.ust)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Brutto</p>
                <p className="font-semibold">{formatCurrency(document.bookingProposal.brutto)}</p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
