'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { AlertCircle, ExternalLink, RotateCcw, Save } from 'lucide-react'
import { mockVehicleListRowsLegacy } from '@/lib/mock-data'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import type { Vehicle, VehicleAuctionStatus, VehicleListRowLegacy, VehicleStatus } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

const auctionStatusConfig: Record<VehicleAuctionStatus, { label: string; className: string }> = {
  aktiv: {
    label: 'Aktiv',
    className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
  },
  verkauft: {
    label: 'Verkauft',
    className: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400',
  },
  reserviert: {
    label: 'Reserviert',
    className: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  },
}

const vehicleStatusLabels: Record<VehicleStatus, string> = {
  eingang: 'Eingang',
  inspektion: 'Inspektion',
  werkstatt: 'Werkstatt',
  aufbereitung: 'Aufbereitung',
  verkaufsbereit: 'Verkaufsbereit',
  verkauft: 'Verkauft',
}

const comparableKeys: Array<keyof VehicleListRowLegacy> = [
  'autoId',
  'catalogNumber',
  'kNumber',
  'lotNumber',
  'minimumPrice',
  'currentBid',
  'auctionStatus',
  'imagesAvailable',
  'auctionDate',
  'docsCoc',
  'docsServiceHistory',
  'docsSpareKey',
  'huValidUntil',
  'damageNote',
  'lastAuction',
  'listingUrl',
  'contractTextUrl',
  'rowLocked',
]

function createFallbackRow(vehicle: Vehicle): VehicleListRowLegacy {
  const idSuffix = vehicle.id.replace(/[^\d]/g, '').padStart(3, '0')
  return {
    id: `legacy-${vehicle.id}`,
    vehicleId: vehicle.id,
    autoId: `24${idSuffix}`,
    catalogNumber: '315',
    kNumber: `K-${idSuffix}`,
    lotNumber: idSuffix,
    minimumPrice: Math.max(1000, vehicle.price - 2200),
    currentBid: Math.max(0, vehicle.price - 2800),
    auctionStatus: vehicle.status === 'verkauft' ? 'verkauft' : 'aktiv',
    imagesAvailable: true,
    auctionDate: vehicle.intakeDate,
    docsCoc: false,
    docsServiceHistory: true,
    docsSpareKey: false,
    huValidUntil: vehicle.deadline,
    damageNote: vehicle.notes || 'Keine Angaben',
    lastAuction: 'Letzte Auktion',
    listingUrl: `https://lahfauto.de/inserat/${vehicle.id}`,
    contractTextUrl: `https://lahfauto.de/vertrag/${vehicle.id}`,
    rowLocked: false,
  }
}

function buildInitialRows(vehicles: Vehicle[]) {
  const rows: Record<string, VehicleListRowLegacy> = {}
  for (const row of mockVehicleListRowsLegacy) {
    rows[row.vehicleId] = { ...row }
  }
  for (const vehicle of vehicles) {
    if (!rows[vehicle.id]) rows[vehicle.id] = createFallbackRow(vehicle)
  }
  return rows
}

function isDirtyRow(draft: VehicleListRowLegacy, saved: VehicleListRowLegacy) {
  return comparableKeys.some((key) => draft[key] !== saved[key])
}

function compactUrl(url: string) {
  try {
    const parsed = new URL(url)
    return parsed.hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

function shortText(value: string, max = 40) {
  if (value.length <= max) return value
  return `${value.slice(0, max - 1)}…`
}

export default function VehicleListExcelTable({ vehicles }: { vehicles: Vehicle[] }) {
  const [savedRows, setSavedRows] = useState<Record<string, VehicleListRowLegacy>>(() => buildInitialRows(vehicles))
  const [draftRows, setDraftRows] = useState<Record<string, VehicleListRowLegacy>>(() => buildInitialRows(vehicles))

  const vehicleById = useMemo(() => new Map(vehicles.map((vehicle) => [vehicle.id, vehicle])), [vehicles])

  const rows = useMemo(
    () =>
      vehicles.map((vehicle) => {
        const saved = savedRows[vehicle.id] ?? createFallbackRow(vehicle)
        const row = draftRows[vehicle.id] ?? saved
        return {
          vehicle,
          row,
          dirty: isDirtyRow(row, saved),
        }
      }),
    [draftRows, savedRows, vehicles]
  )

  const soldCount = rows.filter((entry) => entry.row.auctionStatus === 'verkauft').length
  const minimumTotal = rows.reduce((sum, entry) => sum + entry.row.minimumPrice, 0)
  const bidTotal = rows.reduce((sum, entry) => sum + entry.row.currentBid, 0)

  const updateRow = <K extends keyof VehicleListRowLegacy>(
    vehicleId: string,
    key: K,
    value: VehicleListRowLegacy[K]
  ) => {
    setDraftRows((prev) => {
      const fallbackVehicle = vehicleById.get(vehicleId)
      const current = prev[vehicleId] ?? savedRows[vehicleId] ?? (fallbackVehicle ? createFallbackRow(fallbackVehicle) : undefined)
      if (!current || current.rowLocked) return prev
      return {
        ...prev,
        [vehicleId]: {
          ...current,
          [key]: value,
        },
      }
    })
  }

  const saveRow = (vehicleId: string) => {
    const fallbackVehicle = vehicleById.get(vehicleId)
    const row = draftRows[vehicleId] ?? savedRows[vehicleId] ?? (fallbackVehicle ? createFallbackRow(fallbackVehicle) : undefined)
    if (!row || row.rowLocked) return
    setSavedRows((prev) => ({ ...prev, [vehicleId]: { ...row } }))
    setDraftRows((prev) => ({ ...prev, [vehicleId]: { ...row } }))
  }

  const resetRow = (vehicleId: string) => {
    const fallbackVehicle = vehicleById.get(vehicleId)
    const row = savedRows[vehicleId] ?? (fallbackVehicle ? createFallbackRow(fallbackVehicle) : undefined)
    if (!row) return
    setDraftRows((prev) => ({ ...prev, [vehicleId]: { ...row } }))
  }

  const groupHeaderClass =
    'sticky top-0 z-30 h-8 border-b border-border/80 bg-muted/75 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground backdrop-blur supports-[backdrop-filter]:bg-muted/60'
  const columnHeaderClass =
    'sticky top-8 z-30 h-9 border-b border-border/80 bg-background/95 px-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground backdrop-blur supports-[backdrop-filter]:bg-background/85'
  const cellClass = 'h-[46px] px-2 align-middle whitespace-nowrap text-[12px]'
  const stickyBaseClass =
    'sticky z-20 border-r border-border/60 bg-background/95 supports-[backdrop-filter]:bg-background/85 group-hover:bg-muted/40'

  return (
    <div className="rounded-xl border border-border/60 bg-card">
      <TooltipProvider delayDuration={150}>
        <ScrollArea className="max-h-[calc(100vh-260px)] w-full">
          <div className="min-w-[2600px]">
            <Table className="border-separate border-spacing-0 text-[12px]">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead colSpan={8} className={groupHeaderClass}>
                    Fahrzeug
                  </TableHead>
                  <TableHead colSpan={8} className={groupHeaderClass}>
                    Verkauf / Auktion
                  </TableHead>
                  <TableHead colSpan={4} className={groupHeaderClass}>
                    Dokumente
                  </TableHead>
                  <TableHead colSpan={2} className={groupHeaderClass}>
                    Schäden / Notizen
                  </TableHead>
                  <TableHead colSpan={3} className={groupHeaderClass}>
                    Links / Aktion
                  </TableHead>
                </TableRow>
                <TableRow className="hover:bg-transparent">
                  <TableHead className={cn(columnHeaderClass, stickyBaseClass, 'left-0 z-40 w-[80px]')}>Foto</TableHead>
                  <TableHead className={cn(columnHeaderClass, stickyBaseClass, 'left-[80px] z-40 w-[92px]')}>AutoID</TableHead>
                  <TableHead className={cn(columnHeaderClass, stickyBaseClass, 'left-[172px] z-40 w-[220px]')}>Marke</TableHead>
                  <TableHead className={cn(columnHeaderClass, 'w-[220px]')}>FIN</TableHead>
                  <TableHead className={cn(columnHeaderClass, 'w-[120px] text-right')}>Preis</TableHead>
                  <TableHead className={cn(columnHeaderClass, 'w-[120px] text-right')}>Diff</TableHead>
                  <TableHead className={cn(columnHeaderClass, 'w-[105px]')}>Getriebe</TableHead>
                  <TableHead className={cn(columnHeaderClass, 'w-[120px]')}>Standort</TableHead>
                  <TableHead className={cn(columnHeaderClass, 'w-[95px]')}>Katalog-Nr.</TableHead>
                  <TableHead className={cn(columnHeaderClass, 'w-[85px]')}>K-Nr.</TableHead>
                  <TableHead className={cn(columnHeaderClass, 'w-[80px]')}>LOT</TableHead>
                  <TableHead className={cn(columnHeaderClass, 'w-[130px] text-right')}>Mindestpreis</TableHead>
                  <TableHead className={cn(columnHeaderClass, 'w-[115px] text-right')}>Gebot</TableHead>
                  <TableHead className={cn(columnHeaderClass, 'w-[120px]')}>Status</TableHead>
                  <TableHead className={cn(columnHeaderClass, 'w-[90px]')}>Bilder</TableHead>
                  <TableHead className={cn(columnHeaderClass, 'w-[130px]')}>Auktionsdatum</TableHead>
                  <TableHead className={cn(columnHeaderClass, 'w-[70px] text-center')}>COC</TableHead>
                  <TableHead className={cn(columnHeaderClass, 'w-[70px] text-center')}>SH</TableHead>
                  <TableHead className={cn(columnHeaderClass, 'w-[70px] text-center')}>ES</TableHead>
                  <TableHead className={cn(columnHeaderClass, 'w-[130px]')}>HU gültig bis</TableHead>
                  <TableHead className={cn(columnHeaderClass, 'w-[250px]')}>Schadentext</TableHead>
                  <TableHead className={cn(columnHeaderClass, 'w-[150px]')}>Letzte Auktion</TableHead>
                  <TableHead className={cn(columnHeaderClass, 'w-[140px]')}>Inserat</TableHead>
                  <TableHead className={cn(columnHeaderClass, 'w-[145px]')}>Vertragstext</TableHead>
                  <TableHead className={cn(columnHeaderClass, 'w-[220px] text-right')}>Aktionen</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {rows.map(({ vehicle, row, dirty }) => {
                  const diff = vehicle.price - vehicle.purchasePrice
                  const diffPositive = diff >= 0
                  const statusConfig = auctionStatusConfig[row.auctionStatus]

                  return (
                    <TableRow
                      key={vehicle.id}
                      className={cn(
                        'group border-b border-border/60 even:bg-muted/[0.22] hover:bg-muted/40',
                        dirty && 'shadow-[inset_3px_0_0] shadow-amber-500/80'
                      )}
                    >
                      <TableCell className={cn(cellClass, stickyBaseClass, 'left-0 z-20')}>
                        <div className="relative h-10 w-16 overflow-hidden rounded-sm border border-border/70 bg-muted">
                          <Image src={vehicle.imageUrl} alt={`${vehicle.make} ${vehicle.model}`} fill className="object-cover" sizes="64px" />
                        </div>
                      </TableCell>

                      <TableCell className={cn(cellClass, stickyBaseClass, 'left-[80px] z-20')}>
                        <div className="font-mono text-[11px]">{row.autoId}</div>
                      </TableCell>

                      <TableCell className={cn(cellClass, stickyBaseClass, 'left-[172px] z-20')}>
                        <div className="flex min-w-0 flex-col">
                          <Link href={`/fahrzeuge/${vehicle.id}`} className="truncate font-medium hover:text-primary hover:underline">
                            {vehicle.make} {vehicle.model}
                          </Link>
                          <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <span className="truncate">{vehicle.licensePlate}</span>
                            <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                              {vehicleStatusLabels[vehicle.status]}
                            </Badge>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className={cellClass}>
                        <span className="font-mono text-[11px] text-muted-foreground">{vehicle.vin}</span>
                      </TableCell>

                      <TableCell className={cn(cellClass, 'text-right font-medium')}>{formatCurrency(vehicle.price)}</TableCell>
                      <TableCell
                        className={cn(
                          cellClass,
                          'text-right font-medium',
                          diffPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                        )}
                      >
                        {diffPositive ? '+' : '-'}
                        {formatCurrency(Math.abs(diff))}
                      </TableCell>
                      <TableCell className={cellClass}>{vehicle.transmission}</TableCell>
                      <TableCell className={cellClass}>{vehicle.location}</TableCell>
                      <TableCell className={cellClass}>{row.catalogNumber}</TableCell>
                      <TableCell className={cellClass}>{row.kNumber}</TableCell>
                      <TableCell className={cellClass}>{row.lotNumber}</TableCell>

                      <TableCell className={cn(cellClass, 'text-right')}>
                        <Input
                          type="number"
                          min={0}
                          value={row.minimumPrice}
                          onChange={(event) => {
                            const value = Number.isNaN(event.target.valueAsNumber) ? 0 : Math.max(0, event.target.valueAsNumber)
                            updateRow(vehicle.id, 'minimumPrice', value)
                          }}
                          disabled={row.rowLocked}
                          className="h-8 w-[118px] text-right text-[12px] disabled:opacity-70"
                        />
                      </TableCell>

                      <TableCell className={cn(cellClass, 'text-right')}>
                        <Input
                          type="number"
                          min={0}
                          value={row.currentBid}
                          onChange={(event) => {
                            const value = Number.isNaN(event.target.valueAsNumber) ? 0 : Math.max(0, event.target.valueAsNumber)
                            updateRow(vehicle.id, 'currentBid', value)
                          }}
                          disabled={row.rowLocked}
                          className="h-8 w-[105px] text-right text-[12px] disabled:opacity-70"
                        />
                      </TableCell>

                      <TableCell className={cellClass}>
                        <Select
                          value={row.auctionStatus}
                          onValueChange={(value: VehicleAuctionStatus) => updateRow(vehicle.id, 'auctionStatus', value)}
                          disabled={row.rowLocked}
                        >
                          <SelectTrigger className="h-8 w-[116px] text-[12px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="aktiv">Aktiv</SelectItem>
                            <SelectItem value="verkauft">Verkauft</SelectItem>
                            <SelectItem value="reserviert">Reserviert</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>

                      <TableCell className={cellClass}>
                        <Select
                          value={row.imagesAvailable ? 'ja' : 'nein'}
                          onValueChange={(value) => updateRow(vehicle.id, 'imagesAvailable', value === 'ja')}
                          disabled={row.rowLocked}
                        >
                          <SelectTrigger className="h-8 w-[84px] text-[12px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ja">ja</SelectItem>
                            <SelectItem value="nein">nein</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>

                      <TableCell className={cellClass}>
                        <Input
                          type="date"
                          value={row.auctionDate}
                          onChange={(event) => updateRow(vehicle.id, 'auctionDate', event.target.value)}
                          disabled={row.rowLocked}
                          className="h-8 w-[128px] text-[12px] disabled:opacity-70"
                        />
                      </TableCell>

                      <TableCell className={cn(cellClass, 'text-center')}>
                        <input
                          type="checkbox"
                          checked={row.docsCoc}
                          onChange={(event) => updateRow(vehicle.id, 'docsCoc', event.target.checked)}
                          disabled={row.rowLocked}
                          className="h-3.5 w-3.5 accent-primary disabled:cursor-not-allowed"
                        />
                      </TableCell>
                      <TableCell className={cn(cellClass, 'text-center')}>
                        <input
                          type="checkbox"
                          checked={row.docsServiceHistory}
                          onChange={(event) => updateRow(vehicle.id, 'docsServiceHistory', event.target.checked)}
                          disabled={row.rowLocked}
                          className="h-3.5 w-3.5 accent-primary disabled:cursor-not-allowed"
                        />
                      </TableCell>
                      <TableCell className={cn(cellClass, 'text-center')}>
                        <input
                          type="checkbox"
                          checked={row.docsSpareKey}
                          onChange={(event) => updateRow(vehicle.id, 'docsSpareKey', event.target.checked)}
                          disabled={row.rowLocked}
                          className="h-3.5 w-3.5 accent-primary disabled:cursor-not-allowed"
                        />
                      </TableCell>
                      <TableCell className={cellClass}>
                        <Input
                          type="date"
                          value={row.huValidUntil}
                          onChange={(event) => updateRow(vehicle.id, 'huValidUntil', event.target.value)}
                          disabled={row.rowLocked}
                          className="h-8 w-[128px] text-[12px] disabled:opacity-70"
                        />
                      </TableCell>

                      <TableCell className={cellClass}>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="h-8 w-[238px] justify-start px-2 text-[12px] font-normal">
                              {shortText(row.damageNote, 44)}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent align="start" className="w-[360px] p-3">
                            <div className="space-y-2">
                              <p className="text-xs font-medium text-muted-foreground">Schadentext</p>
                              <Textarea
                                value={row.damageNote}
                                onChange={(event) => updateRow(vehicle.id, 'damageNote', event.target.value)}
                                disabled={row.rowLocked}
                                className="min-h-24 text-[12px] disabled:opacity-70"
                              />
                            </div>
                          </PopoverContent>
                        </Popover>
                      </TableCell>

                      <TableCell className={cellClass}>{row.lastAuction}</TableCell>

                      <TableCell className={cellClass}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <a
                              href={row.listingUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[12px] text-primary hover:underline"
                            >
                              {compactUrl(row.listingUrl)}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="max-w-[340px] break-all text-[11px]">
                            {row.listingUrl}
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>

                      <TableCell className={cellClass}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <a
                              href={row.contractTextUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[12px] text-primary hover:underline"
                            >
                              Vertrag
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="max-w-[340px] break-all text-[11px]">
                            {row.contractTextUrl}
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>

                      <TableCell className={cn(cellClass, 'text-right')}>
                        <div className="flex min-w-[210px] items-center justify-end gap-1.5">
                          <Badge className={cn('border-0 text-[10px]', statusConfig.className)} variant="secondary">
                            {statusConfig.label}
                          </Badge>
                          {dirty && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 dark:text-amber-300">
                              <AlertCircle className="h-3.5 w-3.5" />
                              geändert
                            </span>
                          )}
                          <Button
                            type="button"
                            size="sm"
                            className="h-7 px-2.5 text-[11px]"
                            onClick={() => saveRow(vehicle.id)}
                            disabled={!dirty || row.rowLocked}
                          >
                            <Save className="mr-1 h-3.5 w-3.5" />
                            Speichern
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-[11px]"
                            onClick={() => resetRow(vehicle.id)}
                            disabled={!dirty}
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>

              <TableFooter>
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={25} className="py-2">
                    <div className="flex items-center gap-6 text-xs">
                      <span>
                        Verkauft: <strong>{soldCount}</strong>
                      </span>
                      <span>
                        Summe Mindestpreis: <strong>{formatCurrency(minimumTotal)}</strong>
                      </span>
                      <span>
                        Summe Gebot: <strong>{formatCurrency(bidTotal)}</strong>
                      </span>
                      <span className="text-muted-foreground">Aktualisiert: {formatDate(new Date())}</span>
                    </div>
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
          <ScrollBar orientation="horizontal" />
          <ScrollBar orientation="vertical" />
        </ScrollArea>
      </TooltipProvider>
    </div>
  )
}
