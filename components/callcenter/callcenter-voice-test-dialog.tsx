'use client'

import { useState } from 'react'
import { Phone, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type CallStatus = 'idle' | 'calling' | 'success' | 'error'

export function CallcenterVoiceTestDialog() {
  const [open, setOpen] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [status, setStatus] = useState<CallStatus>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [callResult, setCallResult] = useState<{ id: string; from: string; to: string } | null>(null)

  const handleCall = async () => {
    if (!phoneNumber.trim()) return

    setStatus('calling')
    setErrorMessage('')
    setCallResult(null)

    try {
      const res = await fetch('/api/nlpearl/make-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: phoneNumber.trim() }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Fehler ${res.status}`)
      }

      const data = await res.json()
      setCallResult(data)
      setStatus('success')
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Unbekannter Fehler')
      setStatus('error')
    }
  }

  const reset = () => {
    setStatus('idle')
    setErrorMessage('')
    setCallResult(null)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { reset(); setPhoneNumber('') } }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 border-violet-200 text-violet-700 hover:bg-violet-50 hover:text-violet-800 dark:border-violet-800 dark:text-violet-400 dark:hover:bg-violet-950/30">
          <Phone className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">KI Voice Agent Test</span>
          <span className="sm:hidden">Voice Test</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-violet-100 dark:bg-violet-950/30">
              <Phone className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            </div>
            KI Voice Agent — Testanruf
          </DialogTitle>
          <DialogDescription>
            Starte einen Testanruf mit dem KI Voice Agent. Der Agent wird die angegebene Nummer anrufen.
          </DialogDescription>
        </DialogHeader>

        {status === 'idle' && (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefonnummer</Label>
              <Input
                id="phone"
                placeholder="+49 711 1234567"
                value={phoneNumber}
                onChange={e => setPhoneNumber(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCall()}
              />
              <p className="text-[11px] text-muted-foreground">
                Bitte im internationalen Format eingeben (z.B. +49...)
              </p>
            </div>
          </div>
        )}

        {status === 'calling' && (
          <div className="flex flex-col items-center py-8 gap-3">
            <Loader2 className="h-8 w-8 text-violet-500 animate-spin" />
            <p className="text-sm font-medium">Anruf wird gestartet...</p>
            <p className="text-xs text-muted-foreground">Bitte warten</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center py-6 gap-3">
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <CheckCircle className="h-6 w-6 text-emerald-600" />
            </div>
            <p className="text-sm font-medium">Anruf gestartet!</p>
            <p className="text-xs text-muted-foreground text-center">
              Der KI Voice Agent ruft jetzt <span className="font-medium text-foreground">{callResult?.to}</span> an.
            </p>
            {callResult?.id && (
              <p className="text-[10px] text-muted-foreground font-mono">
                Call-ID: {callResult.id}
              </p>
            )}
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center py-6 gap-3">
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <p className="text-sm font-medium">Fehler beim Anruf</p>
            <p className="text-xs text-muted-foreground text-center">{errorMessage}</p>
          </div>
        )}

        <DialogFooter>
          {status === 'idle' && (
            <Button onClick={handleCall} disabled={!phoneNumber.trim()} className="gap-2">
              <Phone className="h-4 w-4" />
              Anruf starten
            </Button>
          )}
          {(status === 'success' || status === 'error') && (
            <div className="flex gap-2 w-full">
              <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
                Schließen
              </Button>
              <Button onClick={reset} className="flex-1 gap-2">
                <Phone className="h-4 w-4" />
                Neuer Anruf
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
