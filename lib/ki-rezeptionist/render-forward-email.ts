// Rendert die KI-Rückruf-Weiterleitungs-E-Mail.
//
// Bewusst eigenes, schlichtes Template (Inline-CSS, Arial, eine Tabelle, KEINE
// Bilder/Web-Fonts/externen Ressourcen) — identische „blocker-sichere" Bauart
// wie die Callcenter-Mail, aber eigenständig und KI-gebrandet. HTML UND
// Plaintext werden zusammen verschickt.

export interface KiForwardEmailPayload {
  recipientName: string
  /** Name der Person, die weiterleitet (z. B. „Dashboard" / angemeldeter Nutzer). */
  forwardedBy: string
  customerName: string
  customerPhone: string
  /** Menschlich lesbares Anliegen-Label (z. B. „Probefahrt / Besichtigung"). */
  categoryLabel: string
  summary: string
  vehicle?: string | null
  desiredAppt?: string | null
  /** Formatierte Anrufdauer (z. B. „2:14") oder null. */
  durationLabel?: string | null
  /** Anrufzeitpunkt als ISO-String. */
  receivedAt: string
  /** Optionale persönliche Nachricht an den Berater. */
  message?: string | null
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

export function renderKiForwardEmail(payload: KiForwardEmailPayload): {
  subject: string
  html: string
  text: string
} {
  const customerName = payload.customerName.trim() || 'Unbekannt'
  const receivedAt = formatDateTime(payload.receivedAt)
  const message = payload.message?.trim() ?? ''
  const summary = payload.summary?.trim() ?? ''

  // Tabellenzeilen — nur befüllte Felder, in fester, sinnvoller Reihenfolge.
  const rows: Row[] = [
    { label: 'Kunde', value: customerName },
    { label: 'Telefon', value: payload.customerPhone.trim() || '—' },
    { label: 'Anliegen', value: payload.categoryLabel },
  ]
  if (payload.vehicle?.trim()) rows.push({ label: 'Fahrzeug', value: payload.vehicle.trim() })
  if (payload.desiredAppt?.trim()) rows.push({ label: 'Wunschtermin', value: payload.desiredAppt.trim() })
  if (payload.durationLabel?.trim()) rows.push({ label: 'Gesprächsdauer', value: payload.durationLabel.trim() })
  rows.push({ label: 'Eingegangen', value: receivedAt })

  const subject = `${customerName} – bitte zurückrufen`

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
      <p>Hallo ${escapeHtml(payload.recipientName)},</p>
      <p>der KI-Vertriebsassistent von Wackenhut hat einen Anruf entgegengenommen, der einen persönlichen Rückruf braucht. Bitte melde dich zeitnah beim Kunden. Hier die Details:</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
${htmlRows}
      </table>${
        summary
          ? `
      <p style="margin:0 0 4px 0;color:#666666;">Zusammenfassung des Gesprächs:</p>
      <p style="margin:0 0 16px 0;white-space:pre-wrap;">${escapeHtml(summary)}</p>`
          : ''
      }${
        message
          ? `
      <p style="margin:0 0 4px 0;color:#666666;">Nachricht:</p>
      <p style="margin:0 0 16px 0;white-space:pre-wrap;">${escapeHtml(message)}</p>`
          : ''
      }
      <p>Viele Grüße<br />Wackenhut KI-Vertriebsassistent</p>
    </div>
  </body>
</html>`

  // ---- Plaintext ----
  const textLines: string[] = [
    `Hallo ${payload.recipientName},`,
    '',
    'der KI-Vertriebsassistent von Wackenhut hat einen Anruf entgegengenommen,',
    'der einen persönlichen Rückruf braucht. Bitte melde dich zeitnah beim Kunden.',
    '',
    'Hier die Details:',
    '',
    ...rows.map((r) => `${r.label}: ${r.value}`),
  ]
  if (summary) {
    textLines.push('', 'Zusammenfassung des Gesprächs:', summary)
  }
  if (message) {
    textLines.push('', 'Nachricht:', message)
  }
  textLines.push('', 'Viele Grüße', 'Wackenhut KI-Vertriebsassistent')

  return { subject, html, text: textLines.join('\n') }
}
