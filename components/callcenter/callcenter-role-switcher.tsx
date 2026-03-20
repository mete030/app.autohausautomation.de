'use client'

import { Shield, Headset, UserCog, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Select, SelectContent, SelectItem, SelectGroup, SelectLabel,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useCallbackStore } from '@/lib/stores/callback-store'
import { useMemo } from 'react'
import { mockCallAgents } from '@/lib/constants'

export type CallcenterRole = 'admin' | 'callcenter' | 'berater'

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
    <div className="flex items-center gap-2">
      {/* User selector dropdown (only for non-admin roles) */}
      {role === 'callcenter' && (
        <Select value={selectedUser} onValueChange={onSelectedUserChange}>
          <SelectTrigger className="h-8 text-xs w-[170px]">
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
          <SelectTrigger className="h-8 text-xs w-[170px]">
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
      <div className="flex items-center gap-1 rounded-lg border bg-muted/50 p-0.5">
        {roles.map((r) => {
          const Icon = r.icon
          const isActive = role === r.value
          return (
            <button
              key={r.value}
              onClick={() => onRoleChange(r.value)}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all',
                isActive && r.value === 'admin'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : isActive
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{r.label}</span>
              <span className="sm:hidden">{r.shortLabel}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
