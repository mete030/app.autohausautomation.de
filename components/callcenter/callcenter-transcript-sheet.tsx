'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Bot, User, Phone, Globe, MessageCircle, PenLine, Clock, ArrowRightLeft, ChevronUp, CheckCircle } from 'lucide-react'
import { cn, formatTimeAgo } from '@/lib/utils'
import { callSourceConfig, callbackStatusConfig, callbackPriorityConfig } from '@/lib/constants'
import type { Callback, CallSource } from '@/lib/types'

interface TranscriptSheetProps {
  open: boolean
  callback: Callback | null
  onOpenChange: (open: boolean) => void
  onReassign: (id: string) => void
  onEscalate: (id: string) => void
  onComplete: (id: string) => void
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
  if (!seconds) return '—'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m > 0 ? `${m} min ${s} sek` : `${s} sek`
}

export function TranscriptSheet({ open, callback, onOpenChange, onReassign, onEscalate, onComplete }: TranscriptSheetProps) {
  if (!callback) return null

  const isKi = callback.takenBy.type === 'ki'
  const isCompleted = callback.status === 'erledigt'
  const canEscalate = callback.priority !== 'dringend' && !isCompleted
  const SourceIcon = getSourceIcon(callback.source)
  const statusCfg = callbackStatusConfig[callback.status]
  const priorityCfg = callbackPriorityConfig[callback.priority]
  const sourceCfg = callSourceConfig[callback.source]
  const initials = callback.takenBy.name.split(' ').map(n => n[0]).join('')

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-0">
          <SheetTitle className="text-lg">Anrufdetails</SheetTitle>
          <p className="text-sm text-muted-foreground">
            {callback.customerName} · {callback.customerPhone}
          </p>
        </SheetHeader>

        <ScrollArea className="flex-1 px-6">
          <div className="space-y-5 pb-6 pt-4">
            {/* Metadata */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className={cn(
                    'text-xs font-semibold',
                    isKi
                      ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'
                      : 'bg-primary/10 text-primary',
                  )}>
                    {isKi ? <Bot className="h-4 w-4" /> : initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{callback.takenBy.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {isKi ? 'KI-Agent' : 'Serviceberater'}
                  </p>
                </div>
                {isKi && (
                  <Badge variant="secondary" className="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 text-[10px]">
                    KI
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Quelle</p>
                  <div className="flex items-center gap-1.5">
                    <SourceIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className={cn('text-xs font-medium rounded-full px-2 py-0.5', sourceCfg.color)}>
                      {sourceCfg.label}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Dauer</p>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm">{formatDuration(callback.callDuration)}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Zeitpunkt</p>
                  <span className="text-sm">{formatTimeAgo(callback.createdAt)}</span>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Zugewiesen an</p>
                  <span className="text-sm font-medium">{callback.assignedAdvisor}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Transcript */}
            <div>
              <h4 className="text-sm font-semibold mb-2">Gespräch / Zusammenfassung</h4>
              {callback.callTranscript ? (
                <div className="bg-muted/40 rounded-lg p-4 text-sm leading-relaxed whitespace-pre-wrap">
                  {callback.callTranscript}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">Kein Transkript verfügbar</p>
              )}
            </div>

            <Separator />

            {/* Status & History */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Status & Details</h4>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className={cn('text-xs', statusCfg.color)}>
                  {statusCfg.label}
                </Badge>
                <Badge variant="secondary" className={cn('text-xs', priorityCfg.color)}>
                  {priorityCfg.label}
                </Badge>
              </div>

              <div className="text-sm space-y-1.5">
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">Anliegen:</span> {callback.reason}
                </p>
                {callback.notes && (
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">Notizen:</span> {callback.notes}
                  </p>
                )}
              </div>

              {callback.reassignedFrom && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
                  <ArrowRightLeft className="h-3.5 w-3.5" />
                  <span>
                    Umgeleitet von <span className="font-medium text-foreground">{callback.reassignedFrom}</span>
                    {callback.reassignedAt && ` · ${formatTimeAgo(callback.reassignedAt)}`}
                  </span>
                </div>
              )}

              {callback.escalatedBy && (
                <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 rounded-lg px-3 py-2">
                  <ChevronUp className="h-3.5 w-3.5" />
                  <span>
                    Eskaliert von <span className="font-medium">{callback.escalatedBy}</span>
                    {callback.escalatedAt && ` · ${formatTimeAgo(callback.escalatedAt)}`}
                  </span>
                </div>
              )}

              {isCompleted && callback.completionNotes && (
                <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg px-3 py-2">
                  <CheckCircle className="h-3.5 w-3.5" />
                  <span>{callback.completionNotes}</span>
                </div>
              )}

              <div className="text-xs text-muted-foreground">
                SLA-Deadline: {new Date(callback.slaDeadline).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })} Uhr
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Footer actions */}
        {!isCompleted && (
          <>
            <Separator />
            <div className="flex gap-2 px-6 py-4">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => onReassign(callback.id)}>
                <ArrowRightLeft className="h-3.5 w-3.5 mr-1" />
                Zuweisen
              </Button>
              {canEscalate && (
                <Button variant="outline" size="sm" className="flex-1" onClick={() => onEscalate(callback.id)}>
                  <ChevronUp className="h-3.5 w-3.5 mr-1" />
                  Eskalieren
                </Button>
              )}
              <Button size="sm" className="flex-1" onClick={() => onComplete(callback.id)}>
                <CheckCircle className="h-3.5 w-3.5 mr-1" />
                Erledigt
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
