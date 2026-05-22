type CallbackPriority = 'niedrig' | 'mittel' | 'hoch' | 'dringend'
type EscalationLevel = 1 | 2 | 3

export interface EscalationNotificationEmailPayload {
  /** Name of the escalation recipient (LKD / Standortverantwortlicher / …). */
  recipientName: string
  /** Human-readable label of the escalation target stage. */
  stageLabel: string
  /** Name of the escalation rule that fired. */
  ruleName: string
  fromLevel: EscalationLevel
  toLevel: EscalationLevel
  /** Employee currently responsible for the callback (assigned advisor). */
  assignedAdvisor: string
  /** Who originally took the callback (agent / KI). */
  takenByName: string
  customerName: string
  customerPhone: string
  reason: string
  notes?: string
  priority: CallbackPriority
  createdAt: string
  dueAt: string
  /** Original SLA processing window in minutes. */
  slaDurationMinutes: number
  /** The rule's trigger threshold in seconds (e.g. 30) — used to explain why the rule fired. */
  triggerSeconds: number
  /** Seconds elapsed since the callback was created (= since it became due in the demo). */
  elapsedSeconds: number
  /** Seconds the callback is past its SLA deadline (0 if not yet overdue). */
  overdueSeconds: number
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
    second: '2-digit',
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

/** Renders a duration in seconds as a compact German label, e.g. "1 Min. 30 Sek." */
export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds))
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const rest = seconds % 60

  const parts: string[] = []
  if (hours > 0) parts.push(`${hours} Std.`)
  if (minutes > 0) parts.push(`${minutes} Min.`)
  if (rest > 0 || parts.length === 0) parts.push(`${rest} Sek.`)
  return parts.join(' ')
}

export function renderEscalationNotificationEmail(payload: EscalationNotificationEmailPayload): {
  subject: string
  html: string
  text: string
} {
  const recipientName = escapeHtml(payload.recipientName)
  const stageLabel = escapeHtml(payload.stageLabel)
  const assignedAdvisor = escapeHtml(payload.assignedAdvisor)
  const takenByName = escapeHtml(payload.takenByName)
  const customerName = escapeHtml(payload.customerName)
  const customerPhone = escapeHtml(payload.customerPhone)
  const reason = escapeHtml(payload.reason)
  const notes = payload.notes?.trim() ? escapeHtml(payload.notes.trim()) : ''
  const priorityText = priorityLabel(payload.priority)
  const createdAt = formatDateTime(payload.createdAt)
  const dueAt = formatDateTime(payload.dueAt)
  const completionUrl = payload.completionUrl ? escapeHtml(payload.completionUrl) : ''

  const overduePhrase =
    payload.overdueSeconds > 0
      ? `seit ${formatDuration(payload.overdueSeconds)} überfällig`
      : 'noch innerhalb der SLA-Frist'
  const overdueValue =
    payload.overdueSeconds > 0 ? formatDuration(payload.overdueSeconds) : 'noch nicht überfällig'
  const ruleExplanation = `Rückruf wurde ${formatDuration(payload.triggerSeconds)} nach Erstellung nicht bearbeitet`
  const slaText = `${payload.slaDurationMinutes} Min.`

  // The final stage (3 — Standortverantwortlicher) gets a distinctly more
  // urgent framing: it means BOTH the responsible advisor (stage 1) and the
  // service/sales lead notified at stage 2 already failed to react.
  const isFinalStage = payload.toLevel === 3

  const subject = isFinalStage
    ? `LETZTE ESKALATIONSSTUFE: Rückruf ${payload.customerName} seit Langem unbearbeitet`
    : `Eskalation (${payload.stageLabel}): Rückruf ${payload.customerName} unbearbeitet`

  // Two parallel row sets: escaped values for HTML, raw values for plain text.
  // Order intentionally tells the story: stage → why it fired → who failed
  // (the recipient's own team member) → who took it → customer → timeline
  // (created / due / overdue) → contact / reason / priority / SLA window.
  const boldLabels = new Set(['Zuständiger Mitarbeiter (aus Ihrem Team)', 'Kunde', 'Überfällig seit'])
  const rows: Array<[string, string, string]> = [
    ['Eskalationsstufe', stageLabel, payload.stageLabel],
    ['Ausgelöste Regel', escapeHtml(ruleExplanation), ruleExplanation],
    ['Zuständiger Mitarbeiter (aus Ihrem Team)', assignedAdvisor, payload.assignedAdvisor],
    ['Angenommen von', takenByName, payload.takenByName],
    ['Kunde', customerName, payload.customerName],
    ['Rückruf erstellt am', createdAt, createdAt],
    ['Fällig bis (SLA-Frist)', dueAt, dueAt],
    ['Überfällig seit', escapeHtml(overdueValue), overdueValue],
    ['Telefon', customerPhone, payload.customerPhone],
    ['Anliegen', reason, payload.reason],
    ['Priorität', priorityText, priorityText],
    ['Vorgesehene Bearbeitungszeit', slaText, slaText],
  ]

  const tableRows = rows
    .map(
      ([label, value]) => `        <tr>
          <td style="padding:6px 12px 6px 0;color:#666666;vertical-align:top;white-space:nowrap;">${escapeHtml(label)}</td>
          <td style="padding:6px 0;font-weight:${boldLabels.has(label) ? 'bold' : 'normal'};">${value}</td>
        </tr>`,
    )
    .join('\n')

  const headerLabel = isFinalStage
    ? 'Letzte Eskalationsstufe — dringender Handlungsbedarf'
    : 'Automatische Eskalation'

  const introHtml = isFinalStage
    ? `      <p>Hallo ${recipientName},</p>
      <p>dieser Rückruf hat die <strong>letzte Eskalationsstufe</strong> erreicht und liegt nun bei Ihnen als <strong>Standortverantwortlichem</strong>. Beide vorgelagerten Stufen sind bereits verstrichen, ohne dass reagiert wurde:</p>
      <div style="border-left:4px solid #b91c1c;background:#fef2f2;padding:12px 16px;margin:16px 0;border-radius:4px;">
        <p style="margin:0 0 8px;font-weight:bold;color:#b91c1c;">Warum Sie diese E-Mail erhalten</p>
        <ul style="margin:0;padding-left:18px;">
          <li>Stufe 1: Der zuständige Serviceberater/Verkäufer <strong>${assignedAdvisor}</strong> hat den Rückruf nicht bearbeitet.</li>
          <li>Stufe 2: Auch der daraufhin informierte <strong>Leiter Kundendienst / Verkaufsleiter</strong> (Teamleiter) hat nicht reagiert.</li>
        </ul>
        <p style="margin:8px 0 0;">Der Rückruf ist <strong>${overduePhrase}</strong> — also seit erheblicher Zeit offen. Als Standortverantwortlicher sind Sie die <strong>letzte Eskalationsinstanz</strong>; bitte umgehend handeln.</p>
      </div>`
    : `      <p>Hallo ${recipientName},</p>
      <p>ein Rückruf wurde nicht fristgerecht bearbeitet und daher automatisch an Sie eskaliert (<strong>${stageLabel}</strong>). Hier die Details:</p>`

  const closingHtml = isFinalStage
    ? '<p style="font-weight:bold;color:#b91c1c;">Dies ist die letzte automatische Eskalationsstufe — bitte umgehend bearbeiten.</p>'
    : '<p>Bitte um zeitnahe Bearbeitung.</p>'

  const html = `<!doctype html>
<html lang="de">
  <body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#333333;">
    <div style="max-width:600px;margin:0 auto;padding:20px;">
      <p style="margin:0 0 4px;font-size:13px;color:#b91c1c;font-weight:bold;text-transform:uppercase;letter-spacing:0.5px;">${escapeHtml(headerLabel)}</p>
${introHtml}
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
${tableRows}
      </table>${notes ? `
      <p><strong>Notizen:</strong> ${notes}</p>` : ''}${completionUrl ? `
      <p style="margin-top:16px;"><a href="${completionUrl}" style="display:inline-block;background:#1d4ed8;color:#ffffff;padding:10px 18px;border-radius:6px;text-decoration:none;">Rückruf als erledigt markieren</a></p>` : ''}
      ${closingHtml}
      <p>Viele Grüße<br />Wackenhut Callcenter</p>
    </div>
  </body>
</html>`

  const introTextLines = isFinalStage
    ? [
        `LETZTE ESKALATIONSSTUFE (${payload.stageLabel}) — DRINGENDER HANDLUNGSBEDARF`,
        '',
        `Hallo ${payload.recipientName},`,
        '',
        'dieser Rückruf hat die letzte Eskalationsstufe erreicht und liegt nun bei Ihnen als Standortverantwortlichem. Beide vorgelagerten Stufen sind bereits verstrichen, ohne dass reagiert wurde:',
        '',
        `- Stufe 1: Der zuständige Serviceberater/Verkäufer ${payload.assignedAdvisor} hat den Rückruf nicht bearbeitet.`,
        '- Stufe 2: Auch der daraufhin informierte Leiter Kundendienst / Verkaufsleiter (Teamleiter) hat nicht reagiert.',
        '',
        `Der Rückruf ist ${overduePhrase} — also seit erheblicher Zeit offen. Als Standortverantwortlicher sind Sie die letzte Eskalationsinstanz; bitte umgehend handeln.`,
        '',
        'Details:',
      ]
    : [
        `AUTOMATISCHE ESKALATION (${payload.stageLabel})`,
        '',
        `Hallo ${payload.recipientName},`,
        '',
        'ein Rückruf wurde nicht fristgerecht bearbeitet und daher automatisch an Sie eskaliert. Hier die Details:',
      ]

  const textLines = [
    ...introTextLines,
    '',
    ...rows.map(([label, , rawValue]) => `${label}: ${rawValue}`),
  ]

  if (payload.notes?.trim()) {
    textLines.push('', `Notizen: ${payload.notes.trim()}`)
  }

  if (payload.completionUrl?.trim()) {
    textLines.push('', 'Rückruf als erledigt markieren:', payload.completionUrl.trim())
  }

  textLines.push(
    '',
    isFinalStage
      ? 'Dies ist die letzte automatische Eskalationsstufe — bitte umgehend bearbeiten.'
      : 'Bitte um zeitnahe Bearbeitung.',
    '',
    'Viele Grüße',
    'Wackenhut Callcenter',
  )

  return {
    subject,
    html,
    text: textLines.join('\n'),
  }
}
