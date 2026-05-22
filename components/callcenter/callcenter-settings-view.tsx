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
  Save, Clock, ShieldAlert, Mail, AlertTriangle, Users, Pencil, CheckCircle2, ChevronDown, BellOff, Info,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCallbackStore } from '@/lib/stores/callback-store'
import {
  callbackPriorityConfig, escalationLevelConfig, slaDurationOptions,
} from '@/lib/constants'
import type { CallbackPriority } from '@/lib/types'

const priorityKeys: CallbackPriority[] = ['dringend', 'hoch', 'mittel', 'niedrig']

const ROLE_LABELS: Record<string, string> = {
  standortleiter: 'Standortverantwortlicher',
  geschaeftsfuehrung: 'Geschäftsführung',
  verkaufsleiter: 'Verkaufsleiter',
  serviceleiter: 'Serviceleiter (LKD)',
  werkstattleiter: 'Werkstattleiter',
}

type TimeUnit = 'seconds' | 'minutes' | 'hours'

const TIME_UNIT_FACTOR: Record<TimeUnit, number> = {
  seconds: 1,
  minutes: 60,
  hours: 3600,
}

const TIME_UNIT_LABEL: Record<TimeUnit, string> = {
  seconds: 'Sekunden',
  minutes: 'Minuten',
  hours: 'Stunden',
}

function triggerSecondsOf(rule: { triggerAfterSeconds?: number; triggerAfterMinutes: number }): number {
  return rule.triggerAfterSeconds ?? rule.triggerAfterMinutes * 60
}

function detectTimeUnit(seconds: number): TimeUnit {
  if (seconds > 0 && seconds % 3600 === 0) return 'hours'
  if (seconds > 0 && seconds % 60 === 0) return 'minutes'
  return 'seconds'
}

function formatTriggerLabel(seconds: number): string {
  if (seconds < 60) return `${seconds} Sek.`
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60)
    const rest = seconds % 60
    return rest ? `${minutes} Min. ${rest} Sek.` : `${minutes} Min.`
  }
  const hours = Math.floor(seconds / 3600)
  const restMin = Math.round((seconds % 3600) / 60)
  return restMin ? `${hours} Std. ${restMin} Min.` : `${hours} Std.`
}

export function CallcenterSettingsView() {
  const {
    slaConfig, escalationRules, employees,
    updateSlaConfig, updateEscalationRule,
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

  // ---- Per-rule recipient mode (contact picker vs. free Name/E-Mail) ----
  const [recipientModes, setRecipientModes] = useState<Record<string, 'contact' | 'manual'>>(
    () => Object.fromEntries(
      escalationRules.map((rule) => [rule.id, rule.recipientEmployeeId ? 'contact' : 'manual']),
    ),
  )

  // ---- Per-rule trigger-time draft (value + unit) ----
  const [timeDrafts, setTimeDrafts] = useState<Record<string, { value: string; unit: TimeUnit }>>(
    () => Object.fromEntries(
      escalationRules.map((rule) => {
        const seconds = triggerSecondsOf(rule)
        const unit = detectTimeUnit(seconds)
        return [rule.id, { value: String(seconds / TIME_UNIT_FACTOR[unit]), unit }]
      }),
    ),
  )

  const getTimeDraft = (ruleId: string, seconds: number) =>
    timeDrafts[ruleId] ?? { value: String(seconds), unit: 'seconds' as TimeUnit }

  const commitTriggerTime = (ruleId: string) => {
    const draft = timeDrafts[ruleId]
    if (!draft) return
    const num = parseInt(draft.value, 10)
    if (isNaN(num) || num <= 0) return
    const seconds = num * TIME_UNIT_FACTOR[draft.unit]
    updateEscalationRule(ruleId, {
      triggerAfterSeconds: seconds,
      triggerAfterMinutes: Math.max(1, Math.round(seconds / 60)),
    })
  }

  const resolveRecipientEmail = (recipientEmployeeId: string | undefined, recipientEmail: string | undefined) =>
    recipientEmail?.trim() || employees.find((e) => e.id === recipientEmployeeId)?.email?.trim() || ''

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  // ---- Per-rule collapse state. Active rules collapse to a compact summary;
  // toggling activation auto-collapses/expands for a tidy overview. ----
  const [collapsedRules, setCollapsedRules] = useState<Record<string, boolean>>(
    () => Object.fromEntries(escalationRules.map((rule) => [rule.id, rule.isActive])),
  )

  const setRuleActive = (ruleId: string, active: boolean) => {
    updateEscalationRule(ruleId, {
      isActive: active,
      // Stamp the activation moment so the rule only catches callbacks created
      // from now on. Re-activating resets the cutoff to the new moment.
      ...(active ? { activatedAt: new Date().toISOString() } : {}),
    })
    setCollapsedRules((prev) => ({ ...prev, [ruleId]: active }))
  }

  const formatActivatedAt = (iso: string | undefined) => {
    if (!iso) return ''
    const date = new Date(iso)
    if (Number.isNaN(date.getTime())) return ''
    return date.toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const toggleCollapsed = (ruleId: string) =>
    setCollapsedRules((prev) => ({ ...prev, [ruleId]: !(prev[ruleId] ?? false) }))

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
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">Automatische Eskalation</CardTitle>
          </div>
          <p className="text-xs text-muted-foreground pt-1">
            Diese Regeln gelten ausschließlich für echte, manuell über „Neuer Rückruf“ angelegte
            Rückrufe (in der Datenbank gespeichert) — nicht für die Demo-Beispieldaten. Eine Regel
            kann erst aktiviert werden, wenn ein Empfänger hinterlegt ist.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {escalationRules.map(rule => {
              const fromCfg = escalationLevelConfig[rule.fromLevel as keyof typeof escalationLevelConfig]
              const toCfg = escalationLevelConfig[rule.toLevel as keyof typeof escalationLevelConfig]
              const seconds = triggerSecondsOf(rule)
              const draft = getTimeDraft(rule.id, seconds)
              const mode = recipientModes[rule.id] ?? (rule.recipientEmployeeId ? 'contact' : 'manual')
              const resolvedEmail = resolveRecipientEmail(rule.recipientEmployeeId, rule.recipientEmail)
              const canActivate = isValidEmail(resolvedEmail)

              const collapsed = collapsedRules[rule.id] ?? rule.isActive
              const recipientSummary = [rule.recipientName?.trim(), resolvedEmail]
                .filter(Boolean)
                .join(' · ')

              return (
                <div
                  key={rule.id}
                  className={cn(
                    'flex flex-col gap-3 rounded-lg border px-4 py-3 transition-colors',
                    !rule.isActive && 'bg-muted/30',
                  )}
                >
                  {/* Titel + Aktiv-Toggle (Header — klickbar zum Auf-/Zuklappen) */}
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => toggleCollapsed(rule.id)}
                      className="flex flex-1 min-w-0 items-start gap-2 text-left"
                    >
                      <ChevronDown
                        className={cn(
                          'h-4 w-4 mt-0.5 shrink-0 text-muted-foreground transition-transform',
                          !collapsed && 'rotate-180',
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{rule.name}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-xs text-muted-foreground">
                            Wird {formatTriggerLabel(seconds)} nach Erstellung eines neuen Rückrufs ausgelöst
                          </span>
                          <span className="text-xs text-muted-foreground">|</span>
                          <span className="text-xs">
                            <span className={cn('font-medium', fromCfg?.color)}>Stufe {rule.fromLevel}</span>
                            {' → '}
                            <span className={cn('font-medium', toCfg?.color)}>Stufe {rule.toLevel}</span>
                          </span>
                        </div>
                        {collapsed && recipientSummary && (
                          <p className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground truncate">
                            <Mail className="h-3.5 w-3.5 shrink-0" />
                            {recipientSummary}
                          </p>
                        )}
                      </div>
                    </button>
                    <div className="flex flex-col items-end gap-1">
                      <Badge
                        variant="secondary"
                        className={cn(
                          'text-[10px]',
                          rule.isActive
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                            : 'bg-muted text-muted-foreground',
                        )}
                      >
                        {rule.isActive ? 'Aktiv' : 'Inaktiv'}
                      </Badge>
                      <Switch
                        checked={rule.isActive}
                        disabled={!rule.isActive && !canActivate}
                        onCheckedChange={v => {
                          if (v && !canActivate) return
                          setRuleActive(rule.id, v)
                        }}
                      />
                    </div>
                  </div>

                  {!collapsed && (
                  <>
                  {/* Auslösezeit */}
                  <div className="flex items-center gap-2 flex-wrap border-t pt-3">
                    <Label className="text-xs text-muted-foreground min-w-[110px] flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> Auslösung nach
                    </Label>
                    <Input
                      type="number"
                      min={1}
                      className="w-24 h-9"
                      value={draft.value}
                      onChange={e =>
                        setTimeDrafts(prev => ({
                          ...prev,
                          [rule.id]: { ...getTimeDraft(rule.id, seconds), value: e.target.value },
                        }))
                      }
                      onBlur={() => commitTriggerTime(rule.id)}
                    />
                    <Select
                      value={draft.unit}
                      onValueChange={v => {
                        const unit = v as TimeUnit
                        const current = getTimeDraft(rule.id, seconds)
                        setTimeDrafts(prev => ({ ...prev, [rule.id]: { ...current, unit } }))
                        const num = parseInt(current.value, 10)
                        if (!isNaN(num) && num > 0) {
                          const secs = num * TIME_UNIT_FACTOR[unit]
                          updateEscalationRule(rule.id, {
                            triggerAfterSeconds: secs,
                            triggerAfterMinutes: Math.max(1, Math.round(secs / 60)),
                          })
                        }
                      }}
                    >
                      <SelectTrigger className="w-[130px] h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(['seconds', 'minutes', 'hours'] as TimeUnit[]).map(u => (
                          <SelectItem key={u} value={u}>
                            {TIME_UNIT_LABEL[u]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="basis-full flex items-start gap-1.5 text-[11px] text-muted-foreground">
                      <Info className="h-3.5 w-3.5 shrink-0 mt-px" />
                      <span>
                        <strong className="font-medium text-foreground">Nur ein Testwert:</strong>{' '}
                        Die Eskalation startet {formatTriggerLabel(seconds)}, nachdem ein neuer
                        Rückruf erstellt wurde — bewusst kurz gewählt, damit sich der Ablauf sofort
                        testen lässt (statt im Realbetrieb z.&nbsp;B. 30&nbsp;Min. warten zu müssen).
                        Der Wert ist frei anpassbar.
                      </span>
                    </p>
                  </div>

                  {/* Empfänger */}
                  <div className="flex flex-col gap-2 border-t pt-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <Label className="text-xs text-muted-foreground">
                        Empfänger der Eskalations-E-Mail
                      </Label>
                      <div className="inline-flex rounded-md border p-0.5">
                        <button
                          type="button"
                          className={cn(
                            'flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors',
                            mode === 'contact' ? 'bg-muted font-medium' : 'text-muted-foreground',
                          )}
                          onClick={() => setRecipientModes(prev => ({ ...prev, [rule.id]: 'contact' }))}
                        >
                          <Users className="h-3.5 w-3.5" /> Aus Kontakten
                        </button>
                        <button
                          type="button"
                          className={cn(
                            'flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors',
                            mode === 'manual' ? 'bg-muted font-medium' : 'text-muted-foreground',
                          )}
                          onClick={() => setRecipientModes(prev => ({ ...prev, [rule.id]: 'manual' }))}
                        >
                          <Pencil className="h-3.5 w-3.5" /> Manuell eingeben
                        </button>
                      </div>
                    </div>

                    {mode === 'contact' ? (
                      <Select
                        value={rule.recipientEmployeeId ?? ''}
                        onValueChange={v => {
                          const emp = employees.find(e => e.id === v)
                          updateEscalationRule(rule.id, {
                            recipientEmployeeId: v,
                            recipientEmail: emp?.email ?? '',
                            recipientName: emp?.name ?? '',
                          })
                        }}
                      >
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Kontakt auswählen…" />
                        </SelectTrigger>
                        <SelectContent>
                          {supervisorOptions.map(emp => (
                            <SelectItem key={emp.id} value={emp.id}>
                              {emp.name} — {ROLE_LABELS[emp.role] ?? emp.role} &lt;{emp.email}&gt;
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="grid gap-2 sm:grid-cols-2">
                        <div className="space-y-1">
                          <Label className="text-[11px] text-muted-foreground">Name</Label>
                          <Input
                            className="h-9"
                            placeholder="z.B. Tobias Lohmüller"
                            value={rule.recipientName ?? ''}
                            onChange={e =>
                              updateEscalationRule(rule.id, {
                                recipientName: e.target.value,
                                recipientEmployeeId: undefined,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px] text-muted-foreground">E-Mail</Label>
                          <Input
                            className="h-9"
                            type="email"
                            placeholder="name@wackenhut.de"
                            value={rule.recipientEmail ?? ''}
                            onChange={e =>
                              updateEscalationRule(rule.id, {
                                recipientEmail: e.target.value,
                                recipientEmployeeId: undefined,
                              })
                            }
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-3 flex-wrap pt-1">
                      {!canActivate ? (
                        <p className="flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400">
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                          Bitte Name &amp; eine gültige E-Mail hinterlegen, um die Regel zu aktivieren.
                        </p>
                      ) : rule.isActive ? (
                        <p className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                          {rule.activatedAt
                            ? `Aktiv seit ${formatActivatedAt(rule.activatedAt)} Uhr — gilt nur für danach erstellte Rückrufe.`
                            : 'Regel ist aktiv und eskaliert automatisch.'}
                        </p>
                      ) : (
                        <p className="flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-[11px] font-medium text-muted-foreground">
                          <BellOff className="h-3.5 w-3.5 shrink-0" />
                          Regel ist deaktiviert — es werden keine Eskalations-E-Mails versendet.
                        </p>
                      )}
                      <Button
                        size="sm"
                        variant={rule.isActive ? 'outline' : 'default'}
                        disabled={!canActivate}
                        onClick={() => setRuleActive(rule.id, !rule.isActive)}
                      >
                        {rule.isActive ? 'Regel deaktivieren' : 'Regel aktivieren'}
                      </Button>
                    </div>
                  </div>
                  </>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
