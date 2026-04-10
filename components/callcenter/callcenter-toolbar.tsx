'use client'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Plus, LayoutList, Users, Columns3, Clock, Bell } from 'lucide-react'
import { cn } from '@/lib/utils'
import { callSourceConfig } from '@/lib/constants'

type FilterMode = 'aktiv' | 'alle' | 'erledigt'
type ViewMode = 'tabelle' | 'berater' | 'kanban' | 'zeitleiste'

export interface AdvisorEntry {
  name: string
  role: string
  roleLabel: string
}

export interface CallAgentFilterEntry {
  id: string
  name: string
}

interface CallcenterToolbarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  statusFilter: FilterMode
  onStatusFilterChange: (filter: FilterMode) => void
  advisorFilter: string
  onAdvisorFilterChange: (advisor: string) => void
  sourceFilter: string
  onSourceFilterChange: (source: string) => void
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  onNewCallback: () => void
  advisorNames: string[]
  advisorEntries?: AdvisorEntry[]
  priorityFilter?: string
  onPriorityFilterChange?: (value: string) => void
  activeReminderCount?: number
  onShowReminders?: () => void
  hideAdvisorFilter?: boolean
  hideNewCallback?: boolean
  customerFilter?: string
  customerOptions?: string[]
  onCustomerFilterChange?: (value: string) => void
  callAgentFilter?: string
  callAgentOptions?: CallAgentFilterEntry[]
  onCallAgentFilterChange?: (value: string) => void
}

const filterPills: { value: FilterMode; label: string }[] = [
  { value: 'aktiv', label: 'Offen & Überfällig' },
  { value: 'alle', label: 'Alle' },
  { value: 'erledigt', label: 'Erledigt' },
]

export function CallcenterToolbar({
  searchQuery, onSearchChange,
  statusFilter, onStatusFilterChange,
  advisorFilter, onAdvisorFilterChange,
  sourceFilter, onSourceFilterChange,
  viewMode, onViewModeChange,
  onNewCallback,
  advisorNames,
  advisorEntries,
  priorityFilter, onPriorityFilterChange,
  activeReminderCount, onShowReminders,
  hideAdvisorFilter, hideNewCallback,
  customerFilter,
  customerOptions,
  onCustomerFilterChange,
  callAgentFilter,
  callAgentOptions,
  onCallAgentFilterChange,
}: CallcenterToolbarProps) {
  const showCustomerFilter = !!onCustomerFilterChange && !!customerOptions
  const showCallAgentFilter = !!onCallAgentFilterChange && !!callAgentOptions
  return (
    <div className="space-y-3">
      {/* Row 1: Search + New Callback + View Toggle */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Kunde, Telefon, Berater, Anliegen..."
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          {!hideNewCallback && (
            <Button onClick={onNewCallback} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Neuer Rückruf
            </Button>
          )}
          {onShowReminders && (
            <Button
              variant="ghost"
              size="sm"
              className="relative px-2.5"
              onClick={onShowReminders}
              title="Erinnerungen"
            >
              <Bell className="h-4 w-4" />
              {(activeReminderCount ?? 0) > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {activeReminderCount}
                </span>
              )}
            </Button>
          )}
          <div className="flex border rounded-lg">
            <Button
              variant="ghost"
              size="sm"
              className={cn('rounded-r-none px-2.5', viewMode === 'tabelle' && 'bg-muted')}
              onClick={() => onViewModeChange('tabelle')}
              title="Tabellenansicht"
            >
              <LayoutList className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn('rounded-none px-2.5', viewMode === 'berater' && 'bg-muted')}
              onClick={() => onViewModeChange('berater')}
              title="Berateransicht"
            >
              <Users className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn('rounded-none px-2.5', viewMode === 'kanban' && 'bg-muted')}
              onClick={() => onViewModeChange('kanban')}
              title="Kanban"
            >
              <Columns3 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn('rounded-l-none px-2.5', viewMode === 'zeitleiste' && 'bg-muted')}
              onClick={() => onViewModeChange('zeitleiste')}
              title="Zeitleiste"
            >
              <Clock className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Row 2: Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Status pills */}
        <div className="flex gap-1.5">
          {filterPills.map(f => (
            <button
              key={f.value}
              onClick={() => onStatusFilterChange(f.value)}
              className={cn(
                'px-3 py-1 text-xs rounded-full border font-medium transition-colors whitespace-nowrap',
                statusFilter === f.value
                  ? 'bg-foreground text-background border-foreground'
                  : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/50',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {!hideAdvisorFilter && (
          <>
            <div className="h-4 w-px bg-border hidden sm:block" />

            {/* Advisor filter */}
            <Select value={advisorFilter} onValueChange={onAdvisorFilterChange}>
              <SelectTrigger className="w-full h-8 text-xs sm:w-[220px]">
                <SelectValue placeholder="Alle Mitarbeiter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alle">Alle Mitarbeiter</SelectItem>
                {advisorEntries ? (() => {
                  const groups = new Map<string, AdvisorEntry[]>()
                  for (const entry of advisorEntries) {
                    const key = entry.roleLabel || 'Sonstige'
                    if (!groups.has(key)) groups.set(key, [])
                    groups.get(key)!.push(entry)
                  }
                  return Array.from(groups.entries()).map(([roleLabel, entries]) => (
                    <SelectGroup key={roleLabel}>
                      <SelectLabel className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">
                        {roleLabel}
                      </SelectLabel>
                      {entries.map(entry => (
                        <SelectItem key={entry.name} value={entry.name}>
                          {entry.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))
                })() : advisorNames.map(name => (
                  <SelectItem key={name} value={name}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        )}

        {/* Source filter */}
        <Select value={sourceFilter} onValueChange={onSourceFilterChange}>
          <SelectTrigger className="w-full h-8 text-xs sm:w-[160px]">
            <SelectValue placeholder="Alle Quellen" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="alle">Alle Quellen</SelectItem>
            {Object.entries(callSourceConfig).map(([value, cfg]) => (
              <SelectItem key={value} value={value}>{cfg.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Priority filter */}
        {onPriorityFilterChange && (
          <Select value={priorityFilter ?? 'alle'} onValueChange={onPriorityFilterChange}>
            <SelectTrigger className="w-full h-8 text-xs sm:w-[170px]">
              <SelectValue placeholder="Alle Prioritäten" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="alle">Alle Prioritäten</SelectItem>
              <SelectItem value="dringend">Dringend</SelectItem>
              <SelectItem value="hoch">Hoch</SelectItem>
              <SelectItem value="mittel">Mittel</SelectItem>
              <SelectItem value="niedrig">Niedrig</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Row 3: Admin-only refined filters (Kunde, Call-Center-Agent, Berater) */}
      {(showCustomerFilter || showCallAgentFilter) && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed bg-muted/20 px-2.5 py-2">
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
            Admin-Filter
          </span>

          {showCustomerFilter && (
            <Select value={customerFilter ?? 'alle'} onValueChange={onCustomerFilterChange}>
              <SelectTrigger className="w-full h-8 text-xs sm:w-[200px]">
                <SelectValue placeholder="Alle Kunden" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alle">Alle Kunden</SelectItem>
                {customerOptions!.map((name) => (
                  <SelectItem key={name} value={name}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {showCallAgentFilter && (
            <Select value={callAgentFilter ?? 'alle'} onValueChange={onCallAgentFilterChange}>
              <SelectTrigger className="w-full h-8 text-xs sm:w-[220px]">
                <SelectValue placeholder="Alle Call-Center-Agenten" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alle">Alle Call-Center-Agenten</SelectItem>
                {callAgentOptions!.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}
    </div>
  )
}
