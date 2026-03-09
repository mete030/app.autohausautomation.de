'use client'

import { useCallback, useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, Mic, MicOff, Loader2, RotateCcw, Wand2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import { useVoiceParser, type ParsedVoiceCommand } from '@/hooks/useVoiceParser'
import { useVehicleStore } from '@/lib/stores/vehicle-store'
import {
  vehicleBlockerLabels,
  vehicleLocationLabels,
  vehicleOwnerRoleLabels,
  vehicleStatusLabels,
} from '@/lib/vehicle-operations'
import { cn } from '@/lib/utils'

const sampleCommands = [
  'C 220 d T-Modell wartet auf Teile in der Werkstatt, nächster Schritt Freigabe Serviceleiter.',
  'CLA 250 e ist fertig für Fotos und geht an Foto Team.',
  'GLC 300 steht jetzt auf Hof B, bitte an Verkauf für Probefahrt.',
  'A 200 hat noch keinen nächsten Schritt, bitte an Service.',
  'GLE 450 d ist beim Lackierer, wartet auf Lackierer und danach zurück in Werkstatt.',
] as const

function CommandSummary({ command }: { command: ParsedVoiceCommand }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/80 p-3 sm:p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground sm:text-xs">Erkannt</p>
          <p className="mt-0.5 text-sm font-semibold sm:mt-1">
            {command.vehicle ? `${command.vehicle.make} ${command.vehicle.model}` : 'Kein Fahrzeug erkannt'}
          </p>
        </div>
        <Badge variant={command.canApply ? 'default' : 'secondary'} className="shrink-0 text-[10px] sm:text-xs">
          {command.canApply ? 'Bereit' : 'Prüfung nötig'}
        </Badge>
      </div>

      <div className="mt-3 grid gap-2 text-sm sm:mt-4 sm:grid-cols-2">
        <div className="rounded-xl bg-muted/60 px-3 py-2">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Status</p>
          <p className="mt-1 font-medium">{command.status ? vehicleStatusLabels[command.status] : 'Unverändert'}</p>
        </div>
        <div className="rounded-xl bg-muted/60 px-3 py-2">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Standort</p>
          <p className="mt-1 font-medium">{command.location ? vehicleLocationLabels[command.location] : 'Unverändert'}</p>
        </div>
        <div className="rounded-xl bg-muted/60 px-3 py-2">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Blocker</p>
          <p className="mt-1 font-medium">{command.blocker ? vehicleBlockerLabels[command.blocker] : 'Unverändert'}</p>
        </div>
        <div className="rounded-xl bg-muted/60 px-3 py-2">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Verantwortlich</p>
          <p className="mt-1 font-medium">{command.ownerRole ? vehicleOwnerRoleLabels[command.ownerRole] : 'Unverändert'}</p>
        </div>
      </div>

      <div className="mt-3 rounded-xl bg-muted/60 px-3 py-2">
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Nächster Schritt</p>
        <p className="mt-1 text-sm font-medium">{command.nextStep || 'Nicht erkannt'}</p>
      </div>

      <div className="mt-3 rounded-xl border border-dashed border-border/70 px-3 py-2 text-xs text-muted-foreground">
        {command.summary}
      </div>

      {!command.canApply && (
        <div className="mt-3 rounded-xl border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {command.issues.join(' ')}
        </div>
      )}
    </div>
  )
}

export function HofsteuerungVoicePanel() {
  const vehicles = useVehicleStore((state) => state.vehicles)
  const applyVoiceUpdate = useVehicleStore((state) => state.applyVoiceUpdate)
  const undoLastVehicleUpdate = useVehicleStore((state) => state.undoLastVehicleUpdate)
  const lastUndoSnapshot = useVehicleStore((state) => state.lastUndoSnapshot)
  const { parseTranscript } = useVoiceParser()

  const [expanded, setExpanded] = useState(false)
  const [draftTranscript, setDraftTranscript] = useState('')
  const [pendingCommand, setPendingCommand] = useState<ParsedVoiceCommand | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const runTranscript = useCallback((transcript: string) => {
    const parsed = parseTranscript(transcript, vehicles)
    setExpanded(true)
    setDraftTranscript(transcript)
    setPendingCommand(parsed)
    setSuccessMessage(null)
  }, [parseTranscript, vehicles])

  const { state, previewTranscript, errorMessage, toggleListening, startListening } = useSpeechRecognition({
    onTranscript: async (transcript) => {
      runTranscript(transcript)
    },
    disabled: false,
  })

  const activeTranscript = useMemo(() => {
    if (state === 'listening' && previewTranscript) return previewTranscript
    return draftTranscript
  }, [draftTranscript, previewTranscript, state])

  const handleConfirm = useCallback(() => {
    if (!pendingCommand?.canApply || !pendingCommand.vehicle) return

    applyVoiceUpdate({
      vehicleId: pendingCommand.vehicle.id,
      status: pendingCommand.status,
      location: pendingCommand.location,
      blocker: pendingCommand.blocker,
      ownerRole: pendingCommand.ownerRole,
      nextStep: pendingCommand.nextStep,
      transcript: pendingCommand.transcript,
    })

    setSuccessMessage(pendingCommand.summary)
    setPendingCommand(null)
  }, [applyVoiceUpdate, pendingCommand])

  const handleUndo = useCallback(() => {
    undoLastVehicleUpdate()
    setSuccessMessage('Letzte Änderung zurückgesetzt.')
  }, [undoLastVehicleUpdate])

  const handleMicClick = useCallback(() => {
    if (state === 'idle') {
      setExpanded(true)
      startListening()
    } else {
      toggleListening()
    }
  }, [state, startListening, toggleListening])

  const canCollapse = !pendingCommand && state === 'idle'

  // ─── Collapsed: slim single-line bar ───
  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="group flex w-full items-center gap-3 rounded-2xl border border-border/70 bg-card/80 px-3.5 py-3 text-left transition-all hover:border-primary/30 hover:shadow-sm sm:gap-4 sm:px-5 sm:py-3.5"
      >
        <div
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation()
            handleMicClick()
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.stopPropagation()
              handleMicClick()
            }
          }}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary transition-transform hover:scale-105 sm:h-10 sm:w-10"
        >
          <Mic className="h-4.5 w-4.5" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">Update sprechen oder tippen</p>
          <p className="truncate text-xs text-muted-foreground">
            <span className="sm:hidden">z.B. &quot;C 220 d wartet auf Teile&quot;</span>
            <span className="hidden sm:inline">Sag z.B. &quot;C 220 d wartet auf Teile in der Werkstatt&quot;</span>
          </p>
        </div>

        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-y-0.5" />
      </button>
    )
  }

  // ─── Expanded: full voice interface ───
  return (
    <div className="rounded-2xl border border-border/70 bg-card/80 shadow-sm">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-border/50 px-3.5 py-2.5 sm:px-5 sm:py-3">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <Mic className="h-4 w-4 shrink-0 text-primary" />
          <div className="min-w-0">
            <p className="text-sm font-medium">Update sprechen oder tippen</p>
            <p className="text-xs text-muted-foreground">
              <span className="sm:hidden">Status, Standort & Blocker werden erkannt.</span>
              <span className="hidden sm:inline">Sag einfach, was mit dem Auto los ist. Status, Standort, Blocker und nächster Schritt werden automatisch erkannt.</span>
            </p>
          </div>
        </div>
        {canCollapse && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setExpanded(false)}
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="space-y-3 p-3.5 sm:space-y-4 sm:p-5">
        {/* Mic + Transcript row */}
        <div className="flex gap-3 sm:gap-4">
          <button
            type="button"
            onClick={handleMicClick}
            className={cn(
              'flex shrink-0 items-center justify-center rounded-full border shadow-sm transition-all duration-200',
              'h-12 w-12 sm:h-16 sm:w-16',
              state === 'idle' && 'border-primary/20 bg-primary/10 text-primary hover:scale-[1.04]',
              state === 'listening' && 'border-red-300 bg-red-500 text-white shadow-lg shadow-red-500/20 scale-[1.04]',
              state === 'processing' && 'border-primary/20 bg-primary/10 text-primary'
            )}
          >
            {state === 'idle' && <Mic className="h-5 w-5 sm:h-6 sm:w-6" />}
            {state === 'listening' && <MicOff className="h-5 w-5 sm:h-6 sm:w-6" />}
            {state === 'processing' && <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" />}
          </button>

          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                {state === 'listening'
                  ? 'Spricht...'
                  : state === 'processing'
                    ? 'Wird ausgewertet...'
                    : 'Tippe alternativ hier:'}
              </p>
              <Badge variant="secondary" className="text-[10px]">
                {state === 'listening' ? 'Hört zu' : state === 'processing' ? 'Verarbeitet' : 'Bereit'}
              </Badge>
            </div>

            <Textarea
              value={activeTranscript}
              onChange={(event) => setDraftTranscript(event.target.value)}
              placeholder='z.B. "C 220 d wartet auf Teile in der Werkstatt"'
              className="min-h-[64px] resize-none border-0 bg-muted/40 shadow-none focus-visible:ring-0 sm:min-h-[80px]"
            />

            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                onClick={() => runTranscript(draftTranscript)}
                disabled={!draftTranscript.trim() || state === 'processing'}
              >
                Auswerten
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDraftTranscript('')
                  setPendingCommand(null)
                  setSuccessMessage(null)
                }}
              >
                Zurücksetzen
              </Button>
              {errorMessage && (
                <span className="text-xs text-destructive">{errorMessage}</span>
              )}
            </div>
          </div>
        </div>

        {/* Sample commands — horizontally scrollable on mobile, wrapping on desktop */}
        <div className="-mx-3.5 flex gap-1.5 overflow-x-auto px-3.5 pb-1 scrollbar-none sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
          {sampleCommands.map((sample) => (
            <button
              key={sample}
              type="button"
              onClick={() => runTranscript(sample)}
              className="flex shrink-0 items-center gap-1.5 rounded-full border border-border/70 bg-muted/30 px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:shrink"
            >
              <Wand2 className="h-3 w-3 shrink-0" />
              <span className="max-w-[180px] truncate sm:max-w-[200px]">{sample}</span>
            </button>
          ))}
        </div>

        {/* Command summary */}
        {pendingCommand && (
          <div className="space-y-3">
            <CommandSummary command={pendingCommand} />
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setPendingCommand(null)}>
                Verwerfen
              </Button>
              <Button variant="outline" size="sm" onClick={() => setDraftTranscript(pendingCommand.transcript)}>
                Bearbeiten
              </Button>
              <Button size="sm" onClick={handleConfirm} disabled={!pendingCommand.canApply}>
                Änderung übernehmen
              </Button>
            </div>
          </div>
        )}

        {/* Success message */}
        {successMessage && (
          <div className="flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-emerald-900 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold">Update übernommen</p>
              <p className="text-sm opacity-80">{successMessage}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-emerald-300 bg-white text-emerald-900 hover:bg-emerald-100"
              onClick={handleUndo}
              disabled={!lastUndoSnapshot}
            >
              <RotateCcw className="mr-2 h-3.5 w-3.5" />
              Rückgängig
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
