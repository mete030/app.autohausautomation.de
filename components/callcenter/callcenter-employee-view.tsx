'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubTrigger,
  DropdownMenuSubContent, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Plus, MoreHorizontal, Mail, Phone, Pencil, Trash2,
  UserCheck, UserX, Coffee, Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCallbackStore } from '@/lib/stores/callback-store'
import { employeeRoleConfig, employeeStatusConfig } from '@/lib/constants'
import type { Employee, EmployeeRole, EmployeeStatus } from '@/lib/types'
import { CallcenterEmployeeDialog } from './callcenter-employee-dialog'
import { EmployeeDetailSheet } from './callcenter-employee-detail-sheet'

const statusActions: { status: EmployeeStatus; label: string; icon: typeof UserCheck }[] = [
  { status: 'aktiv', label: 'Aktiv', icon: UserCheck },
  { status: 'abwesend', label: 'Abwesend', icon: UserX },
  { status: 'pause', label: 'Pause', icon: Coffee },
]

const departmentOrder: EmployeeRole[] = [
  'geschaeftsfuehrung',
  'werkstattleiter',
  'serviceberater',
  'verkaufer',
  'callcenter_agent',
  'backoffice',
]

export function CallcenterEmployeeView() {
  const { employees, callbacks, addEmployee, updateEmployee, removeEmployee } = useCallbackStore()
  const [editingEmployee, setEditingEmployee] = useState<Employee | undefined>(undefined)
  const [showNewDialog, setShowNewDialog] = useState(false)
  const [roleFilter, setRoleFilter] = useState<EmployeeRole | 'alle'>('alle')
  const [detailEmployee, setDetailEmployee] = useState<Employee | null>(null)

  const employeeMetrics = useMemo(() => {
    const metricsMap = new Map<string, { open: number; completed: number; slaPercent: number }>()

    for (const emp of employees) {
      const empCallbacks = callbacks.filter(cb => cb.assignedEmployeeId === emp.id)
      const open = empCallbacks.filter(cb => cb.status === 'offen' || cb.status === 'in_bearbeitung' || cb.status === 'ueberfaellig').length
      const completed = empCallbacks.filter(cb => cb.status === 'erledigt').length
      const total = empCallbacks.length

      let slaPercent = 100
      if (total > 0) {
        const withinSla = empCallbacks.filter(cb => {
          if (cb.status !== 'erledigt') return cb.status !== 'ueberfaellig'
          return cb.completedAt
            ? new Date(cb.completedAt).getTime() <= new Date(cb.slaDeadline).getTime()
            : true
        }).length
        slaPercent = Math.round((withinSla / total) * 100)
      }

      metricsMap.set(emp.id, { open, completed, slaPercent })
    }
    return metricsMap
  }, [employees, callbacks])

  const groupedByDepartment = useMemo(() => {
    const visibleRoles = roleFilter === 'alle' ? departmentOrder : [roleFilter]

    return visibleRoles
      .map(role => ({
        role,
        config: employeeRoleConfig[role],
        employees: employees.filter(emp => emp.role === role),
      }))
      .filter(group => group.employees.length > 0)
  }, [employees, roleFilter])

  const handleSaveNew = (data: {
    name: string
    role: EmployeeRole
    email: string
    phone: string
    isCallAgent: boolean
    isSupervisor: boolean
  }) => {
    addEmployee({
      name: data.name,
      role: data.role,
      email: data.email || undefined,
      phone: data.phone || undefined,
      isCallAgent: data.isCallAgent,
      isSupervisor: data.isSupervisor,
    })
  }

  const handleSaveEdit = (data: {
    name: string
    role: EmployeeRole
    email: string
    phone: string
    isCallAgent: boolean
    isSupervisor: boolean
  }) => {
    if (!editingEmployee) return
    updateEmployee(editingEmployee.id, {
      name: data.name,
      role: data.role,
      email: data.email || undefined,
      phone: data.phone || undefined,
      isCallAgent: data.isCallAgent,
      isSupervisor: data.isSupervisor,
    })
    setEditingEmployee(undefined)
  }

  const handleStatusChange = (employeeId: string, status: EmployeeStatus) => {
    updateEmployee(employeeId, { status })
  }

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold">Mitarbeiter verwalten</h2>
        <div className="flex items-center gap-2">
          <Select
            value={roleFilter}
            onValueChange={value => setRoleFilter(value as EmployeeRole | 'alle')}
          >
            <SelectTrigger className="w-[180px] h-8 text-xs">
              <SelectValue placeholder="Alle Abteilungen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="alle">Alle Abteilungen</SelectItem>
              {departmentOrder.map(role => (
                <SelectItem key={role} value={role}>
                  {employeeRoleConfig[role].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" className="h-8 text-xs" onClick={() => setShowNewDialog(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Neuer Mitarbeiter
          </Button>
        </div>
      </div>

      {/* Department sections — compact table-like rows */}
      <div className="space-y-4">
        {groupedByDepartment.map(({ role, config, employees: deptEmployees }) => (
          <section key={role}>
            <div className="flex items-center gap-2 mb-1.5">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
              <h3 className="text-xs font-semibold">{config.label}</h3>
              <Badge variant="secondary" className={cn('text-[9px] px-1.5 py-0 h-4', config.color)}>
                {deptEmployees.length}
              </Badge>
            </div>

            <div className="border rounded-lg overflow-hidden divide-y">
              {deptEmployees.map(emp => {
                const roleCfg = employeeRoleConfig[emp.role]
                const statusCfg = employeeStatusConfig[emp.status]
                const metrics = employeeMetrics.get(emp.id) ?? { open: 0, completed: 0, slaPercent: 100 }

                return (
                  <div key={emp.id} className="flex items-center gap-3 px-3 py-2 bg-card hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => setDetailEmployee(emp)}>
                    {/* Avatar */}
                    <Avatar className="h-7 w-7 flex-shrink-0">
                      <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-semibold">
                        {getInitials(emp.name)}
                      </AvatarFallback>
                    </Avatar>

                    {/* Name + Role */}
                    <div className="min-w-0 w-[160px] flex-shrink-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-xs truncate">{emp.name}</span>
                        <span
                          className={cn('h-1.5 w-1.5 rounded-full flex-shrink-0', statusCfg.dot)}
                          title={statusCfg.label}
                        />
                      </div>
                      <Badge
                        variant="secondary"
                        className={cn('text-[9px] px-1 py-0 h-3.5', roleCfg.color)}
                      >
                        {roleCfg.label}
                      </Badge>
                    </div>

                    {/* Contact */}
                    <div className="hidden sm:flex items-center gap-4 flex-1 min-w-0">
                      {emp.email && (
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground min-w-0">
                          <Mail className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{emp.email}</span>
                        </div>
                      )}
                      {emp.phone && (
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground min-w-0">
                          <Phone className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{emp.phone}</span>
                        </div>
                      )}
                    </div>

                    {/* Metrics */}
                    <div className="hidden md:flex items-center gap-4 text-[11px] flex-shrink-0">
                      <span className="text-muted-foreground">
                        Offen: <span className="font-semibold text-foreground">{metrics.open}</span>
                      </span>
                      <span className="text-muted-foreground">
                        Erledigt: <span className="font-semibold text-foreground">{metrics.completed}</span>
                      </span>
                      <span className="text-muted-foreground">
                        SLA:{' '}
                        <span
                          className={cn(
                            'font-semibold',
                            metrics.slaPercent >= 90 ? 'text-emerald-600' :
                            metrics.slaPercent >= 70 ? 'text-amber-600' :
                            'text-red-600'
                          )}
                        >
                          {metrics.slaPercent}%
                        </span>
                      </span>
                    </div>

                    {/* Actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0 flex-shrink-0">
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>Status ändern</DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            {statusActions.map(action => (
                              <DropdownMenuItem
                                key={action.status}
                                onClick={() => handleStatusChange(emp.id, action.status)}
                                disabled={emp.status === action.status}
                              >
                                <action.icon className="h-3.5 w-3.5 mr-2" />
                                {action.label}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                        <DropdownMenuItem onClick={() => setEditingEmployee(emp)}>
                          <Pencil className="h-3.5 w-3.5 mr-2" />
                          Bearbeiten
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => removeEmployee(emp.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-2" />
                          Entfernen
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )
              })}
            </div>
          </section>
        ))}

        {groupedByDepartment.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">
            Keine Mitarbeiter in dieser Abteilung vorhanden.
          </div>
        )}
      </div>

      <CallcenterEmployeeDialog
        open={showNewDialog}
        onOpenChange={setShowNewDialog}
        onSave={handleSaveNew}
      />

      <CallcenterEmployeeDialog
        open={!!editingEmployee}
        onOpenChange={open => { if (!open) setEditingEmployee(undefined) }}
        employee={editingEmployee}
        onSave={handleSaveEdit}
      />

      <EmployeeDetailSheet
        open={!!detailEmployee}
        employee={detailEmployee}
        onOpenChange={(open) => { if (!open) setDetailEmployee(null) }}
      />
    </>
  )
}
