'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  ShieldCheck, Cigarette, FileCheck, AlertTriangle, Info, Plus, X,
} from 'lucide-react'

// ─── Editable note list (shared by Schäden & Hinweise) ─────────────────────────

function NoteList({
  icon: Icon,
  tone,
  items,
  onAdd,
  onRemove,
  placeholder,
}: {
  icon: React.ElementType
  tone: 'amber' | 'blue'
  items: string[]
  onAdd: (v: string) => void
  onRemove: (i: number) => void
  placeholder: string
}) {
  const [draft, setDraft] = useState('')
  const iconColor = tone === 'amber' ? 'text-amber-500' : 'text-blue-500'

  const submit = () => {
    const v = draft.trim()
    if (!v) return
    onAdd(v)
    setDraft('')
  }

  return (
    <div className="space-y-2">
      {items.length > 0 && (
        <ul className="space-y-1.5">
          {items.map((item, i) => (
            <li
              key={i}
              className="group flex items-start gap-2 rounded-lg border border-border/60 bg-muted/30 px-2.5 py-1.5 text-sm"
            >
              <Icon className={cn('mt-0.5 h-3.5 w-3.5 shrink-0', iconColor)} />
              <span className="min-w-0 flex-1 text-foreground/90">{item}</span>
              <button
                type="button"
                onClick={() => onRemove(i)}
                aria-label="Hinweis entfernen"
                className="shrink-0 rounded-full p-0.5 text-muted-foreground/60 opacity-0 transition-opacity hover:bg-black/10 hover:text-foreground group-hover:opacity-100 dark:hover:bg-white/15"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              submit()
            }
          }}
          placeholder={placeholder}
          className="h-8 text-sm"
        />
        <button
          type="button"
          onClick={submit}
          disabled={!draft.trim()}
          className="inline-flex h-8 shrink-0 items-center gap-1 rounded-md border border-border px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-40"
        >
          <Plus className="h-3.5 w-3.5" />
          Hinzufügen
        </button>
      </div>
    </div>
  )
}

// ─── Zustand toggle ─────────────────────────────────────────────────────────────

function ConditionToggle({
  label,
  icon: Icon,
  checked,
  onChange,
}: {
  label: string
  icon: React.ElementType
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors',
        checked
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300'
          : 'border-border bg-muted/30 text-muted-foreground',
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="flex-1 font-medium">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} className="scale-90" />
    </label>
  )
}

// ─── Component ──────────────────────────────────────────────────────────────────

export function ConditionSection({
  prefill,
}: {
  prefill?: {
    unfallfrei?: boolean
    nichtraucher?: boolean
    scheckheftgepflegt?: boolean
    schaeden?: string[]
    hinweise?: string[]
  }
}) {
  const [unfallfrei, setUnfallfrei] = useState(prefill?.unfallfrei ?? true)
  const [nichtraucher, setNichtraucher] = useState(prefill?.nichtraucher ?? true)
  const [scheckheft, setScheckheft] = useState(prefill?.scheckheftgepflegt ?? true)
  const [schaeden, setSchaeden] = useState<string[]>(prefill?.schaeden ?? [])
  const [hinweise, setHinweise] = useState<string[]>(prefill?.hinweise ?? [])

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Zustand &amp; Hinweise
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Zustand */}
        <section className="space-y-2.5">
          <h4 className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            Zustand
          </h4>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <ConditionToggle label="Unfallfrei" icon={ShieldCheck} checked={unfallfrei} onChange={setUnfallfrei} />
            <ConditionToggle label="Nichtraucher" icon={Cigarette} checked={nichtraucher} onChange={setNichtraucher} />
            <ConditionToggle label="Scheckheftgepflegt" icon={FileCheck} checked={scheckheft} onChange={setScheckheft} />
          </div>
        </section>

        {/* Schäden & Mängel */}
        <section className="space-y-2.5">
          <h4 className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            <AlertTriangle className="h-3 w-3" />
            Schäden &amp; Mängel
          </h4>
          <NoteList
            icon={AlertTriangle}
            tone="amber"
            items={schaeden}
            onAdd={(v) => setSchaeden((p) => [...p, v])}
            onRemove={(i) => setSchaeden((p) => p.filter((_, idx) => idx !== i))}
            placeholder="z. B. Frontscheibe Steinschlag oben rechts – Reparatur vor Übergabe"
          />
        </section>

        {/* Hinweise */}
        <section className="space-y-2.5">
          <h4 className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            <Info className="h-3 w-3" />
            Hinweise (Garantie, Service, Probefahrt …)
          </h4>
          <NoteList
            icon={Info}
            tone="blue"
            items={hinweise}
            onAdd={(v) => setHinweise((p) => [...p, v])}
            onRemove={(i) => setHinweise((p) => p.filter((_, idx) => idx !== i))}
            placeholder="z. B. Junge-Sterne-Garantie 24 Monate möglich"
          />
        </section>
      </CardContent>
    </Card>
  )
}
