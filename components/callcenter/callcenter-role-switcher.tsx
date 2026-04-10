'use client'

import { Shield, Headset, UserCog, MonitorPlay } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Select, SelectContent, SelectItem, SelectGroup, SelectLabel,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useCallbackStore } from '@/lib/stores/callback-store'
import { useMemo } from 'react'
import { mockCallAgents } from '@/lib/constants'

export type CallcenterRole = 'admin' | 'callcenter' | 'berater' | 'dashboard'

interface RoleOption {
  value: CallcenterRole
  label: string
  shortLabel: string
  icon: typeof Shield
}

const roles: RoleOption[] = [
  {
    value: 'admin',
    label: 'Admin-Zugang',
    shortLabel: 'Admin',
    icon: Shield,
  },
  {
    value: 'callcenter',
    label: 'Call-Center-Agent',
    shortLabel: 'CC-Agent',
    icon: Headset,
  },
  {
    value: 'berater',
    label: 'Serviceberater / Verkäufer',
    shortLabel: 'Berater',
    icon: UserCog,
  },
  {
    value: 'dashboard',
    label: 'Live-Dashboard',
    shortLabel: 'Live',
    icon: MonitorPlay,
  },
]

interface CallcenterRoleSwitcherProps {
  role: CallcenterRole
  onRoleChange: (role: CallcenterRole) => void
  selectedUser: string
  onSelectedUserChange: (user: string) => void
}

export function CallcenterRoleSwitcher({
  role, onRoleChange, selectedUser, onSelectedUserChange,
}: CallcenterRoleSwitcherProps) {
  const employees = useCallbackStore(s => s.employees)

  // Call Center agents (human only from mockCallAgents)
  const ccAgents = useMemo(() => {
    const humanAgents = mockCallAgents.filter(a => a.type === 'mensch')
    return humanAgents
  }, [])

  // Serviceberater + Verkäufer
  const beraterList = useMemo(() => {
    return employees.filter(e => e.role === 'serviceberater' || e.role === 'verkaufer')
  }, [employees])

  return (
    <div className="flex flex-col gap-2 w-full md:w-auto md:flex-row md:items-center md:gap-2.5">
      {/* User selector dropdown (only for non-admin roles) */}
      {role === 'callcenter' && (
        <Select value={selectedUser} onValueChange={onSelectedUserChange}>
          <SelectTrigger className="h-9 text-xs w-full md:h-9 md:text-sm md:w-[200px]">
            <SelectValue placeholder="Agent auswählen" />
          </SelectTrigger>
          <SelectContent>
            {ccAgents.map(agent => (
              <SelectItem key={agent.id} value={agent.name}>
                {agent.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {role === 'berater' && (
        <Select value={selectedUser} onValueChange={onSelectedUserChange}>
          <SelectTrigger className="h-9 text-xs w-full md:h-9 md:text-sm md:w-[200px]">
            <SelectValue placeholder="Berater auswählen" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">
                Serviceberater
              </SelectLabel>
              {beraterList.filter(e => e.role === 'serviceberater').map(emp => (
                <SelectItem key={emp.id} value={emp.name}>
                  {emp.name}
                </SelectItem>
              ))}
            </SelectGroup>
            <SelectGroup>
              <SelectLabel className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">
                Verkäufer
              </SelectLabel>
              {beraterList.filter(e => e.role === 'verkaufer').map(emp => (
                <SelectItem key={emp.id} value={emp.name}>
                  {emp.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      )}

      {/* Role tabs */}
      <div className="flex items-center gap-1 rounded-lg md:rounded-xl border bg-muted/50 p-0.5 md:p-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {roles.map((r) => {
          const Icon = r.icon
          const isActive = role === r.value
          return (
            <button
              key={r.value}
              onClick={() => onRoleChange(r.value)}
              className={cn(
                'flex items-center gap-1.5 rounded-md md:rounded-lg px-2.5 py-2 md:px-3 md:py-2 lg:px-3.5 text-xs md:text-[13px] font-medium transition-all whitespace-nowrap flex-shrink-0',
                isActive && r.value === 'admin'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : isActive
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-3.5 w-3.5 md:h-4 md:w-4" />
              {/* Three-stage labels: short on mobile + tablet, full on desktop */}
              <span className="lg:hidden">{r.shortLabel}</span>
              <span className="hidden lg:inline">{r.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
