'use client'

import { useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { PaketVehicleOrigin } from '@/lib/mock-data-paket'
import { Mic, Loader2, Upload, Sparkles, Layers, Search } from 'lucide-react'

// Realistischer Drehscheiben-„Zug" (8 Fahrzeuge): Mix aus jungen Treibern und
// älteren Mitnahme-Fahrzeugen, die nur gemeinsam gekauft werden können.
const DEMO_LINES = [
  'GLC 200 4MATIC, 2023, 38.000 km, AMG Line · LED',
  'GLC 220 d 4MATIC, 2022, 64.000 km, Night-Paket · AHK',
  'GLC 300 4MATIC, 2023, 32.400 km, Burmester · Panorama · HUD',
  'GLC 300 e 4MATIC, 2022, 55.000 km, AMG Line · Distronic',
  'GLC 200 4MATIC, 2021, 89.000 km, Advanced',
  'GLC 43 AMG, 2020, 96.000 km, Performance · Burmester',
  'GLC 220 d 4MATIC, 2019, 138.000 km, Basis',
  'GLC 220 d 4MATIC, 2018, 152.000 km, Basis · Navi',
]

interface PaketIdentifyProps {
  onRecognize: (transcript: string, origin: PaketVehicleOrigin) => void
  recognizing: boolean
}

export function PaketIdentify({ onRecognize, recognizing }: PaketIdentifyProps) {
  const [transcript, setTranscript] = useState('')
  const [voiceState, setVoiceState] = useState<'idle' | 'listening' | 'processing'>('idle')
  // Eingabeweg der zuletzt erfassten Zeilen → bestimmt das "aus Paket identifiziert"-Label (A2).
  const [origin, setOrigin] = useState<PaketVehicleOrigin>('text')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const simulateVoice = () => {
    setVoiceState('listening')
    setTimeout(() => setVoiceState('processing'), 1400)
    setTimeout(() => {
      setTranscript((prev) => (prev ? prev + '\n' : '') + DEMO_LINES.join('\n'))
      setOrigin('voice')
      setVoiceState('idle')
    }, 2300)
  }

  const fillDemo = () => {
    setTranscript(DEMO_LINES.join('\n'))
    setOrigin('demo')
  }

  // Echtes Datei-Feld; die Verarbeitung selbst ist gemocktes OCR.
  // TODO[real-backend]: OCR — Paket-Screenshot der Drehscheibe parsen.
  const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setVoiceState('processing')
    setTimeout(() => {
      setTranscript(DEMO_LINES.join('\n'))
      setOrigin('screenshot')
      setVoiceState('idle')
    }, 1200)
    e.target.value = '' // erneute Auswahl derselben Datei erlauben
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Layers className="h-4 w-4 text-primary" />
          Paket / Konvolut erfassen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          Fahrzeuge des Pakets einsprechen oder eintippen — eines pro Zeile (VIN, HSN/TSN oder Beschreibung).
          Ideal für Drehscheiben-Pakete, die nur gemeinsam gekauft werden können.
        </p>

        {/* Voice capture */}
        <button
          type="button"
          onClick={simulateVoice}
          disabled={voiceState !== 'idle' || recognizing}
          className={`w-full rounded-2xl border-2 border-dashed p-5 flex items-center justify-center gap-3 transition-all ${
            voiceState === 'listening'
              ? 'border-red-400 bg-red-50/50 dark:bg-red-950/20'
              : 'border-primary/30 bg-primary/[0.03] hover:border-primary/50 hover:bg-primary/[0.06]'
          }`}
        >
          <span
            className={`flex h-11 w-11 items-center justify-center rounded-full ${
              voiceState === 'listening' ? 'bg-red-500 text-white' : 'bg-primary/10 text-primary'
            }`}
          >
            {voiceState === 'processing' ? <Loader2 className="h-5 w-5 animate-spin" /> : <Mic className="h-5 w-5" />}
          </span>
          <div className="text-left">
            <p className="text-sm font-medium">
              {voiceState === 'listening' ? 'Ich höre zu…' : voiceState === 'processing' ? 'Fahrzeuge werden erkannt…' : 'Fahrzeuge einsprechen'}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {voiceState === 'listening' ? 'z.B. „vier GLCs: ein 220d mit AMG Line, ein 300 4MATIC …"' : 'Antippen und die Fahrzeuge des Pakets nennen'}
            </p>
          </div>
        </button>

        <Textarea
          value={transcript}
          onChange={(e) => {
            setTranscript(e.target.value)
            setOrigin('text')
          }}
          placeholder={'GLC 220 d 4MATIC, 2022, 64.000 km, Night-Paket\nGLC 300 4MATIC, 2023, 32.400 km, Burmester …'}
          className="min-h-[120px] font-mono text-xs"
        />

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={onFileSelected}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={voiceState !== 'idle'}
            >
              <Upload className="h-3.5 w-3.5 mr-1.5" />
              Screenshot hochladen
            </Button>
            <button
              type="button"
              onClick={fillDemo}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline underline-offset-2"
            >
              <Sparkles className="h-3 w-3" />
              Demo-Paket einsprechen
            </button>
          </div>
          <Button onClick={() => onRecognize(transcript, origin)} disabled={!transcript.trim() || recognizing} className="shrink-0">
            {recognizing ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Fahrzeuge werden erkannt…</>
            ) : (
              <><Search className="h-4 w-4 mr-2" />Paket erkennen</>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
