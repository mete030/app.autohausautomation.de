'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowRightLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { employeeRoleConfig, employeeStatusConfig } from '@/lib/constants'
import { useCallbackStore } from '@/lib/stores/callback-store'
import type { Callback, Employee, EmployeeRole } from '@/lib/types'

interface ReassignDialogProps {
  open: boolean
  callback: Callback | null
  onOpenChange: (open: boolean) => void
  onReassign: (callbackId: string, newAdvisor: string, newEmployeeId?: string) => void
  advisorNames?: string[]
}

export function ReassignDialog({ open, callback, onOpenChange, onReassign, advisorNames }: ReassignDialogProps) {
  const [selected, setSelected] = useState('')
  const employees = useCallbackStore((s) => s.employees)
  const callbacks = useCallbackStore((s) => s.callbacks)

  const useEmployees = employees.length > 0

  // Group employees by role
  const groupedEmployees = useMemo(() => {
    if (!useEmployees) return {}
    const filtered = employees.filter(e => e.name !== callback?.assignedAdvisor)
    const groups: Record<EmployeeRole, typeof filtered> = {} as Record<EmployeeRole, typeof filtered>
    for (const emp of filtered) {
      if (!groups[emp.role]) groups[emp.role] = []
      groups[emp.role].push(emp)
    }
    return groups
  }, [employees, callback?.assignedAdvisor, useEmployees])

  // Count open callbacks per employee
  const openCountByEmployee = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const cb of callbacks) {
      if (cb.status !== 'erledigt' && cb.assignedEmployeeId) {
        counts[cb.assignedEmployeeId] = (counts[cb.assignedEmployeeId] || 0) + 1
      }
    }
    return counts
  }, [callbacks])

  const handleClose = (val: boolean) => {
    if (!val) setSelected('')
    onOpenChange(val)
  }

  const handleReassign = () => {
    if (!callback || !selected) return

    if (useEmployees) {
      const emp = employees.find(e => e.id === selected)
      if (emp) {
        onReassign(callback.id, emp.name, emp.id)
      }
    } else {
      onReassign(callback.id, selected)
    }
    setSelected('')
  }

  const availableAdvisors = advisorNames?.filter(n => n !== callback?.assignedAdvisor) ?? []

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rückruf neu zuweisen</DialogTitle>
        </DialogHeader>
        {callback && (
          <div className="space-y-3">
            <div className="text-sm">
              <span className="text-muted-foreground">Kunde:</span>{' '}
              <span className="font-medium">{callback.customerName}</span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Aktuell zugewiesen an:</span>{' '}
              <span className="font-medium">{callback.assignedAdvisor}</span>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Neuer Berater</label>
              <Select value={selected} onValueChange={setSelected}>
                <SelectTrigger>
                  <SelectValue placeholder="Berater auswählen..." />
                </SelectTrigger>
                <SelectContent>
                  {useEmployees ? (
                    (Object.entries(groupedEmployees) as [EmployeeRole, Employee[]][]).map(([role, emps]) => {
                      const roleCfg = employeeRoleConfig[role]
                      return (
                        <SelectGroup key={role}>
                          <SelectLabel className="text-xs text-muted-foreground">{roleCfg.label}</SelectLabel>
                          {emps.map(emp => {
                            const statusCfg = employeeStatusConfig[emp.status]
                            const openCount = openCountByEmployee[emp.id] ?? 0
                            return (
                              <SelectItem key={emp.id} value={emp.id}>
                                <div className="flex items-center gap-2 w-full">
                                  <span className={cn('h-2 w-2 rounded-full flex-shrink-0', statusCfg.dot)} />
                                  <span className="flex-1 truncate">{emp.name}</span>
                                  <Badge variant="secondary" className={cn('text-[10px] ml-1 flex-shrink-0', roleCfg.color)}>
                                    {roleCfg.label}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground flex-shrink-0 ml-1">
                                    ({openCount} offen)
                                  </span>
                                </div>
                              </SelectItem>
                            )
                          })}
                        </SelectGroup>
                      )
                    })
                  ) : (
                    availableAdvisors.map(name => (
                      <SelectItem key={name} value={name}>{name}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>Abbrechen</Button>
          <Button disabled={!selected} onClick={handleReassign}>
            <ArrowRightLeft className="h-4 w-4 mr-1" />
            Neu zuweisen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
