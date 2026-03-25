export const VERENA_SCHWAB_EMPLOYEE_ID = 'emp-vs'
export const VERENA_SCHWAB_NAME = 'Verena Schwab'
export const VERENA_SCHWAB_EMAIL = 'v.schwab@wackenhut.de'
export const CALLBACK_NOTIFICATION_EMAIL_UNAVAILABLE_MESSAGE =
  'Der E-Mail-Versand ist derzeit nicht verfuegbar. Bitte Admin kontaktieren.'

// The same public env value is used for the visible UI hint and the server-side
// mail target so test/live switches only require changing one setting.
export const CALLBACK_NOTIFICATION_RECIPIENT_EMAIL =
  process.env.NEXT_PUBLIC_CALLBACK_NOTIFICATION_RECIPIENT_EMAIL ?? VERENA_SCHWAB_EMAIL

export const CALLBACK_NOTIFICATION_RECIPIENT_NAME =
  process.env.NEXT_PUBLIC_CALLBACK_NOTIFICATION_RECIPIENT_NAME ?? VERENA_SCHWAB_NAME
