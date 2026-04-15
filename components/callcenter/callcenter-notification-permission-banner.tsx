'use client'

import { useState } from 'react'
import { Bell, X, BellOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useBrowserNotifications } from '@/lib/hooks/use-browser-notifications'

export function CallcenterNotificationPermissionBanner() {
  const { permission, requestPermission, notify } = useBrowserNotifications()
  const [dismissed, setDismissed] = useState(false)
  const [isRequesting, setIsRequesting] = useState(false)
  const [lastTestStatus, setLastTestStatus] = useState<string | null>(null)

  if (dismissed) return null
  if (permission === 'unsupported') return null

  if (permission === 'granted') {
    const handleTest = () => {
      const nativePermission =
        typeof window !== 'undefined' && 'Notification' in window
          ? window.Notification.permission
          : 'n/a'
      const result = notify('Test-Benachrichtigung', {
        body: 'Wenn du das siehst, funktioniert alles.',
        tag: 'test-notification',
      })
      console.info('[browser-notify] test clicked', {
        nativePermission,
        hookPermission: permission,
        result: result ? 'created' : 'null',
      })
      if (!result) {
        window.alert(
          `Notification konnte nicht erstellt werden.\n`
          + `Native Permission: ${nativePermission}\n`
          + `Hook Permission: ${permission}\n\n`
          + `Pruefe macOS: Systemeinstellungen → Mitteilungen → Browser → "Mitteilungen erlauben" aktivieren.`,
        )
      } else {
        setLastTestStatus('Notification gesendet — falls nicht sichtbar: macOS-Mitteilungen fuer den Browser pruefen.')
      }
    }

    return (
      <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 dark:border-emerald-900/40 dark:bg-emerald-950/20">
        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
          <Bell className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <p className="min-w-0 flex-1 text-xs text-muted-foreground">
          {lastTestStatus ?? 'Browser-Benachrichtigungen sind aktiv.'}
        </p>
        <Button variant="outline" size="sm" onClick={handleTest}>
          Test senden
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 flex-shrink-0"
          onClick={() => setDismissed(true)}
          aria-label="Banner schließen"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  const isDenied = permission === 'denied'

  const handleActivate = async () => {
    setIsRequesting(true)
    try {
      await requestPermission()
    } finally {
      setIsRequesting(false)
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/40 dark:bg-amber-950/20">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
        {isDenied ? (
          <BellOff className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        ) : (
          <Bell className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">
          {isDenied ? 'Browser-Benachrichtigungen sind blockiert' : 'Browser-Benachrichtigungen aktivieren'}
        </p>
        <p className="text-xs text-muted-foreground">
          {isDenied
            ? 'Bitte in den Browser-Einstellungen erlauben, um Rückrufe in Echtzeit zu sehen.'
            : 'Erhalte eine Benachrichtigung, sobald ein neuer Rückruf eingeplant wird oder fällig ist.'}
        </p>
      </div>
      {!isDenied && (
        <Button size="sm" onClick={handleActivate} disabled={isRequesting}>
          {isRequesting ? 'Wird aktiviert...' : 'Aktivieren'}
        </Button>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 flex-shrink-0"
        onClick={() => setDismissed(true)}
        aria-label="Banner schließen"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}
