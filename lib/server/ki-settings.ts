import 'server-only'

import { getPrismaClient } from '@/lib/db/prisma'

// Schlichter Key-Value-Store für KI-Feature-Flags (DB-persistiert, damit der
// Webhook-Handler den Schalter zur Laufzeit lesen kann — ohne Redeploy).

const AUTO_FORWARD_LEAD_KEY = 'auto_forward_lead_enabled'

/** Ist die automatische Weiterleitung neuer Anrufe an lead@wackenhut.de aktiv? (Default: false) */
export async function getKiAutoForwardLeadEnabled(): Promise<boolean> {
  const prisma = getPrismaClient()
  const row = await prisma.kiSetting.findUnique({ where: { key: AUTO_FORWARD_LEAD_KEY } })
  return row?.value === 'true'
}

/** Schaltet die automatische Lead-Weiterleitung ein/aus. */
export async function setKiAutoForwardLeadEnabled(enabled: boolean): Promise<boolean> {
  const prisma = getPrismaClient()
  const value = enabled ? 'true' : 'false'
  await prisma.kiSetting.upsert({
    where: { key: AUTO_FORWARD_LEAD_KEY },
    update: { value },
    create: { key: AUTO_FORWARD_LEAD_KEY, value },
  })
  return enabled
}
