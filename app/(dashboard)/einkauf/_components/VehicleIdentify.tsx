'use client'

import { useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { einkaufVinMock, einkaufVinMockAuktion, type VehicleType } from '@/lib/mock-data-einkauf'
import { einkaufTransporterVinMock } from '@/lib/mock-data-einkauf-transporter'
import { PAKET_DEMO_VINS, type PaketVehicleOrigin } from '@/lib/mock-data-paket'
import { ScanLine, Upload, Search, Loader2, Mic, Sparkles, Gavel, Layers, Truck, Car } from 'lucide-react'

interface VehicleIdentifyProps {
  vehicleType: VehicleType
  onVehicleTypeChange: (t: VehicleType) => void
  onSubmit: (vinText: string, origin: PaketVehicleOrigin) => void
  busy: boolean
}

interface Example {
  key: string
  label: string
  icon: typeof Sparkles
  fill: string
}

const PKW_EXAMPLES: Example[] = [
  { key: 'endkunde', label: 'Endkundenfahrzeug', icon: Sparkles, fill: einkaufVinMock.vin },
  { key: 'auktion', label: 'Auktionsfahrzeug', icon: Gavel, fill: einkaufVinMockAuktion.vin },
  { key: 'paket', label: 'Paketkauf · 8 Fahrzeuge', icon: Layers, fill: PAKET_DEMO_VINS.join('\n') },
]
const TRANSPORTER_EXAMPLES: Example[] = [
  { key: 'transporter', label: 'Sprinter Kühlkoffer', icon: Truck, fill: einkaufTransporterVinMock.vin },
]

export function VehicleIdentify({ vehicleType, onVehicleTypeChange, onSubmit, busy }: VehicleIdentifyProps) {
  const [value, setValue] = useState('')
  const [origin, setOrigin] = useState<PaketVehicleOrigin>('text')
  const [voiceState, setVoiceState] = useState<'idle' | 'listening' | 'processing'>('idle')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const examples = vehicleType === 'transporter' ? TRANSPORTER_EXAMPLES : PKW_EXAMPLES
  // Was Screenshot-OCR / Sprache befüllen: im PKW-Modus das 8er-Demo-Paket, sonst den Transporter.
  const ocrFill = (vehicleType === 'transporter' ? TRANSPORTER_EXAMPLES[0] : PKW_EXAMPLES[2]).fill

  const fillExample = (text: string) => {
    setValue(text)
    setOrigin('text')
  }

  // Echtes Datei-Feld; die Verarbeitung selbst ist gemocktes OCR.
  // TODO[real-backend]: OCR — Drehscheiben-Screenshot/Liste parsen.
  const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setVoiceState('processing')
    setTimeout(() => {
      setValue(ocrFill)
      setOrigin('screenshot')
      setVoiceState('idle')
    }, 1100)
    e.target.value = ''
  }

  const simulateVoice = () => {
    setVoiceState('listening')
    setTimeout(() => setVoiceState('processing'), 1200)
    setTimeout(() => {
      setValue((prev) => (prev ? prev + '\n' : '') + ocrFill)
      setOrigin('voice')
      setVoiceState('idle')
    }, 2200)
  }

  const lineCount = value.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).length
  const submitLabel = lineCount > 1 ? `${lineCount} Fahrzeuge abfragen` : 'Fahrzeug abfragen'

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <ScanLine className="h-4 w-4 text-primary" />
            Fahrzeug(e) per VIN erfassen
          </CardTitle>
          {/* Fahrzeugart-Umschalter PKW ⇄ Transporter — direkt an der Eingabemaske */}
          <div className="flex gap-1 rounded-lg border bg-muted p-1">
            {([
              { t: 'pkw' as VehicleType, icon: Car, label: 'PKW' },
              { t: 'transporter' as VehicleType, icon: Truck, label: 'Transporter' },
            ]).map(({ t, icon: Icon, label }) => (
              <button
                key={t}
                type="button"
                onClick={() => onVehicleTypeChange(t)}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                  vehicleType === t ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          Eine VIN für ein Einzelfahrzeug — oder mehrere VINs (eine pro Zeile) für ein Paket/Konvolut
          (Drehscheibe). HSN/TSN oder eine kurze Beschreibung gehen ebenfalls.
        </p>

        {/* Beispiel-VINs zum schnellen Befüllen */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-muted-foreground">Beispiel laden:</span>
          {examples.map((ex) => {
            const Icon = ex.icon
            return (
              <button
                key={ex.key}
                type="button"
                onClick={() => fillExample(ex.fill)}
                className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/40 px-3 py-1 text-[11px] font-medium text-foreground/80 transition-colors hover:border-primary/40 hover:bg-primary/[0.06] hover:text-primary"
              >
                <Icon className="h-3 w-3" />
                {ex.label}
              </button>
            )
          })}
        </div>

        {/* PRIMÄR: VIN-Eingabe */}
        <Textarea
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            setOrigin('text')
          }}
          placeholder={'z. B. W1N2546021F789012\nW1K2060041R123456\n…'}
          className="min-h-[150px] font-mono text-sm tracking-wide"
          disabled={voiceState !== 'idle'}
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* PROMINENT: Screenshot-Upload */}
            <input ref={fileInputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={onFileSelected} />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={voiceState !== 'idle'}
            >
              {voiceState === 'processing' ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Screenshot wird gelesen…</>
              ) : (
                <><Upload className="h-4 w-4 mr-2" />Screenshot hochladen</>
              )}
            </Button>
            {/* DEZENT: Spracheingabe */}
            <button
              type="button"
              onClick={simulateVoice}
              disabled={voiceState !== 'idle'}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              <Mic className="h-3.5 w-3.5" />
              {voiceState === 'listening' ? 'Ich höre zu…' : 'oder einsprechen'}
            </button>
          </div>

          <Button onClick={() => onSubmit(value, origin)} disabled={!value.trim() || busy} className="shrink-0">
            {busy ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Wird abgefragt…</>
            ) : (
              <><Search className="h-4 w-4 mr-2" />{submitLabel}</>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
