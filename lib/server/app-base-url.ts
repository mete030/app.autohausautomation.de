import type { NextRequest } from 'next/server'

/**
 * Resolves the canonical base URL used to build absolute links inside emails
 * (e.g. the "Rückruf abschließen" completion link).
 *
 * Why not just use `req.nextUrl.origin`? That reflects the host of the incoming
 * request. In local development it is `http://localhost:<port>`, so a callback
 * created via `npm run dev` would embed a localhost link into the production-bound
 * email. To guarantee a stable, public link we prefer an explicitly configured
 * domain and only fall back to the request origin when none is set.
 *
 * Configure `APP_BASE_URL` (server-side) or `NEXT_PUBLIC_APP_URL` in the
 * environment, e.g. `https://app-autohausautomation-de.vercel.app`.
 */
export function resolveAppBaseUrl(req: NextRequest): string {
  const configured = (
    process.env.APP_BASE_URL ?? process.env.NEXT_PUBLIC_APP_URL
  )?.trim()

  if (configured) {
    // Strip any trailing slash so `new URL(path, base)` resolves predictably.
    return configured.replace(/\/+$/, '')
  }

  return req.nextUrl.origin
}
