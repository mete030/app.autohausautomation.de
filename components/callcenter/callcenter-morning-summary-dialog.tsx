'use client'

import { useState, useMemo } from 'react'
import { Mail, Send, Check, Headset, UserCog } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { useCallbackStore } from '@/lib/stores/callback-store'
import { callbackPriorityConfig, employeeRoleConfig } from '@/lib/constants'

type MailTab = 'extern' | 'intern'

function formatDate(date: Date) {
  return date.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
}

export function CallcenterMorningSummaryDialog() {
  const { callbacks, employees } = useCallbackStore()
  const [open, setOpen] = useState(false)
  const [sent, setSent] = useState(false)
  const [mailTab, setMailTab] = useState<MailTab>('extern')
  const [selectedRecipients, setSelectedRecipients] = useState<Set<string>>(new Set())
  const [selectedCallbacks, setSelectedCallbacks] = useState<Set<string>>(new Set())
  const [previewNowMs, setPreviewNowMs] = useState(() => Date.now())

  const summaryData = useMemo(() => {
    const activeCallbacks = callbacks.filter(cb => cb.status !== 'erledigt')
    const overdueCallbacks = activeCallbacks.filter(cb => cb.status === 'ueberfaellig')
    const openCallbacks = activeCallbacks.filter(cb => cb.status === 'offen')
    const inProgressCallbacks = activeCallbacks.filter(cb => cb.status === 'in_bearbeitung')
    const todayStr = new Date().toDateString()
    const completedToday = callbacks.filter(cb =>
      cb.status === 'erledigt' && cb.completedAt &&
      new Date(cb.completedAt).toDateString() === todayStr
    ).length
    return { activeCallbacks, overdueCallbacks, openCallbacks, inProgressCallbacks, completedToday }
  }, [callbacks])

  const selectableCallbacks = useMemo(() => {
    return callbacks.filter(cb => cb.status !== 'erledigt')
      .sort((a, b) => {
        const so: Record<string, number> = { ueberfaellig: 0, offen: 1, in_bearbeitung: 2 }
        const po: Record<string, number> = { dringend: 0, hoch: 1, mittel: 2, niedrig: 3 }
        const sd = (so[a.status] ?? 9) - (so[b.status] ?? 9)
        return sd !== 0 ? sd : (po[a.priority] ?? 9) - (po[b.priority] ?? 9)
      })
  }, [callbacks])

  const externRecipients = useMemo(() => employees.filter(e => e.role === 'serviceberater' || e.role === 'verkaufer'), [employees])
  const internRecipients = useMemo(() => employees.filter(e => e.isCallAgent), [employees])
  const recipients = mailTab === 'extern' ? externRecipients : internRecipients

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen)
    if (isOpen) {
      setSent(false)
      setMailTab('extern')
      setPreviewNowMs(Date.now())
      setSelectedRecipients(new Set(externRecipients.map(r => r.id)))
      setSelectedCallbacks(new Set(selectableCallbacks.map(cb => cb.id)))
    }
  }

  const handleTabChange = (tab: MailTab) => {
    setMailTab(tab)
    setSelectedRecipients(new Set((tab === 'extern' ? externRecipients : internRecipients).map(r => r.id)))
  }

  const toggleRecipient = (id: string) => {
    setSelectedRecipients(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  const toggleCallback = (id: string) => {
    setSelectedCallbacks(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  const selectAllRecipients = () => setSelectedRecipients(new Set(recipients.map(r => r.id)))
  const selectNoRecipients = () => setSelectedRecipients(new Set())
  const selectAllCallbacks = () => setSelectedCallbacks(new Set(selectableCallbacks.map(cb => cb.id)))
  const selectNoCallbacks = () => setSelectedCallbacks(new Set())

  const includedCallbacks = useMemo(
    () => selectableCallbacks.filter(cb => selectedCallbacks.has(cb.id)),
    [selectableCallbacks, selectedCallbacks]
  )

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Mail className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Tägliche Rundmail</span>
          <span className="sm:hidden">Rundmail</span>
          {summaryData.overdueCallbacks.length > 0 && (
            <Badge variant="secondary" className="h-4 min-w-[16px] px-1 text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400">
              {summaryData.overdueCallbacks.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:w-[calc(100vw-2rem)] sm:max-w-[calc(100vw-2rem)] md:max-w-[1040px] xl:max-w-[1120px] sm:h-[min(860px,calc(100dvh-1rem))] max-h-[92dvh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* ── Header ── */}
        <div className="px-5 pt-4 pb-3 md:px-6 md:pt-5 md:pb-4 border-b space-y-3 md:space-y-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-blue-100 dark:bg-blue-950/30">
                <Mail className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              </div>
              Tägliche Rundmail
            </DialogTitle>
            <DialogDescription className="text-xs">
              Rückruf-Übersicht an das Team versenden
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            {/* Tabs */}
            <div className="flex items-center gap-1 rounded-lg border bg-muted/50 p-0.5 self-start">
              {([
                { key: 'extern' as MailTab, icon: UserCog, label: 'Berater & Verkäufer' },
                { key: 'intern' as MailTab, icon: Headset, label: 'Call-Center intern' },
              ] as const).map(t => (
                <button
                  key={t.key}
                  onClick={() => handleTabChange(t.key)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-md px-2.5 py-2 md:px-3 md:py-1.5 text-xs font-medium transition-all',
                    mailTab === t.key ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <t.icon className="h-3.5 w-3.5" />
                  {t.label}
                </button>
              ))}
            </div>

            {/* Compact KPIs */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px]">
              {[
                { n: summaryData.overdueCallbacks.length, l: 'Überfällig', c: 'text-red-600 dark:text-red-400', dot: 'bg-red-500' },
                { n: summaryData.openCallbacks.length, l: 'Offen', c: 'text-blue-600 dark:text-blue-400', dot: 'bg-blue-500' },
                { n: summaryData.inProgressCallbacks.length, l: 'In Bearbeitung', c: 'text-amber-600 dark:text-amber-400', dot: 'bg-amber-500' },
                { n: summaryData.completedToday, l: 'Erledigt', c: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' },
              ].map(k => (
                <div key={k.l} className="flex items-center gap-1.5 whitespace-nowrap">
                  <span className={cn('h-1.5 w-1.5 rounded-full', k.dot)} />
                  <span className={cn('font-bold tabular-nums', k.c)}>{k.n}</span>
                  <span className="text-muted-foreground">{k.l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {!sent ? (
          <>
            {/* ── Body ── */}
            <div className="min-h-0 flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-[340px_minmax(0,1fr)]">
              {/* Left sidebar */}
              <div className="min-h-0 overflow-y-auto border-b lg:border-b-0 lg:border-r px-4 py-4 lg:px-5 lg:py-5 lg:flex lg:flex-col lg:gap-5">
                {/* Recipients */}
                <div className="shrink-0">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Empfänger</Label>
                    <div className="flex gap-1.5">
                      <button onClick={selectAllRecipients} className="text-[10px] text-primary hover:underline">Alle</button>
                      <button onClick={selectNoRecipients} className="text-[10px] text-primary hover:underline">Keine</button>
                    </div>
                  </div>
                  <div className="space-y-px">
                    {recipients.map(emp => (
                      <label
                        key={emp.id}
                        className={cn(
                          'flex items-center gap-2 rounded-md px-2 py-1.5 text-[11px] cursor-pointer transition-colors',
                          selectedRecipients.has(emp.id) ? 'bg-primary/5' : 'hover:bg-muted/50 opacity-50'
                        )}
                      >
                        <Checkbox checked={selectedRecipients.has(emp.id)} onCheckedChange={() => toggleRecipient(emp.id)} className="h-3.5 w-3.5" />
                        <span className="font-medium truncate flex-1">{emp.name}</span>
                        <Badge variant="secondary" className={cn('text-[9px] leading-none px-1.5 py-0.5 font-medium', employeeRoleConfig[emp.role].color)}>
                          {employeeRoleConfig[emp.role].label}
                        </Badge>
                      </label>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1.5">{selectedRecipients.size}/{recipients.length} ausgewählt</p>
                </div>

                {/* Callbacks */}
                <div className="min-h-0 lg:flex lg:flex-1 lg:flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Rückrufe</Label>
                    <div className="flex gap-1.5">
                      <button onClick={selectAllCallbacks} className="text-[10px] text-primary hover:underline">Alle</button>
                      <button onClick={selectNoCallbacks} className="text-[10px] text-primary hover:underline">Keine</button>
                    </div>
                  </div>
                  <div className="max-h-[260px] overflow-y-auto space-y-px rounded-lg border p-1 lg:min-h-0 lg:max-h-none lg:flex-1">
                    {selectableCallbacks.map(cb => (
                      <label
                        key={cb.id}
                        className={cn(
                          'flex items-center gap-1.5 rounded px-2 py-1 text-[10px] cursor-pointer transition-colors',
                          selectedCallbacks.has(cb.id) ? 'bg-primary/5' : 'hover:bg-muted/50 opacity-40'
                        )}
                      >
                        <Checkbox checked={selectedCallbacks.has(cb.id)} onCheckedChange={() => toggleCallback(cb.id)} className="h-3 w-3 flex-shrink-0" />
                        <span className={cn('h-1.5 w-1.5 rounded-full flex-shrink-0',
                          cb.status === 'ueberfaellig' ? 'bg-red-500' : cb.status === 'offen' ? 'bg-blue-400' : 'bg-amber-400'
                        )} />
                        <span className="font-medium truncate flex-1">{cb.customerName}</span>
                        <Badge variant="secondary" className={cn('text-[9px] leading-none px-1.5 py-0.5 font-medium', callbackPriorityConfig[cb.priority].color)}>
                          {callbackPriorityConfig[cb.priority].label}
                        </Badge>
                      </label>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1.5">{selectedCallbacks.size}/{selectableCallbacks.length} ausgewählt</p>
                </div>
              </div>

              {/* Right — email preview */}
              <div className="@container/preview min-w-0 overflow-y-auto bg-stone-50 dark:bg-muted/20">
                <div className="px-4 py-4 @[480px]/preview:px-6 @[480px]/preview:py-6">
                  <div className="mx-auto w-full max-w-[680px] rounded-xl border bg-white dark:bg-card shadow-sm overflow-hidden">

                    {/* Subject strip — no Von/An mockup, just the subject + recipient count */}
                    <div className="bg-muted/40 dark:bg-muted/20 px-4 py-2.5 border-b">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Betreff</p>
                      <p className="text-[13px] font-semibold leading-tight truncate">
                        Rückruf-Übersicht — {new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1 truncate">
                        An <span className="font-medium text-foreground">{selectedRecipients.size}</span> {selectedRecipients.size === 1 ? 'Empfänger' : 'Empfänger'} · von callcenter@wackenhut.de
                      </p>
                    </div>

                    {/* Email body */}
                    <div className="px-4 py-4 @[480px]/preview:px-6 @[480px]/preview:py-5 space-y-5">
                      {/* Greeting */}
                      <p className="text-[13px] leading-relaxed">
                        {mailTab === 'intern' ? 'Hallo Call-Center-Team,' : 'Guten Morgen Team,'}
                      </p>
                      <p className="text-[13px] leading-relaxed -mt-2">
                        hier die aktuelle Rückruf-Übersicht vom {formatDate(new Date())}:
                      </p>

                      {/* Summary stat strip — adapts to container width */}
                      <div className="grid grid-cols-2 @[560px]/preview:grid-cols-4 gap-2">
                        {[
                          { n: summaryData.overdueCallbacks.length, l: 'Überfällig', c: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/30', dot: 'bg-red-500' },
                          { n: summaryData.openCallbacks.length, l: 'Offen', c: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30', dot: 'bg-blue-500' },
                          { n: summaryData.inProgressCallbacks.length, l: 'In Bearbeitung', c: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30', dot: 'bg-amber-500' },
                          { n: summaryData.completedToday, l: 'Erledigt', c: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30', dot: 'bg-emerald-500' },
                        ].map(k => (
                          <div key={k.l} className={cn('min-w-0 flex items-center gap-2 rounded-lg border px-2.5 py-2', k.bg)}>
                            <span className={cn('h-1.5 w-1.5 rounded-full flex-shrink-0', k.dot)} />
                            <span className={cn('text-base font-bold tabular-nums leading-none', k.c)}>{k.n}</span>
                            <span className="min-w-0 text-[10px] text-muted-foreground leading-tight">{k.l}</span>
                          </div>
                        ))}
                      </div>

                      {/* Callback list — 2-line layout so names breathe */}
                      {includedCallbacks.length > 0 && (
                        <div>
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                            Rückrufe ({includedCallbacks.length})
                          </p>
                          <div className="rounded-lg border overflow-hidden divide-y">
                            {includedCallbacks.map(cb => {
                              const isOverdue = cb.status === 'ueberfaellig'
                              const overMin = Math.round((previewNowMs - new Date(cb.slaDeadline).getTime()) / 60000)
                              const prioCfg = callbackPriorityConfig[cb.priority]
                              return (
                                <div key={cb.id} className={cn('flex items-start gap-2.5 px-3 py-2', isOverdue && 'bg-red-50/50 dark:bg-red-950/10')}>
                                  <span className={cn('h-2 w-2 rounded-full flex-shrink-0 mt-1.5',
                                    isOverdue ? 'bg-red-500' : cb.status === 'offen' ? 'bg-blue-400' : 'bg-amber-400'
                                  )} />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[12px] font-semibold truncate leading-tight">{cb.customerName}</p>
                                    <p className="text-[10.5px] text-muted-foreground truncate leading-tight mt-0.5">
                                      {cb.reason} · {cb.assignedAdvisor}
                                    </p>
                                  </div>
                                  <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                                    <span className={cn('text-[11px] font-medium tabular-nums whitespace-nowrap leading-none',
                                      isOverdue ? 'text-red-600 dark:text-red-400' : 'text-foreground'
                                    )}>
                                      {isOverdue ? `+${overMin} Min.` : formatTime(cb.dueAt)}
                                    </span>
                                    <Badge variant="secondary" className={cn('text-[9px] leading-none px-1.5 py-0.5 font-medium', prioCfg.color)}>
                                      {prioCfg.label}
                                    </Badge>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Sign-off */}
                      <div className="text-[12px] text-muted-foreground leading-relaxed pt-3 border-t space-y-2">
                        <p>
                          {mailTab === 'intern'
                            ? 'Bitte stellt sicher, dass alle Rückrufe zeitnah an die zuständigen Berater weitergeleitet werden.'
                            : 'Bitte kümmert euch zeitnah um die offenen Rückrufe.'}
                        </p>
                        <p>
                          Viele Grüße<br />
                          <span className="font-medium text-foreground">Callcenter Administration</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Footer ── */}
            <div className="shrink-0 px-5 py-3 md:px-6 border-t flex flex-col-reverse gap-2 sm:flex-row sm:gap-3">
              <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
                Abbrechen
              </Button>
              <Button
                onClick={() => setSent(true)}
                disabled={selectedRecipients.size === 0 || selectedCallbacks.size === 0}
                className="flex-1 gap-2"
              >
                <Send className="h-3.5 w-3.5" />
                An {selectedRecipients.size} {mailTab === 'intern' ? 'intern' : 'extern'} senden
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex-1 flex flex-col items-center justify-center py-16 gap-3">
              <div className="flex items-center justify-center h-14 w-14 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                <Check className="h-7 w-7 text-emerald-600" />
              </div>
              <p className="text-base font-semibold mt-2">Rundmail gesendet!</p>
              <p className="text-sm text-muted-foreground text-center max-w-[300px]">
                Die {mailTab === 'intern' ? 'interne' : 'externe'} Übersicht wurde an{' '}
                <span className="font-medium text-foreground">{selectedRecipients.size} Mitarbeiter</span> versendet.
              </p>
            </div>
            <div className="px-6 py-3 border-t">
              <Button onClick={() => setOpen(false)} className="w-full">Schließen</Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
