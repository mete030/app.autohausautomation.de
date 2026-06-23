// Zerlegt einen Transkript-String in Sprecher-Turns. Erwartet bereits
// germanisierte Prefixe ("Assistent:" / "Kunde:" am Zeilenanfang, siehe
// germanizeTranscriptSpeakers in lib/ki-rezeptionist/format.ts), akzeptiert
// als Sicherheitsnetz aber auch englische Labels und einen optionalen
// Sprechernamen ("Assistent (Lena):"). Folgezeilen OHNE Prefix gehören zum
// laufenden Turn (Mehrzeilen-Turns). Gibt [] zurück, wenn KEINE Turns
// erkennbar sind → Aufrufer zeigt den Rohtext als pre-wrap-Fallback.

/** Ein geparster Gesprächs-Turn. `speaker` ist normalisiert oder das rohe Label. */
export type TranscriptTurn = { speaker: 'assistent' | 'kunde' | string; text: string }

// Whitelist-Regex (KEINE generische ^Wort:-Erkennung, um "Hinweis:" /
// Anreden NICHT fälschlich als Sprecher zu parsen). `\b[^:]*` schluckt einen
// optionalen Namen hinter dem Rollen-Label, z. B. "Assistent (Lena):".
// Toleriert führenden Whitespace, Groß/Klein und englische Aliasse.
const PREFIX =
  /^[ \t]*(assistent|assistant|ai|agent|bot|kunde|customer|caller|user|human|client)\b[^:]*:[ \t]?/i

const ASSISTENT = new Set(['assistent', 'assistant', 'ai', 'agent', 'bot'])
const KUNDE = new Set(['kunde', 'customer', 'caller', 'user', 'human', 'client'])

function normalizeSpeaker(label: string): 'assistent' | 'kunde' | string {
  const first = label.trim().toLowerCase()
  if (ASSISTENT.has(first)) return 'assistent'
  if (KUNDE.has(first)) return 'kunde'
  return label.trim() // unbekanntes Label: roh durchreichen (eigene neutrale Lane)
}

export function parseTranscript(raw: string | null | undefined): TranscriptTurn[] {
  if (!raw?.trim()) return []

  const turns: TranscriptTurn[] = []
  let current: TranscriptTurn | null = null

  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(PREFIX)
    if (m) {
      if (current) turns.push(current)
      // m[1] = nur das Rollen-Wort (vor einem evtl. Namen) → Normalisierung.
      current = { speaker: normalizeSpeaker(m[1]), text: line.slice(m[0].length) }
    } else if (current) {
      // Folgezeile an den laufenden Turn anhängen (Mehrzeilen-Turn,
      // interne Leerzeilen/Umbrüche bleiben erhalten).
      current.text += '\n' + line
    }
    // Zeilen vor dem ersten erkannten Sprecher werden verworfen
    // (z. B. Leerzeilen-Header) — die Whitelist verhindert Phantom-Sprecher.
  }
  if (current) turns.push(current)

  // Trailing-Whitespace je Turn trimmen, komplett leere Turns entfernen.
  return turns
    .map((t) => ({ ...t, text: t.text.replace(/\s+$/, '') }))
    .filter((t) => t.text.length > 0)
}
