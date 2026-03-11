'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
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

const statusActions: { status: EmployeeStatus; label: string; icon: typeof UserCheck }[] = [
  { status: 'aktiv', label: 'Aktiv', icon: UserCheck },
  { status: 'abwesend', label: 'Abwesend', icon: UserX },
  { status: 'pause', label: 'Pause', icon: Coffee },
]

/** Ordered list of department roles for section rendering. */
const departmentOrder: EmployeeRole[] = [
  'geschaeftsfuehrung',
  'werkstattleiter',
  'serviceberater',
  'verkaufer',
  'backoffice',
]

export function CallcenterEmployeeView() {
  const { employees, callbacks, addEmployee, updateEmployee, removeEmployee } = useCallbackStore()
  const [editingEmployee, setEditingEmployee] = useState<Employee | undefined>(undefined)
  const [showNewDialog, setShowNewDialog] = useState(false)
  const [roleFilter, setRoleFilter] = useState<EmployeeRole | 'alle'>('alle')

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

  /** Employees grouped by role, respecting the active filter. */
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
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Mitarbeiter verwalten</h2>
        <div className="flex items-center gap-2">
          <Select
            value={roleFilter}
            onValueChange={value => setRoleFilter(value as EmployeeRole | 'alle')}
          >
            <SelectTrigger className="w-[200px] h-9 text-sm">
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
          <Button size="sm" onClick={() => setShowNewDialog(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Neuer Mitarbeiter
          </Button>
        </div>
      </div>

      {/* Department sections */}
      <div className="space-y-6">
        {groupedByDepartment.map(({ role, config, employees: deptEmployees }) => (
          <section key={role}>
            {/* Section header */}
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">{config.label}</h3>
              <Badge variant="secondary" className={cn('text-[10px] px-1.5 py-0', config.color)}>
                {deptEmployees.length}
              </Badge>
            </div>

            {/* Employee grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {deptEmployees.map(emp => {
                const roleCfg = employeeRoleConfig[emp.role]
                const statusCfg = employeeStatusConfig[emp.status]
                const metrics = employeeMetrics.get(emp.id) ?? { open: 0, completed: 0, slaPercent: 100 }

                return (
                  <Card key={emp.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      {/* Top row: Avatar, name, status, menu */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar className="h-9 w-9 flex-shrink-0">
                            <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                              {getInitials(emp.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-sm truncate">{emp.name}</span>
                              <span
                                className={cn('h-2 w-2 rounded-full flex-shrink-0', statusCfg.dot)}
                                title={statusCfg.label}
                              />
                            </div>
                            <Badge
                              variant="secondary"
                              className={cn('text-[10px] mt-0.5 px-1.5 py-0', roleCfg.color)}
                            >
                              {roleCfg.label}
                            </Badge>
                          </div>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 flex-shrink-0">
                              <MoreHorizontal className="h-4 w-4" />
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

                      {/* Contact info */}
                      {(emp.email || emp.phone) && (
                        <div className="mt-2.5 space-y-1">
                          {emp.email && (
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              <Mail className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{emp.email}</span>
                            </div>
                          )}
                          {emp.phone && (
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              <Phone className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{emp.phone}</span>
                            </div>
                          )}
                        </div>
                      )}

                      <Separator className="my-3" />

                      {/* Performance metrics */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          Offen: <span className="font-medium text-foreground">{metrics.open}</span>
                        </span>
                        <span className="text-muted-foreground">
                          Erledigt: <span className="font-medium text-foreground">{metrics.completed}</span>
                        </span>
                        <span className="text-muted-foreground">
                          SLA:{' '}
                          <span
                            className={cn(
                              'font-medium',
                              metrics.slaPercent >= 90 ? 'text-emerald-600' :
                              metrics.slaPercent >= 70 ? 'text-amber-600' :
                              'text-red-600'
                            )}
                          >
                            {metrics.slaPercent}%
                          </span>
                        </span>
                      </div>
                    </CardContent>
                  </Card>
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

      {/* New employee dialog */}
      <CallcenterEmployeeDialog
        open={showNewDialog}
        onOpenChange={setShowNewDialog}
        onSave={handleSaveNew}
      />

      {/* Edit employee dialog */}
      <CallcenterEmployeeDialog
        open={!!editingEmployee}
        onOpenChange={open => { if (!open) setEditingEmployee(undefined) }}
        employee={editingEmployee}
        onSave={handleSaveEdit}
      />
    </>
  )
}
