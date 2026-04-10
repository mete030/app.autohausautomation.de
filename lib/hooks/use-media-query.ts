'use client'

import { useSyncExternalStore } from 'react'

/**
 * SSR-safe media query hook.
 *
 * Returns `false` during SSR and on the very first client render so that
 * the markup matches the server, then immediately reconciles to the real
 * `matchMedia` result on the client.
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (callback) => subscribe(query, callback),
    () => getSnapshot(query),
    () => false,
  )
}

function subscribe(query: string, callback: () => void): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return () => {}
  }
  const mql = window.matchMedia(query)
  // Safari < 14 doesn't support addEventListener on MediaQueryList
  if (typeof mql.addEventListener === 'function') {
    mql.addEventListener('change', callback)
    return () => mql.removeEventListener('change', callback)
  }
  mql.addListener(callback)
  return () => mql.removeListener(callback)
}

function getSnapshot(query: string): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false
  }
  return window.matchMedia(query).matches
}

/** Convenience: matches Tailwind's `md:` breakpoint (>=768px). */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 768px)')
}

/** Tablet range used for adaptive shell/layout decisions. */
export function useIsTablet(): boolean {
  return useMediaQuery('(min-width: 768px) and (max-width: 1279.98px)')
}

/** Large desktop range where the full navigation/sidebar should expand. */
export function useIsLargeDesktop(): boolean {
  return useMediaQuery('(min-width: 1280px)')
}
