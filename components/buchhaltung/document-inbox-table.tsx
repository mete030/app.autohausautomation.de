'use client'

import { Sparkles, MoreHorizontal } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import type {
  AccountingDocument,
  AccountingDocumentStatus,
  AccountingPaymentStatus,
} from '@/lib/types'

const statusLabel: Record<AccountingDocumentStatus, string> = {
  neu: 'Neu',
  ki_extrahiert: 'KI extrahiert',
  freigabe_noetig: 'Freigabe nötig',
  freigegeben: 'Freigegeben',
  gebucht: 'Gebucht',
  fehler: 'Fehler',
}

const statusColor: Record<AccountingDocumentStatus, string> = {
  neu: 'bg-slate-100 text-slate-700 dark:bg-slate-800/40 dark:text-slate-300',
  ki_extrahiert: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  freigabe_noetig: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  freigegeben: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  gebucht: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300',
  fehler: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300',
}

const paymentStatusLabel: Record<AccountingPaymentStatus, string> = {
  bezahlt: 'bezahlt',
  offen: 'offen',
  ueberfaellig: 'überfällig',
}

const paymentStatusColor: Record<AccountingPaymentStatus, string> = {
  bezahlt: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400',
  offen: 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
  ueberfaellig: 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400',
}

interface DocumentInboxTableProps {
  documents: AccountingDocument[]
  selectedDocumentId: string | null
  onSelectDocument: (documentId: string) => void
  marginByDocumentId?: Map<string, number>
  onMarkPaid?: (documentId: string) => void
}

export function DocumentInboxTable({
  documents,
  selectedDocumentId,
  onSelectDocument,
  marginByDocumentId,
  onMarkPaid,
}: DocumentInboxTableProps) {
  const netTotal = documents.reduce((sum, document) => sum + document.netAmount, 0)
  const vatTotal = documents.reduce((sum, document) => sum + document.vatAmount, 0)
  const grossTotal = documents.reduce((sum, document) => sum + document.grossAmount, 0)
  const hasMarginColumn = Boolean(marginByDocumentId)

  return (
    <div className="rounded-xl border border-border/60">
      <div className="max-h-[620px] overflow-auto">
        <Table className="text-xs">
          <TableHeader className="sticky top-0 bg-card z-10">
            <TableRow className="hover:bg-transparent">
              <TableHead>Datum</TableHead>
              <TableHead>Belegnr.</TableHead>
              <TableHead>Fahrzeug</TableHead>
              <TableHead>Partner</TableHead>
              <TableHead className="text-right">Netto</TableHead>
              <TableHead className="text-right">USt</TableHead>
              <TableHead className="text-right">Brutto</TableHead>
              {hasMarginColumn && <TableHead className="text-right">Marge</TableHead>}
              <TableHead>Steuerart</TableHead>
              <TableHead>Zahlung</TableHead>
              <TableHead>KI</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[56px] text-right">⋯</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((document) => {
              const hasCritical = document.flags.some((flag) => flag.severity === 'critical' && !flag.resolved)
              const margin = marginByDocumentId?.get(document.id)
              return (
                <TableRow
                  key={document.id}
                  onClick={() => onSelectDocument(document.id)}
                  className={cn(
                    'cursor-pointer',
                    selectedDocumentId === document.id && 'bg-primary/5 hover:bg-primary/10',
                    hasCritical && 'bg-red-50/35 dark:bg-red-950/15'
                  )}
                >
                  <TableCell>
                    <span className="tabular-nums">{formatDate(document.invoiceDate)}</span>
                  </TableCell>
                  <TableCell className="font-medium">{document.invoiceNumber}</TableCell>
                  <TableCell className="font-medium">{document.vehicleId ?? 'Nicht zugeordnet'}</TableCell>
                  <TableCell>{document.partnerName}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatCurrency(document.netAmount)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatCurrency(document.vatAmount)}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(document.grossAmount)}</TableCell>
                  {hasMarginColumn && (
                    <TableCell className="text-right font-medium tabular-nums text-emerald-600 dark:text-emerald-400">
                      {typeof margin === 'number' ? `+${formatCurrency(margin)}` : '—'}
                    </TableCell>
                  )}
                  <TableCell>
                    {document.taxMode === 'regelbesteuerung_19' ? (
                      <Badge variant="outline" className="text-blue-700 border-blue-300 dark:text-blue-300 dark:border-blue-700">
                        Regel
                      </Badge>
                    ) : (
                      <Badge className="bg-violet-100 text-violet-700 border-0 dark:bg-violet-950/40 dark:text-violet-300">
                        §25a Differenz
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={cn('border-0', paymentStatusColor[document.paymentStatus])} variant="secondary">
                      {paymentStatusLabel[document.paymentStatus]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="gap-1">
                      <Sparkles className="h-3 w-3 text-violet-500" />
                      {document.aiConfidence}%
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn('border-0 text-[10px]', statusColor[document.status])} variant="secondary">
                      {statusLabel[document.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <a href={document.pdfUrl} target="_blank" rel="noreferrer">
                            PDF anzeigen
                          </a>
                        </DropdownMenuItem>
                        {onMarkPaid && document.paymentStatus !== 'bezahlt' && (
                          <DropdownMenuItem onClick={() => onMarkPaid(document.id)}>
                            Als bezahlt markieren
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => onSelectDocument(document.id)}>
                          Details öffnen
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
            {documents.length === 0 && (
              <TableRow>
                <TableCell colSpan={hasMarginColumn ? 13 : 12} className="py-10 text-center text-muted-foreground">
                  Keine Belege mit den gewählten Filtern.
                </TableCell>
              </TableRow>
            )}
            {documents.length > 0 && (
              <TableRow className="bg-muted/35 hover:bg-muted/35">
                <TableCell colSpan={4} className="text-[11px] font-medium text-muted-foreground">
                  {documents.length} Belege
                </TableCell>
                <TableCell className="text-right font-semibold tabular-nums">{formatCurrency(netTotal)}</TableCell>
                <TableCell className="text-right font-semibold tabular-nums">{formatCurrency(vatTotal)}</TableCell>
                <TableCell className="text-right font-semibold tabular-nums">{formatCurrency(grossTotal)}</TableCell>
                {hasMarginColumn && <TableCell />}
                <TableCell colSpan={5} />
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
