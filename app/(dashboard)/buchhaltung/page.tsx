'use client'

import { Suspense, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import {
  ArrowUpRight,
  AlertTriangle,
  BarChart3,
  Search,
  Sparkles,
  Download,
  Mail,
  HandCoins,
  CircleDollarSign,
  Landmark,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAccountingStore } from '@/lib/stores/accounting-store'
import { useVehicleStore } from '@/lib/stores/vehicle-store'
import { formatCurrency } from '@/lib/utils'
import type {
  AccountingDocument,
  AccountingPaymentStatus,
  AccountingTaxMode,
  AccountingDocumentStatus,
} from '@/lib/types'
import { DocumentInboxTable } from '@/components/buchhaltung/document-inbox-table'
import { DocumentReviewPanel } from '@/components/buchhaltung/document-review-panel'
import { AdvisorExportPanel } from '@/components/buchhaltung/advisor-export-panel'
import { AIInvoiceScanDialog } from '@/components/buchhaltung/ai-invoice-scan-dialog'

type BuchhaltungTab = 'uebersicht' | 'eingang' | 'ausgang' | 'steuerberater'
const tabValues: BuchhaltungTab[] = ['uebersicht', 'eingang', 'ausgang', 'steuerberater']

const dummyLoanLiabilities = [
  {
    id: 'loan-1',
    lender: 'Autohaus-Finanzierung Süd',
    monthlyRate: 3200,
    remainingAmount: 58200,
    nextDueDate: '2026-03-15',
  },
  {
    id: 'loan-2',
    lender: 'Betriebsmittelkredit Hausbank',
    monthlyRate: 1800,
    remainingAmount: 27400,
    nextDueDate: '2026-03-20',
  },
]

const paymentFilterOptions: { value: 'alle' | AccountingPaymentStatus; label: string }[] = [
  { value: 'alle', label: 'Alle Status' },
  { value: 'bezahlt', label: 'bezahlt' },
  { value: 'offen', label: 'offen' },
  { value: 'ueberfaellig', label: 'überfällig' },
]

const taxFilterOptions: { value: 'alle' | AccountingTaxMode; label: string }[] = [
  { value: 'alle', label: 'Alle Besteuerungen' },
  { value: 'regelbesteuerung_19', label: 'Regelbesteuerung 19%' },
  { value: 'differenzbesteuerung_25a', label: '§25a Differenzbesteuerung' },
]

const workflowFilterOptions: { value: 'alle' | AccountingDocumentStatus; label: string }[] = [
  { value: 'alle', label: 'Alle Workflows' },
  { value: 'neu', label: 'Neu' },
  { value: 'ki_extrahiert', label: 'KI extrahiert' },
  { value: 'freigabe_noetig', label: 'Freigabe nötig' },
  { value: 'freigegeben', label: 'Freigegeben' },
  { value: 'gebucht', label: 'Gebucht' },
  { value: 'fehler', label: 'Fehler' },
]

function parseMonth(month: string) {
  const [year, monthNum] = month.split('-').map(Number)
  return { year, monthNum }
}

function getRollingMonths(baseMonth: string, count: number) {
  const { year, monthNum } = parseMonth(baseMonth)
  const months: string[] = []
  for (let i = count - 1; i >= 0; i -= 1) {
    const date = new Date(year, monthNum - 1 - i, 1)
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    months.push(`${y}-${m}`)
  }
  return months
}

function BuchhaltungPageContent() {
  const documents = useAccountingStore((state) => state.documents)
  const vehicleCases = useAccountingStore((state) => state.vehicleCases)
  const exportBatches = useAccountingStore((state) => state.exportBatches)
  const updateDocumentStatus = useAccountingStore((state) => state.updateDocumentStatus)
  const updatePaymentStatus = useAccountingStore((state) => state.updatePaymentStatus)
  const setFlagResolved = useAccountingStore((state) => state.setFlagResolved)
  const addScannedIncomingInvoice = useAccountingStore((state) => state.addScannedIncomingInvoice)
  const finalizeExport = useAccountingStore((state) => state.finalizeExport)
  const vehicles = useVehicleStore((state) => state.vehicles)

  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [monthFilter, setMonthFilter] = useState('2026-03')
  const [incomingSearch, setIncomingSearch] = useState('')
  const [incomingPaymentFilter, setIncomingPaymentFilter] = useState<'alle' | AccountingPaymentStatus>('alle')
  const [incomingTaxFilter, setIncomingTaxFilter] = useState<'alle' | AccountingTaxMode>('alle')
  const [incomingWorkflowFilter, setIncomingWorkflowFilter] = useState<'alle' | AccountingDocumentStatus>('alle')
  const [incomingSelectedId, setIncomingSelectedId] = useState<string | null>(null)
  const [outgoingSearch, setOutgoingSearch] = useState('')
  const [outgoingPaymentFilter, setOutgoingPaymentFilter] = useState<'alle' | AccountingPaymentStatus>('alle')
  const [outgoingTaxFilter, setOutgoingTaxFilter] = useState<'alle' | AccountingTaxMode>('alle')
  const [outgoingWorkflowFilter, setOutgoingWorkflowFilter] = useState<'alle' | AccountingDocumentStatus>('alle')
  const [outgoingSelectedId, setOutgoingSelectedId] = useState<string | null>(null)
  const [scanDialogOpen, setScanDialogOpen] = useState(false)

  const monthOptions = useMemo(() => {
    const uniqueMonths = Array.from(new Set(documents.map((document) => document.month)))
    return uniqueMonths.sort((a, b) => b.localeCompare(a))
  }, [documents])

  const activeMonth = monthOptions.includes(monthFilter)
    ? monthFilter
    : (monthOptions[0] ?? '2026-03')

  const monthDocuments = useMemo(
    () => documents.filter((document) => document.month === activeMonth),
    [activeMonth, documents]
  )
  const monthCases = useMemo(
    () => vehicleCases.filter((item) => item.month === activeMonth),
    [activeMonth, vehicleCases]
  )

  const tabParam = searchParams.get('tab')
  const activeTab: BuchhaltungTab = tabValues.includes(tabParam as BuchhaltungTab)
    ? (tabParam as BuchhaltungTab)
    : 'uebersicht'

  const setActiveTab = (nextTab: BuchhaltungTab) => {
    const params = new URLSearchParams(searchParams.toString())
    if (nextTab === 'uebersicht') {
      params.delete('tab')
    } else {
      params.set('tab', nextTab)
    }
    const query = params.toString()
    router.replace(query ? `${pathname}?${query}` : pathname)
  }

  const outgoingMarginByDocumentId = useMemo(() => {
    const map = new Map<string, number>()
    for (const item of monthCases) {
      if (!item.outgoingDocumentId || typeof item.marginAmount !== 'number') continue
      map.set(item.outgoingDocumentId, item.marginAmount)
    }
    return map
  }, [monthCases])

  const incomingDocuments = monthDocuments.filter((document) => document.type === 'eingangsrechnung')
  const outgoingDocuments = monthDocuments.filter((document) => document.type === 'ausgangsrechnung')

  const filterDocuments = (
    list: AccountingDocument[],
    search: string,
    paymentFilter: 'alle' | AccountingPaymentStatus,
    taxFilter: 'alle' | AccountingTaxMode,
    workflowFilter: 'alle' | AccountingDocumentStatus
  ) => list.filter((document) => {
    const needle = search.trim().toLowerCase()
    const matchesSearch = needle.length === 0
      || document.invoiceNumber.toLowerCase().includes(needle)
      || document.partnerName.toLowerCase().includes(needle)
      || (document.vehicleId ?? '').toLowerCase().includes(needle)
    const matchesPayment = paymentFilter === 'alle' || document.paymentStatus === paymentFilter
    const matchesTax = taxFilter === 'alle' || document.taxMode === taxFilter
    const matchesWorkflow = workflowFilter === 'alle' || document.status === workflowFilter
    return matchesSearch && matchesPayment && matchesTax && matchesWorkflow
  })

  const filteredIncoming = filterDocuments(
    incomingDocuments,
    incomingSearch,
    incomingPaymentFilter,
    incomingTaxFilter,
    incomingWorkflowFilter
  )
  const filteredOutgoing = filterDocuments(
    outgoingDocuments,
    outgoingSearch,
    outgoingPaymentFilter,
    outgoingTaxFilter,
    outgoingWorkflowFilter
  )

  const effectiveIncomingSelectedId = filteredIncoming.some((document) => document.id === incomingSelectedId)
    ? incomingSelectedId
    : (filteredIncoming[0]?.id ?? null)
  const effectiveOutgoingSelectedId = filteredOutgoing.some((document) => document.id === outgoingSelectedId)
    ? outgoingSelectedId
    : (filteredOutgoing[0]?.id ?? null)

  const selectedIncoming = filteredIncoming.find((document) => document.id === effectiveIncomingSelectedId) ?? null
  const selectedOutgoing = filteredOutgoing.find((document) => document.id === effectiveOutgoingSelectedId) ?? null

  const umsatzBrutto = outgoingDocuments.reduce((sum, document) => sum + document.grossAmount, 0)
  const kostenBrutto = incomingDocuments.reduce((sum, document) => sum + document.grossAmount, 0)
  const rohertrag = monthCases.reduce((sum, item) => sum + (item.marginAmount ?? 0), 0)
  const rohertragQuote = kostenBrutto > 0 ? (rohertrag / kostenBrutto) * 100 : 0

  const outgoingUstRegel = outgoingDocuments
    .filter((document) => document.taxMode === 'regelbesteuerung_19')
    .reduce((sum, document) => sum + document.vatAmount, 0)
  const outgoingUstDiff = monthCases
    .filter((item) => item.taxMode === 'differenzbesteuerung_25a')
    .reduce((sum, item) => {
      const margin = item.marginAmount ?? 0
      return sum + (margin / 1.19) * 0.19
    }, 0)
  const vorsteuer = incomingDocuments
    .filter((document) => document.taxMode === 'regelbesteuerung_19')
    .reduce((sum, document) => sum + document.vatAmount, 0)
  const ustZahllast = outgoingUstRegel + outgoingUstDiff - vorsteuer

  const dueDate = useMemo(() => {
    const { year, monthNum } = parseMonth(activeMonth)
    return format(new Date(year, monthNum, 10), 'dd. MMMM yyyy', { locale: de })
  }, [activeMonth])

  const overdueDocuments = monthDocuments.filter((document) => document.paymentStatus === 'ueberfaellig')
  const offeneDocuments = monthDocuments.filter((document) => document.paymentStatus === 'offen').length
  const pendingFreigabe = monthDocuments.filter((document) => document.status === 'freigabe_noetig').length

  const openReceivables = outgoingDocuments.filter((document) => document.paymentStatus !== 'bezahlt')
  const paidReceivables = outgoingDocuments.filter((document) => document.paymentStatus === 'bezahlt')
  const openPayables = incomingDocuments.filter((document) => document.paymentStatus !== 'bezahlt')

  const openReceivablesAmount = openReceivables.reduce((sum, document) => sum + document.grossAmount, 0)
  const paidReceivablesAmount = paidReceivables.reduce((sum, document) => sum + document.grossAmount, 0)
  const openPayablesAmount = openPayables.reduce((sum, document) => sum + document.grossAmount, 0)

  const monthlyLoanRate = dummyLoanLiabilities.reduce((sum, item) => sum + item.monthlyRate, 0)
  const remainingLoanDebt = dummyLoanLiabilities.reduce((sum, item) => sum + item.remainingAmount, 0)
  const openCreditRepaymentAmount = openPayablesAmount + monthlyLoanRate
  const nextLoanDueDate = dummyLoanLiabilities
    .map((item) => item.nextDueDate)
    .sort()[0]

  const rollingMonths = getRollingMonths(activeMonth, 6)
  const chartData = rollingMonths.map((month) => {
    const inputTotal = documents
      .filter((document) => document.month === month && document.type === 'eingangsrechnung')
      .reduce((sum, document) => sum + document.grossAmount, 0)
    const outputTotal = documents
      .filter((document) => document.month === month && document.type === 'ausgangsrechnung')
      .reduce((sum, document) => sum + document.grossAmount, 0)
    return {
      month,
      label: format(new Date(`${month}-01T00:00:00`), 'MMM yy', { locale: de }),
      Eingang: Math.round(inputTotal),
      Ausgang: Math.round(outputTotal),
    }
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Buchhaltung</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Belege prüfen, KI-Vorschläge freigeben und Exportpaket für den Steuerberater erstellen.
          </p>
        </div>
        <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
          <Select value={activeMonth} onValueChange={setMonthFilter}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((month) => (
                <SelectItem key={month} value={month}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button className="w-full sm:w-auto" variant="outline" onClick={() => setActiveTab('steuerberater')}>
            <ArrowUpRight className="h-4 w-4 mr-1.5" />
            Exportpaket
          </Button>
          <Button
            onClick={() => setScanDialogOpen(true)}
            className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white border-0 sm:w-auto"
          >
            <Sparkles className="h-4 w-4 mr-1.5" />
            KI-Rechnung scannen
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as BuchhaltungTab)} className="gap-4">
        <div className="rounded-2xl border border-border/60 bg-card/40 p-1">
          <TabsList variant="line" className="w-full justify-start overflow-x-auto whitespace-nowrap pb-1">
            <TabsTrigger value="uebersicht">Übersicht</TabsTrigger>
            <TabsTrigger value="eingang">Eingangsrechnungen</TabsTrigger>
            <TabsTrigger value="ausgang">Ausgangsrechnungen</TabsTrigger>
            <TabsTrigger value="steuerberater">Steuerberater</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="uebersicht" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            <Card className="border-border/60">
              <CardContent className="p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                  <HandCoins className="h-3.5 w-3.5" />
                  Offene Forderungen
                </p>
                <p className="text-2xl font-bold mt-1 tabular-nums text-amber-600 dark:text-amber-400">
                  {formatCurrency(openReceivablesAmount)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {openReceivables.length} Rechnung{openReceivables.length === 1 ? '' : 'en'} offen
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardContent className="p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                  <CircleDollarSign className="h-3.5 w-3.5" />
                  Bereits bezahlt
                </p>
                <p className="text-2xl font-bold mt-1 tabular-nums text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(paidReceivablesAmount)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {paidReceivables.length} Zahlung{paidReceivables.length === 1 ? '' : 'en'} eingegangen
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardContent className="p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                  <Landmark className="h-3.5 w-3.5" />
                  Offene Kredittilgung
                </p>
                <p className="text-2xl font-bold mt-1 tabular-nums text-rose-600 dark:text-rose-400">
                  {formatCurrency(openCreditRepaymentAmount)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {openPayables.length} Rechnung{openPayables.length === 1 ? '' : 'en'} offen ({formatCurrency(openPayablesAmount)})
                  {' '}+ Kreditrate {formatCurrency(monthlyLoanRate)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Restschuld {formatCurrency(remainingLoanDebt)}
                  {nextLoanDueDate ? ` · Nächste Rate ${format(new Date(`${nextLoanDueDate}T00:00:00`), 'dd.MM.yyyy')}` : ''}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            <Card className="border-border/60">
              <CardContent className="p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Gesamtumsatz</p>
                <p className="text-2xl font-bold mt-1 tabular-nums">{formatCurrency(umsatzBrutto)}</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">Ausgangsrechnungen (Brutto)</p>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Gesamtkosten</p>
                <p className="text-2xl font-bold mt-1 tabular-nums">{formatCurrency(kostenBrutto)}</p>
                <p className="text-xs text-muted-foreground mt-1">Eingangsrechnungen (Brutto)</p>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Rohertrag</p>
                <p className="text-2xl font-bold mt-1 tabular-nums text-emerald-600 dark:text-emerald-400">{formatCurrency(rohertrag)}</p>
                <p className="text-xs text-muted-foreground mt-1">{rohertragQuote.toFixed(1)}% Marge</p>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">USt-Zahllast</p>
                <p className="text-2xl font-bold mt-1 tabular-nums">{formatCurrency(ustZahllast)}</p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Fällig: {dueDate}</p>
              </CardContent>
            </Card>
          </div>

          {overdueDocuments.length > 0 && (
            <div className="rounded-lg border border-amber-200 dark:border-amber-900/40 bg-amber-50/60 dark:bg-amber-950/20 p-3">
              <p className="text-sm text-amber-800 dark:text-amber-300 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>
                  <strong>{overdueDocuments.length} Rechnung{overdueDocuments.length > 1 ? 'en' : ''} überfällig</strong>
                  {' '}— {overdueDocuments[0].partnerName}, {formatCurrency(overdueDocuments[0].grossAmount)}
                </span>
              </p>
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
            <Card className="border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  Umsatzentwicklung (6 Monate)
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      tickFormatter={(value) => `${Math.round(value / 1000)}k`}
                    />
                    <RechartsTooltip
                      formatter={(value) => formatCurrency(Number(value ?? 0))}
                      labelFormatter={(value) => `Monat: ${String(value ?? '')}`}
                    />
                    <Legend />
                    <Bar dataKey="Eingang" fill="#2563eb" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Ausgang" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Schnellaktionen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5">
                <Button
                  className="w-full justify-start bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white"
                  onClick={() => setScanDialogOpen(true)}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Rechnung scannen
                </Button>
                <Button className="w-full justify-start" variant="secondary" onClick={() => setActiveTab('steuerberater')}>
                  <Download className="h-4 w-4 mr-2" />
                  Exportpaket erstellen
                </Button>
                <Button className="w-full justify-start" variant="outline" asChild>
                  <a href={`mailto:steuerberater@wackenhut.demo?subject=Buchhaltung%20${activeMonth}&body=Guten%20Tag,%20im%20Anhang%20finden%20Sie%20das%20Buchhaltungs-Exportpaket%20f%C3%BCr%20${activeMonth}.`}>
                    <Mail className="h-4 w-4 mr-2" />
                    An Steuerberater
                  </a>
                </Button>
                <div className="pt-2 border-t border-border/40 space-y-1 text-sm">
                  <p>
                    <span className="font-medium">{offeneDocuments}</span> offen
                    {' '}· <span className="font-medium">{formatCurrency(openReceivablesAmount + openPayablesAmount)}</span>
                  </p>
                  <p>
                    <span className="font-medium">{overdueDocuments.length}</span> überfällig
                    {' '}· <span className="font-medium">{formatCurrency(overdueDocuments.reduce((sum, document) => sum + document.grossAmount, 0))}</span>
                  </p>
                  <p>
                    <span className="font-medium">{pendingFreigabe}</span> freizugeben
                    {' '}· <span className="font-medium">{formatCurrency(monthDocuments.filter((document) => document.status === 'freigabe_noetig').reduce((sum, document) => sum + document.grossAmount, 0))}</span>
                  </p>
                  <p>
                    <span className="font-medium">Kredittilgung</span>
                    {' '}· <span className="font-medium">{formatCurrency(openCreditRepaymentAmount)}</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="eingang" className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <div className="relative md:col-span-2">
              <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={incomingSearch}
                onChange={(event) => setIncomingSearch(event.target.value)}
                className="pl-9"
                placeholder="Suche Lieferant, Belegnr., Fahrzeug…"
              />
            </div>
            <Select value={incomingPaymentFilter} onValueChange={(value) => setIncomingPaymentFilter(value as typeof incomingPaymentFilter)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {paymentFilterOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={incomingTaxFilter} onValueChange={(value) => setIncomingTaxFilter(value as typeof incomingTaxFilter)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {taxFilterOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={incomingWorkflowFilter} onValueChange={(value) => setIncomingWorkflowFilter(value as typeof incomingWorkflowFilter)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {workflowFilterOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
            <DocumentInboxTable
              documents={filteredIncoming}
              selectedDocumentId={effectiveIncomingSelectedId}
              onSelectDocument={setIncomingSelectedId}
              onMarkPaid={(documentId) => updatePaymentStatus(documentId, 'bezahlt')}
            />
            <DocumentReviewPanel
              document={selectedIncoming}
              onStatusChange={(status) => (
                selectedIncoming ? updateDocumentStatus(selectedIncoming.id, status) : false
              )}
              onFlagResolved={(flagId, resolved) => {
                if (!selectedIncoming) return
                setFlagResolved(selectedIncoming.id, flagId, resolved)
              }}
            />
          </div>
        </TabsContent>

        <TabsContent value="ausgang" className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <div className="relative md:col-span-2">
              <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={outgoingSearch}
                onChange={(event) => setOutgoingSearch(event.target.value)}
                className="pl-9"
                placeholder="Suche Kunde, Belegnr., Fahrzeug…"
              />
            </div>
            <Select value={outgoingPaymentFilter} onValueChange={(value) => setOutgoingPaymentFilter(value as typeof outgoingPaymentFilter)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {paymentFilterOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={outgoingTaxFilter} onValueChange={(value) => setOutgoingTaxFilter(value as typeof outgoingTaxFilter)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {taxFilterOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={outgoingWorkflowFilter} onValueChange={(value) => setOutgoingWorkflowFilter(value as typeof outgoingWorkflowFilter)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {workflowFilterOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
            <DocumentInboxTable
              documents={filteredOutgoing}
              selectedDocumentId={effectiveOutgoingSelectedId}
              onSelectDocument={setOutgoingSelectedId}
              marginByDocumentId={outgoingMarginByDocumentId}
              onMarkPaid={(documentId) => updatePaymentStatus(documentId, 'bezahlt')}
            />
            <DocumentReviewPanel
              document={selectedOutgoing}
              onStatusChange={(status) => (
                selectedOutgoing ? updateDocumentStatus(selectedOutgoing.id, status) : false
              )}
              onFlagResolved={(flagId, resolved) => {
                if (!selectedOutgoing) return
                setFlagResolved(selectedOutgoing.id, flagId, resolved)
              }}
            />
          </div>
        </TabsContent>

        <TabsContent value="steuerberater">
          <div className="rounded-xl border border-border/60 p-4 mb-4">
            <h3 className="text-base font-semibold">Steuerliche Zusammenfassung ({activeMonth})</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-3 text-sm">
              <div className="rounded-md bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Ausgangs-USt (Regel)</p>
                <p className="font-semibold mt-1">{formatCurrency(outgoingUstRegel)}</p>
              </div>
              <div className="rounded-md bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Ausgangs-USt (§25a Marge)</p>
                <p className="font-semibold mt-1">{formatCurrency(outgoingUstDiff)}</p>
              </div>
              <div className="rounded-md bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Vorsteuer (Eingang)</p>
                <p className="font-semibold mt-1">−{formatCurrency(vorsteuer)}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 mt-4 pt-3 border-t border-border/40">
              <p className="text-sm text-muted-foreground">Formel: Ausgangs-USt − Vorsteuer</p>
              <Badge variant={ustZahllast >= 0 ? 'secondary' : 'outline'} className={ustZahllast >= 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300' : 'text-emerald-700 border-emerald-300 dark:text-emerald-300 dark:border-emerald-800'}>
                USt-Zahllast: {formatCurrency(ustZahllast)}
              </Badge>
            </div>
          </div>

          <AdvisorExportPanel
            month={activeMonth}
            documents={documents}
            vehicleCases={vehicleCases}
            exportBatches={exportBatches}
            onFinalizeExport={finalizeExport}
          />
        </TabsContent>
      </Tabs>

      <AIInvoiceScanDialog
        open={scanDialogOpen}
        onOpenChange={setScanDialogOpen}
        month={activeMonth}
        vehicles={vehicles}
        onSave={(payload) => {
          const newId = addScannedIncomingInvoice(payload)
          setIncomingSelectedId(newId)
          setActiveTab('eingang')
        }}
      />
    </div>
  )
}

export default function BuchhaltungPage() {
  return (
    <Suspense fallback={<div className="space-y-4" />}>
      <BuchhaltungPageContent />
    </Suspense>
  )
}
