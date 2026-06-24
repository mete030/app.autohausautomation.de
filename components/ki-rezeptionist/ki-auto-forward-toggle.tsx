'use client'

import { useEffect, useState } from 'react'
import { Mail, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Switch } from '@/components/ui/switch'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

/**
 * Kompakter Inline-Schalter für die automatische Weiterleitung jedes neuen
 * KI-Anrufs an lead@wackenhut.de (Oliver Gackenheimer). Sitzt in einer Linie
 * mit den Kopf-Buttons. Default aus — Versand startet erst nach Aktivierung.
 */
export function KiAutoForwardToggle() {
  const [enabled, setEnabled] = useState<boolean | null>(null) // null = lädt
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true
    fetch('/api/ki-rezeptionist/settings', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        if (active) setEnabled(Boolean(d.autoForwardLeadEnabled))
      })
      .catch(() => {
        if (active) setEnabled(false)
      })
    return () => {
      active = false
    }
  }, [])

  async function toggle(next: boolean) {
    const prev = enabled
    setSaving(true)
    setEnabled(next) // optimistisch
    try {
      const res = await fetch('/api/ki-rezeptionist/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoForwardLeadEnabled: next }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setEnabled(prev ?? false)
        return
      }
      setEnabled(Boolean(data.autoForwardLeadEnabled))
    } catch {
      setEnabled(prev ?? false)
    } finally {
      setSaving(false)
    }
  }

  const isOn = enabled === true
  const loading = enabled === null

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            'inline-flex h-8 items-center gap-2 rounded-md border px-2.5 transition-colors',
            isOn ? 'border-primary/40 bg-primary/5' : 'border-border/60 bg-card',
          )}
        >
          <Mail className={cn('h-3.5 w-3.5 flex-shrink-0', isOn ? 'text-primary' : 'text-muted-foreground')} />
          <span className="hidden whitespace-nowrap text-[12px] font-medium text-foreground/80 sm:inline">
            Auto-Weiterleitung an lead@wackenhut.de
          </span>
          <span className="whitespace-nowrap text-[12px] font-medium text-foreground/80 sm:hidden">
            Lead-Auto
          </span>
          {(loading || saving) && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
          <Switch
            checked={isOn}
            disabled={loading || saving}
            onCheckedChange={toggle}
            aria-label="Automatische Weiterleitung an lead@wackenhut.de"
          />
        </div>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-xs">
        Jeder neue Anruf wird automatisch als Zusammenfassung (mit Dashboard-Link) an
        Oliver Gackenheimer (lead@wackenhut.de) gesendet.{' '}
        {isOn ? 'Aktuell aktiv.' : 'Aktuell aus — ideal zum Testen.'}
      </TooltipContent>
    </Tooltip>
  )
}
