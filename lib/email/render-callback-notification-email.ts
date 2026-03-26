type CallbackPriority = 'niedrig' | 'mittel' | 'hoch' | 'dringend'
type CallbackStatus = 'offen' | 'in_bearbeitung' | 'erledigt' | 'ueberfaellig'

export interface CallbackNotificationEmailPayload {
  recipientName: string
  salespersonName: string
  customerName: string
  customerPhone: string
  reason: string
  notes?: string
  priority: CallbackPriority
  status: CallbackStatus
  dueAt: string
  slaDeadline: string
  takenByName: string
  sentBy: string
  completionUrl?: string
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
  return new Date(iso).toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function priorityLabel(priority: CallbackPriority): string {
  switch (priority) {
    case 'dringend':
      return 'Dringend'
    case 'hoch':
      return 'Hoch'
    case 'mittel':
      return 'Mittel'
    case 'niedrig':
      return 'Niedrig'
  }
}

function statusLabel(status: CallbackStatus): string {
  switch (status) {
    case 'offen':
      return 'Offen'
    case 'in_bearbeitung':
      return 'In Bearbeitung'
    case 'erledigt':
      return 'Erledigt'
    case 'ueberfaellig':
      return 'Überfällig'
  }
}

export function renderCallbackNotificationEmail(payload: CallbackNotificationEmailPayload): {
  subject: string
  html: string
  text: string
} {
  const recipientName = escapeHtml(payload.recipientName)
  const salespersonName = escapeHtml(payload.salespersonName)
  const customerName = escapeHtml(payload.customerName)
  const customerPhone = escapeHtml(payload.customerPhone)
  const reason = escapeHtml(payload.reason)
  const notes = payload.notes?.trim() ? escapeHtml(payload.notes.trim()) : ''
  const takenByName = escapeHtml(payload.takenByName)
  const sentBy = escapeHtml(payload.sentBy)
  const priorityText = priorityLabel(payload.priority)
  const statusText = statusLabel(payload.status)
  const dueAt = formatDateTime(payload.dueAt)
  const slaDeadline = formatDateTime(payload.slaDeadline)
  const completionUrl = payload.completionUrl ? escapeHtml(payload.completionUrl) : ''

  const subject = `Rückruf-Info: ${payload.customerName}`

  const html = `<!doctype html>
<html lang="de">
  <body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#333333;">
    <div style="max-width:600px;margin:0 auto;padding:20px;">
      <p>Hallo ${recipientName},</p>
      <p>es wurde ein neuer Rückruf angelegt. Hier die Details:</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr>
          <td style="padding:6px 12px 6px 0;color:#666666;vertical-align:top;">Kunde</td>
          <td style="padding:6px 0;font-weight:bold;">${customerName}</td>
        </tr>
        <tr>
          <td style="padding:6px 12px 6px 0;color:#666666;vertical-align:top;">Telefon</td>
          <td style="padding:6px 0;">${customerPhone}</td>
        </tr>
        <tr>
          <td style="padding:6px 12px 6px 0;color:#666666;vertical-align:top;">Anliegen</td>
          <td style="padding:6px 0;">${reason}</td>
        </tr>
        <tr>
          <td style="padding:6px 12px 6px 0;color:#666666;vertical-align:top;">Priorität</td>
          <td style="padding:6px 0;">${priorityText}</td>
        </tr>
        <tr>
          <td style="padding:6px 12px 6px 0;color:#666666;vertical-align:top;">Status</td>
          <td style="padding:6px 0;">${statusText}</td>
        </tr>
        <tr>
          <td style="padding:6px 12px 6px 0;color:#666666;vertical-align:top;">Zuständig</td>
          <td style="padding:6px 0;">${salespersonName}</td>
        </tr>
        <tr>
          <td style="padding:6px 12px 6px 0;color:#666666;vertical-align:top;">Fällig bis</td>
          <td style="padding:6px 0;">${dueAt}</td>
        </tr>
        <tr>
          <td style="padding:6px 12px 6px 0;color:#666666;vertical-align:top;">SLA-Frist</td>
          <td style="padding:6px 0;">${slaDeadline}</td>
        </tr>
        <tr>
          <td style="padding:6px 12px 6px 0;color:#666666;vertical-align:top;">Angenommen von</td>
          <td style="padding:6px 0;">${takenByName}</td>
        </tr>
        <tr>
          <td style="padding:6px 12px 6px 0;color:#666666;vertical-align:top;">Gesendet von</td>
          <td style="padding:6px 0;">${sentBy}</td>
        </tr>
      </table>${notes ? `
      <p><strong>Notizen:</strong> ${notes}</p>` : ''}${completionUrl ? `
      <p>Rückruf abschließen: ${completionUrl}</p>` : ''}
      <p>Viele Grüße<br />Wackenhut Callcenter</p>
    </div>
  </body>
</html>`

  const textLines = [
    `Hallo ${payload.recipientName},`,
    '',
    'es wurde ein neuer Rückruf angelegt. Hier die Details:',
    '',
    `Kunde: ${payload.customerName}`,
    `Telefon: ${payload.customerPhone}`,
    `Anliegen: ${payload.reason}`,
    `Priorität: ${priorityText}`,
    `Status: ${statusText}`,
    `Zuständig: ${payload.salespersonName}`,
    `Fällig bis: ${dueAt}`,
    `SLA-Frist: ${slaDeadline}`,
    `Angenommen von: ${payload.takenByName}`,
    `Gesendet von: ${payload.sentBy}`,
  ]

  if (payload.notes?.trim()) {
    textLines.push('', `Notizen: ${payload.notes.trim()}`)
  }

  if (payload.completionUrl?.trim()) {
    textLines.push(
      '',
      'Rückruf abschließen:',
      payload.completionUrl.trim(),
    )
  }

  textLines.push('', 'Viele Grüße', 'Wackenhut Callcenter')

  return {
    subject,
    html,
    text: textLines.join('\n'),
  }
}
