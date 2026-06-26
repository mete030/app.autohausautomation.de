'use client'

import { useState } from 'react'
import {
  Phone,
  PhoneIncoming,
  Download,
  Trash2,
  Check,
  RotateCcw,
  FileText,
  Clock,
  Forward,
  Tag,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { WaitingSince } from '@/components/ki-rezeptionist/waiting-since'
import { TranscriptView } from '@/components/ki-rezeptionist/transcript-view'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { kiCategoryConfig, kiStatusConfig, kiMarkeConfig } from '@/lib/ki-rezeptionist/ki-reception-config'
import { formatExact, formatDuration, germanizeTranscriptSpeakers } from '@/lib/ki-rezeptionist/format'
import { slugifyName, downloadBlob } from '@/lib/ki-rezeptionist/download'
import type { KiReceptionCallDto } from '@/lib/ki-rezeptionist/types'

interface KiCallDetailDialogProps {
  /** Anzuzeigender Anruf — `null` schließt den Dialog. */
  call: KiReceptionCallDto | null
  busy: boolean
  onOpenChange: (open: boolean) => void
  onToggleDone: (call: KiReceptionCallDto) => void
  onDelete: (call: KiReceptionCallDto) => void
  /** Öffnet das Weiterleiten-Modal für diesen Anruf. */
  onForward: (call: KiReceptionCallDto) => void
}

export function KiCallDetailDialog({
  call,
  busy,
  onOpenChange,
  onToggleDone,
  onDelete,
  onForward,
}: KiCallDetailDialogProps) {
  // „State während des Renderns anpassen" (offizielles React-Muster, kein
  // Effect): den letzten Anruf vorhalten, damit beim Schließen die Inhalte
  // während der Ausblend-Animation sichtbar bleiben (call wird dann zu null),
  // und den Lösch-Bestätigungsstatus beim Anruf-Wechsel zurücksetzen.
  const [shown, setShown] = useState<KiReceptionCallDto | null>(call)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [prevId, setPrevId] = useState<string | undefined>(call?.id)

  if (call && call !== shown) setShown(call)
  if (call?.id !== prevId) {
    setPrevId(call?.id)
    setConfirmDelete(false)
  }

  if (!shown) return null

  const cat = kiCategoryConfig[shown.category]
  const CatIcon = cat.icon
  const marke = shown.marke ? kiMarkeConfig[shown.marke] : null
  const status = kiStatusConfig[shown.status]
  const isDone = shown.status === 'erledigt'
  const duration = formatDuration(shown.callDurationSec)
  // Sprecher-Labels auch bei bereits gespeicherten Anrufen deutsch anzeigen.
  const transcriptText = shown.transcript?.trim()
    ? germanizeTranscriptSpeakers(shown.transcript)
    : ''
  const hasTranscript = transcriptText.length > 0
  const hasRecording = Boolean(shown.recordingUrl)
  const recordingDownloadUrl = `/api/ki-rezeptionist/${shown.id}/recording`

  return (
    <Dialog open={Boolean(call)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl md:max-w-2xl">
        {/* ---- Kopf ---- */}
        <DialogHeader className="pr-8">
          <DialogTitle className="flex items-center gap-2 text-base md:text-lg">
            <span className="truncate">{shown.customerName}</span>
          </DialogTitle>
          <DialogDescription className="sr-only">
            Anrufdetails, Zusammenfassung und Transkript
          </DialogDescription>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
                cat.color,
              )}
            >
              <CatIcon className="h-3 w-3" />
              {cat.label}
            </span>
            {marke && (
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
                  marke.color,
                )}
              >
                <Tag className="h-3 w-3" />
                {marke.label}
              </span>
            )}
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium',
                status.color,
              )}
            >
              {status.label}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              <PhoneIncoming className="h-3 w-3" />
              Eingehender Anruf
            </span>
          </div>
        </DialogHeader>

        {/* ---- Aufnahme ---- */}
        {hasRecording && (
          <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
            <audio controls preload="none" src={shown.recordingUrl} className="w-full" />
          </div>
        )}

        {/* ---- Tabs: Übersicht / Transkription ---- */}
        <Tabs defaultValue="uebersicht" className="gap-3">
          <TabsList variant="line" className="w-full justify-start border-b border-border/60">
            <TabsTrigger value="uebersicht">Übersicht</TabsTrigger>
            <TabsTrigger value="transkript">Transkription</TabsTrigger>
          </TabsList>

          {/* Übersicht */}
          <TabsContent value="uebersicht" className="space-y-4">
            {/* Live-Wartezeit auf Rückruf — nur solange offen */}
            {!isDone && (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/30 px-3 py-2.5">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  Wartet auf Rückruf seit
                </span>
                <WaitingSince receivedAt={shown.receivedAt} slaMinutes={cat.slaMinutes} />
              </div>
            )}

            <section className="space-y-1.5">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Zusammenfassung
              </h3>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                {shown.summary?.trim() || 'Keine Zusammenfassung verfügbar.'}
              </p>
            </section>

            {/* Ergebnis (Pflicht-Notiz beim Abschließen) — nur wenn erledigt. */}
            {isDone && shown.completionNotes?.trim() && (
              <section className="space-y-1.5 rounded-xl border border-emerald-300/50 bg-emerald-50/60 p-3 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                <h3 className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-700/90 dark:text-emerald-400/90">
                  <Check className="h-3.5 w-3.5" />
                  Ergebnis
                </h3>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                  {shown.completionNotes}
                </p>
              </section>
            )}

            <dl className="divide-y divide-border/60 rounded-xl border border-border/60">
              <DetailRow label="Eingegangen" value={formatExact(shown.receivedAt)} />
              <DetailRow label="Dauer" value={duration ?? '—'} />
              <DetailRow
                label="Telefon"
                value={
                  shown.customerPhone ? (
                    <a href={`tel:${shown.customerPhone}`} className="text-primary hover:underline">
                      {shown.customerPhone}
                    </a>
                  ) : (
                    '—'
                  )
                }
              />
              <DetailRow label="Anliegen" value={cat.label} />
              {marke && <DetailRow label="Marke" value={marke.label} />}
              {shown.vehicle && <DetailRow label="Fahrzeug" value={shown.vehicle} />}
              {shown.desiredAppt && <DetailRow label="Wunschtermin" value={shown.desiredAppt} />}
              {isDone && shown.completedAt && (
                <DetailRow
                  label="Erledigt"
                  value={`${formatExact(shown.completedAt)}${shown.completedBy ? ` · ${shown.completedBy}` : ''}`}
                />
              )}
            </dl>
          </TabsContent>

          {/* Transkription */}
          <TabsContent value="transkript" className="space-y-2">
            {hasTranscript ? (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Transkript
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      downloadBlob(
                        `Transkript_${slugifyName(shown.customerName)}.txt`,
                        transcriptText,
                        'text/plain;charset=utf-8',
                      )
                    }
                  >
                    <Download className="h-4 w-4" />
                    Herunterladen
                  </Button>
                </div>
                <TranscriptView transcript={transcriptText} />
              </>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <FileText className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium">Kein Transkript verfügbar</p>
                <p className="max-w-xs text-xs text-muted-foreground">
                  Für diesen Anruf wurde noch kein Transkript übermittelt.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* ---- Footer-Aktionen ---- */}
        <div className="mt-1 flex flex-col-reverse gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Löschen (mit Inline-Bestätigung) */}
          <div className="flex items-center gap-2">
            {confirmDelete ? (
              <>
                <span className="text-xs text-muted-foreground">Wirklich löschen?</span>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={busy}
                  onClick={() => onDelete(shown)}
                >
                  {busy ? 'Löscht …' : 'Ja, löschen'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={busy}
                  onClick={() => setConfirmDelete(false)}
                >
                  Abbrechen
                </Button>
              </>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="h-4 w-4" />
                Löschen
              </Button>
            )}
          </div>

          {/* Primäre Aktionen */}
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => onForward(shown)}>
              <Forward className="h-4 w-4" />
              Weiterleiten
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-8 px-0"
                  title="Herunterladen"
                  aria-label="Herunterladen"
                  disabled={!hasTranscript && !hasRecording}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {hasTranscript && (
                  <DropdownMenuItem
                    onSelect={() =>
                      downloadBlob(
                        `Transkript_${slugifyName(shown.customerName)}.txt`,
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

            {shown.customerPhone && (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="w-8 px-0"
                title="Anrufen"
                aria-label="Anrufen"
              >
                <a href={`tel:${shown.customerPhone}`}>
                  <Phone className="h-4 w-4" />
                </a>
              </Button>
            )}

            {isDone ? (
              <Button variant="outline" size="sm" disabled={busy} onClick={() => onToggleDone(shown)}>
                <RotateCcw className="h-4 w-4" />
                Wieder öffnen
              </Button>
            ) : (
              <Button size="sm" disabled={busy} onClick={() => onToggleDone(shown)}>
                <Check className="h-4 w-4" />
                {busy ? 'Speichert …' : 'Als erledigt markieren'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-3 py-2.5">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="min-w-0 truncate text-right text-sm">{value}</dd>
    </div>
  )
}
