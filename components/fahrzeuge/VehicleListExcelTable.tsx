'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { AlertCircle, RotateCcw, Save } from 'lucide-react'
import { mockVehicleListRowsLegacy } from '@/lib/mock-data'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import type { Vehicle, VehicleAuctionStatus, VehicleListRowLegacy, VehicleStatus } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
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

function saleActionLabel(value: string) {
  if (value === 'Letzte Auktion') return 'Letzte Verkaufsaktion'
  return value.replace('Auktion ', 'Verkauf ')
}

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
    lastAuction: 'Letzte Verkaufsaktion',
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

  const headerClass =
    'sticky top-0 z-20 h-10 border-b border-border/70 bg-muted/85 px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground whitespace-normal backdrop-blur supports-[backdrop-filter]:bg-muted/70'
  const cellClass = 'px-3 py-2.5 align-top whitespace-normal text-[12px]'

  return (
    <div className="rounded-xl border border-border/60 bg-card">
      <TooltipProvider delayDuration={150}>
        <div className="max-h-[calc(100vh-260px)] overflow-y-auto">
          <Table className="w-full table-fixed text-[12px]">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className={cn(headerClass, 'w-[25%]')}>Fahrzeug</TableHead>
                <TableHead className={cn(headerClass, 'w-[15%]')}>Daten</TableHead>
                <TableHead className={cn(headerClass, 'w-[22%]')}>Verkaufsaktion</TableHead>
                <TableHead className={cn(headerClass, 'w-[13%]')}>Dokumente</TableHead>
                <TableHead className={cn(headerClass, 'w-[15%]')}>Schäden & Notizen</TableHead>
                <TableHead className={cn(headerClass, 'w-[10%] text-right')}>Aktionen</TableHead>
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
                      'border-b border-border/60 align-top even:bg-muted/[0.16] hover:bg-muted/35',
                      dirty && 'bg-amber-50/35 dark:bg-amber-900/10'
                    )}
                  >
                    <TableCell className={cellClass}>
                      <div className="flex items-start gap-3">
                        <div className="relative h-12 w-[72px] shrink-0 overflow-hidden rounded-md border border-border/70 bg-muted">
                          <Image src={vehicle.imageUrl} alt={`${vehicle.make} ${vehicle.model}`} fill className="object-cover" sizes="72px" />
                        </div>
                        <div className="min-w-0 space-y-1">
                          <Link href={`/fahrzeuge/${vehicle.id}`} className="block truncate font-semibold hover:text-primary hover:underline">
                            {vehicle.make} {vehicle.model}
                          </Link>
                          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                            <span>{vehicle.licensePlate}</span>
                            <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                              {vehicleStatusLabels[vehicle.status]}
                            </Badge>
                            <span className="font-mono text-[10px] text-muted-foreground/85">#{row.autoId}</span>
                          </div>
                          <p className="truncate font-mono text-[10px] text-muted-foreground">{vehicle.vin}</p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className={cellClass}>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Preis</span>
                        <span className="text-right font-semibold">{formatCurrency(vehicle.price)}</span>
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Diff</span>
                        <span
                          className={cn(
                            'text-right font-semibold',
                            diffPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                          )}
                        >
                          {diffPositive ? '+' : '-'}
                          {formatCurrency(Math.abs(diff))}
                        </span>
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Getriebe</span>
                        <span className="text-right">{vehicle.transmission}</span>
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Standort</span>
                        <span className="text-right">{vehicle.location}</span>
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Standtage</span>
                        <span className={cn('text-right font-semibold', (() => { const d = Math.floor((Date.now() - new Date(vehicle.intakeDate).getTime()) / 86400000); return d > 30 ? 'text-red-600 dark:text-red-400' : d > 14 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400' })())}>
                          {Math.floor((Date.now() - new Date(vehicle.intakeDate).getTime()) / 86400000)} Tage
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className={cellClass}>
                      <div className="grid grid-cols-2 gap-1.5">
                        <div>
                          <p className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">Verkaufspreis</p>
                          <Input
                            type="number"
                            min={0}
                            value={row.minimumPrice}
                            onChange={(event) => {
                              const value = Number.isNaN(event.target.valueAsNumber) ? 0 : Math.max(0, event.target.valueAsNumber)
                              updateRow(vehicle.id, 'minimumPrice', value)
                            }}
                            disabled={row.rowLocked}
                            className="h-8 w-full text-right text-[12px] disabled:opacity-70"
                          />
                        </div>
                        <div>
                          <p className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">Verhandlungsbasis</p>
                          <Input
                            type="number"
                            min={0}
                            value={row.currentBid}
                            onChange={(event) => {
                              const value = Number.isNaN(event.target.valueAsNumber) ? 0 : Math.max(0, event.target.valueAsNumber)
                              updateRow(vehicle.id, 'currentBid', value)
                            }}
                            disabled={row.rowLocked}
                            className="h-8 w-full text-right text-[12px] disabled:opacity-70"
                          />
                        </div>

                        <div>
                          <p className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">Status</p>
                          <Select
                            value={row.auctionStatus}
                            onValueChange={(value: VehicleAuctionStatus) => updateRow(vehicle.id, 'auctionStatus', value)}
                            disabled={row.rowLocked}
                          >
                            <SelectTrigger className={cn('h-8 w-full text-[12px]', statusConfig.className)}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="aktiv">Aktiv</SelectItem>
                              <SelectItem value="verkauft">Verkauft</SelectItem>
                              <SelectItem value="reserviert">Reserviert</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <p className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">Bilder</p>
                          <Select
                            value={row.imagesAvailable ? 'ja' : 'nein'}
                            onValueChange={(value) => updateRow(vehicle.id, 'imagesAvailable', value === 'ja')}
                            disabled={row.rowLocked}
                          >
                            <SelectTrigger className="h-8 w-full text-[12px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ja">ja</SelectItem>
                              <SelectItem value="nein">nein</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="col-span-2">
                          <p className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">Verkaufsdatum</p>
                          <Input
                            type="date"
                            value={row.auctionDate}
                            onChange={(event) => updateRow(vehicle.id, 'auctionDate', event.target.value)}
                            disabled={row.rowLocked}
                            className="h-8 w-full text-[12px] disabled:opacity-70"
                          />
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className={cellClass}>
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <label className="inline-flex items-center gap-1 text-[11px]">
                            <input
                              type="checkbox"
                              checked={row.docsCoc}
                              onChange={(event) => updateRow(vehicle.id, 'docsCoc', event.target.checked)}
                              disabled={row.rowLocked}
                              className="h-3.5 w-3.5 accent-primary disabled:cursor-not-allowed"
                            />
                            COC
                          </label>
                          <label className="inline-flex items-center gap-1 text-[11px]">
                            <input
                              type="checkbox"
                              checked={row.docsServiceHistory}
                              onChange={(event) => updateRow(vehicle.id, 'docsServiceHistory', event.target.checked)}
                              disabled={row.rowLocked}
                              className="h-3.5 w-3.5 accent-primary disabled:cursor-not-allowed"
                            />
                            SH
                          </label>
                          <label className="inline-flex items-center gap-1 text-[11px]">
                            <input
                              type="checkbox"
                              checked={row.docsSpareKey}
                              onChange={(event) => updateRow(vehicle.id, 'docsSpareKey', event.target.checked)}
                              disabled={row.rowLocked}
                              className="h-3.5 w-3.5 accent-primary disabled:cursor-not-allowed"
                            />
                            ES
                          </label>
                        </div>
                        <div>
                          <p className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">HU gültig bis</p>
                          <Input
                            type="date"
                            value={row.huValidUntil}
                            onChange={(event) => updateRow(vehicle.id, 'huValidUntil', event.target.value)}
                            disabled={row.rowLocked}
                            className="h-8 w-full text-[12px] disabled:opacity-70"
                          />
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className={cellClass}>
                      <div className="space-y-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="h-8 w-full justify-start px-2 text-[12px] font-normal">
                              {shortText(row.damageNote, 34)}
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
                        <p className="text-[11px] text-muted-foreground">{saleActionLabel(row.lastAuction)}</p>
                      </div>
                    </TableCell>

                    <TableCell className={cn(cellClass, 'text-right')}>
                      <div className="flex flex-col items-end gap-2">
                        {dirty ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400">
                            <AlertCircle className="h-3 w-3" />
                            Ungespeichert
                          </span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">Gespeichert</span>
                        )}
                        {row.rowLocked && <span className="text-[10px] text-muted-foreground">Gesperrt</span>}
                        <Button
                          type="button"
                          size="sm"
                          className="h-7 w-full gap-1.5 px-2.5 text-[11px]"
                          onClick={() => saveRow(vehicle.id)}
                          disabled={!dirty || row.rowLocked}
                        >
                          <Save className="h-3 w-3" />
                          Speichern
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 w-full gap-1.5 px-2.5 text-[11px]"
                          onClick={() => resetRow(vehicle.id)}
                          disabled={!dirty}
                        >
                          <RotateCcw className="h-3 w-3" />
                          Zurücksetzen
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>

            <TableFooter>
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="py-2">
                  <div className="flex flex-wrap items-center gap-6 text-xs">
                    <span>
                      Fahrzeuge: <strong>{rows.length}</strong>
                    </span>
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
      </TooltipProvider>
    </div>
  )
}
