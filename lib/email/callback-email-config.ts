export const VERENA_SCHWAB_EMPLOYEE_ID = 'emp-vs'
export const VERENA_SCHWAB_NAME = 'Verena Schwab'
export const VERENA_SCHWAB_EMAIL = 'v.schwab@wackenhut.de'
export const CALLBACK_NOTIFICATION_EMAIL_UNAVAILABLE_MESSAGE =
  'Der E-Mail-Versand ist derzeit nicht verfuegbar. Bitte Admin kontaktieren.'

// Client components only use these values as a last-resort fallback. The actual
// recipient is resolved server-side and exposed via the notification API.
export const CALLBACK_NOTIFICATION_RECIPIENT_EMAIL =
  VERENA_SCHWAB_EMAIL

export const CALLBACK_NOTIFICATION_RECIPIENT_NAME =
  VERENA_SCHWAB_NAME
