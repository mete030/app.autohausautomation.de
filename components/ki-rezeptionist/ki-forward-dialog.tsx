'use client'

import { useState } from 'react'
import { Forward, Send, Check, Phone, Clock, AtSign, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { kiCategoryConfig } from '@/lib/ki-rezeptionist/ki-reception-config'
import { formatExact, formatDuration } from '@/lib/ki-rezeptionist/format'
import {
  KI_FORWARD_RECIPIENT_GROUPS,
  KI_FORWARD_RECIPIENTS,
  isAllowedForwardEmail,
} from '@/lib/ki-rezeptionist/forward-recipients'
import type { KiReceptionCallDto } from '@/lib/ki-rezeptionist/types'

const CUSTOM_VALUE = '__custom__'

interface KiForwardDialogProps {
  /** Weiterzuleitender Anruf — `null` schließt den Dialog. */
  call: KiReceptionCallDto | null
  onOpenChange: (open: boolean) => void
  /** Wird nach erfolgreichem Versand mit dem (ggf. aktualisierten) Anruf aufgerufen. */
  onForwarded: (updatedCall: KiReceptionCallDto) => void
}

export function KiForwardDialog({ call, onOpenChange, onForwarded }: KiForwardDialogProps) {
  // Inhalt während der Schließ-Animation halten (call → null), Felder beim
  // Anruf-Wechsel zurücksetzen — „State während des Renderns anpassen".
  const [shown, setShown] = useState<KiReceptionCallDto | null>(call)
  const [prevId, setPrevId] = useState<string | undefined>(call?.id)

  const [selectedId, setSelectedId] = useState('')
  const [customEmail, setCustomEmail] = useState('')
  const [customName, setCustomName] = useState('')
  const [message, setMessage] = useState('')
  const [markInProgress, setMarkInProgress] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [doneName, setDoneName] = useState<string | null>(null)

  if (call && call !== shown) setShown(call)
  if (call?.id !== prevId) {
    setPrevId(call?.id)
    setSelectedId('')
    setCustomEmail('')
    setCustomName('')
    setMessage('')
    setMarkInProgress(true)
    setBusy(false)
    setError(null)
    setDoneName(null)
  }

  if (!shown) return null

  const cat = kiCategoryConfig[shown.category]
  const CatIcon = cat.icon
  const duration = formatDuration(shown.callDurationSec)
  const isCustom = selectedId === CUSTOM_VALUE

  function resolveRecipient(): { name: string; email: string } | null {
    if (isCustom) {
      const email = customEmail.trim()
      if (!email) return null
      const name = customName.trim() || email.split('@')[0]
      return { name, email }
    }
    const r = KI_FORWARD_RECIPIENTS.find((x) => x.id === selectedId)
    return r ? { name: r.name, email: r.email } : null
  }

  const recipient = resolveRecipient()
  const customEmailInvalid = isCustom && customEmail.trim().length > 0 && !isAllowedForwardEmail(customEmail)
  const canSend = Boolean(recipient) && (!isCustom || isAllowedForwardEmail(customEmail)) && !busy

  async function handleSend() {
    const target = resolveRecipient()
    if (!shown || !target) {
      setError('Bitte einen Empfänger auswählen.')
      return
    }
    if (!isAllowedForwardEmail(target.email)) {
      setError('Bitte eine Adresse einer freigegebenen Domain wählen.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/ki-rezeptionist/${shown.id}/forward`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientEmail: target.email,
          recipientName: target.name,
          message: message.trim() || undefined,
          markInProgress,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error ?? 'Weiterleitung fehlgeschlagen.')
        return
      }
      if (data.call) onForwarded(data.call)
      setDoneName(target.name)
    } catch {
      setError('Verbindung zum Server fehlgeschlagen.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={Boolean(call)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="pr-8">
          <DialogTitle className="flex items-center gap-2 text-base md:text-lg">
            <Forward className="h-[18px] w-[18px] text-primary" />
            An Berater weiterleiten
          </DialogTitle>
          <DialogDescription>
            Diesen Rückruf an die zuständige Person übergeben — sie bekommt alle
            Anruf-Details per E-Mail und kann den Kunden direkt zurückrufen.
          </DialogDescription>
        </DialogHeader>

        {doneName ? (
          /* ---- Erfolg ---- */
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <p className="font-medium">Weitergeleitet an {doneName}</p>
              <p className="text-sm text-muted-foreground">
                Die Benachrichtigung wurde per E-Mail verschickt.
                {markInProgress && shown.status !== 'erledigt'
                  ? ' Der Anruf ist jetzt „In Bearbeitung".'
                  : ''}
              </p>
            </div>
            <Button className="mt-1" onClick={() => onOpenChange(false)}>
              <Check className="h-4 w-4" />
              Fertig
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* ---- Anruf-Kontext ---- */}
            <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="font-medium">{shown.customerName}</span>
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
                    cat.color,
                  )}
                >
                  <CatIcon className="h-3 w-3" />
                  {cat.label}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                {shown.customerPhone && (
                  <span className="inline-flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {shown.customerPhone}
                  </span>
                )}
                {duration && <span>{duration}</span>}
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatExact(shown.receivedAt)}
                </span>
              </div>
            </div>

            {/* ---- Empfänger ---- */}
            <div className="space-y-1.5">
              <Label className="text-xs">Empfänger *</Label>
              <Select value={selectedId} onValueChange={setSelectedId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Berater auswählen …" />
                </SelectTrigger>
                <SelectContent>
                  {KI_FORWARD_RECIPIENT_GROUPS.map((group) => (
                    <SelectGroup key={group.key}>
                      <SelectLabel>{group.label}</SelectLabel>
                      {group.recipients.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          <span className="font-medium">{r.name}</span>
                          <span className="ml-1.5 text-xs text-muted-foreground">{r.roleLabel}</span>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                  <SelectGroup>
                    <SelectLabel>Sonstige</SelectLabel>
                    <SelectItem value={CUSTOM_VALUE}>
                      <span className="inline-flex items-center gap-1.5">
                        <AtSign className="h-3.5 w-3.5" />
                        Andere E-Mail eingeben …
                      </span>
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>

              {isCustom && (
                <div className="space-y-2 pt-1">
                  <Input
                    type="email"
                    inputMode="email"
                    autoFocus
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    placeholder="name@wackenhut.de"
                    aria-invalid={customEmailInvalid}
                    className={cn(customEmailInvalid && 'border-destructive focus-visible:ring-destructive/30')}
                  />
                  <Input
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Name (optional)"
                  />
                  {customEmailInvalid && (
                    <p className="text-xs text-destructive">Diese E-Mail-Domain ist nicht freigegeben.</p>
                  )}
                </div>
              )}
            </div>

            {/* ---- Nachricht ---- */}
            <div className="space-y-1.5">
              <Label className="text-xs">Nachricht (optional)</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="z. B. „Bitte heute noch zurückrufen — Kunde ist sehr interessiert."
                rows={3}
                maxLength={2000}
              />
            </div>

            {/* ---- Status-Option ---- */}
            <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-border/60 p-3 text-sm">
              <Checkbox
                checked={markInProgress}
                onCheckedChange={(v) => setMarkInProgress(v === true)}
                className="mt-0.5"
              />
              <span>
                <span className="font-medium">Anruf als „In Bearbeitung" markieren und zuweisen</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  Macht sichtbar, dass der Rückruf an {recipient?.name ?? 'den Berater'} übergeben wurde.
                </span>
              </span>
            </label>

            {error && <p className="text-sm text-destructive">{error}</p>}

            {/* ---- Aktionen ---- */}
            <div className="flex flex-col-reverse gap-2 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-end">
              <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>
                Abbrechen
              </Button>
              <Button onClick={handleSend} disabled={!canSend}>
                <Send className="h-4 w-4" />
                {busy ? 'Sendet …' : 'Weiterleiten'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
