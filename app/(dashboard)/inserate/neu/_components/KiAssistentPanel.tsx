'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover'
import { priceCategoryConfig } from '@/lib/constants'
import { mercedesListingCreationAiMock as MOCK_AI } from '@/lib/mercedes-inventory'
import {
  qualityFactors,
  QUALITY_BASE_SCORE,
  QUALITY_TARGET_SCORE,
  type QualityFactor,
} from '@/lib/inserate-ki-mock'
import { formatCurrency } from '@/lib/utils'
import {
  Sparkles, RefreshCw, Check, Loader2,
  ExternalLink, CheckCircle2,
  ShieldCheck, AlertTriangle, Info, XCircle,
  Heading, FileText, Images, ListChecks, Gauge, Tag,
  Lock, Plus, SlidersHorizontal, Pencil, Trash2, ArrowUpRight,
} from 'lucide-react'

// ─── Platform Brand Icons ────────────────────────────────────────────────────

const MobileDeIcon = ({ size = 40 }: { size?: number }) => (
  <div
    className="rounded-2xl flex items-center justify-center shrink-0"
    style={{ width: size, height: size, background: '#FF6600' }}
  >
    <svg viewBox="0 0 24 24" style={{ width: size * 0.58, height: size * 0.58 }} fill="white">
      <path d="M18.92 6.01L15 2H9L5.08 6.01C4.4 6.73 4 7.7 4 8.75V19c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8.75c0-1.05-.4-2.02-1.08-2.74zM12 17.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 12.5 12 12.5s2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5zM9.5 7l1.5-3h2l1.5 3h-5z" />
    </svg>
  </div>
)

const AutoScout24Icon = ({ size = 40 }: { size?: number }) => (
  <div
    className="rounded-2xl flex items-center justify-center shrink-0"
    style={{ width: size, height: size, background: '#003F87' }}
  >
    <svg viewBox="0 0 24 24" style={{ width: size * 0.58, height: size * 0.58 }} fill="none">
      <circle cx="10.5" cy="10" r="6" stroke="white" strokeWidth="2" />
      <line x1="15" y1="14.5" x2="21" y2="20.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M7.5 10.5h6M8.5 8.5l.9-1.5h2.2l.9 1.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9.2" cy="11.8" r="0.9" fill="white" />
      <circle cx="12.8" cy="11.8" r="0.9" fill="white" />
    </svg>
  </div>
)

const TruckScout24Icon = ({ size = 40 }: { size?: number }) => (
  <div
    className="rounded-2xl flex items-center justify-center shrink-0"
    style={{ width: size, height: size, background: '#009C3B' }}
  >
    <svg viewBox="0 0 24 24" style={{ width: size * 0.58, height: size * 0.58 }} fill="white">
      <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9 1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
    </svg>
  </div>
)

const EXPORT_PLATFORMS = [
  {
    id: 'mobile_de', name: 'mobile.de', description: 'Größter deutscher Automarkt',
    icon: <MobileDeIcon size={44} />,
    borderColor: 'border-orange-200 dark:border-orange-800', bgColor: 'bg-orange-50 dark:bg-orange-950/30',
    btnStyle: { background: '#FF6600' } as React.CSSProperties, btnHoverClass: 'hover:opacity-90',
  },
  {
    id: 'autoscout24', name: 'AutoScout24', description: 'Europäisches Automarktportal',
    icon: <AutoScout24Icon size={44} />,
    borderColor: 'border-blue-200 dark:border-blue-900', bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    btnStyle: { background: '#003F87' } as React.CSSProperties, btnHoverClass: 'hover:opacity-90',
  },
  {
    id: 'truckscout24', name: 'TruckScout24', description: 'Nutzfahrzeuge & Transporter',
    icon: <TruckScout24Icon size={44} />,
    borderColor: 'border-emerald-200 dark:border-emerald-800', bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    btnStyle: { background: '#009C3B' } as React.CSSProperties, btnHoverClass: 'hover:opacity-90',
  },
]

// ─── Quality factor category styling ───────────────────────────────────────────

const categoryMeta: Record<string, { icon: React.ElementType; color: string }> = {
  Titel: { icon: Heading, color: 'text-sky-600 dark:text-sky-400' },
  Beschreibung: { icon: FileText, color: 'text-violet-600 dark:text-violet-400' },
  Fotos: { icon: Images, color: 'text-fuchsia-600 dark:text-fuchsia-400' },
  Ausstattung: { icon: ListChecks, color: 'text-emerald-600 dark:text-emerald-400' },
  Fahrzeugdaten: { icon: Gauge, color: 'text-amber-600 dark:text-amber-400' },
  Preis: { icon: Tag, color: 'text-rose-600 dark:text-rose-400' },
}

// ─── Types ────────────────────────────────────────────────────────────────────

type ExportStatus = 'idle' | 'exporting' | 'done'
interface FactorSel { selected: boolean; value?: string }
interface CustomAction { id: string; label: string; points: number; selected: boolean }

// ─── Component ────────────────────────────────────────────────────────────────

export function KiAssistentPanel() {
  // Inserat-Qualität
  const [kycScore, setKycScore] = useState<number>(QUALITY_BASE_SCORE)
  const [improvingKyc, setImprovingKyc] = useState(false)
  const [kycImproved, setKycImproved] = useState(false)
  const [appliedCount, setAppliedCount] = useState(0)
  const [optimizerOpen, setOptimizerOpen] = useState(false)

  // Optimizer selections (auto-applicable factors pre-selected; price needs a decision)
  const [factorSel, setFactorSel] = useState<Record<string, FactorSel>>(() =>
    Object.fromEntries(
      qualityFactors.map((f) => [f.id, { selected: f.autoApplicable, value: f.editableValue }]),
    ),
  )
  const [customActions, setCustomActions] = useState<CustomAction[]>([])
  const [customLabel, setCustomLabel] = useState('')
  const [customPoints, setCustomPoints] = useState(2)
  const [customSeq, setCustomSeq] = useState(0)

  // Plausibility check
  const [plausibilityRunning, setPlausibilityRunning] = useState(false)
  const [plausibilityProgress, setPlausibilityProgress] = useState(0)
  const [plausibilityDone, setPlausibilityDone] = useState(false)

  // Export
  const [inseratCreated, setInseratCreated] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [exportStatus, setExportStatus] = useState<Record<string, ExportStatus>>({
    mobile_de: 'idle', autoscout24: 'idle', truckscout24: 'idle',
  })

  // ─── Derived ──────────────────────────────────────────────────────────────
  const selectedPoints = useMemo(() => {
    const factorPts = qualityFactors
      .filter((f) => factorSel[f.id]?.selected)
      .reduce((s, f) => s + f.points, 0)
    const customPts = customActions.filter((c) => c.selected).reduce((s, c) => s + c.points, 0)
    return factorPts + customPts
  }, [factorSel, customActions])

  const selectedCount = useMemo(
    () =>
      qualityFactors.filter((f) => factorSel[f.id]?.selected).length +
      customActions.filter((c) => c.selected).length,
    [factorSel, customActions],
  )

  const projectedScore = Math.min(100, QUALITY_BASE_SCORE + selectedPoints)

  // Top open potentials for the compact preview (highest impact first).
  const topPotentials = useMemo(
    () => [...qualityFactors].sort((a, b) => b.points - a.points).slice(0, 3),
    [],
  )

  // ─── Handlers ───────────────────────────────────────────────────────────────
  const toggleFactor = (id: string) =>
    setFactorSel((prev) => ({ ...prev, [id]: { ...prev[id], selected: !prev[id]?.selected } }))

  const setFactorValue = (id: string, value: string) =>
    setFactorSel((prev) => ({ ...prev, [id]: { ...prev[id], value } }))

  const addCustomAction = () => {
    const label = customLabel.trim()
    if (!label) return
    setCustomActions((prev) => [
      ...prev,
      { id: `custom-${customSeq}`, label, points: customPoints, selected: true },
    ])
    setCustomSeq((s) => s + 1)
    setCustomLabel('')
    setCustomPoints(2)
  }

  const toggleCustom = (id: string) =>
    setCustomActions((prev) => prev.map((c) => (c.id === id ? { ...c, selected: !c.selected } : c)))

  const removeCustom = (id: string) =>
    setCustomActions((prev) => prev.filter((c) => c.id !== id))

  const resetOptimizer = () => {
    setFactorSel(
      Object.fromEntries(
        qualityFactors.map((f) => [f.id, { selected: f.autoApplicable, value: f.editableValue }]),
      ),
    )
    setCustomActions([])
  }

  const applyOptimization = () => {
    const target = projectedScore
    const applied = selectedCount
    setOptimizerOpen(false)
    setImprovingKyc(true)
    setTimeout(() => {
      setImprovingKyc(false)
      setKycScore(target)
      setKycImproved(true)
      setAppliedCount(applied)
    }, 1200)
  }

  const handleRunPlausibility = () => {
    setPlausibilityRunning(true)
    setPlausibilityDone(false)
    setPlausibilityProgress(0)
    const steps = [18, 38, 56, 74, 88, 100]
    steps.forEach((value, i) => {
      setTimeout(() => setPlausibilityProgress(value), 350 * (i + 1))
    })
    setTimeout(() => {
      setPlausibilityRunning(false)
      setPlausibilityDone(true)
    }, 350 * steps.length + 250)
  }

  const handleCreateInserat = () => {
    setInseratCreated(true)
    setShowExport(true)
  }

  const handleExport = (platformId: string) => {
    setExportStatus((prev) => ({ ...prev, [platformId]: 'exporting' }))
    setTimeout(() => {
      setExportStatus((prev) => ({ ...prev, [platformId]: 'done' }))
    }, 2200)
  }

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <Card className="border-primary/20 bg-primary/[0.025]">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            KI-Assistent
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* ─── Inserat-Qualität (completeness & attractiveness) ─────────── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                Inserat-Qualität
                <Popover>
                  <PopoverTrigger asChild>
                    <button type="button" aria-label="Unterschied zur Plausibilitätsprüfung" className="text-muted-foreground/60 hover:text-foreground">
                      <Info className="h-3 w-3" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-72">
                    <p className="text-sm font-semibold">Qualität vs. Plausibilität</p>
                    <div className="mt-2 space-y-2 text-xs leading-relaxed">
                      <p>
                        <span className="font-medium text-primary">Inserat-Qualität</span> misst
                        {' '}<span className="font-medium">Vollständigkeit &amp; Attraktivität</span> – wie gut Ihr
                        Inserat gefunden und angeklickt wird (Titel, Text, Fotos, Ausstattung, Preis-Sichtbarkeit).
                      </p>
                      <p>
                        <span className="font-medium">Plausibilitätsprüfung</span> misst
                        {' '}<span className="font-medium">Korrektheit &amp; Konsistenz</span> – ob Ihre Angaben
                        glaubwürdig und widerspruchsfrei zu Bildern und Marktdaten sind.
                      </p>
                    </div>
                  </PopoverContent>
                </Popover>
              </Label>
              <span className={`text-sm font-bold tabular-nums ${
                kycScore >= 90 ? 'text-emerald-600' : kycScore >= 70 ? 'text-amber-600' : 'text-red-500'
              }`}>
                {kycScore}%
              </span>
            </div>
            <Progress value={kycScore} className="h-1.5" />
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>{kycScore >= 90 ? 'Ausgezeichnet' : kycScore >= 70 ? 'Gut' : 'Verbesserungspotential'}</span>
              {!kycImproved
                ? <span className="text-primary">{QUALITY_TARGET_SCORE}% möglich</span>
                : <span className="text-emerald-600 dark:text-emerald-400">{appliedCount} Maßnahmen angewendet</span>}
            </div>

            {/* Why 78 %? — compact preview of the biggest potentials */}
            {!kycImproved && !improvingKyc && (
              <div className="rounded-lg border border-dashed border-border/70 bg-card/60 p-2 space-y-1">
                <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                  Größte Potenziale
                </p>
                {topPotentials.map((f) => {
                  const meta = categoryMeta[f.category] ?? { icon: Info, color: 'text-muted-foreground' }
                  return (
                    <div key={f.id} className="flex items-center gap-1.5 text-[11px]">
                      <meta.icon className={`h-3 w-3 shrink-0 ${meta.color}`} />
                      <span className="min-w-0 flex-1 truncate text-foreground/80">{f.label}</span>
                      <span className="shrink-0 font-semibold text-primary tabular-nums">+{f.points}%</span>
                    </div>
                  )
                })}
              </div>
            )}

            <Button
              size="sm"
              variant="outline"
              className={`h-7 w-full text-xs ${
                kycImproved ? 'border-emerald-300 text-emerald-600 dark:border-emerald-800' : 'border-primary/30 text-primary'
              }`}
              onClick={() => setOptimizerOpen(true)}
              disabled={improvingKyc || inseratCreated}
            >
              {improvingKyc
                ? <><Loader2 className="mr-1 h-3 w-3 animate-spin" />Optimiere…</>
                : kycImproved
                ? <><SlidersHorizontal className="mr-1 h-3 w-3" />Optimierung anpassen</>
                : <><Sparkles className="mr-1 h-3 w-3" />KI-Qualität verbessern</>}
            </Button>
          </div>

          <Separator />

          {/* ─── Plausibilitätsprüfung (correctness & consistency) ───────── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Plausibilitätsprüfung
              </Label>
              {plausibilityDone && (
                <span className={`text-sm font-bold tabular-nums ${
                  MOCK_AI.plausibilityCheck.score >= 90 ? 'text-emerald-600'
                    : MOCK_AI.plausibilityCheck.score >= 70 ? 'text-amber-600' : 'text-red-500'
                }`}>
                  {MOCK_AI.plausibilityCheck.score}/100
                </span>
              )}
            </div>

            {!plausibilityDone && !plausibilityRunning && (
              <p className="text-[10px] leading-relaxed text-muted-foreground">
                Prüft <span className="font-medium text-foreground/80">Korrektheit &amp; Konsistenz</span>: Abgleich von
                Bildern, Fahrzeugdaten und Marktdaten – erkennt Schäden, Widersprüche und unplausible Angaben.
              </p>
            )}

            {plausibilityRunning && (
              <div className="space-y-1.5 animate-in fade-in">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>
                    {plausibilityProgress < 25 ? 'Bilder werden analysiert…'
                      : plausibilityProgress < 50 ? 'Schadensprüfung läuft…'
                      : plausibilityProgress < 75 ? 'Fahrzeugdaten werden abgeglichen…'
                      : plausibilityProgress < 100 ? 'Marktdaten werden geprüft…'
                      : 'Auswertung abgeschlossen'}
                  </span>
                </div>
                <Progress value={plausibilityProgress} className="h-1" />
              </div>
            )}

            {plausibilityDone && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                <Progress value={MOCK_AI.plausibilityCheck.score} className="h-1.5" />
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  {MOCK_AI.plausibilityCheck.summary}
                </p>
                <div className="max-h-56 divide-y divide-border/60 overflow-y-auto rounded-lg border bg-card">
                  {MOCK_AI.plausibilityCheck.checks.map((check) => {
                    const cfg = {
                      pass:    { Icon: CheckCircle2,  color: 'text-emerald-600 dark:text-emerald-400' },
                      warning: { Icon: AlertTriangle, color: 'text-amber-600 dark:text-amber-400' },
                      fail:    { Icon: XCircle,       color: 'text-red-500 dark:text-red-400' },
                      info:    { Icon: Info,          color: 'text-sky-600 dark:text-sky-400' },
                    }[check.status]
                    return (
                      <div key={check.id} className="flex items-start gap-2 p-2">
                        <cfg.Icon className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${cfg.color}`} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate text-xs font-medium">{check.label}</span>
                            <span className="shrink-0 text-[9px] uppercase tracking-wider text-muted-foreground">
                              {check.category}
                            </span>
                          </div>
                          <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{check.detail}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <Button
              size="sm"
              variant="outline"
              className={`h-7 w-full text-xs ${
                plausibilityDone ? 'border-emerald-300 text-emerald-600 dark:border-emerald-800' : 'border-primary/30 text-primary'
              }`}
              onClick={handleRunPlausibility}
              disabled={plausibilityRunning || inseratCreated}
            >
              {plausibilityRunning
                ? <><Loader2 className="mr-1 h-3 w-3 animate-spin" />Prüfe…</>
                : plausibilityDone
                ? <><RefreshCw className="mr-1 h-3 w-3" />Erneut prüfen</>
                : <><ShieldCheck className="mr-1 h-3 w-3" />Plausibilitätsprüfung starten</>}
            </Button>
          </div>

          <Separator />

          {/* Price Analysis */}
          <div className="space-y-2">
            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Preisanalyse</Label>
            <div className="space-y-2 rounded-lg border bg-card p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Ihr Preis</span>
                <span className="text-sm font-bold">{formatCurrency(MOCK_AI.priceAnalysis.suggestion)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Marktpreis (Ø)</span>
                <span className="text-xs">{formatCurrency(MOCK_AI.priceAnalysis.marketPrice)}</span>
              </div>
              <Badge
                variant="outline"
                className={`${priceCategoryConfig[MOCK_AI.priceAnalysis.category].bg} ${priceCategoryConfig[MOCK_AI.priceAnalysis.category].color} border-0 text-xs`}
              >
                {priceCategoryConfig[MOCK_AI.priceAnalysis.category].label}
              </Badge>
              <div className="space-y-1 pt-0.5">
                {MOCK_AI.priceAnalysis.thresholds.map((t, i) => (
                  <div key={i} className="flex justify-between text-[10px] text-muted-foreground">
                    <span>{t.label}</span>
                    <span>bis {formatCurrency(t.max)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Separator />

          {/* Create / Export */}
          {!inseratCreated ? (
            <Button className="w-full" onClick={handleCreateInserat}>
              <Check className="mr-2 h-4 w-4" />
              Inserat erstellen
            </Button>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 dark:border-emerald-800 dark:bg-emerald-950/30">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Inserat erstellt!</span>
              </div>
              <Button variant="outline" className="w-full" onClick={() => setShowExport(true)}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Auf Plattformen exportieren
              </Button>
            </div>
          )}

        </CardContent>
      </Card>

      {/* ─── Quality Optimizer Dialog ───────────────────────────────────────── */}
      <QualityOptimizerDialog
        open={optimizerOpen}
        onOpenChange={setOptimizerOpen}
        factorSel={factorSel}
        customActions={customActions}
        selectedPoints={selectedPoints}
        selectedCount={selectedCount}
        projectedScore={projectedScore}
        customLabel={customLabel}
        customPoints={customPoints}
        onToggleFactor={toggleFactor}
        onSetFactorValue={setFactorValue}
        onToggleCustom={toggleCustom}
        onRemoveCustom={removeCustom}
        onCustomLabelChange={setCustomLabel}
        onCustomPointsChange={setCustomPoints}
        onAddCustom={addCustomAction}
        onReset={resetOptimizer}
        onApply={applyOptimization}
      />

      {/* ─── Export Dialog ──────────────────────────────────────────────────── */}
      <Dialog open={showExport} onOpenChange={setShowExport}>
        <DialogContent className="max-w-[calc(100vw-1rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5 text-primary" />
              Inserat exportieren
            </DialogTitle>
          </DialogHeader>
          <p className="-mt-1 text-sm text-muted-foreground">
            Veröffentlichen Sie das Inserat auf Ihren Wunschplattformen.
          </p>
          <div className="mt-1 space-y-3">
            {EXPORT_PLATFORMS.map((platform) => {
              const status = exportStatus[platform.id]
              return (
                <div
                  key={platform.id}
                  className={`flex items-center gap-3 rounded-xl border p-3.5 ${platform.bgColor} ${platform.borderColor}`}
                >
                  {platform.icon}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">{platform.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{platform.description}</p>
                  </div>
                  <Button
                    size="sm"
                    style={status === 'idle' || status === 'exporting' ? platform.btnStyle : undefined}
                    className={`shrink-0 border-0 text-white ${platform.btnHoverClass} ${status === 'done' ? 'bg-emerald-600 hover:bg-emerald-600' : ''}`}
                    onClick={() => status === 'idle' && handleExport(platform.id)}
                    disabled={status === 'exporting' || status === 'done'}
                  >
                    {status === 'exporting'
                      ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Exportiere</>
                      : status === 'done'
                      ? <><CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />Live</>
                      : <><ExternalLink className="mr-1.5 h-3.5 w-3.5" />Exportieren</>}
                  </Button>
                </div>
              )
            })}
          </div>
          {Object.values(exportStatus).some((s) => s === 'done') && (
            <div className="mt-1 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              {Object.values(exportStatus).filter((s) => s === 'done').length} von {EXPORT_PLATFORMS.length} Plattformen erfolgreich exportiert
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

// ─── Quality Optimizer Dialog ──────────────────────────────────────────────────

function QualityOptimizerDialog({
  open, onOpenChange,
  factorSel, customActions,
  selectedPoints, selectedCount, projectedScore,
  customLabel, customPoints,
  onToggleFactor, onSetFactorValue,
  onToggleCustom, onRemoveCustom,
  onCustomLabelChange, onCustomPointsChange, onAddCustom,
  onReset, onApply,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  factorSel: Record<string, FactorSel>
  customActions: CustomAction[]
  selectedPoints: number
  selectedCount: number
  projectedScore: number
  customLabel: string
  customPoints: number
  onToggleFactor: (id: string) => void
  onSetFactorValue: (id: string, v: string) => void
  onToggleCustom: (id: string) => void
  onRemoveCustom: (id: string) => void
  onCustomLabelChange: (v: string) => void
  onCustomPointsChange: (v: number) => void
  onAddCustom: () => void
  onReset: () => void
  onApply: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-1rem)] sm:max-w-lg max-h-[92vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Inserat-Qualität optimieren
          </DialogTitle>
          <DialogDescription>
            Diese Maßnahmen heben die Qualität von {QUALITY_BASE_SCORE}% auf bis zu {QUALITY_TARGET_SCORE}%. Wählen
            Sie ab, bearbeiten oder ergänzen Sie, was die KI tun soll – Sie behalten die Kontrolle.
          </DialogDescription>
        </DialogHeader>

        {/* Live projection */}
        <div className="flex items-center gap-3 rounded-lg border bg-muted/40 px-3 py-2">
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold tabular-nums text-muted-foreground">{QUALITY_BASE_SCORE}%</span>
            <ArrowUpRight className="h-4 w-4 text-primary" />
            <span className="text-2xl font-bold tabular-nums text-primary">{projectedScore}%</span>
          </div>
          <div className="ml-auto text-right">
            <p className="text-xs font-medium">{selectedCount} Maßnahmen ausgewählt</p>
            <p className="text-[11px] text-muted-foreground">+{selectedPoints}% Qualität</p>
          </div>
        </div>

        {/* Factor list */}
        <div className="-mx-1 flex-1 space-y-2 overflow-y-auto px-1 py-1">
          {qualityFactors.map((f) => (
            <FactorRow
              key={f.id}
              factor={f}
              sel={factorSel[f.id]}
              onToggle={() => onToggleFactor(f.id)}
              onValueChange={(v) => onSetFactorValue(f.id, v)}
            />
          ))}

          {/* Custom actions */}
          {customActions.map((c) => (
            <div key={c.id} className="flex items-start gap-3 rounded-lg border border-primary/25 bg-primary/[0.03] p-3">
              <Checkbox checked={c.selected} onCheckedChange={() => onToggleCustom(c.id)} className="mt-0.5" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-medium uppercase tracking-widest text-primary">Eigene Maßnahme</span>
                  <Badge variant="secondary" className="shrink-0 text-[10px] font-semibold tabular-nums">+{c.points}%</Badge>
                </div>
                <p className="mt-0.5 text-sm font-medium">{c.label}</p>
              </div>
              <button
                type="button"
                onClick={() => onRemoveCustom(c.id)}
                aria-label="Maßnahme entfernen"
                className="mt-0.5 shrink-0 rounded p-0.5 text-muted-foreground/60 hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}

          {/* Add custom action */}
          <div className="rounded-lg border border-dashed border-border/70 p-3 space-y-2">
            <p className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              <Plus className="h-3 w-3" />
              Eigene Maßnahme hinzufügen
            </p>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Sie wissen etwas, das die KI nicht sieht? Ergänzen Sie eine eigene Optimierung.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={customLabel}
                onChange={(e) => onCustomLabelChange(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onAddCustom() } }}
                placeholder="z. B. Wintertreifen-Set im Preis erwähnen"
                className="h-8 flex-1 text-sm"
              />
              <div className="flex items-center gap-1 rounded-md border border-border px-2 h-8 text-xs">
                <span className="text-muted-foreground">+</span>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={customPoints}
                  onChange={(e) => onCustomPointsChange(Math.max(1, Math.min(10, Number(e.target.value) || 1)))}
                  className="w-8 bg-transparent text-center font-medium tabular-nums outline-none"
                  aria-label="Punkte"
                />
                <span className="text-muted-foreground">%</span>
              </div>
              <Button size="sm" variant="outline" className="h-8 shrink-0" onClick={onAddCustom} disabled={!customLabel.trim()}>
                <Plus className="mr-1 h-3.5 w-3.5" />
                Hinzufügen
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-row items-center justify-between gap-2 sm:justify-between">
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            <RefreshCw className="h-3 w-3" />
            Zurücksetzen
          </button>
          <Button onClick={onApply} disabled={selectedCount === 0}>
            <Sparkles className="mr-2 h-4 w-4" />
            Optimierung anwenden → {projectedScore}%
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── One optimizer factor row ───────────────────────────────────────────────────

function FactorRow({
  factor, sel, onToggle, onValueChange,
}: {
  factor: QualityFactor
  sel: FactorSel | undefined
  onToggle: () => void
  onValueChange: (v: string) => void
}) {
  const meta = categoryMeta[factor.category] ?? { icon: Info, color: 'text-muted-foreground' }
  const selected = sel?.selected ?? false
  const [editing, setEditing] = useState(false)

  return (
    <div className={`rounded-lg border p-3 transition-colors ${selected ? 'border-primary/30 bg-primary/[0.02]' : 'border-border bg-card'}`}>
      <div className="flex items-start gap-3">
        <Checkbox checked={selected} onCheckedChange={onToggle} className="mt-0.5" />
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className={`flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-widest ${meta.color}`}>
              <meta.icon className="h-3 w-3" />
              {factor.category}
            </span>
            <div className="flex shrink-0 items-center gap-1.5">
              {!factor.autoApplicable && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                  <Lock className="h-2.5 w-2.5" />
                  Ihre Freigabe
                </span>
              )}
              <Badge variant="secondary" className="text-[10px] font-semibold tabular-nums">+{factor.points}%</Badge>
            </div>
          </div>

          <p className="text-sm font-medium leading-snug">{factor.label}</p>
          <p className="text-[11px] leading-snug text-muted-foreground">{factor.gap}</p>

          <p className="flex items-start gap-1.5 text-[11px] leading-snug text-foreground/80">
            <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
            <span>{factor.aiAction}</span>
          </p>

          {/* Editable proposed value (e.g. optimized title) */}
          {factor.editableValue !== undefined && (
            <div className="pt-1">
              {editing ? (
                <div className="flex items-center gap-1.5">
                  <Input
                    value={sel?.value ?? ''}
                    onChange={(e) => onValueChange(e.target.value)}
                    className="h-7 text-xs"
                    autoFocus
                    onKeyDown={(e) => { if (e.key === 'Enter') setEditing(false) }}
                  />
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="inline-flex h-7 shrink-0 items-center rounded-md border border-border px-2 text-[11px] font-medium hover:border-primary/40 hover:text-primary"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="group flex w-full items-center gap-1.5 rounded-md border border-border/70 bg-muted/40 px-2 py-1 text-left text-[11px] transition-colors hover:border-primary/40"
                >
                  <span className="min-w-0 flex-1 truncate font-medium">{sel?.value}</span>
                  <Pencil className="h-3 w-3 shrink-0 text-muted-foreground group-hover:text-primary" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
