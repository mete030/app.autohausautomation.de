'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { Plus, Trash2, Save, Clock, ShieldAlert, Mail } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCallbackStore } from '@/lib/stores/callback-store'
import {
  callbackPriorityConfig, escalationLevelConfig, slaDurationOptions,
} from '@/lib/constants'
import type { CallbackPriority, EscalationLevel } from '@/lib/types'

const priorityKeys: CallbackPriority[] = ['dringend', 'hoch', 'mittel', 'niedrig']

const levelKeys = [1, 2, 3] as const

const ROLE_LABELS: Record<string, string> = {
  standortleiter: 'Standortverantwortlicher',
  geschaeftsfuehrung: 'Geschäftsführung',
  verkaufsleiter: 'Verkaufsleiter',
  serviceleiter: 'Serviceleiter (LKD)',
  werkstattleiter: 'Werkstattleiter',
}

export function CallcenterSettingsView() {
  const {
    slaConfig, escalationRules, employees,
    updateSlaConfig, addEscalationRule, updateEscalationRule, removeEscalationRule,
  } = useCallbackStore()

  const supervisorOptions = employees
    .filter((e) => e.isSupervisor && e.status === 'aktiv')
    .sort((a, b) => a.name.localeCompare(b.name))

  const [serverFallbackEmail, setServerFallbackEmail] = useState<string>('')
  const [serverFallbackName, setServerFallbackName] = useState<string>('')
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch('/api/email/send-callback-notification', {
          method: 'GET',
          cache: 'no-store',
        })
        const data = (await res.json()) as {
          available?: boolean
          defaultRecipientEmail?: string
          recipientName?: string
        }
        if (cancelled) return
        setEmailAvailable(Boolean(res.ok && data.available))
        setServerFallbackEmail(data.defaultRecipientEmail ?? '')
        setServerFallbackName(data.recipientName ?? '')
      } catch {
        if (!cancelled) setEmailAvailable(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  // ---- SLA local state ----
  const [slaDraft, setSlaDraft] = useState<Record<CallbackPriority, number>>(
    () => ({ ...slaConfig.perPriority }),
  )
  const [slaDefault, setSlaDefault] = useState(() => slaConfig.defaultMinutes)
  const [slaSaved, setSlaSaved] = useState(false)

  const handleSaveSla = () => {
    updateSlaConfig({
      defaultMinutes: slaDefault,
      perPriority: { ...slaDraft },
    })
    setSlaSaved(true)
    setTimeout(() => setSlaSaved(false), 2000)
  }

  // ---- New rule dialog state ----
  const [showNewRule, setShowNewRule] = useState(false)
  const [newRuleName, setNewRuleName] = useState('')
  const [newRuleTriggerMinutes, setNewRuleTriggerMinutes] = useState('10')
  const [newRuleFrom, setNewRuleFrom] = useState<EscalationLevel>(1)
  const [newRuleTo, setNewRuleTo] = useState<EscalationLevel>(2)
  const [newRuleRecipient, setNewRuleRecipient] = useState<string>('__person__')

  const resetNewRule = () => {
    setNewRuleName('')
    setNewRuleTriggerMinutes('10')
    setNewRuleFrom(1)
    setNewRuleTo(2)
    setNewRuleRecipient('__person__')
  }

  const handleCreateRule = () => {
    const minutes = parseInt(newRuleTriggerMinutes, 10)
    if (!newRuleName.trim() || isNaN(minutes) || minutes <= 0) return
    addEscalationRule({
      name: newRuleName.trim(),
      triggerAfterMinutes: minutes,
      fromLevel: newRuleFrom,
      toLevel: newRuleTo,
      notifyChannels: ['app', 'email'],
      isActive: true,
      recipientEmployeeId:
        newRuleRecipient === '__person__' ? undefined : newRuleRecipient,
    })
    resetNewRule()
    setShowNewRule(false)
  }

  const isNewRuleValid =
    newRuleName.trim().length > 0 &&
    !isNaN(parseInt(newRuleTriggerMinutes, 10)) &&
    parseInt(newRuleTriggerMinutes, 10) > 0 &&
    newRuleFrom <= newRuleTo

  const formatMinutes = (minutes: number) => {
    if (minutes >= 60 && minutes % 60 === 0) {
      const hours = minutes / 60
      return `${hours} ${hours === 1 ? 'Stunde' : 'Stunden'}`
    }
    return `${minutes} min`
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">E-Mail-Versand</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="text-muted-foreground">
            Erinnerungs-E-Mails werden automatisch an die im Mitarbeiter-Profil
            hinterlegte Adresse des zugewiesenen Serviceberaters bzw. Verkäufers
            versendet. Die Adresse kann beim Erstellen eines Rückrufs überschrieben
            werden — der Klick auf <span className="font-medium text-foreground">Senden</span> speichert
            die Änderung und verschickt die Erinnerung in einem Schritt.
          </p>
          <Separator />
          <div className="space-y-1 text-xs text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">Status:</span>{' '}
              {emailAvailable === null
                ? 'Wird geprüft…'
                : emailAvailable
                  ? 'Verfügbar (Brevo)'
                  : 'Nicht konfiguriert — bitte BREVO_API_KEY setzen.'}
            </p>
            {serverFallbackEmail && (
              <p>
                <span className="font-medium text-foreground">Fallback-Empfänger:</span>{' '}
                {serverFallbackName ? `${serverFallbackName} <${serverFallbackEmail}>` : serverFallbackEmail}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ---- SLA-Konfiguration ---- */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">SLA-Zeiten nach Priorität</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {priorityKeys.map(priority => {
            const cfg = callbackPriorityConfig[priority]
            return (
              <div key={priority} className="flex items-center justify-between gap-4">
                <Badge variant="secondary" className={cn('text-xs min-w-[80px] justify-center', cfg.color)}>
                  {cfg.label}
                </Badge>
                <Select
                  value={String(slaDraft[priority])}
                  onValueChange={v => setSlaDraft(prev => ({ ...prev, [priority]: Number(v) }))}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {slaDurationOptions.map(o => (
                      <SelectItem key={o.value} value={String(o.value)}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )
          })}

          <Separator />

          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-medium text-muted-foreground">Standard-SLA</span>
            <Select
              value={String(slaDefault)}
              onValueChange={v => setSlaDefault(Number(v))}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {slaDurationOptions.map(o => (
                  <SelectItem key={o.value} value={String(o.value)}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end pt-2">
            <Button size="sm" onClick={handleSaveSla}>
              <Save className="h-4 w-4 mr-1" />
              {slaSaved ? 'Gespeichert' : 'Speichern'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ---- Eskalationsregeln ---- */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">Automatische Eskalation</CardTitle>
            </div>
            <Button size="sm" variant="outline" onClick={() => setShowNewRule(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Neue Regel hinzufügen
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {escalationRules.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Keine Eskalationsregeln konfiguriert.
            </p>
          ) : (
            <div className="space-y-3">
              {escalationRules.map(rule => {
                const fromCfg = escalationLevelConfig[rule.fromLevel as keyof typeof escalationLevelConfig]
                const toCfg = escalationLevelConfig[rule.toLevel as keyof typeof escalationLevelConfig]
                const recipient = rule.recipientEmployeeId
                  ? supervisorOptions.find((e) => e.id === rule.recipientEmployeeId)
                  : undefined

                return (
                  <div
                    key={rule.id}
                    className={cn(
                      'flex flex-col gap-3 rounded-lg border px-4 py-3 transition-colors',
                      !rule.isActive && 'opacity-50 bg-muted/30',
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{rule.name}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-xs text-muted-foreground">
                            Nach {formatMinutes(rule.triggerAfterMinutes)} ohne Bearbeitung
                          </span>
                          <span className="text-xs text-muted-foreground">|</span>
                          <span className="text-xs">
                            Von{' '}
                            <span className={cn('font-medium', fromCfg?.color)}>
                              Stufe {rule.fromLevel}
                            </span>
                            {' \u2192 '}
                            <span className={cn('font-medium', toCfg?.color)}>
                              Stufe {rule.toLevel}
                            </span>
                          </span>
                        </div>
                      </div>

                      <Switch
                        checked={rule.isActive}
                        onCheckedChange={v => updateEscalationRule(rule.id, { isActive: v })}
                      />

                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removeEscalationRule(rule.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap border-t pt-3">
                      <Label className="text-xs text-muted-foreground min-w-[90px]">
                        Empfänger
                      </Label>
                      <Select
                        value={rule.recipientEmployeeId ?? '__person__'}
                        onValueChange={v =>
                          updateEscalationRule(rule.id, {
                            recipientEmployeeId: v === '__person__' ? undefined : v,
                          })
                        }
                      >
                        <SelectTrigger className="flex-1 min-w-[240px] h-9 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__person__">
                            Zugewiesene Person (Berater/Verkäufer)
                          </SelectItem>
                          {supervisorOptions.map((emp) => (
                            <SelectItem key={emp.id} value={emp.id}>
                              {emp.name} — {ROLE_LABELS[emp.role] ?? emp.role} &lt;{emp.email}&gt;
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {recipient && (
                        <span className="text-[11px] text-muted-foreground">
                          {recipient.email}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ---- New Rule Dialog ---- */}
      <Dialog open={showNewRule} onOpenChange={v => { if (!v) resetNewRule(); setShowNewRule(v) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Neue Eskalationsregel</DialogTitle>
            <DialogDescription>
              Definieren Sie eine automatische Eskalation basierend auf der Bearbeitungszeit.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="rule-name">Regelname *</Label>
              <Input
                id="rule-name"
                placeholder="z.B. Auto-Eskalation L1 nach 10 min"
                value={newRuleName}
                onChange={e => setNewRuleName(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rule-minutes">Auslösung nach (Minuten) *</Label>
              <Input
                id="rule-minutes"
                type="number"
                min={1}
                placeholder="10"
                value={newRuleTriggerMinutes}
                onChange={e => setNewRuleTriggerMinutes(e.target.value)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Von Stufe</Label>
                <Select
                  value={String(newRuleFrom)}
                  onValueChange={v => setNewRuleFrom(Number(v) as EscalationLevel)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {levelKeys.map(l => (
                      <SelectItem key={l} value={String(l)}>
                        {escalationLevelConfig[l].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Zu Stufe</Label>
                <Select
                  value={String(newRuleTo)}
                  onValueChange={v => setNewRuleTo(Number(v) as EscalationLevel)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {levelKeys.map(l => (
                      <SelectItem key={l} value={String(l)}>
                        {escalationLevelConfig[l].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Empfänger</Label>
              <Select value={newRuleRecipient} onValueChange={setNewRuleRecipient}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__person__">
                    Zugewiesene Person (Berater/Verkäufer)
                  </SelectItem>
                  {supervisorOptions.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.name} — {ROLE_LABELS[emp.role] ?? emp.role} &lt;{emp.email}&gt;
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                Standardempfänger gemäß Wackenhut-Organigramm (wackenhut.de/kontakte).
              </p>
            </div>

            {newRuleFrom > newRuleTo && (
              <p className="text-xs text-destructive">
                Die Zielstufe darf nicht niedriger als die Ausgangsstufe sein.
              </p>
            )}
            {newRuleFrom === newRuleTo && (
              <p className="text-xs text-muted-foreground">
                Gleiche Stufe = reiner Reminder (keine Eskalation an Vorgesetzte).
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { resetNewRule(); setShowNewRule(false) }}>
              Abbrechen
            </Button>
            <Button disabled={!isNewRuleValid} onClick={handleCreateRule}>
              <Plus className="h-4 w-4 mr-1" />
              Erstellen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
