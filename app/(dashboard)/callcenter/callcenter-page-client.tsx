'use client'

import { useState, useMemo } from 'react'
import { Shield } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useCallbackStore } from '@/lib/stores/callback-store'
import { CallcenterKpiRow } from '@/components/callcenter/callcenter-kpi-row'
import { CallcenterToolbar } from '@/components/callcenter/callcenter-toolbar'
import { CallcenterTableView } from '@/components/callcenter/callcenter-table-view'
import { CallcenterAdvisorView } from '@/components/callcenter/callcenter-advisor-view'
import { CallcenterKanbanView } from '@/components/callcenter/callcenter-kanban-view'
import { CallcenterTimelineView } from '@/components/callcenter/callcenter-timeline-view'
import { CallcenterAdminDashboard } from '@/components/callcenter/callcenter-admin-dashboard'
import { CallcenterEmployeeView } from '@/components/callcenter/callcenter-employee-view'
import { CallcenterSettingsView } from '@/components/callcenter/callcenter-settings-view'
import { NewCallbackDialog } from '@/components/callcenter/callcenter-new-callback-dialog'
import { CompletionDialog } from '@/components/callcenter/callcenter-completion-dialog'
import { ReassignDialog } from '@/components/callcenter/callcenter-reassign-dialog'
import { TranscriptSheet } from '@/components/callcenter/callcenter-transcript-sheet'
import { CallcenterEscalationDialog } from '@/components/callcenter/callcenter-escalation-dialog'
import { CallcenterReminderDialog } from '@/components/callcenter/callcenter-reminder-dialog'
import { CallcenterReminderToast } from '@/components/callcenter/callcenter-reminder-toast'
import { CallcenterAutoEscalationProvider } from '@/components/callcenter/callcenter-auto-escalation-provider'
import { employeeRoleConfig } from '@/lib/constants'
import type { CallbackPriority } from '@/lib/types'

type FilterMode = 'aktiv' | 'alle' | 'erledigt'
type ViewMode = 'tabelle' | 'berater' | 'kanban' | 'zeitleiste'

const NEXT_PRIORITY: Record<string, CallbackPriority> = {
  niedrig: 'mittel',
  mittel: 'hoch',
  hoch: 'dringend',
}

export default function CallcenterPageClient() {
  const callbacks = useCallbackStore(s => s.callbacks)
  const employees = useCallbackStore(s => s.employees)
  const reminders = useCallbackStore(s => s.reminders)
  const updateCallbackStatus = useCallbackStore(s => s.updateCallbackStatus)
  const createCallback = useCallbackStore(s => s.createCallback)
  const reassignCallback = useCallbackStore(s => s.reassignCallback)
  const escalateCallback = useCallbackStore(s => s.escalateCallback)

  // UI state
  const [activeTab, setActiveTab] = useState('rueckrufe')
  const [viewMode, setViewMode] = useState<ViewMode>('tabelle')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<FilterMode>('aktiv')
  const [advisorFilter, setAdvisorFilter] = useState('alle')
  const [sourceFilter, setSourceFilter] = useState('alle')
  const [priorityFilter, setPriorityFilter] = useState('alle')

  // Dialog/sheet states
  const [newCallbackOpen, setNewCallbackOpen] = useState(false)
  const [completeDialogId, setCompleteDialogId] = useState<string | null>(null)
  const [reassignDialogId, setReassignDialogId] = useState<string | null>(null)
  const [transcriptSheetId, setTranscriptSheetId] = useState<string | null>(null)
  const [escalationDialogId, setEscalationDialogId] = useState<string | null>(null)
  const [reminderDialogId, setReminderDialogId] = useState<string | null>(null)

  // Filtered callbacks
  const filteredCallbacks = useMemo(() => {
    let result = callbacks

    if (statusFilter === 'aktiv') result = result.filter(cb => cb.status !== 'erledigt')
    else if (statusFilter === 'erledigt') result = result.filter(cb => cb.status === 'erledigt')

    if (advisorFilter !== 'alle') result = result.filter(cb => cb.assignedAdvisor === advisorFilter)
    if (sourceFilter !== 'alle') result = result.filter(cb => cb.source === sourceFilter)
    if (priorityFilter !== 'alle') result = result.filter(cb => cb.priority === priorityFilter)

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(cb =>
        cb.customerName.toLowerCase().includes(q) ||
        cb.customerPhone.includes(q) ||
        cb.assignedAdvisor.toLowerCase().includes(q) ||
        cb.reason.toLowerCase().includes(q)
      )
    }

    return result
  }, [callbacks, statusFilter, advisorFilter, sourceFilter, priorityFilter, searchQuery])

  // KPIs
  const todayStr = new Date().toDateString()
  const totalOverdue = callbacks.filter(cb => cb.status === 'ueberfaellig').length
  const totalActive = callbacks.filter(cb => cb.status !== 'erledigt').length
  const todayCompleted = callbacks.filter(cb =>
    cb.status === 'erledigt' && cb.completedAt &&
    new Date(cb.completedAt).toDateString() === todayStr
  ).length
  const aiHandled = callbacks.filter(cb => cb.takenBy.type === 'ki').length
  const completedCbs = callbacks.filter(cb => cb.status === 'erledigt')
  const withinSla = completedCbs.filter(cb =>
    cb.completedAt && new Date(cb.completedAt) <= new Date(cb.slaDeadline)
  ).length
  const slaPercentage = completedCbs.length > 0
    ? Math.round((withinSla / completedCbs.length) * 100)
    : 100

  const escalationCount = callbacks.reduce((sum, cb) => sum + cb.escalationHistory.length, 0)

  const avgTime = useMemo(() => {
    const completed = callbacks.filter(cb => cb.completedAt)
    if (completed.length === 0) return 0
    const totalMins = completed.reduce((sum, cb) => {
      const diff = new Date(cb.completedAt!).getTime() - new Date(cb.createdAt).getTime()
      return sum + diff / 60000
    }, 0)
    return Math.round(totalMins / completed.length)
  }, [callbacks])

  const activeReminderCount = reminders.filter(r => r.status === 'ausstehend').length

  const advisorNames = useMemo(
    () => [...new Set([...employees.map(e => e.name), ...callbacks.map(cb => cb.assignedAdvisor)])].sort(),
    [employees, callbacks],
  )

  const advisorEntries = useMemo(() => {
    const roleOrder = ['geschaeftsfuehrung', 'werkstattleiter', 'serviceberater', 'verkaufer', 'backoffice'] as const
    const empMap = new Map(employees.map(e => [e.name, e.role]))
    return [...advisorNames]
      .sort((a, b) => {
        const ra = empMap.get(a) ?? ''
        const rb = empMap.get(b) ?? ''
        const ia = roleOrder.indexOf(ra as typeof roleOrder[number])
        const ib = roleOrder.indexOf(rb as typeof roleOrder[number])
        return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
      })
      .map(name => ({
        name,
        role: empMap.get(name) ?? '',
        roleLabel: empMap.has(name) ? employeeRoleConfig[empMap.get(name)!].label : 'Sonstige',
      }))
  }, [advisorNames, employees])

  const findCallback = (id: string | null) =>
    id ? callbacks.find(cb => cb.id === id) ?? null : null

  const handleEscalate = (id: string) => {
    const cb = findCallback(id)
    if (cb && NEXT_PRIORITY[cb.priority]) {
      escalateCallback({
        callbackId: id,
        newPriority: NEXT_PRIORITY[cb.priority],
        escalatedBy: 'Admin',
      })
    }
  }

  const viewActions = {
    onComplete: setCompleteDialogId,
    onReassign: setReassignDialogId,
    onEscalate: handleEscalate,
    onViewTranscript: setTranscriptSheetId,
    onSetReminder: setReminderDialogId,
    onEscalateToLevel: setEscalationDialogId,
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">
            <span className="sm:hidden">Callcenter</span>
            <span className="hidden sm:inline">Callcenter — Administration</span>
          </h1>
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">
          Rückruf-Management & Mitarbeiter-Tracking
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="uebersicht">Übersicht</TabsTrigger>
          <TabsTrigger value="rueckrufe">Rückrufe</TabsTrigger>
          <TabsTrigger value="mitarbeiter">Mitarbeiter</TabsTrigger>
          <TabsTrigger value="einstellungen">Einstellungen</TabsTrigger>
        </TabsList>

        <TabsContent value="uebersicht" className="mt-4">
          <CallcenterAdminDashboard />
        </TabsContent>

        <TabsContent value="rueckrufe" className="mt-4 space-y-4">
          <CallcenterKpiRow
            overdue={totalOverdue}
            active={totalActive}
            completedToday={todayCompleted}
            slaPercentage={slaPercentage}
            aiHandled={aiHandled}
            escalations={escalationCount}
            avgTime={avgTime}
          />

          <CallcenterToolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            advisorFilter={advisorFilter}
            onAdvisorFilterChange={setAdvisorFilter}
            sourceFilter={sourceFilter}
            onSourceFilterChange={setSourceFilter}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onNewCallback={() => setNewCallbackOpen(true)}
            advisorNames={advisorNames}
            advisorEntries={advisorEntries}
            priorityFilter={priorityFilter}
            onPriorityFilterChange={setPriorityFilter}
            activeReminderCount={activeReminderCount}
          />

          {viewMode === 'tabelle' && (
            <CallcenterTableView callbacks={filteredCallbacks} {...viewActions} />
          )}
          {viewMode === 'berater' && (
            <CallcenterAdvisorView
              callbacks={filteredCallbacks}
              allCallbacks={callbacks}
              onComplete={setCompleteDialogId}
              onReassign={setReassignDialogId}
              onEscalate={handleEscalate}
              onViewTranscript={setTranscriptSheetId}
            />
          )}
          {viewMode === 'kanban' && (
            <CallcenterKanbanView callbacks={filteredCallbacks} {...viewActions} />
          )}
          {viewMode === 'zeitleiste' && (
            <CallcenterTimelineView callbacks={filteredCallbacks} {...viewActions} />
          )}
        </TabsContent>

        <TabsContent value="mitarbeiter" className="mt-4">
          <CallcenterEmployeeView />
        </TabsContent>

        <TabsContent value="einstellungen" className="mt-4">
          <CallcenterSettingsView />
        </TabsContent>
      </Tabs>

      {/* Headless providers */}
      <CallcenterAutoEscalationProvider />
      <CallcenterReminderToast onViewCallback={(id) => setTranscriptSheetId(id)} />

      {/* Dialogs & Sheets */}
      <NewCallbackDialog
        open={newCallbackOpen}
        onOpenChange={setNewCallbackOpen}
        onCreate={createCallback}
        advisorNames={advisorNames}
      />
      <CompletionDialog
        open={!!completeDialogId}
        callbackId={completeDialogId}
        onOpenChange={() => setCompleteDialogId(null)}
        onComplete={(id, notes) => {
          updateCallbackStatus({ callbackId: id, status: 'erledigt', completionNotes: notes })
          setCompleteDialogId(null)
        }}
      />
      <ReassignDialog
        open={!!reassignDialogId}
        callback={findCallback(reassignDialogId)}
        onOpenChange={() => setReassignDialogId(null)}
        onReassign={(id, newAdvisor) => {
          reassignCallback({ callbackId: id, newAdvisor, reassignedBy: 'Admin' })
          setReassignDialogId(null)
        }}
        advisorNames={advisorNames}
      />
      <TranscriptSheet
        open={!!transcriptSheetId}
        callback={findCallback(transcriptSheetId)}
        onOpenChange={() => setTranscriptSheetId(null)}
        onReassign={(id) => { setTranscriptSheetId(null); setReassignDialogId(id) }}
        onEscalate={(id) => { setTranscriptSheetId(null); handleEscalate(id) }}
        onComplete={(id) => { setTranscriptSheetId(null); setCompleteDialogId(id) }}
        onEscalateToLevel={(id) => { setTranscriptSheetId(null); setEscalationDialogId(id) }}
        onSetReminder={(id) => { setTranscriptSheetId(null); setReminderDialogId(id) }}
      />
      <CallcenterEscalationDialog
        open={!!escalationDialogId}
        onOpenChange={() => setEscalationDialogId(null)}
        callback={findCallback(escalationDialogId)}
      />
      <CallcenterReminderDialog
        open={!!reminderDialogId}
        onOpenChange={() => setReminderDialogId(null)}
        callback={findCallback(reminderDialogId)}
      />
    </div>
  )
}
