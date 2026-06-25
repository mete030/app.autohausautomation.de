import 'server-only'

import { getKiAutoForwardLeadEnabled } from '@/lib/server/ki-settings'
import { sendKiBrevoEmail } from '@/lib/server/ki-forward-email'
import { renderKiLeadEmail } from '@/lib/ki-rezeptionist/render-lead-email'
import { kiCategoryConfig } from '@/lib/ki-rezeptionist/ki-reception-config'
import { formatDuration } from '@/lib/ki-rezeptionist/format'
import type { KiReceptionCallDto, FahrzeugZustand } from '@/lib/ki-rezeptionist/types'

// Automatische Weiterleitung jedes NEUEN KI-Anrufs an lead@wackenhut.de
// (dahinter sitzt Oliver Gackenheimer). Hinter dem Dashboard-Feature-Flag
// `auto_forward_lead_enabled` (Default aus) — siehe lib/server/ki-settings.

export const KI_LEAD_FORWARD_EMAIL = 'lead@wackenhut.de'
export const KI_LEAD_FORWARD_NAME = 'Oliver Gackenheimer'

/** Baut den absoluten Deep-Link auf die Konversation im Dashboard. */
export function buildCallDashboardUrl(baseUrl: string, callId: string): string {
  const base = baseUrl.replace(/\/+$/, '')
  return `${base}/ki-rezeptionist?call=${encodeURIComponent(callId)}`
}

/**
 * Schickt — sofern der Flag aktiv ist — eine Zusammenfassung des neuen Anrufs
 * an lead@wackenhut.de. Best effort: Fehler werden nur geloggt (kein PII), nie
 * geworfen, damit der Webhook-Erfolg nicht von der Mail abhängt.
 */
export async function maybeForwardNewCallToLead(
  call: KiReceptionCallDto,
  baseUrl: string,
  fahrzeugZustand?: FahrzeugZustand | null,
): Promise<void> {
  try {
    if (!(await getKiAutoForwardLeadEnabled())) return

    const email = renderKiLeadEmail({
      customerName: call.customerName,
      customerPhone: call.customerPhone,
      categoryLabel: kiCategoryConfig[call.category].label,
      summary: call.summary,
      vehicle: call.vehicle,
      desiredAppt: call.desiredAppt,
      durationLabel: formatDuration(call.callDurationSec),
      receivedAt: call.receivedAt,
      dashboardUrl: buildCallDashboardUrl(baseUrl, call.id),
      fahrzeugZustand,
    })

    await sendKiBrevoEmail({
      recipientEmail: KI_LEAD_FORWARD_EMAIL,
      recipientName: KI_LEAD_FORWARD_NAME,
      subject: email.subject,
      html: email.html,
      text: email.text,
    })

    console.log('[ki-lead-forward] an lead@ gesendet', { id: call.id })
  } catch (error) {
    console.error(
      '[ki-lead-forward] Lead-Weiterleitung fehlgeschlagen:',
      error instanceof Error ? error.message : 'unbekannt',
    )
  }
}
