import 'server-only'

export const CALLBACK_PERSISTENCE_UNAVAILABLE_MESSAGE =
  'Die Rückruf-Persistenz ist noch nicht konfiguriert. Bitte DATABASE_URL setzen und die Prisma-Tabellen anlegen.'

export function isCallbackPersistenceConfigured() {
  return Boolean(process.env.DATABASE_URL?.trim())
}
