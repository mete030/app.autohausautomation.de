'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Bot, Phone, Globe, MessageCircle, PenLine, Clock, ArrowRightLeft, ChevronUp, CheckCircle, Shield, Bell, Mail, Send, Trash2 } from 'lucide-react'
import { cn, formatTimeAgo } from '@/lib/utils'
import { callSourceConfig, callbackStatusConfig, callbackPriorityConfig, escalationLevelConfig } from '@/lib/constants'
import {
  CALLBACK_NOTIFICATION_RECIPIENT_EMAIL,
  CALLBACK_NOTIFICATION_RECIPIENT_NAME,
  VERENA_SCHWAB_EMPLOYEE_ID,
  VERENA_SCHWAB_NAME,
} from '@/lib/email/callback-email-config'
import { useCountdown } from '@/lib/hooks/use-countdown'
import { useCallbackNotificationEmailAvailability } from '@/lib/hooks/use-callback-notification-email-availability'
import { useCallbackStore } from '@/lib/stores/callback-store'
import type { Callback, CallSource, EscalationLevel } from '@/lib/types'

interface TranscriptSheetProps {
  open: boolean
  callback: Callback | null
  onOpenChange: (open: boolean) => void
  onReassign?: (id: string) => void
  onEscalate?: (id: string) => void
  onComplete?: (id: string) => void
  onEscalateToLevel?: (id: string) => void
  onSetReminder?: (id: string) => void
  onDelete?: (id: string) => void
  currentUserName?: string
}

function getEmailActivityLabel(emailKind?: string) {
  switch (emailKind) {
    case 'erinnerung':
      return 'Erinnerungs-E-Mail'
    case 'callback_benachrichtigung':
      return 'Benachrichtigungs-E-Mail'
    case 'morgen_zusammenfassung':
      return 'Morning Summary'
    default:
      return 'E-Mail'
  }
}

function getSourceIcon(source: CallSource) {
  switch (source) {
    case 'telefon': return Phone
    case 'website': return Globe
    case 'whatsapp': return MessageCircle
    case 'ki_agent': return Bot
    case 'manuell': return PenLine
  }
}

function formatDuration(seconds?: number): string {
  if (!seconds) return '\u2014'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m > 0 ? `${m} min ${s} sek` : `${s} sek`
}

function CountdownBadge({ dueAt, slaDurationMinutes }: { dueAt: string; slaDurationMinutes?: number }) {
  const { formatted, isOverdue } = useCountdown(dueAt, slaDurationMinutes)
  return (
    <Badge
      variant="secondary"
      className={cn(
        'text-xs font-medium gap-1',
        isOverdue
          ? 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400'
          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400',
      )}
    >
      <Clock className="h-3 w-3" />
      {isOverdue ? `+${formatted}` : formatted}
    </Badge>
  )
}

export function TranscriptSheet({
  open,
  callback,
  onOpenChange,
  onReassign,
  onEscalate,
  onComplete,
  onEscalateToLevel,
  onSetReminder,
  onDelete,
  currentUserName = 'Admin',
}: TranscriptSheetProps) {
  const reminders = useCallbackStore((s) => s.reminders)
  const employees = useCallbackStore((s) => s.employees)
  const recordCallbackNotificationEmailSent = useCallbackStore((s) => s.recordCallbackNotificationEmailSent)
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [emailStatusMessage, setEmailStatusMessage] = useState('')
  const isVerenaCallback =
    callback?.assignedEmployeeId === VERENA_SCHWAB_EMPLOYEE_ID
    && callback?.assignedAdvisor === VERENA_SCHWAB_NAME
    && callback?.isPersisted === true
  const {
    isAvailable: isNotificationEmailAvailable,
    isLoading: isNotificationEmailAvailabilityLoading,
    recipientEmail: notificationRecipientEmail,
    recipientName: notificationRecipientName,
    unavailableMessage: notificationEmailUnavailableMessage,
  } = useCallbackNotificationEmailAvailability(open && isVerenaCallback)

  if (!callback) return null

  const callbackReminders = reminders.filter(r => callback.reminders.includes(r.id))
  const isKi = callback.takenBy.type === 'ki'
  const isCompleted = callback.status === 'erledigt'
  const SourceIcon = getSourceIcon(callback.source)
  const statusCfg = callbackStatusConfig[callback.status]
  const priorityCfg = callbackPriorityConfig[callback.priority]
  const sourceCfg = callSourceConfig[callback.source]
  const initials = callback.takenBy.name.split(' ').map(n => n[0]).join('')
  const assignedEmployee = employees.find(e => e.id === callback.assignedEmployeeId)
  const emailActivities = [...callback.activityLog]
    .filter((activity) => activity.type === 'email_gesendet')
    .sort((a, b) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime())
  const completionActivities = [...callback.activityLog]
    .filter((activity) => activity.type === 'abgeschlossen')
    .sort((a, b) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime())

  const hasHistory =
    callback.reassignedFrom
    || callback.escalatedBy
    || callback.escalationHistory.length > 0
    || callbackReminders.length > 0
    || completionActivities.length > 0
    || emailActivities.length > 0

  const handleSheetOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setEmailStatus('idle')
      setEmailStatusMessage('')
    }
    onOpenChange(nextOpen)
  }

  const handleSendNotificationEmail = async () => {
    if (!isVerenaCallback || isNotificationEmailAvailable !== true) return

    setEmailStatus('sending')
    setEmailStatusMessage('')

    try {
      const response = await fetch('/api/email/send-callback-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          callbackId: callback.id,
          sentBy: currentUserName,
        }),
      })

      const data = await response.json() as {
        error?: string
        provider?: string
        providerMessageId?: string
        recipientEmail?: string
        recipientName?: string
      }

      if (!response.ok) {
        throw new Error(data.error ?? 'Benachrichtigungs-E-Mail konnte nicht gesendet werden.')
      }

      const recipientEmail =
        data.recipientEmail
        ?? notificationRecipientEmail
        ?? CALLBACK_NOTIFICATION_RECIPIENT_EMAIL
      const recipientName =
        data.recipientName
        ?? notificationRecipientName
        ?? CALLBACK_NOTIFICATION_RECIPIENT_NAME

      recordCallbackNotificationEmailSent({
        callbackId: callback.id,
        recipientEmail,
        recipientName,
        sentBy: currentUserName,
        provider: data.provider ?? 'brevo',
        providerMessageId: data.providerMessageId,
      })

      setEmailStatus('success')
      setEmailStatusMessage(`Benachrichtigung an ${recipientEmail} gesendet.`)
    } catch (error) {
      setEmailStatus('error')
      setEmailStatusMessage(error instanceof Error ? error.message : 'Benachrichtigungs-E-Mail konnte nicht gesendet werden.')
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleSheetOpenChange}>
      <SheetContent className="sm:max-w-lg p-0 flex flex-col h-full">
        {/* Header - fixed */}
        <SheetHeader className="px-6 pt-6 pb-4 flex-shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <SheetTitle className="text-lg">{callback.customerName}</SheetTitle>
              <p className="text-sm text-muted-foreground">{callback.customerPhone}</p>
            </div>
            {!isCompleted && callback.dueAt && (
              <CountdownBadge dueAt={callback.dueAt} slaDurationMinutes={callback.slaDurationMinutes} />
            )}
          </div>
        </SheetHeader>

        {/* Scrollable content */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="space-y-4 px-6 pb-6">
              {/* Assigned to - prominent */}
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className={cn(
                    'text-xs font-semibold',
                    isKi
                      ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'
                      : 'bg-primary/10 text-primary',
                  )}>
                    {isKi ? <Bot className="h-4 w-4" /> : initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{callback.assignedAdvisor}</p>
                  <p className="text-xs text-muted-foreground">
                    Aufgenommen von {callback.takenBy.name}
                    {isKi && ' (KI)'}
                  </p>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <Badge variant="secondary" className={cn('text-[10px]', statusCfg.color)}>
                    {statusCfg.label}
                  </Badge>
                  <Badge variant="secondary" className={cn('text-[10px]', priorityCfg.color)}>
                    {priorityCfg.label}
                  </Badge>
                </div>
              </div>

              {/* Compact metadata row */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium', sourceCfg.color)}>
                  <SourceIcon className="h-3 w-3" />
                  {sourceCfg.label}
                </span>
                <span className="text-muted-foreground/40">|</span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDuration(callback.callDuration)}
                </span>
                <span className="text-muted-foreground/40">|</span>
                <span>{formatTimeAgo(callback.createdAt)}</span>
              </div>

              {/* Anliegen + Notizen */}
              <div className="text-sm space-y-1">
                <p>
                  <span className="font-medium">Anliegen:</span>{' '}
                  <span className="text-muted-foreground">{callback.reason}</span>
                </p>
                {callback.notes && (
                  <p>
                    <span className="font-medium">Notizen:</span>{' '}
                    <span className="text-muted-foreground">{callback.notes}</span>
                  </p>
                )}
              </div>

              {/* Completion banner */}
              {isCompleted && callback.completionNotes && (
                <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg px-3 py-2">
                  <CheckCircle className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>{callback.completionNotes}</span>
                </div>
              )}

              <Separator />

              {/* Transcript */}
              <div>
                <h4 className="text-sm font-semibold mb-2">Gespräch / Zusammenfassung</h4>
                {callback.callTranscript ? (
                  <div className="bg-muted/40 rounded-lg p-3 text-sm leading-relaxed whitespace-pre-wrap">
                    {callback.callTranscript}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Kein Transkript verfügbar</p>
                )}
              </div>

              {/* Verlauf (History) - combined section, only if content exists */}
              {hasHistory && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Verlauf</h4>
                    <div className="relative ml-2 border-l-2 border-muted pl-4 space-y-2.5">
                      {/* Reassignment */}
                      {callback.reassignedFrom && (
                        <div className="relative">
                          <div className="absolute -left-[22px] top-1 h-2.5 w-2.5 rounded-full border-2 border-background bg-blue-400" />
                          <div className="text-xs space-y-0.5">
                            <p className="font-medium text-foreground">Umgeleitet</p>
                            <p className="text-muted-foreground">
                              Von <span className="font-medium text-foreground">{callback.reassignedFrom}</span>
                              {callback.reassignedAt && ` · ${formatTimeAgo(callback.reassignedAt)}`}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Escalation event */}
                      {callback.escalatedBy && (
                        <div className="relative">
                          <div className="absolute -left-[22px] top-1 h-2.5 w-2.5 rounded-full border-2 border-background bg-amber-400" />
                          <div className="text-xs space-y-0.5">
                            <p className="font-medium text-amber-700 dark:text-amber-400">Eskaliert</p>
                            <p className="text-muted-foreground">
                              Von <span className="font-medium text-foreground">{callback.escalatedBy}</span>
                              {callback.escalatedAt && ` · ${formatTimeAgo(callback.escalatedAt)}`}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Escalation history */}
                      {callback.escalationHistory.map((event) => {
                        const levelCfg = escalationLevelConfig[event.toLevel as EscalationLevel]
                        return (
                          <div key={event.id} className="relative">
                            <div className={cn(
                              'absolute -left-[22px] top-1 h-2.5 w-2.5 rounded-full border-2 border-background',
                              levelCfg?.bg ?? 'bg-muted',
                            )} />
                            <div className="text-xs space-y-0.5">
                              <p className={cn('font-medium', levelCfg?.color)}>
                                Stufe {event.fromLevel} → {event.toLevel}
                              </p>
                              <p className="text-muted-foreground">
                                {event.escalatedBy} → {event.escalatedTo}
                                {' · '}{formatTimeAgo(event.escalatedAt)}
                              </p>
                              {event.note && (
                                <p className="text-muted-foreground italic">{event.note}</p>
                              )}
                            </div>
                          </div>
                        )
                      })}

                      {/* Reminders */}
                      {callbackReminders.map((reminder) => (
                        <div key={reminder.id} className="relative">
                          <div className="absolute -left-[22px] top-1 h-2.5 w-2.5 rounded-full border-2 border-background bg-violet-400" />
                          <div className="text-xs space-y-0.5">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-foreground">Erinnerung</p>
                              <Badge
                                variant="secondary"
                                className={cn('text-[9px] py-0 h-4', {
                                  'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400': reminder.status === 'ausstehend',
                                  'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400': reminder.status === 'angezeigt',
                                  'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400': reminder.status === 'erledigt',
                                })}
                              >
                                {reminder.status === 'ausstehend' ? 'Ausstehend' : reminder.status === 'angezeigt' ? 'Angezeigt' : 'Erledigt'}
                              </Badge>
                            </div>
                            <p className="text-muted-foreground">{reminder.message}</p>
                            <p className="text-muted-foreground">
                              {new Date(reminder.reminderAt).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })} Uhr
                            </p>
                          </div>
                        </div>
                      ))}

                      {/* Sent emails */}
                      {emailActivities.map((activity) => {
                        const recipientName = activity.metadata?.recipientName
                        const recipientEmail = activity.metadata?.recipientEmail
                        const emailLabel = getEmailActivityLabel(activity.metadata?.emailKind)

                        return (
                          <div key={activity.id} className="relative">
                            <div className="absolute -left-[22px] top-1 h-2.5 w-2.5 rounded-full border-2 border-background bg-emerald-400" />
                            <div className="text-xs space-y-0.5">
                              <p className="font-medium text-emerald-700 dark:text-emerald-400">{emailLabel} gesendet</p>
                              <p className="text-muted-foreground">
                                {recipientName ? `An ${recipientName}` : 'Empfänger unbekannt'}
                                {recipientEmail ? ` (${recipientEmail})` : ''}
                                {' · '}
                                {formatTimeAgo(activity.performedAt)}
                              </p>
                              <p className="text-muted-foreground">
                                Ausgelöst von <span className="font-medium text-foreground">{activity.performedBy}</span>
                              </p>
                            </div>
                          </div>
                        )
                      })}

                      {/* Completed callbacks */}
                      {completionActivities.map((activity) => {
                        const noteFromMetadata = activity.metadata?.completionNotes
                        const completionNote = noteFromMetadata || callback.completionNotes

                        return (
                          <div key={activity.id} className="relative">
                            <div className="absolute -left-[22px] top-1 h-2.5 w-2.5 rounded-full border-2 border-background bg-emerald-500" />
                            <div className="text-xs space-y-0.5">
                              <p className="font-medium text-emerald-700 dark:text-emerald-400">Rückruf erledigt</p>
                              <p className="text-muted-foreground">
                                Von <span className="font-medium text-foreground">{activity.performedBy}</span>
                                {' · '}
                                {formatTimeAgo(activity.performedAt)}
                              </p>
                              <p className="text-muted-foreground">{activity.description}</p>
                              {completionNote && (
                                <p className="text-muted-foreground">
                                  Notiz: <span className="font-medium text-foreground">{completionNote}</span>
                                </p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Footer actions - fixed */}
        {(!isCompleted || onDelete) && (
          <div className="flex-shrink-0 border-t px-6 py-3 space-y-2">
            {!isCompleted && (
              <>
                {isVerenaCallback && assignedEmployee && (
                  <div className="space-y-2 rounded-lg border border-dashed px-3 py-2.5">
                    <div className="flex items-start gap-2 text-xs text-muted-foreground">
                      <Mail className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground">Benachrichtigungs-E-Mail senden</p>
                        <p>
                          Zuständig: <span className="font-medium text-foreground">{assignedEmployee.name}</span>
                        </p>
                        <p className="truncate">
                          Aktueller Empfänger: <span className="font-medium text-foreground">{notificationRecipientEmail || CALLBACK_NOTIFICATION_RECIPIENT_EMAIL}</span>
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={handleSendNotificationEmail}
                        disabled={
                          emailStatus === 'sending'
                          || isNotificationEmailAvailabilityLoading
                          || isNotificationEmailAvailable === false
                        }
                        className="flex-shrink-0"
                      >
                        <Send className={cn('mr-1 h-3.5 w-3.5', emailStatus === 'sending' && 'animate-pulse')} />
                        {emailStatus === 'sending'
                          ? 'Sende...'
                          : isNotificationEmailAvailabilityLoading
                            ? 'Pruefe...'
                            : isNotificationEmailAvailable === false
                              ? 'Nicht verfuegbar'
                              : 'Senden'}
                      </Button>
                    </div>

                    {(emailStatus !== 'idle' || notificationEmailUnavailableMessage) && (
                      <p
                        className={cn(
                          'text-xs',
                          emailStatus === 'success' && 'text-emerald-700 dark:text-emerald-400',
                          emailStatus === 'error' && 'text-red-700 dark:text-red-400',
                          emailStatus === 'sending' && 'text-muted-foreground',
                          !emailStatusMessage
                          && notificationEmailUnavailableMessage
                          && 'text-red-700 dark:text-red-400',
                        )}
                      >
                        {emailStatusMessage
                          || (emailStatus === 'sending'
                            ? 'Benachrichtigungs-E-Mail wird versendet...'
                            : notificationEmailUnavailableMessage)}
                      </p>
                    )}
                  </div>
                )}
                <div className="flex gap-2">
                  {onReassign && (
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => onReassign(callback.id)}>
                      <ArrowRightLeft className="h-3.5 w-3.5 mr-1" />
                      Zuweisen
                    </Button>
                  )}
                  {onEscalateToLevel ? (
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => onEscalateToLevel(callback.id)}>
                      <Shield className="h-3.5 w-3.5 mr-1" />
                      Eskalieren
                    </Button>
                  ) : onEscalate ? (
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => onEscalate(callback.id)}>
                      <ChevronUp className="h-3.5 w-3.5 mr-1" />
                      Eskalieren
                    </Button>
                  ) : null}
                  {onSetReminder && (
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => onSetReminder(callback.id)}>
                      <Bell className="h-3.5 w-3.5 mr-1" />
                      Erinnerung
                    </Button>
                  )}
                  {onComplete && (
                    <Button size="sm" className="flex-1" onClick={() => onComplete(callback.id)}>
                      <CheckCircle className="h-3.5 w-3.5 mr-1" />
                      Erledigt
                    </Button>
                  )}
                </div>
              </>
            )}
            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                className="w-full text-destructive hover:text-destructive"
                onClick={() => onDelete(callback.id)}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Rückruf löschen
              </Button>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
