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
  'BMW 320d wartet auf Teile in der Werkstatt, nächster Schritt Freigabe Serviceleiter.',
  'Audi A4 ist fertig für Fotos und geht an Foto Team.',
  'GLC steht jetzt auf Hof B, bitte an Verkauf für Probefahrt.',
  'BMW 118i hat noch keinen nächsten Schritt, bitte an Service.',
  'X3 ist beim Lackierer, wartet auf Lackierer und danach zurück in Werkstatt.',
] as const

function CommandSummary({ command }: { command: ParsedVoiceCommand }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Erkannt</p>
          <p className="mt-1 text-sm font-semibold">
            {command.vehicle ? `${command.vehicle.make} ${command.vehicle.model}` : 'Kein Fahrzeug erkannt'}
          </p>
        </div>
        <Badge variant={command.canApply ? 'default' : 'secondary'}>
          {command.canApply ? 'Bereit zum Übernehmen' : 'Prüfung nötig'}
        </Badge>
      </div>

      <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
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

  const [expanded, setExpanded] = useState(true)
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
        className="group flex w-full items-center gap-4 rounded-2xl border border-border/70 bg-card/80 px-5 py-3.5 text-left transition-all hover:border-primary/30 hover:shadow-sm"
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
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary transition-transform hover:scale-105"
        >
          <Mic className="h-4.5 w-4.5" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">1. Update sprechen oder tippen</p>
          <p className="truncate text-xs text-muted-foreground">
            Sag z.B. &quot;BMW 320d wartet auf Teile in der Werkstatt&quot;
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
      <div className="flex items-center justify-between border-b border-border/50 px-5 py-3">
        <div className="flex items-center gap-3">
          <Mic className="h-4 w-4 text-primary" />
          <div>
            <p className="text-sm font-medium">1. Update sprechen oder tippen</p>
            <p className="text-xs text-muted-foreground">
              Sag einfach, was mit dem Auto los ist. Status, Standort, Blocker und nächster Schritt werden automatisch erkannt.
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

      <div className="space-y-4 p-5">
        {/* Mic + Transcript row */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={handleMicClick}
            className={cn(
              'flex h-16 w-16 shrink-0 items-center justify-center rounded-full border shadow-sm transition-all duration-200',
              state === 'idle' && 'border-primary/20 bg-primary/10 text-primary hover:scale-[1.04]',
              state === 'listening' && 'border-red-300 bg-red-500 text-white shadow-lg shadow-red-500/20 scale-[1.04]',
              state === 'processing' && 'border-primary/20 bg-primary/10 text-primary'
            )}
          >
            {state === 'idle' && <Mic className="h-6 w-6" />}
            {state === 'listening' && <MicOff className="h-6 w-6" />}
            {state === 'processing' && <Loader2 className="h-6 w-6 animate-spin" />}
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
              placeholder='z.B. "BMW 320d wartet auf Teile in der Werkstatt, nächster Schritt Freigabe Serviceleiter."'
              className="min-h-[80px] resize-none border-0 bg-muted/40 shadow-none focus-visible:ring-0"
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

        {/* Sample commands — compact pills */}
        <div className="flex flex-wrap gap-1.5">
          {sampleCommands.map((sample) => (
            <button
              key={sample}
              type="button"
              onClick={() => runTranscript(sample)}
              className="flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/30 px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Wand2 className="h-3 w-3" />
              <span className="max-w-[200px] truncate">{sample}</span>
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
