'use client'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Plus, LayoutList, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { callSourceConfig } from '@/lib/constants'
import type { CallSource } from '@/lib/types'

type FilterMode = 'aktiv' | 'alle' | 'erledigt'
type ViewMode = 'tabelle' | 'berater'

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
}: CallcenterToolbarProps) {
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
          <Button onClick={onNewCallback} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Neuer Rückruf
          </Button>
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
              className={cn('rounded-l-none px-2.5', viewMode === 'berater' && 'bg-muted')}
              onClick={() => onViewModeChange('berater')}
              title="Berateransicht"
            >
              <Users className="h-4 w-4" />
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

        <div className="h-4 w-px bg-border hidden sm:block" />

        {/* Advisor filter */}
        <Select value={advisorFilter} onValueChange={onAdvisorFilterChange}>
          <SelectTrigger className="w-full h-8 text-xs sm:w-[180px]">
            <SelectValue placeholder="Alle Berater" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="alle">Alle Berater</SelectItem>
            {advisorNames.map(name => (
              <SelectItem key={name} value={name}>{name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

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
      </div>
    </div>
  )
}
