import { NextRequest, NextResponse } from 'next/server'

/**
 * App-weiter Basis-Schutz per HTTP Basic Auth (ein gemeinsames Passwort).
 *
 * Zweck: Solange es (noch) kein echtes Login-/Session-System gibt, dürfen die
 * Seiten + API-Routen mit echten Kundendaten (Name, Telefon, Transkript,
 * Aufnahme) nicht ungeschützt öffentlich erreichbar sein (DSGVO/AVV). Statt
 * einer Login-Seite fragt der Browser das Passwort selbst ab.
 *
 * Aktiv NUR, wenn BASIC_AUTH_USER + BASIC_AUTH_PASSWORD gesetzt sind — sonst
 * Pass-through (z. B. lokale Entwicklung; und sicheres Roll-out: erst nach dem
 * Setzen der Variablen in Vercel greift der Schutz, kein versehentliches
 * Aussperren beim Deploy).
 *
 * Ausgenommen: /api/webhooks/* — Famulor & andere Maschinen können kein
 * Passwort eingeben; diese Routen sind durch ihr eigenes Secret geschützt.
 */

// Maschinen-Endpunkte ohne Basic Auth (eigene Secret-Prüfung in der Route).
const PUBLIC_PREFIXES = ['/api/webhooks']

/** Längen-konstanter String-Vergleich (mindert Timing-Seitenkanäle). */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

function unauthorized(): NextResponse {
  return new NextResponse('Authentifizierung erforderlich.', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Wackenhut", charset="UTF-8"' },
  })
}

export function middleware(req: NextRequest): NextResponse {
  const { pathname } = req.nextUrl

  // Webhooks (Famulor etc.) immer durchlassen.
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  const expectedUser = process.env.BASIC_AUTH_USER
  const expectedPass = process.env.BASIC_AUTH_PASSWORD

  // Nicht konfiguriert → Schutz aus (Pass-through).
  if (!expectedUser || !expectedPass) {
    return NextResponse.next()
  }

  const header = req.headers.get('authorization')
  if (header?.startsWith('Basic ')) {
    try {
      const decoded = atob(header.slice(6)) // "user:pass"
      const sep = decoded.indexOf(':')
      if (sep !== -1) {
        const user = decoded.slice(0, sep)
        const pass = decoded.slice(sep + 1)
        // Beide Vergleiche immer ausführen (kein Early-Out → weniger Timing-Leak).
        const ok = safeEqual(user, expectedUser) && safeEqual(pass, expectedPass)
        if (ok) return NextResponse.next()
      }
    } catch {
      /* ungültiges Base64 → 401 */
    }
  }

  return unauthorized()
}

export const config = {
  // Alles prüfen AUSSER Next-Interna und statischen Assets.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|avif|woff|woff2|ttf|otf|map)$).*)',
  ],
}
