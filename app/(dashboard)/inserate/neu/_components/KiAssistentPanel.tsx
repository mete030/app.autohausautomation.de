'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { priceCategoryConfig } from '@/lib/constants'
import { mercedesListingCreationAiMock as MOCK_AI } from '@/lib/mercedes-inventory'
import { formatCurrency } from '@/lib/utils'
import {
  Sparkles, RefreshCw, Check, Loader2,
  ExternalLink, CheckCircle2,
  ShieldCheck, AlertTriangle, Info, XCircle,
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
    id: 'mobile_de',
    name: 'mobile.de',
    description: 'Größter deutscher Automarkt',
    icon: <MobileDeIcon size={44} />,
    borderColor: 'border-orange-200 dark:border-orange-800',
    bgColor: 'bg-orange-50 dark:bg-orange-950/30',
    btnStyle: { background: '#FF6600' } as React.CSSProperties,
    btnHoverClass: 'hover:opacity-90',
  },
  {
    id: 'autoscout24',
    name: 'AutoScout24',
    description: 'Europäisches Automarktportal',
    icon: <AutoScout24Icon size={44} />,
    borderColor: 'border-blue-200 dark:border-blue-900',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    btnStyle: { background: '#003F87' } as React.CSSProperties,
    btnHoverClass: 'hover:opacity-90',
  },
  {
    id: 'truckscout24',
    name: 'TruckScout24',
    description: 'Nutzfahrzeuge & Transporter',
    icon: <TruckScout24Icon size={44} />,
    borderColor: 'border-emerald-200 dark:border-emerald-800',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    btnStyle: { background: '#009C3B' } as React.CSSProperties,
    btnHoverClass: 'hover:opacity-90',
  },
]

// ─── Types ────────────────────────────────────────────────────────────────────

type ExportStatus = 'idle' | 'exporting' | 'done'

// ─── Component ────────────────────────────────────────────────────────────────

export function KiAssistentPanel() {
  // KYC
  const [kycScore, setKycScore] = useState<number>(MOCK_AI.kycScore)
  const [improvingKyc, setImprovingKyc] = useState(false)
  const [kycImproved, setKycImproved] = useState(false)

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

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleImproveKyc = () => {
    setImprovingKyc(true)
    setTimeout(() => {
      setImprovingKyc(false)
      setKycImproved(true)
      setKycScore(MOCK_AI.improvedKycScore)
    }, 1500)
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
    setExportStatus(prev => ({ ...prev, [platformId]: 'exporting' }))
    setTimeout(() => {
      setExportStatus(prev => ({ ...prev, [platformId]: 'done' }))
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

          {/* Inserat-Qualität (KYC) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] text-muted-foreground uppercase tracking-widest">
                Inserat-Qualität
              </Label>
              <span className={`text-sm font-bold tabular-nums ${
                kycScore >= 90 ? 'text-emerald-600' : kycScore >= 70 ? 'text-amber-600' : 'text-red-500'
              }`}>
                {kycScore}%
              </span>
            </div>
            <Progress value={kycScore} className="h-1.5" />
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>
                {kycScore >= 90 ? 'Ausgezeichnet' : kycScore >= 70 ? 'Gut' : 'Verbesserungspotential'}
              </span>
              {!kycImproved && (
                <span className="text-primary">{MOCK_AI.improvedKycScore}% möglich</span>
              )}
            </div>
            <Button
              size="sm"
              variant="outline"
              className={`w-full h-7 text-xs ${
                kycImproved
                  ? 'text-emerald-600 border-emerald-300 dark:border-emerald-800'
                  : 'text-primary border-primary/30'
              }`}
              onClick={handleImproveKyc}
              disabled={improvingKyc || kycImproved || inseratCreated}
            >
              {improvingKyc
                ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Optimiere...</>
                : kycImproved
                ? <><CheckCircle2 className="h-3 w-3 mr-1" />Qualität optimiert</>
                : <><Sparkles className="h-3 w-3 mr-1" />KI-Qualität verbessern</>
              }
            </Button>
          </div>

          <Separator />

          {/* Plausibilitätsprüfung */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] text-muted-foreground uppercase tracking-widest">
                Plausibilitätsprüfung
              </Label>
              {plausibilityDone && (
                <span className={`text-sm font-bold tabular-nums ${
                  MOCK_AI.plausibilityCheck.score >= 90 ? 'text-emerald-600'
                    : MOCK_AI.plausibilityCheck.score >= 70 ? 'text-amber-600'
                    : 'text-red-500'
                }`}>
                  {MOCK_AI.plausibilityCheck.score}/100
                </span>
              )}
            </div>

            {!plausibilityDone && !plausibilityRunning && (
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                KI-gestützter Abgleich von Bildern, Fahrzeugdaten und Marktdaten – erkennt Schäden, Inkonsistenzen und unplausible Angaben.
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
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {MOCK_AI.plausibilityCheck.summary}
                </p>

                <div className="rounded-lg border bg-card divide-y divide-border/60 max-h-56 overflow-y-auto">
                  {MOCK_AI.plausibilityCheck.checks.map(check => {
                    const cfg = {
                      pass:    { Icon: CheckCircle2,  color: 'text-emerald-600 dark:text-emerald-400' },
                      warning: { Icon: AlertTriangle, color: 'text-amber-600 dark:text-amber-400' },
                      fail:    { Icon: XCircle,       color: 'text-red-500 dark:text-red-400' },
                      info:    { Icon: Info,          color: 'text-sky-600 dark:text-sky-400' },
                    }[check.status]
                    return (
                      <div key={check.id} className="flex items-start gap-2 p-2">
                        <cfg.Icon className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${cfg.color}`} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-medium truncate">{check.label}</span>
                            <span className="text-[9px] text-muted-foreground uppercase tracking-wider shrink-0">
                              {check.category}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                            {check.detail}
                          </p>
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
              className={`w-full h-7 text-xs ${
                plausibilityDone
                  ? 'text-emerald-600 border-emerald-300 dark:border-emerald-800'
                  : 'text-primary border-primary/30'
              }`}
              onClick={handleRunPlausibility}
              disabled={plausibilityRunning || inseratCreated}
            >
              {plausibilityRunning
                ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Prüfe...</>
                : plausibilityDone
                ? <><RefreshCw className="h-3 w-3 mr-1" />Erneut prüfen</>
                : <><ShieldCheck className="h-3 w-3 mr-1" />Plausibilitätsprüfung starten</>
              }
            </Button>
          </div>

          <Separator />

          {/* Price Analysis */}
          <div className="space-y-2">
            <Label className="text-[10px] text-muted-foreground uppercase tracking-widest">
              Preisanalyse
            </Label>
            <div className="p-3 bg-card rounded-lg border space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Ihr Preis</span>
                <span className="text-sm font-bold">{formatCurrency(MOCK_AI.priceAnalysis.suggestion)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Marktpreis (Ø)</span>
                <span className="text-xs">{formatCurrency(MOCK_AI.priceAnalysis.marketPrice)}</span>
              </div>
              <Badge
                variant="outline"
                className={`${priceCategoryConfig[MOCK_AI.priceAnalysis.category].bg} ${priceCategoryConfig[MOCK_AI.priceAnalysis.category].color} border-0 text-xs`}
              >
                {priceCategoryConfig[MOCK_AI.priceAnalysis.category].label}
              </Badge>
              <div className="pt-0.5 space-y-1">
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
              <Check className="h-4 w-4 mr-2" />
              Inserat erstellen
            </Button>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-2.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">
                  Inserat erstellt!
                </span>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowExport(true)}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Auf Plattformen exportieren
              </Button>
            </div>
          )}

        </CardContent>
      </Card>

      {/* ─── Export Dialog ──────────────────────────────────────────────────── */}
      <Dialog open={showExport} onOpenChange={setShowExport}>
        <DialogContent className="max-w-[calc(100vw-1rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5 text-primary" />
              Inserat exportieren
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground -mt-1">
            Veröffentlichen Sie das Inserat auf Ihren Wunschplattformen.
          </p>
          <div className="space-y-3 mt-1">
            {EXPORT_PLATFORMS.map(platform => {
              const status = exportStatus[platform.id]
              return (
                <div
                  key={platform.id}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border ${platform.bgColor} ${platform.borderColor}`}
                >
                  {platform.icon}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground">{platform.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{platform.description}</p>
                  </div>
                  <Button
                    size="sm"
                    style={status === 'idle' || status === 'exporting' ? platform.btnStyle : undefined}
                    className={`text-white border-0 shrink-0 ${platform.btnHoverClass} ${
                      status === 'done' ? 'bg-emerald-600 hover:bg-emerald-600' : ''
                    }`}
                    onClick={() => status === 'idle' && handleExport(platform.id)}
                    disabled={status === 'exporting' || status === 'done'}
                  >
                    {status === 'exporting'
                      ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Exportiere</>
                      : status === 'done'
                      ? <><CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />Live</>
                      : <><ExternalLink className="h-3.5 w-3.5 mr-1.5" />Exportieren</>
                    }
                  </Button>
                </div>
              )
            })}
          </div>

          {Object.values(exportStatus).some(s => s === 'done') && (
            <div className="mt-1 p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              {Object.values(exportStatus).filter(s => s === 'done').length} von {EXPORT_PLATFORMS.length} Plattformen erfolgreich exportiert
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
