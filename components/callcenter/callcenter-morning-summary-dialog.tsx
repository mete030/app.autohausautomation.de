'use client'

import { useState, useMemo } from 'react'
import { Mail, Send, Check, Headset, UserCog, Clock, AlertTriangle } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { useCallbackStore } from '@/lib/stores/callback-store'
import { callbackPriorityConfig, callbackStatusConfig, employeeRoleConfig } from '@/lib/constants'

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
      setSelectedRecipients(new Set(externRecipients.map(r => r.id)))
      setSelectedCallbacks(new Set(selectableCallbacks.map(cb => cb.id)))
    }
  }

  const handleTabChange = (tab: MailTab) => {
    setMailTab(tab)
    setSelectedRecipients(new Set((tab === 'extern' ? externRecipients : internRecipients).map(r => r.id)))
  }

  const toggleRecipient = (id: string) => {
    setSelectedRecipients(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }
  const toggleCallback = (id: string) => {
    setSelectedCallbacks(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
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
            <Badge variant="secondary" className="h-4 min-w-[16px] px-1 text-[9px] font-bold bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400">
              {summaryData.overdueCallbacks.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[940px] max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* ── Header ── */}
        <div className="px-6 pt-5 pb-4 border-b space-y-4">
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

          <div className="flex items-center justify-between">
            {/* Tabs */}
            <div className="flex items-center gap-1 rounded-lg border bg-muted/50 p-0.5">
              {([
                { key: 'extern' as MailTab, icon: UserCog, label: 'Berater & Verkäufer' },
                { key: 'intern' as MailTab, icon: Headset, label: 'Call-Center intern' },
              ] as const).map(t => (
                <button
                  key={t.key}
                  onClick={() => handleTabChange(t.key)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all',
                    mailTab === t.key ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <t.icon className="h-3.5 w-3.5" />
                  {t.label}
                </button>
              ))}
            </div>

            {/* Compact KPIs */}
            <div className="hidden sm:flex items-center gap-4 text-[11px]">
              {[
                { n: summaryData.overdueCallbacks.length, l: 'Überfällig', c: 'text-red-600', dot: 'bg-red-500' },
                { n: summaryData.openCallbacks.length, l: 'Offen', c: 'text-blue-600', dot: 'bg-blue-400' },
                { n: summaryData.inProgressCallbacks.length, l: 'In Bearb.', c: 'text-amber-600', dot: 'bg-amber-400' },
                { n: summaryData.completedToday, l: 'Erledigt', c: 'text-emerald-600', dot: 'bg-emerald-400' },
              ].map(k => (
                <div key={k.l} className="flex items-center gap-1.5">
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
            <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-[280px_1fr]">
              {/* Left sidebar */}
              <div className="overflow-y-auto border-r px-4 py-4 space-y-5">
                {/* Recipients */}
                <div>
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
                        <Checkbox checked={selectedRecipients.has(emp.id)} onCheckedChange={() => toggleRecipient(emp.id)} className="h-3 w-3" />
                        <span className="font-medium truncate flex-1">{emp.name}</span>
                        <Badge variant="secondary" className={cn('text-[7px] px-1 py-0 h-3', employeeRoleConfig[emp.role].color)}>
                          {employeeRoleConfig[emp.role].label}
                        </Badge>
                      </label>
                    ))}
                  </div>
                  <p className="text-[9px] text-muted-foreground mt-1.5">{selectedRecipients.size}/{recipients.length} ausgewählt</p>
                </div>

                {/* Callbacks */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Rückrufe</Label>
                    <div className="flex gap-1.5">
                      <button onClick={selectAllCallbacks} className="text-[10px] text-primary hover:underline">Alle</button>
                      <button onClick={selectNoCallbacks} className="text-[10px] text-primary hover:underline">Keine</button>
                    </div>
                  </div>
                  <div className="max-h-[220px] overflow-y-auto space-y-px rounded-lg border p-1">
                    {selectableCallbacks.map(cb => (
                      <label
                        key={cb.id}
                        className={cn(
                          'flex items-center gap-1.5 rounded px-2 py-1 text-[10px] cursor-pointer transition-colors',
                          selectedCallbacks.has(cb.id) ? 'bg-primary/5' : 'hover:bg-muted/50 opacity-40'
                        )}
                      >
                        <Checkbox checked={selectedCallbacks.has(cb.id)} onCheckedChange={() => toggleCallback(cb.id)} className="h-2.5 w-2.5 flex-shrink-0" />
                        <span className={cn('h-1.5 w-1.5 rounded-full flex-shrink-0',
                          cb.status === 'ueberfaellig' ? 'bg-red-500' : cb.status === 'offen' ? 'bg-blue-400' : 'bg-amber-400'
                        )} />
                        <span className="font-medium truncate flex-1">{cb.customerName}</span>
                        <Badge variant="secondary" className={cn('text-[6px] px-0.5 py-0 h-2.5', callbackPriorityConfig[cb.priority].color)}>
                          {callbackPriorityConfig[cb.priority].label}
                        </Badge>
                      </label>
                    ))}
                  </div>
                  <p className="text-[9px] text-muted-foreground mt-1.5">{selectedCallbacks.size}/{selectableCallbacks.length} ausgewählt</p>
                </div>
              </div>

              {/* Right — rendered email preview */}
              <div className="overflow-y-auto bg-stone-50 dark:bg-muted/20 p-5">
                <div className="max-w-[540px] mx-auto rounded-xl border bg-white dark:bg-card shadow-sm overflow-hidden">
                  {/* Email header bar */}
                  <div className="bg-muted/40 dark:bg-muted/20 px-5 py-3 border-b space-y-1.5">
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="text-muted-foreground w-10">Von</span>
                      <span className="font-medium">callcenter@wackenhut.de</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="text-muted-foreground w-10">An</span>
                      <span className="font-medium">{selectedRecipients.size} Empfänger</span>
                      <span className="text-muted-foreground">
                        ({[...selectedRecipients].slice(0, 3).map(id => {
                          const emp = recipients.find(r => r.id === id)
                          return emp?.name.split(' ')[1] ?? emp?.name
                        }).join(', ')}{selectedRecipients.size > 3 ? `, +${selectedRecipients.size - 3}` : ''})
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="text-muted-foreground w-10">Betreff</span>
                      <span className="font-semibold">Rückruf-Übersicht — {new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                    </div>
                  </div>

                  {/* Email body — rendered, not raw text */}
                  <div className="px-5 py-5 space-y-5">
                    {/* Greeting */}
                    <p className="text-[13px] leading-relaxed">
                      {mailTab === 'intern' ? 'Hallo Call-Center-Team,' : 'Guten Morgen Team,'}<br /><br />
                      hier die aktuelle Rückruf-Übersicht vom {formatDate(new Date())}:
                    </p>

                    {/* Summary cards */}
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { n: summaryData.overdueCallbacks.length, l: 'Überfällig', c: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/30' },
                        { n: summaryData.openCallbacks.length, l: 'Offen', c: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30' },
                        { n: summaryData.inProgressCallbacks.length, l: 'In Bearb.', c: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30' },
                        { n: summaryData.completedToday, l: 'Erledigt', c: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30' },
                      ].map(k => (
                        <div key={k.l} className={cn('rounded-lg border p-2 text-center', k.bg)}>
                          <p className={cn('text-base font-bold tabular-nums', k.c)}>{k.n}</p>
                          <p className="text-[9px] text-muted-foreground">{k.l}</p>
                        </div>
                      ))}
                    </div>

                    {/* Callback list */}
                    {includedCallbacks.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                          Rückrufe ({includedCallbacks.length})
                        </p>
                        <div className="rounded-lg border overflow-hidden divide-y">
                          {includedCallbacks.map(cb => {
                            const isOverdue = cb.status === 'ueberfaellig'
                            const overMin = Math.round((Date.now() - new Date(cb.slaDeadline).getTime()) / 60000)
                            const prioCfg = callbackPriorityConfig[cb.priority]
                            return (
                              <div key={cb.id} className={cn('flex items-center gap-2.5 px-3 py-2', isOverdue && 'bg-red-50/50 dark:bg-red-950/10')}>
                                <div className={cn('h-2 w-2 rounded-full flex-shrink-0',
                                  isOverdue ? 'bg-red-500' : cb.status === 'offen' ? 'bg-blue-400' : 'bg-amber-400'
                                )} />
                                <div className="flex-1 min-w-0">
                                  <p className="text-[11px] font-semibold truncate">{cb.customerName}</p>
                                  <p className="text-[10px] text-muted-foreground truncate">{cb.reason} · {cb.assignedAdvisor}</p>
                                </div>
                                <Badge variant="secondary" className={cn('text-[7px] px-1 py-0 h-3.5 flex-shrink-0', prioCfg.color)}>
                                  {prioCfg.label}
                                </Badge>
                                <span className={cn('text-[10px] font-medium tabular-nums flex-shrink-0 w-[60px] text-right',
                                  isOverdue ? 'text-red-600' : 'text-muted-foreground'
                                )}>
                                  {isOverdue ? `+${overMin} Min.` : formatTime(cb.dueAt)}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="text-[12px] text-muted-foreground leading-relaxed pt-2 border-t">
                      <p>
                        {mailTab === 'intern'
                          ? 'Bitte stellt sicher, dass alle Rückrufe zeitnah an die zuständigen Berater weitergeleitet werden.'
                          : 'Bitte kümmert euch zeitnah um die offenen Rückrufe.'}
                      </p>
                      <p className="mt-3">
                        Viele Grüße<br />
                        <span className="font-medium text-foreground">Callcenter Administration</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Footer ── */}
            <div className="px-6 py-3 border-t flex gap-3">
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
