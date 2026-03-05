'use client'

import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency } from '@/lib/utils'
import type { AccountingDocument, Vehicle, VehicleAccountingCase, VehicleAccountingCaseStatus } from '@/lib/types'

const caseStatusLabel: Record<VehicleAccountingCaseStatus, string> = {
  offen: 'Offen',
  pruefung: 'Prüfung',
  exportbereit: 'Exportbereit',
  exportiert: 'Exportiert',
}

const caseStatusClass: Record<VehicleAccountingCaseStatus, string> = {
  offen: 'bg-slate-100 text-slate-700 dark:bg-slate-800/40 dark:text-slate-300',
  pruefung: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  exportbereit: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  exportiert: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300',
}

interface VehicleAccountingTableProps {
  cases: VehicleAccountingCase[]
  vehicleById: Map<string, Vehicle>
  documentsById: Map<string, AccountingDocument>
}

export function VehicleAccountingTable({
  cases,
  vehicleById,
  documentsById,
}: VehicleAccountingTableProps) {
  return (
    <div className="rounded-xl border border-border/60 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Fahrzeug</TableHead>
            <TableHead>Eingangsrechnung</TableHead>
            <TableHead>Ausgangsrechnung</TableHead>
            <TableHead>Steuerart</TableHead>
            <TableHead className="text-right">Marge</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Konflikte</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cases.map((item) => {
            const vehicle = vehicleById.get(item.vehicleId)
            const incoming = item.incomingDocumentId ? documentsById.get(item.incomingDocumentId) : undefined
            const outgoing = item.outgoingDocumentId ? documentsById.get(item.outgoingDocumentId) : undefined
            return (
              <TableRow key={item.id} className="align-top">
                <TableCell>
                  <div>
                    <p className="font-medium">{vehicle ? `${vehicle.make} ${vehicle.model}` : item.vehicleId}</p>
                    <p className="text-xs text-muted-foreground">{vehicle?.licensePlate ?? 'Ohne Kennzeichen'}</p>
                  </div>
                </TableCell>
                <TableCell>
                  {incoming ? (
                    <div>
                      <p className="font-medium">{incoming.invoiceNumber}</p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(incoming.grossAmount)}</p>
                    </div>
                  ) : (
                    <span className="text-xs text-red-600 dark:text-red-400">Fehlt</span>
                  )}
                </TableCell>
                <TableCell>
                  {outgoing ? (
                    <div>
                      <p className="font-medium">{outgoing.invoiceNumber}</p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(outgoing.grossAmount)}</p>
                    </div>
                  ) : (
                    <span className="text-xs text-red-600 dark:text-red-400">Fehlt</span>
                  )}
                </TableCell>
                <TableCell>{item.taxMode === 'regelbesteuerung_19' ? 'Regel 19%' : 'Differenz §25a'}</TableCell>
                <TableCell className="text-right font-semibold">
                  {typeof item.marginAmount === 'number' ? formatCurrency(item.marginAmount) : '—'}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className={caseStatusClass[item.status]}>
                    {caseStatusLabel[item.status]}
                  </Badge>
                </TableCell>
                <TableCell>
                  {item.blockers.length > 0 ? (
                    <div className="space-y-1">
                      {item.blockers.map((blocker, index) => (
                        <p key={index} className="text-xs text-red-600 dark:text-red-400 flex items-start gap-1">
                          <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                          <span>{blocker}</span>
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Keine Konflikte
                    </p>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
          {cases.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                Keine Fahrzeugfälle für den gewählten Monat.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
