'use client'

import { useState, useMemo } from 'react'
import { Mail, Send, Reply, Bot, Clock, CheckCheck, ChevronDown, ChevronRight, Search, Inbox } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

// ---- Types ----

interface EmailThread {
  id: string
  subject: string
  callbackId?: string
  customerName?: string
  messages: EmailMessage[]
  lastMessageAt: string
  isRead: boolean
}

interface EmailMessage {
  id: string
  from: string
  fromRole: 'callcenter' | 'berater' | 'ki'
  to: string
  subject: string
  body: string
  sentAt: string
  isAiProcessed?: boolean
  relatedAction?: string
}

// ---- Mock Data ----

const mockThreads: EmailThread[] = [
  {
    id: 'thread-1',
    subject: 'Erinnerung: Rückruf Peter Wagner — Reklamation Ölwechsel',
    callbackId: 'cb-1',
    customerName: 'Peter Wagner',
    lastMessageAt: new Date(Date.now() - 8 * 60000).toISOString(),
    isRead: false,
    messages: [
      {
        id: 'msg-1a',
        from: 'Marina Schittenhelm (Call Center)',
        fromRole: 'callcenter',
        to: 'Michael Schmidt',
        subject: 'Erinnerung: Rückruf Peter Wagner — Reklamation Ölwechsel',
        body: 'Hallo Michael,\n\nbitte rufe Peter Wagner (+49 711 3456789) dringend zurück. Er hat eine Reklamation bezüglich seines Ölwechsels. Der Rückruf ist seit 31 Minuten überfällig.\n\nSLA-Frist: 5 Min. (Dringend)\n\nBitte kümmere dich zeitnah darum.\n\nViele Grüße\nMarina Schittenhelm',
        sentAt: new Date(Date.now() - 25 * 60000).toISOString(),
      },
      {
        id: 'msg-1b',
        from: 'Michael Schmidt',
        fromRole: 'berater',
        to: 'Marina Schittenhelm (Call Center)',
        subject: 'Re: Erinnerung: Rückruf Peter Wagner — Reklamation Ölwechsel',
        body: 'Hallo Lisa,\n\nich habe Herrn Wagner soeben zurückgerufen. Das Problem mit dem Ölwechsel war ein Missverständnis — er hatte eine falsche Rechnung erhalten. Ich habe das geklärt und ihm eine korrigierte Rechnung zugeschickt.\n\nRückruf erledigt.\n\nGrüße\nMichael',
        sentAt: new Date(Date.now() - 8 * 60000).toISOString(),
      },
      {
        id: 'msg-1c',
        from: 'KI-Assistent',
        fromRole: 'ki',
        to: 'System',
        subject: 'Automatische Verarbeitung: Rückruf erledigt',
        body: '✓ Rückruf-Status aktualisiert: Erledigt\n✓ Kundenakte Peter Wagner aktualisiert\n✓ SLA-Bericht: Überfällig (+31 Min.)\n\nAntwort von Michael Schmidt erkannt und verarbeitet. Der Rückruf wurde als "erledigt" markiert.',
        sentAt: new Date(Date.now() - 7 * 60000).toISOString(),
        isAiProcessed: true,
        relatedAction: 'Rückruf als erledigt markiert',
      },
    ],
  },
  {
    id: 'thread-2',
    subject: 'Rückruf: Sabine Wolf — Finanzierungsangebot',
    callbackId: 'cb-4',
    customerName: 'Sabine Wolf',
    lastMessageAt: new Date(Date.now() - 15 * 60000).toISOString(),
    isRead: false,
    messages: [
      {
        id: 'msg-2a',
        from: 'Marina Schittenhelm (Call Center)',
        fromRole: 'callcenter',
        to: 'Marina Schittenhelm (Serviceberater)',
        subject: 'Rückruf: Sabine Wolf — Finanzierungsangebot',
        body: 'Hallo,\n\nSabine Wolf (+49 711 4445566) hat angerufen und möchte ein Finanzierungsangebot für einen Audi A4 Avant besprechen. Bitte rufe sie zeitnah zurück.\n\nPriorität: Hoch\nQuelle: WhatsApp\n\nViele Grüße\nCall Center',
        sentAt: new Date(Date.now() - 19 * 60000).toISOString(),
      },
      {
        id: 'msg-2b',
        from: 'KI-Agent Max',
        fromRole: 'ki',
        to: 'Marina Schittenhelm (Call Center)',
        subject: 'Re: Rückruf: Sabine Wolf — Finanzierungsangebot',
        body: '🤖 Automatische Benachrichtigung:\n\nDer Rückruf für Sabine Wolf wurde von KI-Agent Max angenommen. Die Kundin wurde per WhatsApp kontaktiert und hat ein vorläufiges Finanzierungsangebot erhalten.\n\nStatus: In Bearbeitung\nNächster Schritt: Persönliches Beratungsgespräch vereinbart für morgen 10:00 Uhr',
        sentAt: new Date(Date.now() - 15 * 60000).toISOString(),
        isAiProcessed: true,
        relatedAction: 'Status auf "In Bearbeitung" gesetzt',
      },
    ],
  },
  {
    id: 'thread-3',
    subject: 'Dringende Eskalation: Frank Neumann — Lieferverzögerung',
    callbackId: 'cb-2',
    customerName: 'Frank Neumann',
    lastMessageAt: new Date(Date.now() - 45 * 60000).toISOString(),
    isRead: true,
    messages: [
      {
        id: 'msg-3a',
        from: 'Marina Schittenhelm (Call Center)',
        fromRole: 'callcenter',
        to: 'Thomas Müller',
        subject: 'Dringende Eskalation: Frank Neumann — Lieferverzögerung',
        body: 'Hallo Thomas,\n\nFrank Neumann (+49 711 7778899) hat sich zum dritten Mal gemeldet wegen der Lieferverzögerung seines Mercedes GLC. Er ist sehr verärgert.\n\nDies ist eine Eskalation Stufe 3. Bitte kümmere dich umgehend darum.\n\nPriorität: DRINGEND\nÜberfällig seit: 61 Minuten\n\nViele Grüße\nMarina Schittenhelm',
        sentAt: new Date(Date.now() - 65 * 60000).toISOString(),
      },
      {
        id: 'msg-3b',
        from: 'Thomas Müller',
        fromRole: 'berater',
        to: 'Marina Schittenhelm (Call Center)',
        subject: 'Re: Dringende Eskalation: Frank Neumann — Lieferverzögerung',
        body: 'Lisa,\n\nich bin gerade im Kundengespräch. Ich rufe Herrn Neumann in 15 Minuten zurück. Bitte teile ihm mit, dass ich mich persönlich kümmere.\n\nThomas',
        sentAt: new Date(Date.now() - 50 * 60000).toISOString(),
      },
      {
        id: 'msg-3c',
        from: 'KI-Assistent',
        fromRole: 'ki',
        to: 'System',
        subject: 'Verarbeitung: Berater-Antwort erkannt',
        body: '✓ Antwort von Thomas Müller verarbeitet\n✓ Status bleibt: Überfällig (Berater hat Rückruf in 15 Min. angekündigt)\n✓ Automatische Erinnerung in 15 Minuten gesetzt',
        sentAt: new Date(Date.now() - 49 * 60000).toISOString(),
        isAiProcessed: true,
        relatedAction: 'Erinnerung in 15 Min. gesetzt',
      },
      {
        id: 'msg-3d',
        from: 'Thomas Müller',
        fromRole: 'berater',
        to: 'Marina Schittenhelm (Call Center)',
        subject: 'Re: Re: Dringende Eskalation: Frank Neumann — Lieferverzögerung',
        body: 'Erledigt. Habe Herrn Neumann angerufen und die Situation geklärt. Das Fahrzeug kommt nächste Woche Mittwoch. Er ist jetzt zufrieden.\n\nThomas',
        sentAt: new Date(Date.now() - 45 * 60000).toISOString(),
      },
      {
        id: 'msg-3e',
        from: 'KI-Assistent',
        fromRole: 'ki',
        to: 'System',
        subject: 'Automatische Verarbeitung: Rückruf erledigt',
        body: '✓ Rückruf-Status aktualisiert: Erledigt\n✓ Eskalation abgeschlossen\n✓ Kundenakte Frank Neumann aktualisiert\n✓ SLA-Bericht: Überfällig (+61 Min.)',
        sentAt: new Date(Date.now() - 44 * 60000).toISOString(),
        isAiProcessed: true,
        relatedAction: 'Rückruf als erledigt markiert',
      },
    ],
  },
  {
    id: 'thread-4',
    subject: 'Neuer Rückruf: Hans Gruber — Probefahrt BMW 320d',
    callbackId: 'cb-5',
    customerName: 'Hans Gruber',
    lastMessageAt: new Date(Date.now() - 9 * 60000).toISOString(),
    isRead: true,
    messages: [
      {
        id: 'msg-4a',
        from: 'Marina Schittenhelm (Call Center)',
        fromRole: 'callcenter',
        to: 'Thomas Müller',
        subject: 'Neuer Rückruf: Hans Gruber — Probefahrt BMW 320d',
        body: 'Hallo Thomas,\n\nHans Gruber (+49 711 1234567) möchte eine Probefahrt mit dem BMW 320d vereinbaren. Bitte rufe ihn zurück.\n\nPriorität: Hoch\nQuelle: Telefon\n\nViele Grüße\nLisa',
        sentAt: new Date(Date.now() - 9 * 60000).toISOString(),
      },
    ],
  },
  {
    id: 'thread-5',
    subject: 'Werkstatttermin: Markus Lehmann — Inspektionstermin',
    callbackId: 'cb-7',
    customerName: 'Markus Lehmann',
    lastMessageAt: new Date(Date.now() - 3 * 60000).toISOString(),
    isRead: false,
    messages: [
      {
        id: 'msg-5a',
        from: 'KI-Agent Luna',
        fromRole: 'ki',
        to: 'Marina Schittenhelm (Call Center)',
        subject: 'Werkstatttermin: Markus Lehmann — Inspektionstermin',
        body: '🤖 Automatisch erfasster Rückruf:\n\nMarkus Lehmann (+49 711 1112233) hat über den KI-Agenten einen Werkstatttermin für eine Inspektion angefragt. Der Rückruf wurde an Michael Schmidt (Serviceberater) zugewiesen.\n\nKundendetails:\n- Fahrzeug: VW Golf 7\n- Gewünschter Termin: Nächste Woche\n- Anliegen: Regelmäßige Inspektion + Ölwechsel',
        sentAt: new Date(Date.now() - 7 * 60000).toISOString(),
        isAiProcessed: true,
      },
      {
        id: 'msg-5b',
        from: 'Michael Schmidt',
        fromRole: 'berater',
        to: 'KI-Agent Luna',
        subject: 'Re: Werkstatttermin: Markus Lehmann — Inspektionstermin',
        body: 'Termin ist für nächsten Dienstag 14:00 eingetragen. Kunde wird noch bestätigt.',
        sentAt: new Date(Date.now() - 3 * 60000).toISOString(),
      },
    ],
  },
]

// ---- Helper ----

function formatTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diffMin = Math.round((now.getTime() - d.getTime()) / 60000)
  if (diffMin < 1) return 'Jetzt'
  if (diffMin < 60) return `vor ${diffMin} Min.`
  const diffH = Math.round(diffMin / 60)
  if (diffH < 24) return `vor ${diffH} Std.`
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
}

function getRoleIcon(role: EmailMessage['fromRole']) {
  if (role === 'ki') return Bot
  if (role === 'callcenter') return Send
  return Reply
}

function getRoleBadge(role: EmailMessage['fromRole']) {
  if (role === 'ki') return { label: 'KI', class: 'bg-violet-100 text-violet-700 dark:bg-violet-950/30 dark:text-violet-400' }
  if (role === 'callcenter') return { label: 'Call Center', class: 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400' }
  return { label: 'Berater', class: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' }
}

// ---- Component ----

export function CallcenterEmailInbox() {
  const [threads] = useState<EmailThread[]>(mockThreads)
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set())

  const filteredThreads = useMemo(() => {
    if (!searchQuery.trim()) return threads
    const q = searchQuery.toLowerCase()
    return threads.filter(
      t =>
        t.subject.toLowerCase().includes(q) ||
        t.customerName?.toLowerCase().includes(q) ||
        t.messages.some(m => m.body.toLowerCase().includes(q) || m.from.toLowerCase().includes(q))
    )
  }, [threads, searchQuery])

  const selectedThread = threads.find(t => t.id === selectedThreadId)
  const unreadCount = threads.filter(t => !t.isRead).length

  const toggleMessage = (msgId: string) => {
    setExpandedMessages(prev => {
      const next = new Set(prev)
      if (next.has(msgId)) next.delete(msgId)
      else next.add(msgId)
      return next
    })
  }

  return (
    <div className="flex h-[calc(100vh-320px)] min-h-[500px] rounded-xl border bg-card overflow-hidden">
      {/* Thread List */}
      <div className={cn(
        'flex flex-col border-r w-full md:w-[380px] md:min-w-[380px]',
        selectedThreadId && 'hidden md:flex'
      )}>
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <Inbox className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold">Posteingang</span>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="h-5 min-w-[20px] justify-center rounded-full px-1.5 text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400">
              {unreadCount}
            </Badge>
          )}
        </div>
        <div className="px-3 py-2 border-b">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Suche in E-Mails..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredThreads.map(thread => {
            const lastMsg = thread.messages[thread.messages.length - 1]
            const hasAi = thread.messages.some(m => m.isAiProcessed)
            return (
              <button
                key={thread.id}
                onClick={() => {
                  setSelectedThreadId(thread.id)
                  setExpandedMessages(new Set(thread.messages.map(m => m.id)))
                }}
                className={cn(
                  'w-full text-left px-4 py-3 border-b transition-colors hover:bg-muted/50',
                  selectedThreadId === thread.id && 'bg-muted/80',
                  !thread.isRead && 'bg-blue-50/50 dark:bg-blue-950/10'
                )}
              >
                <div className="flex items-start gap-2">
                  {!thread.isRead && (
                    <div className="mt-1.5 h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={cn('text-xs truncate', !thread.isRead && 'font-semibold')}>
                        {lastMsg.from}
                      </p>
                      <span className="text-[10px] text-muted-foreground flex-shrink-0">
                        {formatTime(thread.lastMessageAt)}
                      </span>
                    </div>
                    <p className={cn('text-xs mt-0.5 truncate', !thread.isRead ? 'font-medium text-foreground' : 'text-muted-foreground')}>
                      {thread.subject}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[10px] text-muted-foreground truncate">
                        {lastMsg.body.slice(0, 60).replace(/\n/g, ' ')}...
                      </span>
                      {hasAi && (
                        <Bot className="h-3 w-3 text-violet-500 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
          {filteredThreads.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Mail className="h-8 w-8 mb-2 opacity-40" />
              <p className="text-sm">Keine E-Mails gefunden</p>
            </div>
          )}
        </div>
      </div>

      {/* Message Detail */}
      <div className={cn(
        'flex-1 flex flex-col',
        !selectedThreadId && 'hidden md:flex'
      )}>
        {selectedThread ? (
          <>
            <div className="flex items-center gap-2 border-b px-4 py-3">
              <button
                className="md:hidden text-muted-foreground hover:text-foreground"
                onClick={() => setSelectedThreadId(null)}
              >
                ←
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{selectedThread.subject}</p>
                <p className="text-[10px] text-muted-foreground">
                  {selectedThread.messages.length} Nachrichten · {selectedThread.customerName && `Kunde: ${selectedThread.customerName}`}
                </p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {selectedThread.messages.map((msg, idx) => {
                const RoleIcon = getRoleIcon(msg.fromRole)
                const badge = getRoleBadge(msg.fromRole)
                const isExpanded = expandedMessages.has(msg.id)
                const isLast = idx === selectedThread.messages.length - 1
                return (
                  <div
                    key={msg.id}
                    className={cn(
                      'rounded-lg border',
                      msg.isAiProcessed
                        ? 'bg-violet-50/50 dark:bg-violet-950/10 border-violet-200 dark:border-violet-900/30'
                        : 'bg-card'
                    )}
                  >
                    <button
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left"
                      onClick={() => toggleMessage(msg.id)}
                    >
                      <div className={cn(
                        'flex items-center justify-center h-7 w-7 rounded-full flex-shrink-0',
                        msg.fromRole === 'ki' ? 'bg-violet-100 dark:bg-violet-900/30' :
                        msg.fromRole === 'callcenter' ? 'bg-blue-100 dark:bg-blue-900/30' :
                        'bg-emerald-100 dark:bg-emerald-900/30'
                      )}>
                        <RoleIcon className={cn(
                          'h-3.5 w-3.5',
                          msg.fromRole === 'ki' ? 'text-violet-600' :
                          msg.fromRole === 'callcenter' ? 'text-blue-600' :
                          'text-emerald-600'
                        )} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium truncate">{msg.from}</span>
                          <Badge variant="secondary" className={cn('text-[9px] px-1.5 py-0 h-4', badge.class)}>
                            {badge.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-muted-foreground">an {msg.to}</span>
                          <span className="text-[10px] text-muted-foreground">· {formatTime(msg.sentAt)}</span>
                        </div>
                      </div>
                      {msg.isAiProcessed && msg.relatedAction && (
                        <Badge variant="secondary" className="text-[9px] bg-violet-100 text-violet-700 dark:bg-violet-950/30 dark:text-violet-400 flex-shrink-0">
                          <CheckCheck className="h-2.5 w-2.5 mr-1" />
                          {msg.relatedAction}
                        </Badge>
                      )}
                      {isExpanded || isLast ? (
                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      )}
                    </button>
                    {(isExpanded || isLast) && (
                      <div className="px-4 pb-3 pt-0">
                        <div className="ml-10 text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed border-t pt-3">
                          {msg.body}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <Mail className="h-12 w-12 mb-3 opacity-20" />
            <p className="text-sm font-medium">Wähle eine E-Mail aus</p>
            <p className="text-xs mt-1">Klicke auf einen Thread um die Details zu sehen</p>
          </div>
        )}
      </div>
    </div>
  )
}
