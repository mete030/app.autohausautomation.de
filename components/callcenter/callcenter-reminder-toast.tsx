'use client'

import { useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Bell, Eye, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCallbackStore } from '@/lib/stores/callback-store'
import type { Reminder } from '@/lib/types'

interface ReminderToastProps {
  onViewCallback?: (callbackId: string) => void
}

export function CallcenterReminderToast({ onViewCallback }: ReminderToastProps) {
  const reminders = useCallbackStore((s) => s.reminders)
  const callbacks = useCallbackStore((s) => s.callbacks)
  const dismissReminder = useCallbackStore((s) => s.dismissReminder)
  const completeReminder = useCallbackStore((s) => s.completeReminder)

  const shownTimestamps = useRef<Map<string, number>>(new Map())

  // Determine which reminders are due
  const now = Date.now()
  const dueReminders = reminders.filter(
    (r) => r.status === 'ausstehend' && new Date(r.reminderAt).getTime() <= now
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

  // Track when reminders first become visible
  useEffect(() => {
    for (const r of dueReminders) {
      if (!shownTimestamps.current.has(r.id)) {
        shownTimestamps.current.set(r.id, Date.now())
      }
    }
  }, [dueReminders])

  // Polling interval: check every 10 seconds for auto-dismiss and new reminders
  useEffect(() => {
    const interval = setInterval(() => {
      // Force re-render to pick up newly due reminders
      // and auto-dismiss expired ones
      const currentDue = useCallbackStore
        .getState()
        .reminders.filter(
          (r) =>
            r.status === 'ausstehend' &&
            new Date(r.reminderAt).getTime() <= Date.now()
        )

      for (const r of currentDue) {
        autoDismiss(r)
      }
    }, 10_000)

    return () => clearInterval(interval)
  }, [autoDismiss])

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
