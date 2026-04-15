'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Bell, Eye, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCallbackStore } from '@/lib/stores/callback-store'
import { useBrowserNotifications } from '@/lib/hooks/use-browser-notifications'
import type { Reminder } from '@/lib/types'

interface ReminderToastProps {
  onViewCallback?: (callbackId: string) => void
}

export function CallcenterReminderToast({ onViewCallback }: ReminderToastProps) {
  const reminders = useCallbackStore((s) => s.reminders)
  const callbacks = useCallbackStore((s) => s.callbacks)
  const dismissReminder = useCallbackStore((s) => s.dismissReminder)
  const completeReminder = useCallbackStore((s) => s.completeReminder)
  const { notify: notifyBrowser } = useBrowserNotifications()
  const [nowTs, setNowTs] = useState(() => Date.now())

  const shownTimestamps = useRef<Map<string, number>>(new Map())
  const notifiedReminderIds = useRef<Set<string>>(new Set())
  const notifiedDueCallbackIds = useRef<Set<string>>(new Set())

  // Determine which reminders are due
  const dueReminders = reminders.filter(
    (r) => r.status === 'ausstehend' && new Date(r.reminderAt).getTime() <= nowTs
  )

  // Auto-dismiss after 30 seconds
  const autoDismiss = useCallback(
    (reminder: Reminder) => {
      const shownAt = shownTimestamps.current.get(reminder.id)
      if (shownAt && Date.now() - shownAt >= 30_000) {
        dismissReminder(reminder.id)
        shownTimestamps.current.delete(reminder.id)
      }
    },
    [dismissReminder]
  )

  // Track when reminders first become visible + fire browser notification once
  useEffect(() => {
    for (const r of dueReminders) {
      if (!shownTimestamps.current.has(r.id)) {
        shownTimestamps.current.set(r.id, Date.now())
      }
      if (!notifiedReminderIds.current.has(r.id)) {
        notifiedReminderIds.current.add(r.id)
        const cb = callbacks.find((c) => c.id === r.callbackId)
        notifyBrowser('Erinnerung: Rückruf fällig', {
          body: cb
            ? `${cb.customerName} — ${r.message || cb.reason}`
            : r.message,
          tag: `reminder-${r.id}`,
        })
      }
    }
  }, [dueReminders, callbacks, notifyBrowser])

  // Fire a browser notification when a callback's dueAt passes (once per cb).
  useEffect(() => {
    const now = Date.now()
    for (const cb of callbacks) {
      if (cb.status === 'erledigt') continue
      if (!cb.dueAt) continue
      if (notifiedDueCallbackIds.current.has(cb.id)) continue
      const dueTime = new Date(cb.dueAt).getTime()
      if (Number.isNaN(dueTime) || dueTime > now) continue
      notifiedDueCallbackIds.current.add(cb.id)
      notifyBrowser('Rückruf jetzt fällig', {
        body: `${cb.customerName} — ${cb.reason}\nZugewiesen an ${cb.assignedAdvisor}`,
        tag: `callback-due-${cb.id}`,
      })
    }
  }, [callbacks, notifyBrowser])

  // Polling interval: check every 10 seconds for auto-dismiss, newly due
  // reminders, and callbacks whose dueAt has just passed.
  useEffect(() => {
    const interval = setInterval(() => {
      const state = useCallbackStore.getState()
      const now = Date.now()
      setNowTs(now)

      const currentDue = state.reminders.filter(
        (r) =>
          r.status === 'ausstehend' &&
          new Date(r.reminderAt).getTime() <= now
      )

      for (const r of currentDue) {
        autoDismiss(r)
        if (!notifiedReminderIds.current.has(r.id)) {
          notifiedReminderIds.current.add(r.id)
          const cb = state.callbacks.find((c) => c.id === r.callbackId)
          notifyBrowser('Erinnerung: Rückruf fällig', {
            body: cb
              ? `${cb.customerName} — ${r.message || cb.reason}`
              : r.message,
            tag: `reminder-${r.id}`,
          })
        }
      }

      for (const cb of state.callbacks) {
        if (cb.status === 'erledigt') continue
        if (!cb.dueAt) continue
        if (notifiedDueCallbackIds.current.has(cb.id)) continue
        const dueTime = new Date(cb.dueAt).getTime()
        if (Number.isNaN(dueTime) || dueTime > now) continue
        notifiedDueCallbackIds.current.add(cb.id)
        notifyBrowser('Rückruf jetzt fällig', {
          body: `${cb.customerName} — ${cb.reason}\nZugewiesen an ${cb.assignedAdvisor}`,
          tag: `callback-due-${cb.id}`,
        })
      }
    }, 10_000)

    return () => clearInterval(interval)
  }, [autoDismiss, notifyBrowser])

  const getCallbackCustomerName = (callbackId: string): string => {
    const cb = callbacks.find((c) => c.id === callbackId)
    return cb?.customerName ?? 'Unbekannt'
  }

  const handleView = (reminder: Reminder) => {
    onViewCallback?.(reminder.callbackId)
    dismissReminder(reminder.id)
    shownTimestamps.current.delete(reminder.id)
  }

  const handleComplete = (reminder: Reminder) => {
    completeReminder(reminder.id)
    shownTimestamps.current.delete(reminder.id)
  }

  if (dueReminders.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {dueReminders.map((reminder) => (
        <div
          key={reminder.id}
          className={cn(
            'w-80 rounded-lg border bg-card p-4 shadow-lg',
            'animate-in slide-in-from-right-full duration-300'
          )}
        >
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
              <Bell className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">
                {getCallbackCustomerName(reminder.callbackId)}
              </p>
              {reminder.message && (
                <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                  {reminder.message}
                </p>
              )}
              <div className="mt-2 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => handleView(reminder)}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Anzeigen
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => handleComplete(reminder)}
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Erledigt
                </Button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
