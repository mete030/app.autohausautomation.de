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

function priorityColors(priority: CallbackPriority): { bg: string; text: string } {
  switch (priority) {
    case 'dringend':
      return { bg: '#fee2e2', text: '#b91c1c' }
    case 'hoch':
      return { bg: '#ffedd5', text: '#c2410c' }
    case 'mittel':
      return { bg: '#fef3c7', text: '#a16207' }
    case 'niedrig':
      return { bg: '#dcfce7', text: '#15803d' }
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
  const priorityStyle = priorityColors(payload.priority)

  const subject = `Neuer Rückruf: ${payload.customerName} — ${payload.reason}`

  const html = `<!doctype html>
<html lang="de">
  <body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f6f8;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="640" cellspacing="0" cellpadding="0" style="width:640px;max-width:640px;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:28px 32px;background:#111827;color:#ffffff;">
                <div style="font-size:12px;letter-spacing:0.08em;text-transform:uppercase;opacity:0.75;">Callcenter Wackenhut</div>
                <h1 style="margin:12px 0 0;font-size:28px;line-height:1.2;">Neuer Rückruf aus dem Callcenter</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">Hallo ${recipientName},</p>
                <p style="margin:0 0 24px;font-size:15px;line-height:1.6;">
                  es wurde ein neuer Rückruf angelegt. Die wichtigsten Informationen findest du unten.
                </p>

                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:24px;border-collapse:separate;border-spacing:0 12px;">
                  <tr>
                    <td style="padding:16px 18px;border:1px solid #e5e7eb;border-radius:12px;background:#f9fafb;">
                      <div style="font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:#6b7280;margin-bottom:6px;">Kunde</div>
                      <div style="font-size:20px;font-weight:700;color:#111827;">${customerName}</div>
                      <div style="margin-top:8px;font-size:14px;color:#4b5563;">
                        Telefon:
                        <a href="tel:${customerPhone}" style="color:#2563eb;text-decoration:none;">${customerPhone}</a>
                      </div>
                    </td>
                  </tr>
                </table>

                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
                  <tr>
                    <td style="padding:14px 18px;background:#f9fafb;border-bottom:1px solid #e5e7eb;font-size:13px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.08em;">Rückrufdetails</td>
                  </tr>
                  <tr>
                    <td style="padding:18px;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                        <tr>
                          <td style="padding:0 0 14px;font-size:13px;color:#6b7280;width:160px;">Zuständig</td>
                          <td style="padding:0 0 14px;font-size:15px;color:#111827;">${salespersonName}</td>
                        </tr>
                        <tr>
                          <td style="padding:0 0 14px;font-size:13px;color:#6b7280;width:160px;">Anliegen</td>
                          <td style="padding:0 0 14px;font-size:15px;color:#111827;font-weight:600;">${reason}</td>
                        </tr>
                        <tr>
                          <td style="padding:0 0 14px;font-size:13px;color:#6b7280;">Priorität</td>
                          <td style="padding:0 0 14px;">
                            <span style="display:inline-block;padding:6px 10px;border-radius:999px;background:${priorityStyle.bg};color:${priorityStyle.text};font-size:13px;font-weight:700;">
                              ${priorityText}
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:0 0 14px;font-size:13px;color:#6b7280;">Status</td>
                          <td style="padding:0 0 14px;font-size:15px;color:#111827;">${statusText}</td>
                        </tr>
                        <tr>
                          <td style="padding:0 0 14px;font-size:13px;color:#6b7280;">Fällig bis</td>
                          <td style="padding:0 0 14px;font-size:15px;color:#111827;">${dueAt}</td>
                        </tr>
                        <tr>
                          <td style="padding:0 0 14px;font-size:13px;color:#6b7280;">SLA-Frist</td>
                          <td style="padding:0 0 14px;font-size:15px;color:#111827;">${slaDeadline}</td>
                        </tr>
                        <tr>
                          <td style="padding:0 0 14px;font-size:13px;color:#6b7280;">Angenommen von</td>
                          <td style="padding:0 0 14px;font-size:15px;color:#111827;">${takenByName}</td>
                        </tr>
                        <tr>
                          <td style="padding:0;font-size:13px;color:#6b7280;">Ausgelöst von</td>
                          <td style="padding:0;font-size:15px;color:#111827;">${sentBy}</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                ${notes ? `
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:24px;border:1px solid #e5e7eb;border-radius:12px;background:#fff7ed;">
                  <tr>
                    <td style="padding:16px 18px;">
                      <div style="font-size:13px;font-weight:700;color:#9a3412;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px;">Notizen</div>
                      <div style="font-size:15px;line-height:1.6;color:#7c2d12;">${notes}</div>
                    </td>
                  </tr>
                </table>` : ''}

                <p style="margin:24px 0 0;font-size:14px;line-height:1.6;color:#4b5563;">
                  Viele Grüße<br />
                  <strong style="color:#111827;">Wackenhut Callcenter</strong>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`

  const textLines = [
    `Hallo ${payload.recipientName},`,
    '',
    'es wurde ein neuer Rückruf angelegt.',
    '',
    `Zuständig: ${payload.salespersonName}`,
    `Kunde: ${payload.customerName}`,
    `Telefon: ${payload.customerPhone}`,
    `Anliegen: ${payload.reason}`,
    `Priorität: ${priorityText}`,
    `Status: ${statusText}`,
    `Fällig bis: ${dueAt}`,
    `SLA-Frist: ${slaDeadline}`,
    `Angenommen von: ${payload.takenByName}`,
    `Ausgelöst von: ${payload.sentBy}`,
  ]

  if (payload.notes?.trim()) {
    textLines.push('', `Notizen: ${payload.notes.trim()}`)
  }

  textLines.push('', 'Viele Grüße', 'Wackenhut Callcenter')

  return {
    subject,
    html,
    text: textLines.join('\n'),
  }
}
