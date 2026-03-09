'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Search, User, X, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { callSourceConfig, mockCallAgents, mockCustomers } from '@/lib/constants'
import type { CallbackPriority, CallSource, CallAgent } from '@/lib/types'

interface CreateCallbackPayload {
  customerName: string
  customerPhone: string
  reason: string
  notes: string
  assignedAdvisor: string
  priority: CallbackPriority
  source: CallSource
  takenBy: CallAgent
  callTranscript?: string
}

interface NewCallbackDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (payload: CreateCallbackPayload) => void
  advisorNames: string[]
}

const priorityOptions: { value: CallbackPriority; label: string }[] = [
  { value: 'niedrig', label: 'Niedrig' },
  { value: 'mittel', label: 'Mittel' },
  { value: 'hoch', label: 'Hoch' },
  { value: 'dringend', label: 'Dringend' },
]

const sourceOptions = Object.entries(callSourceConfig).map(([value, cfg]) => ({
  value: value as CallSource,
  label: cfg.label,
}))

export function NewCallbackDialog({ open, onOpenChange, onCreate, advisorNames }: NewCallbackDialogProps) {
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [priority, setPriority] = useState<CallbackPriority>('mittel')
  const [assignedAdvisor, setAssignedAdvisor] = useState('')
  const [source, setSource] = useState<CallSource>('telefon')
  const [agentId, setAgentId] = useState('')

  // Customer search inline combobox
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false)
  const [customerSearch, setCustomerSearch] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    if (!customerDropdownOpen) return
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setCustomerDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [customerDropdownOpen])

  const filteredCustomers = useMemo(() => {
    const q = customerSearch.toLowerCase()
    if (!q) return mockCustomers.slice(0, 8)
    return mockCustomers.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      (c.email && c.email.toLowerCase().includes(q))
    )
  }, [customerSearch])

  const reset = () => {
    setCustomerName('')
    setCustomerPhone('')
    setReason('')
    setNotes('')
    setPriority('mittel')
    setAssignedAdvisor('')
    setSource('telefon')
    setAgentId('')
    setCustomerSearch('')
  }

  const handleClose = (val: boolean) => {
    if (!val) reset()
    onOpenChange(val)
  }

  const handleSourceChange = (val: CallSource) => {
    setSource(val)
    if (val === 'ki_agent') {
      const kiAgent = mockCallAgents.find(a => a.type === 'ki')
      if (kiAgent) setAgentId(kiAgent.id)
    }
  }

  const handleSelectCustomer = (customer: typeof mockCustomers[number]) => {
    setCustomerName(customer.name)
    setCustomerPhone(customer.phone)
    setCustomerSearch('')
    setCustomerDropdownOpen(false)
  }

  const handleCreate = () => {
    const agent = mockCallAgents.find(a => a.id === agentId)
    if (!customerName.trim() || !reason.trim() || !assignedAdvisor || !agent) return

    onCreate({
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      reason: reason.trim(),
      notes: notes.trim(),
      assignedAdvisor,
      priority,
      source,
      takenBy: agent,
    })
    reset()
    onOpenChange(false)
  }

  const isValid = customerName.trim() && reason.trim() && assignedAdvisor && agentId

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Neuer Rückruf</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          {/* Customer name with inline search dropdown */}
          <div className="space-y-1.5 sm:col-span-2" ref={dropdownRef}>
            <label className="text-sm font-medium">Kundenname *</label>
            {/* Selected state vs search state */}
            {customerName && !customerDropdownOpen ? (
              <button
                type="button"
                onClick={() => { setCustomerDropdownOpen(true); setCustomerSearch('') }}
                className="flex h-9 items-center gap-2 w-full rounded-md border border-input bg-background px-3 text-sm text-left"
              >
                <User className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                <span className="flex-1 truncate font-medium">{customerName}</span>
                <span className="text-xs text-muted-foreground mr-1">{customerPhone}</span>
                <X
                  className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground flex-shrink-0"
                  onClick={(e) => { e.stopPropagation(); setCustomerName(''); setCustomerPhone('') }}
                />
              </button>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Kunde suchen (Name, Telefon, E-Mail)..."
                  value={customerSearch}
                  onChange={e => { setCustomerSearch(e.target.value); setCustomerDropdownOpen(true) }}
                  onFocus={() => setCustomerDropdownOpen(true)}
                  className="pl-9 pr-8"
                />
                {customerSearch && (
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    onClick={() => setCustomerSearch('')}
                  >
                    <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                  </button>
                )}
              </div>
            )}

            {/* Dropdown results */}
            {customerDropdownOpen && (
              <div className="border rounded-lg bg-background shadow-lg overflow-hidden -mt-1">
                <div className="max-h-[200px] overflow-y-auto">
                  {filteredCustomers.length === 0 ? (
                    <div className="px-3 py-3 text-center text-sm text-muted-foreground">
                      Kein Kunde gefunden
                    </div>
                  ) : (
                    filteredCustomers.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        className={cn(
                          'w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-muted/50 transition-colors',
                          customerName === c.name && 'bg-primary/5',
                        )}
                        onClick={() => handleSelectCustomer(c)}
                      >
                        <div className="flex items-center justify-center h-7 w-7 rounded-full bg-muted text-muted-foreground flex-shrink-0">
                          <User className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium truncate">{c.name}</p>
                            {customerName === c.name && <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />}
                          </div>
                          <p className="text-xs text-muted-foreground">{c.phone}</p>
                        </div>
                        {c.vehicleInterest && (
                          <span className="text-[11px] text-muted-foreground/60 truncate max-w-[100px] hidden sm:inline">
                            {c.vehicleInterest}
                          </span>
                        )}
                      </button>
                    ))
                  )}
                </div>
                {customerSearch && (
                  <div className="border-t px-3 py-2">
                    <button
                      type="button"
                      className="text-xs text-primary hover:underline"
                      onClick={() => {
                        setCustomerName(customerSearch)
                        setCustomerDropdownOpen(false)
                        setCustomerSearch('')
                      }}
                    >
                      + &quot;{customerSearch}&quot; als neuen Kunden verwenden
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Phone is auto-filled from customer selection but can be edited manually */}
          {customerName && !customerDropdownOpen && (
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-sm font-medium">Telefonnummer</label>
              <Input
                placeholder="+49 711 ..."
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
              />
            </div>
          )}
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-sm font-medium">Anliegen *</label>
            <Input
              placeholder="Grund des Anrufs..."
              value={reason}
              onChange={e => setReason(e.target.value)}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-sm font-medium">Notizen</label>
            <Textarea
              placeholder="Weitere Details..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Priorität</label>
            <Select value={priority} onValueChange={v => setPriority(v as CallbackPriority)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {priorityOptions.map(o => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Zuweisen an *</label>
            <Select value={assignedAdvisor} onValueChange={setAssignedAdvisor}>
              <SelectTrigger><SelectValue placeholder="Berater wählen..." /></SelectTrigger>
              <SelectContent>
                {advisorNames.map(name => (
                  <SelectItem key={name} value={name}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Quelle</label>
            <Select value={source} onValueChange={v => handleSourceChange(v as CallSource)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {sourceOptions.map(o => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Angenommen von *</label>
            <Select value={agentId} onValueChange={setAgentId}>
              <SelectTrigger><SelectValue placeholder="Agent wählen..." /></SelectTrigger>
              <SelectContent>
                {mockCallAgents.map(a => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.type === 'ki' ? `🤖 ${a.name}` : a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>Abbrechen</Button>
          <Button disabled={!isValid} onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-1" />
            Erstellen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
