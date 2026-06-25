// Rendert die automatische „Neuer-Anruf"-E-Mail an lead@wackenhut.de.
//
// Schlicht (Inline-CSS, Arial, keine Bilder/Web-Fonts) → blocker-sicher, HTML +
// Plaintext. Enthält eine Zusammenfassung des Anrufs UND genau einen Link, der
// direkt auf die Konversation im Dashboard führt (Transkript & Aufnahme).

import type { FahrzeugZustand } from '@/lib/ki-rezeptionist/types'

export interface KiLeadEmailPayload {
  customerName: string
  customerPhone: string
  /** Menschlich lesbares Anliegen-Label. */
  categoryLabel: string
  summary: string
  vehicle?: string | null
  desiredAppt?: string | null
  durationLabel?: string | null
  /** Anrufzeitpunkt als ISO-String. */
  receivedAt: string
  /** Absolute URL zur Konversation im Dashboard (Transkript + Aufnahme). */
  dashboardUrl: string
  /** Neuwagen vs. Gebrauchtwagen — für Betreff-Tag + Body-Zeile. */
  fahrzeugZustand?: FahrzeugZustand | null
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function formatDateTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface Row {
  label: string
  value: string
}

/** Anzeige-Label + Betreff-Tag je Fahrzeug-Zustand. */
const FAHRZEUG_ZUSTAND_INFO: Record<FahrzeugZustand, { label: string; tag: string }> = {
  neuwagen: { label: 'Neuwagen', tag: 'NEUWAGEN' },
  gebrauchtwagen: { label: 'Gebrauchtwagen', tag: 'GEBRAUCHTWAGEN' },
  unklar: { label: 'Unklar (Neu-/Gebrauchtwagen)', tag: 'FAHRZEUG UNKLAR' },
}

export function renderKiLeadEmail(payload: KiLeadEmailPayload): {
  subject: string
  html: string
  text: string
} {
  const customerName = payload.customerName.trim() || 'Unbekannt'
  const summary = payload.summary?.trim() ?? ''
  const url = payload.dashboardUrl
  const zustand = payload.fahrzeugZustand ? FAHRZEUG_ZUSTAND_INFO[payload.fahrzeugZustand] : null

  const rows: Row[] = [
    { label: 'Kunde', value: customerName },
    { label: 'Telefon', value: payload.customerPhone.trim() || '—' },
    { label: 'Anliegen', value: payload.categoryLabel },
  ]
  if (zustand) rows.push({ label: 'Fahrzeug-Zustand', value: zustand.label })
  if (payload.vehicle?.trim()) rows.push({ label: 'Fahrzeug', value: payload.vehicle.trim() })
  if (payload.desiredAppt?.trim()) rows.push({ label: 'Wunschtermin', value: payload.desiredAppt.trim() })
  if (payload.durationLabel?.trim()) rows.push({ label: 'Gesprächsdauer', value: payload.durationLabel.trim() })
  rows.push({ label: 'Eingegangen', value: formatDateTime(payload.receivedAt) })

  const subject = `${zustand ? `[${zustand.tag}] ` : ''}Neuer Anruf: ${customerName} – ${payload.categoryLabel}`

  // ---- HTML ----
  const htmlRows = rows
    .map(
      (r) => `        <tr>
          <td style="padding:6px 12px 6px 0;color:#666666;vertical-align:top;white-space:nowrap;">${escapeHtml(r.label)}</td>
          <td style="padding:6px 0;font-weight:${r.label === 'Kunde' ? 'bold' : 'normal'};">${escapeHtml(r.value)}</td>
        </tr>`,
    )
    .join('\n')

  const html = `<!doctype html>
<html lang="de">
  <body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#333333;">
    <div style="max-width:600px;margin:0 auto;padding:20px;">
      <p>Hallo,</p>
      <p>ein neuer Anruf ist beim KI-Vertriebsassistenten von Wackenhut eingegangen und wartet auf einen Rückruf. Hier die Zusammenfassung:</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
${htmlRows}
      </table>${
        summary
          ? `
      <p style="margin:0 0 4px 0;color:#666666;">Zusammenfassung des Gesprächs:</p>
      <p style="margin:0 0 16px 0;white-space:pre-wrap;">${escapeHtml(summary)}</p>`
          : ''
      }
      <p style="margin:16px 0 4px 0;">
        <a href="${escapeHtml(url)}" style="color:#1a56db;font-weight:bold;">Im Dashboard öffnen – Transkript &amp; Aufnahme</a>
      </p>
      <p style="margin:0 0 16px 0;color:#888888;font-size:12px;word-break:break-all;">${escapeHtml(url)}</p>
      <p>Viele Grüße<br />Wackenhut KI-Vertriebsassistent</p>
    </div>
  </body>
</html>`

  // ---- Plaintext ----
  const textLines: string[] = [
    'Hallo,',
    '',
    'ein neuer Anruf ist beim KI-Vertriebsassistenten von Wackenhut eingegangen',
    'und wartet auf einen Rückruf. Hier die Zusammenfassung:',
    '',
    ...rows.map((r) => `${r.label}: ${r.value}`),
  ]
  if (summary) {
    textLines.push('', 'Zusammenfassung des Gesprächs:', summary)
  }
  textLines.push('', 'Im Dashboard öffnen (Transkript & Aufnahme):', url, '', 'Viele Grüße', 'Wackenhut KI-Vertriebsassistent')

  return { subject, html, text: textLines.join('\n') }
}
