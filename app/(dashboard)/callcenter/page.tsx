'use client'

import { useState, useMemo } from 'react'
import { Shield } from 'lucide-react'
import { useCallbackStore } from '@/lib/stores/callback-store'
import { CallcenterKpiRow } from '@/components/callcenter/callcenter-kpi-row'
import { CallcenterToolbar } from '@/components/callcenter/callcenter-toolbar'
import { CallcenterTableView } from '@/components/callcenter/callcenter-table-view'
import { CallcenterAdvisorView } from '@/components/callcenter/callcenter-advisor-view'
import { NewCallbackDialog } from '@/components/callcenter/callcenter-new-callback-dialog'
import { CompletionDialog } from '@/components/callcenter/callcenter-completion-dialog'
import { ReassignDialog } from '@/components/callcenter/callcenter-reassign-dialog'
import { TranscriptSheet } from '@/components/callcenter/callcenter-transcript-sheet'
import type { CallbackPriority } from '@/lib/types'

type FilterMode = 'aktiv' | 'alle' | 'erledigt'
type ViewMode = 'tabelle' | 'berater'

const NEXT_PRIORITY: Record<string, CallbackPriority> = {
  niedrig: 'mittel',
  mittel: 'hoch',
  hoch: 'dringend',
}

export default function CallcenterPage() {
  const callbacks = useCallbackStore(s => s.callbacks)
  const updateCallbackStatus = useCallbackStore(s => s.updateCallbackStatus)
  const createCallback = useCallbackStore(s => s.createCallback)
  const reassignCallback = useCallbackStore(s => s.reassignCallback)
  const escalateCallback = useCallbackStore(s => s.escalateCallback)

  // UI state
  const [viewMode, setViewMode] = useState<ViewMode>('tabelle')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<FilterMode>('aktiv')
  const [advisorFilter, setAdvisorFilter] = useState('alle')
  const [sourceFilter, setSourceFilter] = useState('alle')

  // Dialog/sheet states
  const [newCallbackOpen, setNewCallbackOpen] = useState(false)
  const [completeDialogId, setCompleteDialogId] = useState<string | null>(null)
  const [reassignDialogId, setReassignDialogId] = useState<string | null>(null)
  const [transcriptSheetId, setTranscriptSheetId] = useState<string | null>(null)

  // Filtered callbacks
  const filteredCallbacks = useMemo(() => {
    let result = callbacks

    if (statusFilter === 'aktiv') result = result.filter(cb => cb.status !== 'erledigt')
    else if (statusFilter === 'erledigt') result = result.filter(cb => cb.status === 'erledigt')

    if (advisorFilter !== 'alle') result = result.filter(cb => cb.assignedAdvisor === advisorFilter)
    if (sourceFilter !== 'alle') result = result.filter(cb => cb.source === sourceFilter)

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
  }, [callbacks, statusFilter, advisorFilter, sourceFilter, searchQuery])

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

  const advisorNames = useMemo(
    () => [...new Set(callbacks.map(cb => cb.assignedAdvisor))].sort(),
    [callbacks],
  )

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

  return (
    <div className="space-y-4">
      {/* Admin Header */}
      <div>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">
            <span className="sm:hidden">Callcenter</span>
            <span className="hidden sm:inline">Callcenter — Administration</span>
          </h1>
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">
          Rückruf-Management & Serviceberater-Tracking
        </p>
      </div>

      {/* KPI Row */}
      <CallcenterKpiRow
        overdue={totalOverdue}
        active={totalActive}
        completedToday={todayCompleted}
        slaPercentage={slaPercentage}
        aiHandled={aiHandled}
      />

      {/* Toolbar */}
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
      />

      {/* Main Content */}
      {viewMode === 'tabelle' ? (
        <CallcenterTableView
          callbacks={filteredCallbacks}
          onComplete={setCompleteDialogId}
          onReassign={setReassignDialogId}
          onEscalate={handleEscalate}
          onViewTranscript={setTranscriptSheetId}
        />
      ) : (
        <CallcenterAdvisorView
          callbacks={filteredCallbacks}
          allCallbacks={callbacks}
          onComplete={setCompleteDialogId}
          onReassign={setReassignDialogId}
          onEscalate={handleEscalate}
          onViewTranscript={setTranscriptSheetId}
        />
      )}

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
      />
    </div>
  )
}
