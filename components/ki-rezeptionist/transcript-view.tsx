'use client'

import { useMemo } from 'react'
import { Bot, UserRound } from 'lucide-react'
import { cn } from '@/lib/utils'
import { parseTranscript, type TranscriptTurn } from '@/lib/ki-rezeptionist/parse-transcript'

const SPEAKER_META: Record<
  'assistent' | 'kunde',
  { label: string; Icon: typeof Bot; labelCls: string; barCls: string; tintCls: string }
> = {
  assistent: {
    label: 'Assistent',
    Icon: Bot,
    labelCls: 'text-primary',
    barCls: 'border-l-primary/40',
    tintCls: '',
  },
  kunde: {
    label: 'Kunde',
    Icon: UserRound,
    labelCls: 'text-foreground/70',
    barCls: 'border-l-foreground/25',
    // Kunde-Turns dezent getönt → Sprecherwechsel zusätzlich erkennbar.
    tintCls: 'bg-foreground/[0.025] dark:bg-foreground/[0.04]',
  },
}

/** Liefert Darstellungs-Metadaten; unbekannte Labels neutral + Original-Name. */
function metaFor(speaker: TranscriptTurn['speaker']) {
  if (speaker === 'assistent' || speaker === 'kunde') return SPEAKER_META[speaker]
  return {
    label: speaker.charAt(0).toUpperCase() + speaker.slice(1),
    Icon: UserRound,
    labelCls: 'text-muted-foreground',
    barCls: 'border-l-border',
    tintCls: '',
  }
}

/**
 * Rendert ein Anruf-Transkript sprecher-getrennt: kleines, farbcodiertes
 * Uppercase-Label + farbige Einrück-Leiste, Kunde-Turns dezent getönt.
 * Drei redundante, dezente Signale (Label-Farbe, Akzent-Leiste, Tönung)
 * machen „wer spricht?" auf einen Blick erkennbar — ruhig, dokumentartig.
 * Fallback: keine Turns erkannt → Rohtext als pre-wrap.
 */
export function TranscriptView({ transcript }: { transcript: string }) {
  const turns = useMemo(() => parseTranscript(transcript), [transcript])

  // Fallback: nichts erkannt → Rohtext lesbar als pre-wrap (selbsttragend).
  if (turns.length === 0) {
    return (
      <div className="max-h-[42vh] overflow-y-auto whitespace-pre-wrap break-words rounded-xl bg-muted/40 p-3 text-[13px] leading-relaxed text-foreground/90">
        {transcript?.trim() || 'Kein Transkript verfügbar.'}
      </div>
    )
  }

  return (
    <div className="max-h-[42vh] divide-y divide-border/40 overflow-y-auto rounded-xl bg-muted/40">
      {turns.map((turn, i) => {
        const { label, Icon, labelCls, barCls, tintCls } = metaFor(turn.speaker)
        return (
          <div key={i} className={cn('px-4 py-3', tintCls)}>
            {/* Sprecher-Label: klein, uppercase, farbcodiert (wie „Zusammenfassung") */}
            <div
              className={cn(
                'mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.08em]',
                labelCls,
              )}
            >
              <Icon className="h-3 w-3 shrink-0" strokeWidth={2.25} aria-hidden />
              {label}
            </div>
            {/* Text: eingerückt mit farbiger Leiste — primäres, lichtunabhängiges Signal */}
            <p
              className={cn(
                'whitespace-pre-wrap break-words border-l-2 pl-3 text-[13px] leading-relaxed text-foreground/90',
                barCls,
              )}
            >
              {turn.text}
            </p>
          </div>
        )
      })}
    </div>
  )
}
