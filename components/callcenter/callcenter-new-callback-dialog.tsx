'use client'

import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Plus, Search, User, X, Check, Phone, CheckCircle2, Mail, Loader2, CalendarClock } from 'lucide-react'
import { CallbackAttachmentUploader, type LocalAttachment } from '@/components/callcenter/callback-attachment-uploader'
import { cn } from '@/lib/utils'
import {
  callSourceConfig,
  mockCallAgents,
  mockCustomers,
  employeeRoleConfig,
  employeeStatusConfig,
} from '@/lib/constants'
import { useBrowserNotifications } from '@/lib/hooks/use-browser-notifications'
import {
  markCallbackNotificationActivitySeen,
  sendCallbackNotificationEmail,
} from '@/lib/callcenter/callback-notification-client'
import { useCallbackStore } from '@/lib/stores/callback-store'
import type {
  Callback,
  CallbackActivity,
  CallbackAttachment,
  CallbackPriority,
  CallSource,
  CallAgent,
  Employee,
  EmployeeRole,
} from '@/lib/types'

interface CreateCallbackPayload {
  customerName: string
  customerPhone: string
  reason: string
  notes: string
  assignedAdvisor: string
  assignedEmployeeId?: string
  priority: CallbackPriority
  source: CallSource
  takenBy: CallAgent
  callTranscript?: string
  slaDurationMinutes?: number
  dueAt?: string
}

/**
 * Reminder emails are always routed to this fixed tester address. The matching
 * constant in the send-callback-notification API route enforces it server-side
 * as well — this client copy is only used for the optimistic confirmation.
 */
const FIXED_NOTIFICATION_RECIPIENT_EMAIL = 'v.ratti@wackenhut.de'

type DialogStep = 'form' | 'success'

interface NewCallbackDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (payload: CreateCallbackPayload) => Promise<Callback>
  advisorNames?: string[]
  defaultAgentId?: string
  currentUser?: string
}

const priorityOptions: { value: CallbackPriority; label: string }[] = [
  { value: 'niedrig', label: 'Niedrig' },
  { value: 'mittel', label: 'Mittel' },
  { value: 'hoch', label: 'Hoch' },
  { value: 'dringend', label: 'Dringend' },
]

const priorityLabelMap: Record<CallbackPriority, string> = {
  niedrig: 'Niedrig',
  mittel: 'Mittel',
  hoch: 'Hoch',
  dringend: 'Dringend',
}

const dueTimeOptions = [
  { minutes: 5, label: '5 min' },
  { minutes: 15, label: '15 min' },
  { minutes: 30, label: '30 min' },
  { minutes: 60, label: '1 Std' },
  { minutes: 120, label: '2 Std' },
]

const sourceOptions = Object.entries(callSourceConfig).map(([value, cfg]) => ({
  value: value as CallSource,
  label: cfg.label,
}))

const assignableRoles = new Set<EmployeeRole>(['serviceberater', 'verkaufer'])

function combineScheduledDateTime(dateValue: string, timeValue: string) {
  if (!dateValue || !timeValue) return null

  const [year, month, day] = dateValue.split('-').map(Number)
  const [hours, minutes] = timeValue.split(':').map(Number)
  const combined = new Date(year, (month ?? 1) - 1, day, hours ?? 0, minutes ?? 0, 0, 0)

  if (Number.isNaN(combined.getTime())) {
    return null
  }

  return combined
}

function formatDueAtLabel(dueAt: string) {
  return new Date(dueAt).toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function NewCallbackDialog({ open, onOpenChange, onCreate, advisorNames, defaultAgentId, currentUser }: NewCallbackDialogProps) {
  // Form state
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [priority, setPriority] = useState<CallbackPriority>('mittel')
  const [assignedAdvisor, setAssignedAdvisor] = useState('')
  const [assignedEmployeeId, setAssignedEmployeeId] = useState('')
  const [source, setSource] = useState<CallSource>('telefon')
  const [agentId, setAgentId] = useState('')
  const [slaDurationMinutes, setSlaDurationMinutes] = useState<number | null>(null)
  const [manualDueOverride, setManualDueOverride] = useState(false)
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [showExactSchedule, setShowExactSchedule] = useState(false)

  // Dialog step state
  const [dialogStep, setDialogStep] = useState<DialogStep>('form')
  const [createdCallback, setCreatedCallback] = useState<Callback | null>(null)
  const [sentEmailRecipient, setSentEmailRecipient] = useState<{ name: string; email: string } | null>(null)
  const [isCreatingCallback, setIsCreatingCallback] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  // Guards the one-shot automatic reminder send so re-renders (and React strict
  // mode's double effect invocation) can't dispatch duplicate emails.
  const autoSendTriggeredCallbackIdRef = useRef<string | null>(null)

  // Pending attachments selected before the callback is persisted.
  const [pendingAttachments, setPendingAttachments] = useState<LocalAttachment[]>([])
  // Attachments uploaded after the callback was persisted, used for display.
  const [uploadedCreationAttachments, setUploadedCreationAttachments] = useState<CallbackAttachment[]>([])

  // Store data
  const employees = useCallbackStore((s) => s.employees)
  const slaConfig = useCallbackStore((s) => s.slaConfig)
  const callbacks = useCallbackStore((s) => s.callbacks)
  const recordCallbackNotificationEmailSent = useCallbackStore((s) => s.recordCallbackNotificationEmailSent)
  const { notify: notifyBrowser } = useBrowserNotifications()

  const useEmployees = employees.length > 0

  // Customer search inline combobox
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false)
  const [customerSearch, setCustomerSearch] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Compute effective SLA duration
  const effectiveSla = slaDurationMinutes ?? slaConfig.perPriority[priority] ?? slaConfig.defaultMinutes
  const hasExactScheduleInput = scheduledDate.trim().length > 0 || scheduledTime.trim().length > 0
  const scheduledDueAtPreview = useMemo(() => {
    const scheduledDueAt = combineScheduledDateTime(scheduledDate, scheduledTime)
    return scheduledDueAt ? formatDueAtLabel(scheduledDueAt.toISOString()) : null
  }, [scheduledDate, scheduledTime])

  // The reminder email is only sendable once the callback has been persisted.
  const isEmailCapable = Boolean(createdCallback?.isPersisted)

  // Group employees by role
  const groupedEmployees = useMemo(() => {
    if (!useEmployees) return {}
    const eligibleEmployees = employees.filter((employee) => assignableRoles.has(employee.role))
    const groups: Record<EmployeeRole, typeof employees> = {} as Record<EmployeeRole, typeof employees>
    for (const emp of eligibleEmployees) {
      if (!groups[emp.role]) groups[emp.role] = []
      groups[emp.role].push(emp)
    }
    return groups
  }, [employees, useEmployees])

  // Count open callbacks per employee
  const openCountByEmployee = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const cb of callbacks) {
      if (cb.status !== 'erledigt' && cb.assignedEmployeeId) {
        counts[cb.assignedEmployeeId] = (counts[cb.assignedEmployeeId] || 0) + 1
      }
    }
    return counts
  }, [callbacks])

  // Pre-fill agent when dialog opens with a default
  useEffect(() => {
    if (open && defaultAgentId && !agentId) {
      setAgentId(defaultAgentId)
    }
  }, [open, defaultAgentId, agentId])

  // Close dropdown on outside click
  useEffect(() => {
    if (!customerDropdownOpen) return
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setCustomerDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [customerDropdownOpen])

  // When priority changes, auto-update SLA unless manually overridden
  const handlePriorityChange = useCallback((newPriority: CallbackPriority) => {
    setPriority(newPriority)
    if (!manualDueOverride) {
      setSlaDurationMinutes(null)
    }
  }, [manualDueOverride])

  const handleDueTimePick = useCallback((minutes: number) => {
    setSlaDurationMinutes(minutes)
    setManualDueOverride(true)
    // Presets and an exact due date/time are mutually exclusive — picking a
    // quick preset clears and closes the exact-schedule mode.
    setScheduledDate('')
    setScheduledTime('')
    setShowExactSchedule(false)
  }, [])

  const notifyCallbackScheduled = useCallback((callback: Callback, activity?: CallbackActivity) => {
    notifyBrowser('Neuer Rueckruf geplant', {
      body:
        `${callback.customerName} — ${callback.reason}\n`
        + `Geplant fuer ${formatDueAtLabel(callback.dueAt)}`,
      tag: `callback-email-${activity?.id ?? callback.id}`,
    })
  }, [notifyBrowser])

  const resolveScheduledDueAt = useCallback(() => {
    if (!hasExactScheduleInput) {
      return { dueAt: undefined as string | undefined, error: '' }
    }

    if (!scheduledDate.trim() || !scheduledTime.trim()) {
      return {
        dueAt: undefined,
        error: 'Bitte Datum und Uhrzeit fuer die exakte Planung vollstaendig ausfuellen.',
      }
    }

    const scheduledDueAt = combineScheduledDateTime(scheduledDate, scheduledTime)
    if (!scheduledDueAt) {
      return {
        dueAt: undefined,
        error: 'Der geplante Rueckruf konnte nicht aus Datum und Uhrzeit gelesen werden.',
      }
    }

    if (scheduledDueAt.getTime() <= Date.now()) {
      return {
        dueAt: undefined,
        error: 'Der geplante Rueckruf muss in der Zukunft liegen.',
      }
    }

    return {
      dueAt: scheduledDueAt.toISOString(),
      error: '',
    }
  }, [hasExactScheduleInput, scheduledDate, scheduledTime])

  const applyEmailSendResult = useCallback((callback: Callback, result: Awaited<ReturnType<typeof sendCallbackNotificationEmail>>) => {
    markCallbackNotificationActivitySeen(result.activity?.id)

    recordCallbackNotificationEmailSent({
      callbackId: callback.id,
      recipientEmail: result.recipientEmail,
      recipientName: result.recipientName,
      sentBy: currentUser ?? 'System',
      provider: result.provider,
      providerMessageId: result.providerMessageId,
      activity: result.activity,
    })

    notifyCallbackScheduled(callback, result.activity)

    setSentEmailRecipient({
      name: result.recipientName,
      email: result.recipientEmail,
    })
  }, [currentUser, notifyCallbackScheduled, recordCallbackNotificationEmailSent])

  const filteredCustomers = useMemo(() => {
    const q = customerSearch.toLowerCase()
    if (!q) return mockCustomers.slice(0, 8)
    return mockCustomers.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      (c.email && c.email.toLowerCase().includes(q))
    )
  }, [customerSearch])

  const resetForm = () => {
    setCustomerName('')
    setCustomerPhone('')
    setReason('')
    setNotes('')
    setPriority('mittel')
    setAssignedAdvisor('')
    setAssignedEmployeeId('')
    setSource('telefon')
    setAgentId('')
    setCustomerSearch('')
    setSlaDurationMinutes(null)
    setManualDueOverride(false)
    setScheduledDate('')
    setScheduledTime('')
    setShowExactSchedule(false)
  }

  const resetAll = () => {
    resetForm()
    setDialogStep('form')
    setCreatedCallback(null)
    setSentEmailRecipient(null)
    setCreateError(null)
    setIsCreatingCallback(false)
    setEmailError(null)
    setIsSendingEmail(false)
    autoSendTriggeredCallbackIdRef.current = null
    setPendingAttachments([])
    setUploadedCreationAttachments([])
  }

  const handleClose = (val: boolean) => {
    if (!val) resetAll()
    onOpenChange(val)
  }

  const handleSourceChange = (val: CallSource) => {
    setSource(val)
    if (val === 'ki_agent') {
      const kiAgent = mockCallAgents.find(a => a.type === 'ki')
      if (kiAgent) setAgentId(kiAgent.id)
    }
  }

  const handleSelectCustomer = (customer: typeof mockCustomers[number]) => {
    setCustomerName(customer.name)
    setCustomerPhone(customer.phone)
    setCustomerSearch('')
    setCustomerDropdownOpen(false)
  }

  const handleEmployeeSelect = (employeeId: string) => {
    const emp = employees.find(e => e.id === employeeId)
    if (emp) {
      setAssignedEmployeeId(emp.id)
      setAssignedAdvisor(emp.name)
    }
  }

  const uploadPendingAttachments = useCallback(
    async (callbackId: string, uploaderName: string): Promise<CallbackAttachment[]> => {
      if (pendingAttachments.length === 0) return []
      const uploaded: CallbackAttachment[] = []
      for (const attachment of pendingAttachments) {
        const formData = new FormData()
        formData.set('file', attachment.file)
        formData.set('stage', 'creation')
        formData.set('uploadedByName', uploaderName)
        formData.set('uploadedByRole', 'callcenter')
        const res = await fetch(`/api/callbacks/${callbackId}/attachments`, {
          method: 'POST',
          body: formData,
        })
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as { error?: string }
          throw new Error(data.error || `Anhang "${attachment.file.name}" konnte nicht hochgeladen werden.`)
        }
        const data = (await res.json()) as { attachment: CallbackAttachment }
        uploaded.push(data.attachment)
      }
      return uploaded
    },
    [pendingAttachments],
  )

  const handleCreate = async () => {
    const agent = mockCallAgents.find(a => a.id === agentId)
    if (!customerName.trim() || !reason.trim() || !assignedAdvisor || !agent) return

    const { dueAt, error } = resolveScheduledDueAt()
    if (error) {
      setCreateError(error)
      return
    }

    setIsCreatingCallback(true)
    setCreateError(null)
    setEmailError(null)

    try {
      const cb = await onCreate({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        reason: reason.trim(),
        notes: notes.trim(),
        assignedAdvisor,
        assignedEmployeeId: assignedEmployeeId || undefined,
        priority,
        source,
        takenBy: agent,
        slaDurationMinutes: effectiveSla,
        dueAt,
      })

      // Upload any attachments collected before persistence so they exist on
      // the callback by the time the email is offered.
      let uploaded: CallbackAttachment[] = []
      if (pendingAttachments.length > 0) {
        uploaded = await uploadPendingAttachments(cb.id, currentUser ?? agent.name)
      }
      setUploadedCreationAttachments(uploaded)

      resetForm()
      setPendingAttachments([])
      const finalCallback = {
        ...cb,
        attachments: [...(cb.attachments ?? []), ...uploaded],
      }
      setCreatedCallback(finalCallback)
      // Move to the success step, which automatically sends the reminder email
      // to the fixed recipient and then shows that recipient read-only.
      setDialogStep('success')
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : 'Rückruf konnte nicht erstellt werden.')
    } finally {
      setIsCreatingCallback(false)
    }
  }

  const autoSendNotification = useCallback(async (callback: Callback) => {
    setIsSendingEmail(true)
    setEmailError(null)

    try {
      const result = await sendCallbackNotificationEmail({
        callbackId: callback.id,
        sentBy: currentUser ?? 'System',
        // The recipient is forced server-side; we pass it through only so the
        // confirmation can render the correct address immediately.
        recipientEmail: FIXED_NOTIFICATION_RECIPIENT_EMAIL,
        recipientName: callback.assignedAdvisor,
      })
      applyEmailSendResult(callback, result)
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : 'Fehler beim Senden der E-Mail')
    } finally {
      setIsSendingEmail(false)
    }
  }, [currentUser, applyEmailSendResult])

  // Automatically send the reminder email once the callback has been persisted —
  // there is no manual confirmation step anymore.
  useEffect(() => {
    if (dialogStep !== 'success') return
    if (!createdCallback?.isPersisted) return
    if (autoSendTriggeredCallbackIdRef.current === createdCallback.id) return

    autoSendTriggeredCallbackIdRef.current = createdCallback.id
    void autoSendNotification(createdCallback)
  }, [dialogStep, createdCallback, autoSendNotification])

  const isValid = customerName.trim() && reason.trim() && assignedAdvisor && agentId

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md md:max-w-lg lg:max-w-xl max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-5rem)] overflow-y-auto" onOpenAutoFocus={(e) => e.preventDefault()}>
        {dialogStep === 'form' ? (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3 text-left">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Phone className="h-5 w-5" />
                </div>
                <div className="space-y-0.5">
                  <DialogTitle>Neuer Rückruf</DialogTitle>
                  <DialogDescription>Erfasse die Anfrage und weise sie einem Berater zu.</DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <div className="space-y-5">
              {/* === Kunde === */}
              <div className="space-y-1.5" ref={dropdownRef}>
                <label className="text-sm font-medium">
                  Kunde<span className="ml-1 text-destructive">*</span>
                </label>
                {customerName && !customerDropdownOpen ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => { setCustomerDropdownOpen(true); setCustomerSearch('') }}
                      className="flex h-10 md:h-9 flex-1 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm text-left hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary flex-shrink-0">
                        <User className="h-3 w-3" />
                      </div>
                      <span className="flex-1 truncate font-medium">{customerName}</span>
                      {customerPhone && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {customerPhone}
                        </span>
                      )}
                    </button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 flex-shrink-0"
                      onClick={() => { setCustomerName(''); setCustomerPhone('') }}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                    <Input
                      placeholder="Kunde suchen (Name, Telefon, E-Mail)..."
                      value={customerSearch}
                      onChange={e => { setCustomerSearch(e.target.value); setCustomerDropdownOpen(true) }}
                      onFocus={() => setCustomerDropdownOpen(true)}
                      className="pl-9 pr-8"
                      autoFocus={customerDropdownOpen}
                    />
                    {customerSearch && (
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                        onClick={() => setCustomerSearch('')}
                      >
                        <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                      </button>
                    )}
                  </div>
                )}

                {/* Dropdown results */}
                {customerDropdownOpen && (
                  <div className="border rounded-lg bg-background shadow-lg overflow-hidden -mt-0.5">
                    <div className="max-h-[180px] overflow-y-auto">
                      {filteredCustomers.length === 0 ? (
                        <div className="px-3 py-3 text-center text-sm text-muted-foreground">
                          Kein Kunde gefunden
                        </div>
                      ) : (
                        filteredCustomers.map(c => (
                          <button
                            key={c.id}
                            type="button"
                            className={cn(
                              'w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-muted/50 transition-colors',
                              customerName === c.name && 'bg-primary/5',
                            )}
                            onClick={() => handleSelectCustomer(c)}
                          >
                            <div className="flex items-center justify-center h-7 w-7 rounded-full bg-muted text-muted-foreground flex-shrink-0">
                              <User className="h-3.5 w-3.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium truncate">{c.name}</p>
                                {customerName === c.name && <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />}
                              </div>
                              <p className="text-xs text-muted-foreground">{c.phone}</p>
                            </div>
                            {c.vehicleInterest && (
                              <span className="text-[11px] text-muted-foreground/60 truncate max-w-[100px] hidden sm:inline">
                                {c.vehicleInterest}
                              </span>
                            )}
                          </button>
                        ))
                      )}
                    </div>
                    {customerSearch && (
                      <div className="border-t px-3 py-2">
                        <button
                          type="button"
                          className="text-xs text-primary hover:underline"
                          onClick={() => {
                            setCustomerName(customerSearch)
                            setCustomerDropdownOpen(false)
                            setCustomerSearch('')
                          }}
                        >
                          + &quot;{customerSearch}&quot; als neuen Kunden verwenden
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Phone field only for manually-entered customers without phone */}
                {customerName && !customerDropdownOpen && !customerPhone && (
                  <Input
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="Telefonnummer eingeben..."
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    className="mt-1.5"
                  />
                )}
              </div>

              {/* === Anliegen === */}
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">
                    Anliegen<span className="ml-1 text-destructive">*</span>
                  </label>
                  <Input
                    placeholder="Grund des Anrufs..."
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Notizen</label>
                  <Textarea
                    placeholder="Weitere Details..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>

              {/* === Zuweisung, Klassifizierung & Planung === */}
              <div className="space-y-4">
                {/* Zuweisen an - full width to avoid overflow */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">
                    Zuweisen an<span className="ml-1 text-destructive">*</span>
                  </label>
                  {useEmployees ? (
                    <Select value={assignedEmployeeId} onValueChange={handleEmployeeSelect}>
                      <SelectTrigger>
                        <SelectValue placeholder="Mitarbeiter wählen...">
                          {(() => {
                            const emp = employees.find(e => e.id === assignedEmployeeId)
                            if (!emp) return null
                            const statusCfg = employeeStatusConfig[emp.status]
                            const roleCfg = employeeRoleConfig[emp.role]
                            return (
                              <span className="flex items-center gap-2 truncate">
                                <span className={cn('h-2 w-2 rounded-full flex-shrink-0', statusCfg.dot)} />
                                <span className="truncate">{emp.name}</span>
                                <span className={cn('text-[10px] px-1.5 py-0.5 rounded', roleCfg.color)}>
                                  {roleCfg.label}
                                </span>
                              </span>
                            )
                          })()}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.entries(groupedEmployees) as [EmployeeRole, Employee[]][]).map(([role, emps]) => {
                          const roleCfg = employeeRoleConfig[role]
                          return (
                            <SelectGroup key={role}>
                              <SelectLabel className="text-xs text-muted-foreground">{roleCfg.label}</SelectLabel>
                              {emps.map(emp => {
                                const statusCfg = employeeStatusConfig[emp.status]
                                const openCount = openCountByEmployee[emp.id] ?? 0
                                return (
                                  <SelectItem key={emp.id} value={emp.id} textValue={emp.name}>
                                    <div className="flex items-center gap-2">
                                      <span className={cn('h-2 w-2 rounded-full flex-shrink-0', statusCfg.dot)} />
                                      <span className="truncate">{emp.name}</span>
                                      <Badge variant="secondary" className={cn('text-[10px] flex-shrink-0', roleCfg.color)}>
                                        {roleCfg.label}
                                      </Badge>
                                      <span className="text-xs text-muted-foreground flex-shrink-0">
                                        ({openCount})
                                      </span>
                                    </div>
                                  </SelectItem>
                                )
                              })}
                            </SelectGroup>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Select value={assignedAdvisor} onValueChange={setAssignedAdvisor}>
                      <SelectTrigger><SelectValue placeholder="Berater wählen..." /></SelectTrigger>
                      <SelectContent>
                        {(advisorNames ?? []).map(name => (
                          <SelectItem key={name} value={name}>{name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Priorität + Quelle */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Priorität</label>
                    <Select value={priority} onValueChange={v => handlePriorityChange(v as CallbackPriority)}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {priorityOptions.map(o => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Quelle</label>
                    <Select value={source} onValueChange={v => handleSourceChange(v as CallSource)}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {sourceOptions.map(o => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Angenommen von */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">
                    Angenommen von<span className="ml-1 text-destructive">*</span>
                  </label>
                  <Select value={agentId} onValueChange={setAgentId}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Agent wählen..." /></SelectTrigger>
                    <SelectContent>
                      {mockCallAgents.map(a => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.type === 'ki' ? `🤖 ${a.name}` : a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Fälligkeit */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Fälligkeit</label>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {dueTimeOptions.map(opt => {
                      const isActive = !showExactSchedule && effectiveSla === opt.minutes
                      return (
                        <Button
                          key={opt.minutes}
                          type="button"
                          variant="outline"
                          size="sm"
                          className={cn(
                            'h-9 md:h-8 px-3.5 text-xs rounded-full',
                            isActive && 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground border-primary',
                          )}
                          onClick={() => handleDueTimePick(opt.minutes)}
                        >
                          {opt.label}
                        </Button>
                      )
                    })}
                  </div>
                  {!showExactSchedule && !manualDueOverride && (
                    <p className="text-[11px] text-muted-foreground">Automatisch nach Priorität · ab jetzt gerechnet</p>
                  )}
                  {showExactSchedule ? (
                    <div className="rounded-lg border border-border/60 bg-muted/30 p-3 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium">Genaue Fälligkeit</p>
                        <button
                          type="button"
                          className="rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground"
                          aria-label="Genaue Fälligkeit entfernen, zurück zur Schnellauswahl"
                          onClick={() => {
                            setScheduledDate('')
                            setScheduledTime('')
                            setShowExactSchedule(false)
                          }}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="grid gap-2.5 sm:grid-cols-2">
                        <div className="space-y-1">
                          <label className="text-[11px] font-medium text-muted-foreground">Datum</label>
                          <Input
                            type="date"
                            value={scheduledDate}
                            min={new Date().toISOString().slice(0, 10)}
                            onChange={(event) => {
                              setScheduledDate(event.target.value)
                              setManualDueOverride(true)
                            }}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-medium text-muted-foreground">Uhrzeit</label>
                          <Input
                            type="time"
                            value={scheduledTime}
                            onChange={(event) => {
                              setScheduledTime(event.target.value)
                              setManualDueOverride(true)
                            }}
                          />
                        </div>
                      </div>
                      {scheduledDueAtPreview ? (
                        <p className="text-[11px] font-medium text-primary">
                          Fällig am {scheduledDueAtPreview} Uhr
                        </p>
                      ) : (
                        <p className="text-[11px] text-muted-foreground">
                          Ersetzt die Schnellauswahl oben — bitte Datum und Uhrzeit angeben.
                        </p>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowExactSchedule(true)}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                    >
                      <CalendarClock className="h-3.5 w-3.5" />
                      Genaue Fälligkeit festlegen (Datum &amp; Uhrzeit)
                    </button>
                  )}
                </div>
              </div>

              {/* === Anhänge === */}
              <CallbackAttachmentUploader
                mode="deferred"
                stage="creation"
                pending={pendingAttachments}
                onPendingChange={setPendingAttachments}
                disabled={isCreatingCallback}
                description="Optional. PDFs oder Bilder bis 10 MB werden direkt mit der Erinnerungs-E-Mail versendet."
              />
            </div>
            {createError && (
              <p className="text-sm text-red-700">{createError}</p>
            )}
            <DialogFooter className="flex-col-reverse gap-2 sm:flex-row">
              <Button variant="outline" className="h-10 w-full sm:h-9 sm:w-auto" onClick={() => handleClose(false)}>Abbrechen</Button>
              <Button className="h-10 w-full sm:h-9 sm:w-auto" disabled={!isValid || isCreatingCallback} onClick={() => { void handleCreate() }}>
                {isCreatingCallback ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Plus className="mr-1 h-4 w-4" />}
                {isCreatingCallback ? 'Erstelle...' : 'Erstellen'}
              </Button>
            </DialogFooter>
          </>
        ) : dialogStep === 'success' && createdCallback ? (
          <>
            <DialogHeader className="sr-only">
              <DialogTitle>Rückruf erstellt</DialogTitle>
              <DialogDescription>Der Rückruf wurde erfolgreich erstellt.</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center text-center py-4 space-y-4">
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Rückruf erstellt</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Der Rückruf wurde erfolgreich für <span className="font-medium text-foreground">{createdCallback.assignedAdvisor}</span> angelegt.
                </p>
              </div>

              {/* Summary */}
              <div className="w-full text-left rounded-lg border bg-muted/30 p-3.5 space-y-2 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Kunde</span>
                  <span className="font-medium text-right">{createdCallback.customerName}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Anliegen</span>
                  <span className="font-medium text-right truncate max-w-[220px]">{createdCallback.reason}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Zugewiesen an</span>
                  <span className="font-medium text-right">{createdCallback.assignedAdvisor}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Priorität</span>
                  <span className="font-medium text-right">{priorityLabelMap[createdCallback.priority]}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Geplant für</span>
                  <span className="font-medium text-right">{formatDueAtLabel(createdCallback.dueAt)} Uhr</span>
                </div>
              </div>

              {/* Attachments uploaded with the callback */}
              {uploadedCreationAttachments.length > 0 && (
                <div className="w-full text-left rounded-lg border border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-950/20 p-3 space-y-1.5">
                  <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    {uploadedCreationAttachments.length} Anhang{uploadedCreationAttachments.length === 1 ? '' : 'änge'} hochgeladen
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-0.5">
                    {uploadedCreationAttachments.map((att) => (
                      <li key={att.id} className="truncate">• {att.fileName}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* The reminder email is sent automatically — the recipient is shown read-only. */}
              {isEmailCapable ? (
                <div className="w-full space-y-3 pt-1">
                  {isSendingEmail ? (
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Erinnerungs-E-Mail wird automatisch gesendet...
                    </div>
                  ) : sentEmailRecipient ? (
                    <div className="w-full text-left rounded-lg border border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-950/20 p-3.5 space-y-2">
                      <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                        <Mail className="h-4 w-4" />
                        Erinnerungs-E-Mail gesendet
                      </div>
                      <div className="flex items-center justify-between gap-4 text-sm">
                        <span className="text-muted-foreground">Empfänger</span>
                        <span className="font-medium text-right">{sentEmailRecipient.email}</span>
                      </div>
                    </div>
                  ) : emailError ? (
                    <div className="space-y-2">
                      <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                        {emailError}
                      </p>
                      <Button
                        onClick={() => { void autoSendNotification(createdCallback) }}
                        variant="outline"
                        className="gap-1.5"
                      >
                        <Mail className="h-4 w-4" />
                        Erneut senden
                      </Button>
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => handleClose(false)} disabled={isSendingEmail}>
                  Schließen
                </Button>
              </div>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
