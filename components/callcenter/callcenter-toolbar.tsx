'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Search, Plus, LayoutList, Users, Columns3, Clock, Bell, SlidersHorizontal } from 'lucide-react'
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

const viewModes: { value: ViewMode; label: string; icon: typeof LayoutList }[] = [
  { value: 'tabelle', label: 'Tabelle', icon: LayoutList },
  { value: 'berater', label: 'Berater', icon: Users },
  { value: 'kanban', label: 'Kanban', icon: Columns3 },
  { value: 'zeitleiste', label: 'Zeitleiste', icon: Clock },
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
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const showCustomerFilter = !!onCustomerFilterChange && !!customerOptions
  const showCallAgentFilter = !!onCallAgentFilterChange && !!callAgentOptions

  const activeFilterCount =
    (advisorFilter !== 'alle' ? 1 : 0)
    + (sourceFilter !== 'alle' ? 1 : 0)
    + (priorityFilter && priorityFilter !== 'alle' ? 1 : 0)
    + (showCustomerFilter && customerFilter && customerFilter !== 'alle' ? 1 : 0)
    + (showCallAgentFilter && callAgentFilter && callAgentFilter !== 'alle' ? 1 : 0)

  // Reusable selects (used in both desktop inline and mobile sheet)
  const advisorSelect = (size: 'sm' | 'lg') => (
    <Select value={advisorFilter} onValueChange={onAdvisorFilterChange}>
      <SelectTrigger className={cn(
        'w-full text-xs',
        size === 'lg' ? 'h-11 text-sm' : 'h-9 md:text-sm md:w-[220px] lg:w-[220px]',
      )}>
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
  )

  const sourceSelect = (size: 'sm' | 'lg') => (
    <Select value={sourceFilter} onValueChange={onSourceFilterChange}>
      <SelectTrigger className={cn(
        'w-full text-xs',
        size === 'lg' ? 'h-11 text-sm' : 'h-9 md:text-sm md:w-[170px]',
      )}>
        <SelectValue placeholder="Alle Quellen" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="alle">Alle Quellen</SelectItem>
        {Object.entries(callSourceConfig)
          // KI-Agent als Quelle vorerst ausgeblendet (noch nicht produktiv).
          .filter(([value]) => value !== 'ki_agent')
          .map(([value, cfg]) => (
            <SelectItem key={value} value={value}>{cfg.label}</SelectItem>
          ))}
      </SelectContent>
    </Select>
  )

  const prioritySelect = (size: 'sm' | 'lg') => onPriorityFilterChange ? (
    <Select value={priorityFilter ?? 'alle'} onValueChange={onPriorityFilterChange}>
      <SelectTrigger className={cn(
        'w-full text-xs',
        size === 'lg' ? 'h-11 text-sm' : 'h-9 md:text-sm md:w-[170px]',
      )}>
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
  ) : null

  const customerSelect = (size: 'sm' | 'lg') => showCustomerFilter ? (
    <Select value={customerFilter ?? 'alle'} onValueChange={onCustomerFilterChange}>
      <SelectTrigger className={cn(
        'w-full text-xs',
        size === 'lg' ? 'h-11 text-sm' : 'h-9 md:text-sm md:w-[200px]',
      )}>
        <SelectValue placeholder="Alle Kunden" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="alle">Alle Kunden</SelectItem>
        {customerOptions!.map((name) => (
          <SelectItem key={name} value={name}>{name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  ) : null

  const callAgentSelect = (size: 'sm' | 'lg') => showCallAgentFilter ? (
    <Select value={callAgentFilter ?? 'alle'} onValueChange={onCallAgentFilterChange}>
      <SelectTrigger className={cn(
        'w-full text-xs',
        size === 'lg' ? 'h-11 text-sm' : 'h-9 md:text-sm md:w-[220px]',
      )}>
        <SelectValue placeholder="Alle Call-Center-Agenten" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="alle">Alle Call-Center-Agenten</SelectItem>
        {callAgentOptions!.map((agent) => (
          <SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  ) : null

  return (
    <div className="space-y-2 md:space-y-3">
      {/* Row 1: Search + (mobile) Filter button + (desktop) New Callback + View Toggle */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 md:h-[18px] md:w-[18px] text-muted-foreground" />
          <Input
            placeholder="Kunde, Telefon, Berater..."
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            className="pl-9 md:pl-10 h-10 md:h-10 md:text-sm"
          />
        </div>

        {/* Mobile-only: filter button + view-mode quick switch */}
        <div className="flex items-center gap-2 md:hidden">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-10 flex-1 justify-center"
            onClick={() => setMobileFiltersOpen(true)}
          >
            <SlidersHorizontal className="h-4 w-4 mr-1.5" />
            Filter
            {activeFilterCount > 0 && (
              <span className="ml-1.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-foreground px-1.5 text-[10px] font-bold text-background">
                {activeFilterCount}
              </span>
            )}
          </Button>
          <div className="flex items-center rounded-lg border border-border bg-background p-0.5 flex-shrink-0">
            {viewModes.map((vm) => {
              const Icon = vm.icon
              const isActive = viewMode === vm.value
              return (
                <button
                  key={vm.value}
                  type="button"
                  onClick={() => onViewModeChange(vm.value)}
                  aria-label={vm.label}
                  aria-pressed={isActive}
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-md transition-colors',
                    isActive
                      ? 'bg-foreground text-background'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <Icon className="h-4 w-4" />
                </button>
              )
            })}
          </div>
        </div>

        {/* Tablet-only (md-lg): compact filter button next to actions */}
        <div className="hidden md:flex lg:hidden items-center">
          <Button
            type="button"
            variant="outline"
            className="h-10 px-3.5"
            onClick={() => setMobileFiltersOpen(true)}
          >
            <SlidersHorizontal className="h-4 w-4 mr-1.5" />
            Filter
            {activeFilterCount > 0 && (
              <span className="ml-1.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-foreground px-1.5 text-[10px] font-bold text-background">
                {activeFilterCount}
              </span>
            )}
          </Button>
          {!hideNewCallback && (
            <Button onClick={onNewCallback} size="sm" className="h-10 flex-1 justify-center">
              <Plus className="h-4 w-4 mr-1" />
              Neuer Rückruf
            </Button>
          )}
          {onShowReminders && (
            <Button
              variant="outline"
              size="sm"
              className="relative h-10 w-10 flex-shrink-0 px-0"
              onClick={onShowReminders}
              title="Erinnerungen"
            >
              <Bell className="h-4 w-4" />
              {(activeReminderCount ?? 0) > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {activeReminderCount}
                </span>
              )}
            </Button>
          )}
        </div>

        {/* Desktop-only: new callback + reminders + view toggle */}
        <div className="hidden md:flex items-center gap-2">
          {!hideNewCallback && (
            <Button onClick={onNewCallback} className="h-10 px-4">
              <Plus className="h-4 w-4 mr-1.5" />
              Neuer Rückruf
            </Button>
          )}
          {onShowReminders && (
            <Button
              variant="ghost"
              className="relative h-10 w-10 p-0"
              onClick={onShowReminders}
              title="Erinnerungen"
            >
              <Bell className="h-[18px] w-[18px]" />
              {(activeReminderCount ?? 0) > 0 && (
                <span className="absolute top-1 right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {activeReminderCount}
                </span>
              )}
            </Button>
          )}
          <div className="flex border rounded-xl overflow-hidden">
            {viewModes.map((vm, idx) => {
              const Icon = vm.icon
              const isFirst = idx === 0
              const isLast = idx === viewModes.length - 1
              return (
                <Button
                  key={vm.value}
                  variant="ghost"
                  className={cn(
                    'h-10 w-10 p-0',
                    isFirst && 'rounded-r-none',
                    isLast && 'rounded-l-none',
                    !isFirst && !isLast && 'rounded-none',
                    viewMode === vm.value && 'bg-muted',
                  )}
                  onClick={() => onViewModeChange(vm.value)}
                  title={vm.label}
                >
                  <Icon className="h-[18px] w-[18px]" />
                </Button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Row 2: Status pills (always visible, scrollable on mobile) + desktop filters */}
      <div className="flex items-center gap-2 md:gap-3">
        <div className="flex gap-1.5 md:gap-2 overflow-x-auto -mx-3 px-3 pb-1 md:mx-0 md:px-0 md:pb-0 md:flex-wrap md:overflow-visible md:flex-shrink-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {filterPills.map(f => (
            <button
              key={f.value}
              onClick={() => onStatusFilterChange(f.value)}
              className={cn(
                'h-9 md:h-10 px-3.5 md:px-4 text-xs md:text-[13px] rounded-full border font-medium transition-colors whitespace-nowrap flex-shrink-0',
                statusFilter === f.value
                  ? 'bg-foreground text-background border-foreground'
                  : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/50',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Desktop filters inline (lg+ only; below lg use filter sheet) */}
        <div className="hidden lg:flex lg:items-center lg:gap-2 lg:flex-wrap lg:flex-1">
          {!hideAdvisorFilter && (
            <>
              <div className="h-6 w-px bg-border" />
              {advisorSelect('sm')}
            </>
          )}
          {sourceSelect('sm')}
          {prioritySelect('sm')}
        </div>
      </div>

      {/* Row 3: Admin-only refined filters (Kunde, Call-Center-Agent) — desktop inline */}
      {(showCustomerFilter || showCallAgentFilter) && (
        <div className="hidden lg:flex flex-wrap items-center gap-2 rounded-lg border border-dashed bg-muted/20 px-2.5 py-2">
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
            Admin-Filter
          </span>
          {customerSelect('sm')}
          {callAgentSelect('sm')}
        </div>
      )}

      {/* Mobile filter sheet */}
      <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-2xl border-t p-0 flex flex-col h-auto max-h-[88dvh]"
        >
          <div className="flex justify-center pt-2 pb-1 flex-shrink-0">
            <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
          </div>
          <SheetHeader className="px-5 pt-2 pb-3 flex-shrink-0">
            <SheetTitle className="text-base">Filter & Ansicht</SheetTitle>
          </SheetHeader>
          <div className="px-5 space-y-4 overflow-y-auto pb-[max(env(safe-area-inset-bottom),1.5rem)]">
            {!hideAdvisorFilter && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Mitarbeiter</label>
                {advisorSelect('lg')}
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Quelle</label>
              {sourceSelect('lg')}
            </div>
            {prioritySelect('lg') && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Priorität</label>
                {prioritySelect('lg')}
              </div>
            )}
            {customerSelect('lg') && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Kunde</label>
                {customerSelect('lg')}
              </div>
            )}
            {callAgentSelect('lg') && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Call-Center-Agent</label>
                {callAgentSelect('lg')}
              </div>
            )}

            {/* Mobile view-mode picker */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ansicht</label>
              <div className="grid grid-cols-2 gap-2">
                {viewModes.map((vm) => {
                  const Icon = vm.icon
                  return (
                    <button
                      key={vm.value}
                      type="button"
                      onClick={() => {
                        onViewModeChange(vm.value)
                      }}
                      className={cn(
                        'flex items-center gap-2 rounded-lg border h-11 px-3 text-sm font-medium transition-colors',
                        viewMode === vm.value
                          ? 'border-foreground bg-foreground text-background'
                          : 'border-border text-muted-foreground hover:text-foreground',
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {vm.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="h-11 flex-1"
                onClick={() => {
                  if (!hideAdvisorFilter) onAdvisorFilterChange('alle')
                  onSourceFilterChange('alle')
                  onPriorityFilterChange?.('alle')
                  onCustomerFilterChange?.('alle')
                  onCallAgentFilterChange?.('alle')
                }}
              >
                Zurücksetzen
              </Button>
              <Button
                type="button"
                className="h-11 flex-1"
                onClick={() => setMobileFiltersOpen(false)}
              >
                Anwenden
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
