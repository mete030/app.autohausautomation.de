'use client'

import { useState, useMemo } from 'react'
import { Shield, Headset, UserCog } from 'lucide-react'
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
import { CallcenterEmailInbox } from '@/components/callcenter/callcenter-email-inbox'
import { NewCallbackDialog } from '@/components/callcenter/callcenter-new-callback-dialog'
import { CompletionDialog } from '@/components/callcenter/callcenter-completion-dialog'
import { ReassignDialog } from '@/components/callcenter/callcenter-reassign-dialog'
import { TranscriptSheet } from '@/components/callcenter/callcenter-transcript-sheet'
import { CallcenterEscalationDialog } from '@/components/callcenter/callcenter-escalation-dialog'
import { CallcenterReminderDialog } from '@/components/callcenter/callcenter-reminder-dialog'
import { CallcenterReminderToast } from '@/components/callcenter/callcenter-reminder-toast'
import { CallcenterAutoEscalationProvider } from '@/components/callcenter/callcenter-auto-escalation-provider'
import { CallcenterRoleSwitcher, type CallcenterRole } from '@/components/callcenter/callcenter-role-switcher'
import { CallcenterVoiceTestDialog } from '@/components/callcenter/callcenter-voice-test-dialog'
import { CallcenterMorningSummaryDialog } from '@/components/callcenter/callcenter-morning-summary-dialog'
import { employeeRoleConfig, mockCallAgents } from '@/lib/constants'
import type { CallbackPriority } from '@/lib/types'

type FilterMode = 'aktiv' | 'alle' | 'erledigt'
type ViewMode = 'tabelle' | 'berater' | 'kanban' | 'zeitleiste'

const NEXT_PRIORITY: Record<string, CallbackPriority> = {
  niedrig: 'mittel',
  mittel: 'hoch',
  hoch: 'dringend',
}

const ROLE_HEADER: Record<CallcenterRole, { icon: typeof Shield; title: string; subtitle: string }> = {
  admin: { icon: Shield, title: 'Callcenter — Administration', subtitle: 'Rückruf-Management & Mitarbeiter-Tracking' },
  callcenter: { icon: Headset, title: 'Callcenter — Mein Arbeitsplatz', subtitle: 'Rückrufe erstellen & verfolgen' },
  berater: { icon: UserCog, title: 'Callcenter — Meine Rückrufe', subtitle: 'Zugewiesene Rückrufe bearbeiten' },
}

export default function CallcenterPageClient() {
  const callbacks = useCallbackStore(s => s.callbacks)
  const employees = useCallbackStore(s => s.employees)
  const reminders = useCallbackStore(s => s.reminders)
  const updateCallbackStatus = useCallbackStore(s => s.updateCallbackStatus)
  const createCallback = useCallbackStore(s => s.createCallback)
  const reassignCallback = useCallbackStore(s => s.reassignCallback)
  const escalateCallback = useCallbackStore(s => s.escalateCallback)

  // Role state
  const [role, setRole] = useState<CallcenterRole>('callcenter')
  const [selectedUser, setSelectedUser] = useState('Marina Schittenhelm')

  // Derive current user from role + selection
  const currentUser = role === 'admin' ? 'Admin' : selectedUser

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

  // Reset tab on role change, set appropriate default user
  const handleRoleChange = (newRole: CallcenterRole) => {
    setRole(newRole)
    setActiveTab('rueckrufe')
    setViewMode('tabelle')
    setAdvisorFilter('alle')

    if (newRole === 'callcenter') {
      const firstAgent = mockCallAgents.find(a => a.type === 'mensch')
      setSelectedUser(firstAgent?.name ?? 'Marina Schittenhelm')
    } else if (newRole === 'berater') {
      const firstBerater = employees.find(e => e.role === 'serviceberater' || e.role === 'verkaufer')
      setSelectedUser(firstBerater?.name ?? 'Alexander Eckhardt')
    }
  }

  // Role-filtered callbacks
  const roleCallbacks = useMemo(() => {
    if (role === 'admin') return callbacks
    if (role === 'callcenter') {
      return callbacks.filter(cb => cb.takenBy.name === currentUser)
    }
    return callbacks.filter(cb => cb.assignedAdvisor === currentUser)
  }, [callbacks, role, currentUser])

  // Filtered callbacks (from role-scoped set)
  const filteredCallbacks = useMemo(() => {
    let result = roleCallbacks

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
  }, [roleCallbacks, statusFilter, advisorFilter, sourceFilter, priorityFilter, searchQuery])

  // KPIs (admin only, from all callbacks)
  const totalCallbacks = callbacks.filter(cb => cb.status !== 'erledigt').length
  const totalOverdue = callbacks.filter(cb => cb.status === 'ueberfaellig').length
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
        escalatedBy: currentUser,
      })
    }
  }

  // Role-based action permissions
  const viewActions = useMemo(() => {
    const base = {
      onViewTranscript: setTranscriptSheetId,
    }

    if (role === 'admin') {
      return {
        ...base,
        onComplete: setCompleteDialogId,
        onReassign: setReassignDialogId,
        onEscalate: handleEscalate,
        onSetReminder: setReminderDialogId,
        onEscalateToLevel: setEscalationDialogId,
      }
    }

    if (role === 'callcenter') {
      return {
        ...base,
        onComplete: undefined as unknown as (id: string) => void,
        onReassign: setReassignDialogId,
        onEscalate: handleEscalate,
        onSetReminder: setReminderDialogId,
        onEscalateToLevel: setEscalationDialogId,
      }
    }

    // berater — only complete
    return {
      ...base,
      onComplete: setCompleteDialogId,
      onReassign: undefined as unknown as (id: string) => void,
      onEscalate: undefined as unknown as (id: string) => void,
      onSetReminder: undefined as unknown as (id: string) => void,
      onEscalateToLevel: undefined as unknown as (id: string) => void,
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role])

  const header = ROLE_HEADER[role]
  const HeaderIcon = header.icon

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <HeaderIcon className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold">
              <span className="sm:hidden">Callcenter</span>
              <span className="hidden sm:inline">{header.title}</span>
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {header.subtitle}
            {role !== 'admin' && (
              <span className="ml-2 text-xs font-medium text-foreground/70">
                — {currentUser}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {role === 'admin' && <CallcenterMorningSummaryDialog />}
          {role === 'admin' && <CallcenterVoiceTestDialog />}
          <CallcenterRoleSwitcher
            role={role}
            onRoleChange={handleRoleChange}
            selectedUser={selectedUser}
            onSelectedUserChange={setSelectedUser}
          />
        </div>
      </div>

      {/* ======== ADMIN VIEW ======== */}
      {role === 'admin' && (
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
              totalCallbacks={totalCallbacks}
              overdue={totalOverdue}
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
      )}

      {/* ======== CALL CENTER MITARBEITER VIEW ======== */}
      {role === 'callcenter' && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="rueckrufe">Rückrufe</TabsTrigger>
            <TabsTrigger value="mails">Mails</TabsTrigger>
          </TabsList>

          <TabsContent value="rueckrufe" className="mt-4 space-y-4">
            <CallcenterToolbar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              advisorFilter="alle"
              onAdvisorFilterChange={() => {}}
              sourceFilter={sourceFilter}
              onSourceFilterChange={setSourceFilter}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onNewCallback={() => setNewCallbackOpen(true)}
              advisorNames={[]}
              priorityFilter={priorityFilter}
              onPriorityFilterChange={setPriorityFilter}
              activeReminderCount={activeReminderCount}
              hideAdvisorFilter
            />

            {viewMode === 'tabelle' && (
              <CallcenterTableView callbacks={filteredCallbacks} {...viewActions} />
            )}
            {viewMode === 'berater' && (
              <CallcenterAdvisorView
                callbacks={filteredCallbacks}
                allCallbacks={roleCallbacks}
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

          <TabsContent value="mails" className="mt-4">
            <CallcenterEmailInbox />
          </TabsContent>
        </Tabs>
      )}

      {/* ======== SERVICEBERATER / VERKÄUFER VIEW ======== */}
      {role === 'berater' && (
        <div className="space-y-4">
          <CallcenterToolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            advisorFilter="alle"
            onAdvisorFilterChange={() => {}}
            sourceFilter={sourceFilter}
            onSourceFilterChange={setSourceFilter}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onNewCallback={() => {}}
            advisorNames={[]}
            priorityFilter={priorityFilter}
            onPriorityFilterChange={setPriorityFilter}
            hideAdvisorFilter
            hideNewCallback
          />

          {viewMode === 'tabelle' && (
            <CallcenterTableView callbacks={filteredCallbacks} {...viewActions} />
          )}
          {viewMode === 'kanban' && (
            <CallcenterKanbanView callbacks={filteredCallbacks} {...viewActions} />
          )}
          {viewMode === 'zeitleiste' && (
            <CallcenterTimelineView callbacks={filteredCallbacks} {...viewActions} />
          )}
        </div>
      )}

      {/* Headless providers */}
      <CallcenterAutoEscalationProvider />
      <CallcenterReminderToast onViewCallback={(id) => setTranscriptSheetId(id)} />

      {/* Dialogs & Sheets */}
      <NewCallbackDialog
        open={newCallbackOpen}
        onOpenChange={setNewCallbackOpen}
        onCreate={createCallback}
        advisorNames={advisorNames}
        defaultAgentId={role === 'callcenter' ? mockCallAgents.find(a => a.name === selectedUser)?.id : undefined}
        currentUser={currentUser}
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
          reassignCallback({ callbackId: id, newAdvisor, reassignedBy: currentUser })
          setReassignDialogId(null)
        }}
        advisorNames={advisorNames}
      />
      <TranscriptSheet
        open={!!transcriptSheetId}
        callback={findCallback(transcriptSheetId)}
        onOpenChange={() => setTranscriptSheetId(null)}
        onReassign={role !== 'berater' ? (id) => { setTranscriptSheetId(null); setReassignDialogId(id) } : undefined}
        onEscalate={role !== 'berater' ? (id) => { setTranscriptSheetId(null); handleEscalate(id) } : undefined}
        onComplete={role !== 'callcenter' ? (id) => { setTranscriptSheetId(null); setCompleteDialogId(id) } : undefined}
        onEscalateToLevel={role !== 'berater' ? (id) => { setTranscriptSheetId(null); setEscalationDialogId(id) } : undefined}
        onSetReminder={role !== 'berater' ? (id) => { setTranscriptSheetId(null); setReminderDialogId(id) } : undefined}
        currentUserName={currentUser}
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
