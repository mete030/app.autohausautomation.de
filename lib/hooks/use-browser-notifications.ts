'use client'

import { useCallback, useSyncExternalStore } from 'react'

export type BrowserNotificationPermission = 'default' | 'granted' | 'denied' | 'unsupported'

interface NotifyOptions extends NotificationOptions {
  onClick?: () => void
}

function getSnapshot(): BrowserNotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
  return window.Notification.permission as BrowserNotificationPermission
}

function getServerSnapshot(): BrowserNotificationPermission {
  return 'default'
}

// Permission changes are driven by requestPermission() below, plus the optional
// Permissions API if available. We subscribe to both so the UI updates without
// a manual refresh when the user flips the switch in browser settings.
function subscribe(notify: () => void): () => void {
  if (typeof window === 'undefined') return () => {}

  let cleanup: (() => void) | undefined

  const handleWindowEvent = () => notify()
  window.addEventListener('browser-notification-permission-change', handleWindowEvent)

  if ('permissions' in navigator) {
    navigator.permissions
      .query({ name: 'notifications' as PermissionName })
      .then((status) => {
        const onChange = () => notify()
        status.addEventListener('change', onChange)
        cleanup = () => status.removeEventListener('change', onChange)
      })
      .catch(() => {
        // Permissions API not supported for notifications — ignore.
      })
  }

  return () => {
    window.removeEventListener('browser-notification-permission-change', handleWindowEvent)
    cleanup?.()
  }
}

export function useBrowserNotifications() {
  const permission = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const requestPermission = useCallback(async (): Promise<BrowserNotificationPermission> => {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
    const result = await window.Notification.requestPermission()
    window.dispatchEvent(new Event('browser-notification-permission-change'))
    return result as BrowserNotificationPermission
  }, [])

  const notify = useCallback((title: string, options?: NotifyOptions): Notification | null => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.debug('[browser-notify] skipped: Notification API not supported')
      return null
    }
    if (window.Notification.permission !== 'granted') {
      console.debug('[browser-notify] skipped: permission is', window.Notification.permission)
      return null
    }

    const { onClick, ...rest } = options ?? {}
    try {
      const notification = new window.Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...rest,
      })
      console.debug('[browser-notify] fired', { title, tag: rest.tag })

      if (onClick) {
        notification.onclick = () => {
          window.focus()
          onClick()
          notification.close()
        }
      }

      return notification
    } catch (err) {
      console.warn('[browser-notify] failed to construct Notification', err)
      return null
    }
  }, [])

  return { permission, requestPermission, notify }
}
