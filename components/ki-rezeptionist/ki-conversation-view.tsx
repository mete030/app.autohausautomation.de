'use client'

import {
  Download,
  ChevronDown,
  FileText,
  Loader2,
  MessageSquareOff,
  PhoneIncoming,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { TranscriptView } from '@/components/ki-rezeptionist/transcript-view'
import { kiCategoryConfig } from '@/lib/ki-rezeptionist/ki-reception-config'
import { formatExact, formatDuration, germanizeTranscriptSpeakers } from '@/lib/ki-rezeptionist/format'
import { slugifyName, downloadBlob } from '@/lib/ki-rezeptionist/download'
import type { KiReceptionCallDto } from '@/lib/ki-rezeptionist/types'

/**
 * Schreibgeschützte Konversations-Ansicht (Zusammenfassung + Aufnahme +
 * sprecher-getrenntes Transkript + Downloads). Wird im Termin-Modal
 * eingebettet, damit der Empfang VOR dem Bestätigen kurz in den Anruf
 * schauen kann. Teilt sich die Transkript-Darstellung mit dem Anruf-Detail.
 */
export function KiConversationView({
  call,
  loading = false,
}: {
  call: KiReceptionCallDto | null
  loading?: boolean
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Konversation wird geladen …
      </div>
    )
  }

  if (!call) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <MessageSquareOff className="h-5 w-5" />
        </div>
        <p className="text-sm font-medium">Keine verknüpfte Konversation</p>
        <p className="max-w-xs text-xs text-muted-foreground">
          Dieser Termin ist keinem KI-Anruf zugeordnet — z. B. weil er manuell angelegt wurde.
        </p>
      </div>
    )
  }

  const cat = kiCategoryConfig[call.category]
  const duration = formatDuration(call.callDurationSec)
  const transcriptText = call.transcript?.trim()
    ? germanizeTranscriptSpeakers(call.transcript)
    : ''
  const hasTranscript = transcriptText.length > 0
  const hasRecording = Boolean(call.recordingUrl)
  const recordingDownloadUrl = `/api/ki-rezeptionist/${call.id}/recording`

  return (
    <div className="space-y-4">
      {/* Kopfzeile: Kunde + Anliegen + Eckdaten */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="font-medium">{call.customerName}</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
          <cat.icon className="h-3 w-3" />
          {cat.label}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
          <PhoneIncoming className="h-3 w-3" />
          {formatExact(call.receivedAt)}
          {duration ? ` · ${duration}` : ''}
        </span>
      </div>

      {/* Aufnahme */}
      {hasRecording && (
        <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
          <audio controls preload="none" src={call.recordingUrl} className="w-full" />
        </div>
      )}

      {/* Zusammenfassung */}
      <section className="space-y-1.5">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Zusammenfassung
        </h3>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
          {call.summary?.trim() || 'Keine Zusammenfassung verfügbar.'}
        </p>
      </section>

      {/* Transkript */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Transkript
          </h3>
          {(hasTranscript || hasRecording) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Download className="h-4 w-4" />
                  Herunterladen
                  <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {hasTranscript && (
                  <DropdownMenuItem
                    onSelect={() =>
                      downloadBlob(
                        `Transkript_${slugifyName(call.customerName)}.txt`,
                        transcriptText,
                        'text/plain;charset=utf-8',
                      )
                    }
                  >
                    <FileText className="h-4 w-4" />
                    Transkript (.txt)
                  </DropdownMenuItem>
                )}
                {hasRecording && (
                  <DropdownMenuItem asChild>
                    <a href={recordingDownloadUrl} download>
                      <Download className="h-4 w-4" />
                      Aufnahme
                    </a>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        {hasTranscript ? (
          <TranscriptView transcript={transcriptText} />
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl bg-muted/40 py-10 text-center">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm font-medium">Kein Transkript verfügbar</p>
            <p className="max-w-xs text-xs text-muted-foreground">
              Für diesen Anruf wurde noch kein Transkript übermittelt.
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
