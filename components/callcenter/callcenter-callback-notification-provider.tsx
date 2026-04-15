'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useBrowserNotifications } from '@/lib/hooks/use-browser-notifications'
import { useCallbackStore } from '@/lib/stores/callback-store'
import {
  getSeenCallbackNotificationActivityIds,
  markCallbackNotificationActivitySeen,
} from '@/lib/callcenter/callback-notification-client'
import type { Callback, CallbackActivity } from '@/lib/types'

const CALLBACK_REFRESH_INTERVAL_MS = 10_000

interface CallbackEmailNotificationEntry {
  callback: Callback
  activity: CallbackActivity
}

function formatDueAt(dueAt: string) {
  return new Date(dueAt).toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function isCallbackNotificationEmail(activity: CallbackActivity) {
  return (
    activity.type === 'email_gesendet'
    && activity.metadata?.emailKind === 'callback_benachrichtigung'
  )
}

export function CallcenterCallbackNotificationProvider() {
  const callbacks = useCallbackStore((state) => state.callbacks)
  const loadPersistedCallbacks = useCallbackStore((state) => state.loadPersistedCallbacks)
  const { notify: notifyBrowser } = useBrowserNotifications()

  const seenActivityIdsRef = useRef<Set<string>>(new Set())
  const isPrimedRef = useRef(false)

  const collectNotificationEntries = useCallback((items: Callback[]): CallbackEmailNotificationEntry[] => {
    return items.flatMap((callback) =>
      callback.activityLog
        .filter(isCallbackNotificationEmail)
        .map((activity) => ({ callback, activity })),
    )
  }, [])

  useEffect(() => {
    let cancelled = false

    const refreshCallbacks = async () => {
      try {
        await loadPersistedCallbacks()
      } catch (error) {
        if (!cancelled) {
          console.error(error)
        }
      }
    }

    void (async () => {
      await refreshCallbacks()

      const seenActivityIds = seenActivityIdsRef.current
      for (const activityId of getSeenCallbackNotificationActivityIds()) {
        seenActivityIds.add(activityId)
      }

      for (const entry of collectNotificationEntries(useCallbackStore.getState().callbacks)) {
        seenActivityIds.add(entry.activity.id)
      }

      isPrimedRef.current = true
    })()

    const interval = setInterval(() => {
      void refreshCallbacks()
    }, CALLBACK_REFRESH_INTERVAL_MS)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [collectNotificationEntries, loadPersistedCallbacks])

  useEffect(() => {
    if (!isPrimedRef.current) return

    const seenActivityIds = seenActivityIdsRef.current
    for (const activityId of getSeenCallbackNotificationActivityIds()) {
      seenActivityIds.add(activityId)
    }

    for (const entry of collectNotificationEntries(callbacks)) {
      if (seenActivityIds.has(entry.activity.id)) continue

      seenActivityIds.add(entry.activity.id)
      markCallbackNotificationActivitySeen(entry.activity.id)

      notifyBrowser('Neuer Rueckruf geplant', {
        body:
          `${entry.callback.customerName} — ${entry.callback.reason}\n`
          + `Geplant fuer ${formatDueAt(entry.callback.dueAt)}`,
        tag: `callback-email-${entry.activity.id}`,
        onClick: () => {
          window.location.assign('/callcenter')
        },
      })
    }
  }, [callbacks, collectNotificationEntries, notifyBrowser])

  return null
}
