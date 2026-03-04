'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { mockAdvisors } from '@/lib/mock-data'
import { useCallbackStore } from '@/lib/stores/callback-store'
import { formatTimeAgo, formatSlaTime } from '@/lib/utils'
import { Phone, Clock, CheckCircle, AlertTriangle, User } from 'lucide-react'
import type { CallbackStatus } from '@/lib/types'

const statusConfig: Record<CallbackStatus, { label: string; color: string; icon: typeof Phone }> = {
  offen: { label: 'Offen', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', icon: Phone },
  in_bearbeitung: { label: 'In Bearbeitung', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400', icon: Clock },
  erledigt: { label: 'Erledigt', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400', icon: CheckCircle },
  ueberfaellig: { label: 'Überfällig', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', icon: AlertTriangle },
}

const priorityConfig = {
  niedrig: { label: 'Niedrig', color: 'text-muted-foreground' },
  mittel: { label: 'Mittel', color: 'text-blue-600' },
  hoch: { label: 'Hoch', color: 'text-orange-600' },
  dringend: { label: 'Dringend', color: 'text-red-600 font-semibold' },
}

export default function CallcenterPage() {
  const callbacks = useCallbackStore((state) => state.callbacks)
  const updateCallbackStatus = useCallbackStore((state) => state.updateCallbackStatus)
  const [completeDialog, setCompleteDialog] = useState<string | null>(null)
  const [completionNotes, setCompletionNotes] = useState('')

  const filterCallbacks = (tab: string) => {
    if (tab === 'alle') return callbacks
    return callbacks.filter(cb => cb.status === tab)
  }

  const handleComplete = (id: string) => {
    updateCallbackStatus({
      callbackId: id,
      status: 'erledigt' as CallbackStatus,
      completionNotes,
    })
    setCompleteDialog(null)
    setCompletionNotes('')
  }

  const todayCreated = callbacks.filter(cb => {
    const created = new Date(cb.createdAt)
    const today = new Date()
    return created.toDateString() === today.toDateString()
  }).length

  const todayCompleted = callbacks.filter(cb => cb.status === 'erledigt' && cb.completedAt && new Date(cb.completedAt).toDateString() === new Date().toDateString()).length
  const totalOverdue = callbacks.filter(cb => cb.status === 'ueberfaellig').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Callcenter</h1>
        <p className="text-muted-foreground">Rückruf-Tracking & Berater-Übersicht</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{todayCreated}</div>
            <p className="text-sm text-muted-foreground">Heute erstellt</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-emerald-600">{todayCompleted}</div>
            <p className="text-sm text-muted-foreground">Heute erledigt</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{totalOverdue}</div>
            <p className="text-sm text-muted-foreground">Überfällig gesamt</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="alle">
            <TabsList>
              <TabsTrigger value="alle">Alle ({callbacks.length})</TabsTrigger>
              <TabsTrigger value="offen">Offen ({filterCallbacks('offen').length})</TabsTrigger>
              <TabsTrigger value="in_bearbeitung">In Bearbeitung ({filterCallbacks('in_bearbeitung').length})</TabsTrigger>
              <TabsTrigger value="erledigt">Erledigt ({filterCallbacks('erledigt').length})</TabsTrigger>
              <TabsTrigger value="ueberfaellig">Überfällig ({filterCallbacks('ueberfaellig').length})</TabsTrigger>
            </TabsList>

            {['alle', 'offen', 'in_bearbeitung', 'erledigt', 'ueberfaellig'].map(tab => (
              <TabsContent key={tab} value={tab} className="space-y-3 mt-4">
                {filterCallbacks(tab).map(cb => {
                  const config = statusConfig[cb.status]
                  const priority = priorityConfig[cb.priority]
                  const sla = formatSlaTime(cb.createdAt)

                  return (
                    <Card key={cb.id}>
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-semibold">{cb.customerName}</h3>
                                <p className="text-sm text-muted-foreground">{cb.customerPhone}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className={config.color} variant="secondary">
                                  {config.label}
                                </Badge>
                                <span className={`text-xs ${priority.color}`}>{priority.label}</span>
                              </div>
                            </div>
                            <p className="text-sm">{cb.reason}</p>
                            {cb.notes && (
                              <p className="text-xs text-muted-foreground">{cb.notes}</p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {cb.assignedAdvisor}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatTimeAgo(cb.createdAt)}
                              </span>
                              <span className={`flex items-center gap-1 ${sla.overdue ? 'text-red-600 font-medium' : ''}`}>
                                <AlertTriangle className="h-3 w-3" />
                                SLA: {sla.text}
                              </span>
                            </div>
                            {cb.completionNotes && (
                              <div className="mt-2 p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded text-xs">
                                <span className="font-medium">Erledigt: </span>{cb.completionNotes}
                              </div>
                            )}
                          </div>
                          {cb.status !== 'erledigt' && (
                            <Button
                              size="sm"
                              variant={cb.status === 'ueberfaellig' ? 'destructive' : 'default'}
                              onClick={() => setCompleteDialog(cb.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Als erledigt markieren
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {/* Advisor Sidebar */}
        <div className="space-y-4">
          <h3 className="font-semibold">Berater</h3>
          {mockAdvisors.map(advisor => (
            <Card key={advisor.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {advisor.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{advisor.name}</p>
                    <p className="text-xs text-muted-foreground">{advisor.role}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-lg font-bold">{advisor.openCallbacks}</p>
                    <p className="text-[10px] text-muted-foreground">Offen</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-emerald-600">{advisor.completedToday}</p>
                    <p className="text-[10px] text-muted-foreground">Erledigt</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-red-600">{advisor.overdueCallbacks}</p>
                    <p className="text-[10px] text-muted-foreground">Überfällig</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Completion Dialog */}
      <Dialog open={!!completeDialog} onOpenChange={() => setCompleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rückruf als erledigt markieren</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Notiz zum Abschluss (Pflichtfeld)..."
            value={completionNotes}
            onChange={(e) => setCompletionNotes(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompleteDialog(null)}>
              Abbrechen
            </Button>
            <Button
              disabled={!completionNotes.trim()}
              onClick={() => completeDialog && handleComplete(completeDialog)}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Erledigt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
