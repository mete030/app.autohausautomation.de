'use client'

import { useState, useMemo } from 'react'
import { Mail, Send, Check, Headset, UserCog } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { useCallbackStore } from '@/lib/stores/callback-store'
import { callbackPriorityConfig, callbackStatusConfig, employeeRoleConfig, mockCallAgents } from '@/lib/constants'
import type { Callback } from '@/lib/types'

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
        const statusOrder: Record<string, number> = { ueberfaellig: 0, offen: 1, in_bearbeitung: 2 }
        const priorityOrder: Record<string, number> = { dringend: 0, hoch: 1, mittel: 2, niedrig: 3 }
        const sd = (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9)
        if (sd !== 0) return sd
        return (priorityOrder[a.priority] ?? 9) - (priorityOrder[b.priority] ?? 9)
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
    const recs = tab === 'extern' ? externRecipients : internRecipients
    setSelectedRecipients(new Set(recs.map(r => r.id)))
  }

  const toggleRecipient = (id: string) => {
    setSelectedRecipients(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const toggleCallback = (id: string) => {
    setSelectedCallbacks(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const selectAllRecipients = () => setSelectedRecipients(new Set(recipients.map(r => r.id)))
  const selectNoRecipients = () => setSelectedRecipients(new Set())
  const selectAllCallbacks = () => setSelectedCallbacks(new Set(selectableCallbacks.map(cb => cb.id)))
  const selectNoCallbacks = () => setSelectedCallbacks(new Set())

  const emailPreview = useMemo(() => {
    const today = formatDate(new Date())
    const { overdueCallbacks, openCallbacks, inProgressCallbacks, completedToday } = summaryData
    const included = selectableCallbacks.filter(cb => selectedCallbacks.has(cb.id))
    const isIntern = mailTab === 'intern'
    const greeting = isIntern ? 'Hallo Call-Center-Team,' : 'Guten Morgen Team,'

    let body = `${greeting}\n\nhier die aktuelle Rückruf-Übersicht vom ${today}:\n\n`
    body += `━━━  ZUSAMMENFASSUNG  ━━━━━━━━━━━━━━━━━━━━━\n\n`
    body += `  Überfällig:       ${overdueCallbacks.length}\n`
    body += `  Offen:            ${openCallbacks.length}\n`
    body += `  In Bearbeitung:   ${inProgressCallbacks.length}\n`
    body += `  Heute erledigt:   ${completedToday}\n\n`

    if (included.length > 0) {
      body += `━━━  RÜCKRUFE (${included.length})  ━━━━━━━━━━━━━━━━━━━━\n\n`

      for (const cb of included) {
        const isOverdue = cb.status === 'ueberfaellig'
        const overMs = Date.now() - new Date(cb.slaDeadline).getTime()
        const overMin = Math.round(overMs / 60000)

        body += `  ${isOverdue ? '🔴' : cb.status === 'offen' ? '🔵' : '🟡'} ${cb.customerName}\n`
        body += `     Anliegen:  ${cb.reason}\n`
        body += `     Berater:   ${cb.assignedAdvisor}\n`
        body += `     Priorität: ${callbackPriorityConfig[cb.priority].label}`
        if (isOverdue) body += ` · Überfällig seit ${overMin} Min.`
        else body += ` · Fällig: ${formatTime(cb.dueAt)}`
        body += '\n\n'
      }
    }

    body += isIntern
      ? `Bitte stellt sicher, dass alle Rückrufe zeitnah\nan die zuständigen Berater weitergeleitet werden.\n\n`
      : `Bitte kümmert euch zeitnah um die offenen Rückrufe.\n\n`

    body += `Viele Grüße\nCallcenter Administration`
    return body
  }, [summaryData, selectedCallbacks, selectableCallbacks, mailTab])

  const handleSend = () => setSent(true)

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
      <DialogContent className="sm:max-w-[900px] max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-950/30">
                <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              Tägliche Rundmail
            </DialogTitle>
            <DialogDescription>
              Status-Übersicht und offene Rückrufe an das Team senden
            </DialogDescription>
          </DialogHeader>

          {/* Tabs + Stats in header */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-1 rounded-lg border bg-muted/50 p-0.5">
              <button
                onClick={() => handleTabChange('extern')}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all',
                  mailTab === 'extern' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <UserCog className="h-3.5 w-3.5" />
                Extern — Berater & Verkäufer
              </button>
              <button
                onClick={() => handleTabChange('intern')}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all',
                  mailTab === 'intern' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Headset className="h-3.5 w-3.5" />
                Intern — Call-Center
              </button>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                <span className="font-bold text-red-600 tabular-nums">{summaryData.overdueCallbacks.length}</span>
                <span className="text-muted-foreground">Überfällig</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-400" />
                <span className="font-bold text-blue-600 tabular-nums">{summaryData.openCallbacks.length}</span>
                <span className="text-muted-foreground">Offen</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                <span className="font-bold text-amber-600 tabular-nums">{summaryData.inProgressCallbacks.length}</span>
                <span className="text-muted-foreground">In Bearb.</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span className="font-bold text-emerald-600 tabular-nums">{summaryData.completedToday}</span>
                <span className="text-muted-foreground">Erledigt</span>
              </div>
            </div>
          </div>
        </div>

        {!sent ? (
          <>
            {/* Body — two columns */}
            <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-[320px_1fr] divide-x">
              {/* Left: Recipients + Callbacks */}
              <div className="overflow-y-auto px-5 py-4 space-y-4">
                {/* Recipients */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold">Empfänger</Label>
                    <div className="flex items-center gap-2">
                      <button onClick={selectAllRecipients} className="text-[10px] text-primary hover:underline">Alle</button>
                      <span className="text-[10px] text-muted-foreground">·</span>
                      <button onClick={selectNoRecipients} className="text-[10px] text-primary hover:underline">Keine</button>
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    {recipients.map(emp => {
                      const roleCfg = employeeRoleConfig[emp.role]
                      return (
                        <label
                          key={emp.id}
                          className={cn(
                            'flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs cursor-pointer transition-colors',
                            selectedRecipients.has(emp.id)
                              ? 'bg-primary/5'
                              : 'hover:bg-muted/50 opacity-60'
                          )}
                        >
                          <Checkbox
                            checked={selectedRecipients.has(emp.id)}
                            onCheckedChange={() => toggleRecipient(emp.id)}
                            className="h-3 w-3"
                          />
                          <span className="font-medium truncate flex-1">{emp.name}</span>
                          <Badge variant="secondary" className={cn('text-[8px] px-1 py-0 h-3.5', roleCfg.color)}>
                            {roleCfg.label}
                          </Badge>
                        </label>
                      )
                    })}
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {selectedRecipients.size} von {recipients.length} ausgewählt
                  </p>
                </div>

                {/* Callback selection */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold">Rückrufe aufnehmen</Label>
                    <div className="flex items-center gap-2">
                      <button onClick={selectAllCallbacks} className="text-[10px] text-primary hover:underline">Alle</button>
                      <span className="text-[10px] text-muted-foreground">·</span>
                      <button onClick={selectNoCallbacks} className="text-[10px] text-primary hover:underline">Keine</button>
                    </div>
                  </div>
                  <div className="max-h-[260px] overflow-y-auto space-y-0.5 rounded-lg border p-1">
                    {selectableCallbacks.map(cb => {
                      const prioCfg = callbackPriorityConfig[cb.priority]
                      return (
                        <label
                          key={cb.id}
                          className={cn(
                            'flex items-center gap-1.5 rounded px-2 py-1 text-[11px] cursor-pointer transition-colors',
                            selectedCallbacks.has(cb.id)
                              ? 'bg-primary/5'
                              : 'hover:bg-muted/50 opacity-50'
                          )}
                        >
                          <Checkbox
                            checked={selectedCallbacks.has(cb.id)}
                            onCheckedChange={() => toggleCallback(cb.id)}
                            className="h-3 w-3 flex-shrink-0"
                          />
                          <div className={cn('h-1.5 w-1.5 rounded-full flex-shrink-0',
                            cb.status === 'ueberfaellig' ? 'bg-red-500' :
                            cb.status === 'offen' ? 'bg-blue-400' : 'bg-amber-400'
                          )} />
                          <span className="font-medium truncate flex-1">{cb.customerName}</span>
                          <Badge variant="secondary" className={cn('text-[7px] px-1 py-0 h-3 flex-shrink-0', prioCfg.color)}>
                            {prioCfg.label}
                          </Badge>
                        </label>
                      )
                    })}
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {selectedCallbacks.size} von {selectableCallbacks.length} ausgewählt
                  </p>
                </div>
              </div>

              {/* Right: Preview */}
              <div className="overflow-y-auto px-5 py-4 bg-muted/10">
                <Label className="text-xs font-semibold mb-2 block">E-Mail Vorschau</Label>
                <div className="rounded-xl border bg-white dark:bg-card shadow-sm p-6 min-h-[420px]">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4 pb-3 border-b">
                    <span className="font-medium text-foreground">Von:</span> callcenter@wackenhut.de
                    <span className="mx-2">·</span>
                    <span className="font-medium text-foreground">An:</span> {selectedRecipients.size} Empfänger
                    <span className="mx-2">·</span>
                    <span className="font-medium text-foreground">Betreff:</span> Rückruf-Übersicht {new Date().toLocaleDateString('de-DE')}
                  </div>
                  <pre className="text-[13px] text-foreground/85 whitespace-pre-wrap font-sans leading-[1.7]">
                    {emailPreview}
                  </pre>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t flex gap-3">
              <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
                Abbrechen
              </Button>
              <Button
                onClick={handleSend}
                disabled={selectedRecipients.size === 0 || selectedCallbacks.size === 0}
                className="flex-1 gap-2"
              >
                <Send className="h-4 w-4" />
                {mailTab === 'intern' ? 'Intern' : 'Extern'} an {selectedRecipients.size} senden
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
                Die {mailTab === 'intern' ? 'interne' : 'externe'} Übersicht wurde erfolgreich an{' '}
                <span className="font-medium text-foreground">{selectedRecipients.size} Mitarbeiter</span> gesendet.
              </p>
            </div>
            <div className="px-6 py-4 border-t">
              <Button onClick={() => setOpen(false)} className="w-full">
                Schließen
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
