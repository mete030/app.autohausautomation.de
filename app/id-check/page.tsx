'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  ShieldCheck, CheckCircle, Loader2, Upload, Camera,
  CreditCard, User, AlertCircle, ArrowRight, Lock,
} from 'lucide-react'

type IdCheckStep = 'welcome' | 'document' | 'selfie' | 'processing' | 'done'
type CheckItemStatus = 'pending' | 'loading' | 'done'

interface CheckItem { id: string; label: string; status: CheckItemStatus }

const PROCESSING_ITEMS: CheckItem[] = [
  { id: 'c1', label: 'Dokumenten-Scan wird analysiert', status: 'pending' },
  { id: 'c2', label: 'Sicherheitsmerkmale werden geprüft', status: 'pending' },
  { id: 'c3', label: 'Biometrischer Abgleich läuft', status: 'pending' },
  { id: 'c4', label: 'Altersverifikation', status: 'pending' },
]

function StepDots({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2 justify-center mb-6">
      {[1, 2, 3].map(n => (
        <div key={n} className={`rounded-full transition-all duration-300 ${
          n < current ? 'h-2 w-2 bg-emerald-500' : n === current ? 'h-2 w-5 bg-primary' : 'h-2 w-2 bg-muted-foreground/30'
        }`} />
      ))}
    </div>
  )
}

export default function IdCheckPage() {
  const [step, setStep] = useState<IdCheckStep>('welcome')
  const [docUploaded, setDocUploaded] = useState(false)
  const [selfieUploaded, setSelfieUploaded] = useState(false)
  const [checks, setChecks] = useState<CheckItem[]>(PROCESSING_ITEMS)

  const startProcessing = () => {
    setStep('processing')
    let delay = 400
    PROCESSING_ITEMS.forEach((_, index) => {
      setTimeout(() => {
        setChecks(prev => prev.map((c, i) => i === index ? { ...c, status: 'loading' } : c))
      }, delay)
      delay += 1400
      setTimeout(() => {
        setChecks(prev => prev.map((c, i) => i === index ? { ...c, status: 'done' } : c))
      }, delay)
      delay += 300
    })
    setTimeout(() => setStep('done'), delay + 500)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden">

          {/* Header */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 dark:from-slate-800 dark:to-slate-950 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Wackenhut Autohaus</p>
                <p className="text-white/60 text-xs">Identitätsprüfung · Gesichert</p>
              </div>
              <div className="ml-auto">
                <Lock className="h-4 w-4 text-white/40" />
              </div>
            </div>
          </div>

          <div className="p-6">

            {/* ── WELCOME ─────────────────────────────────────────────── */}
            {step === 'welcome' && (
              <div className="space-y-5">
                <div className="text-center">
                  <div className="h-16 w-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                    <CreditCard className="h-8 w-8 text-slate-600 dark:text-slate-400" />
                  </div>
                  <h1 className="font-bold text-xl">Identitätsprüfung</h1>
                  <p className="text-muted-foreground text-sm mt-1">
                    Für Ihren Fahrzeugkauf benötigen wir eine kurze Identitätsprüfung.
                  </p>
                </div>

                <div className="space-y-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
                  {[
                    { icon: CreditCard, text: 'Personalausweis oder Reisepass bereithalten' },
                    { icon: Camera, text: 'Kamera für Selfie bereithalten' },
                    { icon: ShieldCheck, text: 'Nur ca. 2 Minuten Ihrer Zeit' },
                  ].map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-3 text-sm">
                      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">{text}</span>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-3">
                  <p className="text-xs text-blue-700 dark:text-blue-400 flex items-start gap-2">
                    <Lock className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    Ihre Daten werden Ende-zu-Ende verschlüsselt und nicht an Dritte weitergegeben.
                  </p>
                </div>

                <Button className="w-full" size="lg" onClick={() => setStep('document')}>
                  Jetzt starten <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}

            {/* ── DOCUMENT ────────────────────────────────────────────── */}
            {step === 'document' && (
              <div className="space-y-5">
                <StepDots current={1} />
                <div className="text-center">
                  <h2 className="font-bold text-lg">Ausweis fotografieren</h2>
                  <p className="text-muted-foreground text-sm mt-1">Legen Sie Ihren Ausweis auf eine ebene Fläche und machen Sie ein klares Foto.</p>
                </div>

                {/* Front */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Vorderseite</p>
                  <button
                    onClick={() => setDocUploaded(true)}
                    className={`w-full rounded-xl border-2 border-dashed p-5 text-center transition-all ${
                      docUploaded ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20' : 'border-border hover:border-muted-foreground'
                    }`}
                  >
                    {docUploaded ? (
                      <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle className="h-5 w-5" />
                        <span className="text-sm font-medium">Bild hochgeladen</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="h-6 w-6 mx-auto text-muted-foreground/50" />
                        <p className="text-sm text-muted-foreground">Tippen zum Hochladen</p>
                        <p className="text-xs text-muted-foreground/60">JPG, PNG · max. 10 MB</p>
                      </div>
                    )}
                  </button>
                </div>

                {/* Back */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Rückseite</p>
                  <button
                    className="w-full rounded-xl border-2 border-dashed border-border p-5 text-center hover:border-muted-foreground transition-all"
                  >
                    <div className="space-y-2">
                      <Upload className="h-6 w-6 mx-auto text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">Tippen zum Hochladen</p>
                    </div>
                  </button>
                </div>

                <Button className="w-full" disabled={!docUploaded} onClick={() => setStep('selfie')}>
                  Weiter <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}

            {/* ── SELFIE ──────────────────────────────────────────────── */}
            {step === 'selfie' && (
              <div className="space-y-5">
                <StepDots current={2} />
                <div className="text-center">
                  <h2 className="font-bold text-lg">Selfie aufnehmen</h2>
                  <p className="text-muted-foreground text-sm mt-1">Machen Sie ein aktuelles Foto von sich — gut beleuchtet und ohne Sonnenbrille.</p>
                </div>

                {/* Selfie area */}
                <button
                  onClick={() => setSelfieUploaded(true)}
                  className={`w-full rounded-xl border-2 border-dashed p-8 text-center transition-all ${
                    selfieUploaded ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20' : 'border-border hover:border-muted-foreground'
                  }`}
                >
                  {selfieUploaded ? (
                    <div className="flex flex-col items-center gap-2 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle className="h-8 w-8" />
                      <span className="text-sm font-medium">Selfie aufgenommen</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="h-16 w-16 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center mx-auto">
                        <User className="h-8 w-8 text-muted-foreground/40" />
                      </div>
                      <p className="text-sm text-muted-foreground">Kamera aktivieren</p>
                      <Button variant="outline" size="sm" onClick={e => { e.stopPropagation(); setSelfieUploaded(true) }}>
                        <Camera className="h-4 w-4 mr-2" />Foto aufnehmen
                      </Button>
                    </div>
                  )}
                </button>

                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>Stellen Sie sicher, dass Ihr Gesicht vollständig sichtbar und gut beleuchtet ist.</span>
                </div>

                <Button className="w-full" disabled={!selfieUploaded} onClick={startProcessing}>
                  Prüfung starten <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}

            {/* ── PROCESSING ──────────────────────────────────────────── */}
            {step === 'processing' && (
              <div className="space-y-5">
                <StepDots current={3} />
                <div className="text-center">
                  <div className="h-14 w-14 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-3">
                    <Loader2 className="h-7 w-7 text-blue-600 dark:text-blue-400 animate-spin" />
                  </div>
                  <h2 className="font-bold text-lg">Prüfung läuft</h2>
                  <p className="text-muted-foreground text-sm mt-1">Dies dauert nur wenige Sekunden…</p>
                </div>

                <div className="space-y-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
                  {checks.map(check => (
                    <div key={check.id} className={`flex items-center gap-3 transition-all duration-300 ${check.status === 'pending' ? 'opacity-30' : 'opacity-100'}`}>
                      <div className="shrink-0">
                        {check.status === 'loading' && <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />}
                        {check.status === 'done' && <CheckCircle className="h-4 w-4 text-emerald-500" />}
                        {check.status === 'pending' && <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />}
                      </div>
                      <p className={`text-sm ${
                        check.status === 'loading' ? 'text-blue-600 dark:text-blue-400 font-medium'
                        : check.status === 'done' ? 'text-emerald-700 dark:text-emerald-400 font-medium'
                        : 'text-muted-foreground'
                      }`}>{check.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── DONE ────────────────────────────────────────────────── */}
            {step === 'done' && (
              <div className="space-y-5 text-center">
                <div>
                  <div className="h-20 w-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h2 className="font-bold text-xl">Identität bestätigt</h2>
                  <p className="text-muted-foreground text-sm mt-1">
                    Ihre Prüfung war erfolgreich. Sie können dieses Fenster jetzt schließen.
                  </p>
                </div>

                <Separator />

                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 text-left space-y-2">
                  {[
                    'Personalausweis erkannt & gültig',
                    'Sicherheitsmerkmale bestätigt',
                    'Biometrischer Abgleich erfolgreich',
                    'Altersverifikation bestanden (18+)',
                  ].map(text => (
                    <div key={text} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span className="text-muted-foreground">{text}</span>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 p-3">
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium text-center">
                    Wackenhut Autohaus wurde automatisch benachrichtigt.
                  </p>
                </div>

                <Button variant="outline" className="w-full" onClick={() => window.close()}>
                  Fenster schließen
                </Button>
              </div>
            )}

          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-4">
          Gesichert durch Wackenhut Autohaus · Ende-zu-Ende verschlüsselt
        </p>

      </div>
    </div>
  )
}
