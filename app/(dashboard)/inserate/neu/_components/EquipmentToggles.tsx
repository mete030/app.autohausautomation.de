'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  equipmentGroups,
  datEquipmentNames,
  equipmentState,
  type EquipmentGroup,
  type EquipmentState,
} from '@/lib/inserate-foto-mock'
import { Check, Plus, Sparkles, RotateCcw, ListChecks, X, ArrowRight } from 'lucide-react'

type GroupKey = 'serie' | 'sonder'

// ─── State styling (single source of truth for the 3 toggle states) ───────────

const STATE_CLASSES: Record<EquipmentState, string> = {
  dat: 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:border-emerald-400 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800 dark:hover:border-emerald-700',
  manual:
    'bg-amber-50 text-amber-700 border-amber-300 hover:border-amber-400 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800 dark:hover:border-amber-700',
  available:
    'bg-background text-foreground/80 border-foreground/60 hover:border-foreground hover:bg-muted/40',
}

const CHIP_BASE =
  'inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-all'

// ─── Legend chip ──────────────────────────────────────────────────────────────

function LegendChip({
  swatch,
  icon,
  label,
}: {
  swatch: string
  icon: React.ReactNode
  label: string
}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
      <span
        className={cn(
          'inline-flex h-4 w-4 items-center justify-center rounded-full border [&>svg]:h-2.5 [&>svg]:w-2.5',
          swatch,
        )}
      >
        {icon}
      </span>
      {label}
    </span>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function EquipmentToggles() {
  const datSet = useMemo(() => new Set(datEquipmentNames), [])
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(datEquipmentNames),
  )
  // User-added equipment not present in the catalog, per group.
  const [customItems, setCustomItems] = useState<Record<GroupKey, string[]>>({
    serie: [],
    sonder: [],
  })

  const toggle = (name: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  // Every name already known (catalog + customs) — lower-cased for dedupe.
  const knownNames = useMemo(() => {
    const s = new Set<string>()
    for (const g of equipmentGroups) for (const it of g.items) s.add(it.name.toLowerCase())
    for (const k of ['serie', 'sonder'] as GroupKey[]) for (const n of customItems[k]) s.add(n.toLowerCase())
    return s
  }, [customItems])

  const addCustom = (key: GroupKey, raw: string) => {
    const name = raw.trim()
    if (!name || knownNames.has(name.toLowerCase())) return
    setCustomItems((prev) => ({ ...prev, [key]: [...prev[key], name] }))
    setSelected((prev) => new Set(prev).add(name))
  }

  const removeCustom = (key: GroupKey, name: string) => {
    setCustomItems((prev) => ({ ...prev, [key]: prev[key].filter((n) => n !== name) }))
    setSelected((prev) => {
      const next = new Set(prev)
      next.delete(name)
      return next
    })
  }

  const resetToDat = () => {
    setSelected(new Set(datSet))
    setCustomItems({ serie: [], sonder: [] })
  }

  const totalActive = selected.size
  const totalManual = useMemo(
    () => [...selected].filter((name) => !datSet.has(name)).length,
    [selected, datSet],
  )
  const hasCustom = customItems.serie.length > 0 || customItems.sonder.length > 0
  const isPristine = totalManual === 0 && totalActive === datSet.size && !hasCustom

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-primary" />
            Ausstattung
          </span>
          <Badge variant="secondary" className="text-[10px] font-normal tabular-nums">
            {totalActive} aktiv
            {totalManual > 0 && <> &middot; {totalManual} manuell</>}
          </Badge>
        </CardTitle>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1">
          <LegendChip
            swatch="bg-emerald-50 text-emerald-600 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800"
            icon={<Check />}
            label="Aus DAT übernommen"
          />
          <LegendChip
            swatch="bg-amber-50 text-amber-600 border-amber-300 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800"
            icon={<Sparkles />}
            label="Manuell ergänzt"
          />
          <LegendChip
            swatch="bg-background text-foreground/60 border-foreground/60"
            icon={<Plus />}
            label="Verfügbar, nicht gewählt"
          />
          {!isPristine && (
            <button
              type="button"
              onClick={resetToDat}
              className="ml-auto inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline"
            >
              <RotateCcw className="h-3 w-3" />
              Alle DAT zurücksetzen
            </button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {equipmentGroups.map((group) => (
          <EquipmentGroupSection
            key={group.key}
            group={group}
            customItems={customItems[group.key]}
            selected={selected}
            datSet={datSet}
            onToggle={toggle}
            onAdd={(name) => addCustom(group.key, name)}
            onRemove={(name) => removeCustom(group.key, name)}
          />
        ))}
      </CardContent>
    </Card>
  )
}

// ─── Per-group section ────────────────────────────────────────────────────────

function EquipmentGroupSection({
  group,
  customItems,
  selected,
  datSet,
  onToggle,
  onAdd,
  onRemove,
}: {
  group: EquipmentGroup
  customItems: string[]
  selected: Set<string>
  datSet: Set<string>
  onToggle: (name: string) => void
  onAdd: (name: string) => void
  onRemove: (name: string) => void
}) {
  const [draft, setDraft] = useState('')

  const renderItems = useMemo(
    () => [
      ...group.items.map((i) => ({ name: i.name, custom: false })),
      ...customItems.map((name) => ({ name, custom: true })),
    ],
    [group.items, customItems],
  )

  const { active, manual } = useMemo(() => {
    let a = 0
    let m = 0
    for (const item of renderItems) {
      if (!selected.has(item.name)) continue
      a += 1
      if (!datSet.has(item.name)) m += 1
    }
    return { active: a, manual: m }
  }, [renderItems, selected, datSet])

  const submit = () => {
    onAdd(draft)
    setDraft('')
  }

  return (
    <div className="space-y-2.5">
      {/* Subheading */}
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
          {group.title}
        </h4>
        <Badge
          variant="outline"
          className="gap-1 text-[10px] font-normal tabular-nums text-muted-foreground"
        >
          <span className="font-medium text-emerald-600 dark:text-emerald-400">
            {active} aktiv
          </span>
          {manual > 0 && (
            <>
              <span className="text-border">&middot;</span>
              <span className="font-medium text-amber-600 dark:text-amber-400">
                {manual} manuell
              </span>
            </>
          )}
        </Badge>
      </div>

      {/* Toggle grid + inline "add custom" pill (tag-input style) */}
      <div className="flex flex-wrap items-center gap-1.5">
        {renderItems.map(({ name, custom }) => {
          const state = equipmentState(name, selected, datSet)
          const icon =
            state === 'dat' ? <Check className="h-2.5 w-2.5 shrink-0" />
            : state === 'manual' ? <Sparkles className="h-2.5 w-2.5 shrink-0" />
            : <Plus className="h-2.5 w-2.5 shrink-0 opacity-60" />

          if (!custom) {
            return (
              <button
                key={name}
                type="button"
                onClick={() => onToggle(name)}
                aria-pressed={state !== 'available'}
                className={cn(
                  CHIP_BASE,
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 active:scale-[0.97]',
                  STATE_CLASSES[state],
                )}
              >
                {icon}
                {name}
              </button>
            )
          }
          // Custom item: toggle + remove (×)
          return (
            <span key={name} className={cn(CHIP_BASE, 'gap-0 py-1 pr-1', STATE_CLASSES[state])}>
              <button
                type="button"
                onClick={() => onToggle(name)}
                aria-pressed={state !== 'available'}
                className="inline-flex items-center gap-1 py-0.5 pl-0 focus-visible:outline-none active:scale-[0.97]"
              >
                {icon}
                {name}
              </button>
              <button
                type="button"
                onClick={() => onRemove(name)}
                aria-label={`${name} entfernen`}
                className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full transition-colors hover:bg-black/10 dark:hover:bg-white/15"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          )
        })}

        {/* Inline add — modern tag-input pill, flows with the chips */}
        <div className="group/add inline-flex items-center gap-1 rounded-full border border-dashed border-foreground/35 bg-background py-1 pl-2.5 pr-1.5 transition-all hover:border-foreground/55 focus-within:border-solid focus-within:border-primary focus-within:bg-primary/[0.03] focus-within:ring-2 focus-within:ring-primary/15">
          <Plus className="h-3 w-3 shrink-0 text-muted-foreground transition-colors group-focus-within/add:text-primary" />
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                submit()
              }
            }}
            placeholder="Hinzufügen…"
            aria-label={`Eigene ${group.title} hinzufügen`}
            className="w-24 bg-transparent text-xs font-medium outline-none transition-[width] placeholder:font-normal placeholder:text-muted-foreground/70 focus:w-32"
          />
          {draft.trim() && (
            <button
              type="button"
              onClick={submit}
              aria-label="Hinzufügen"
              className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-transform animate-in zoom-in-50 active:scale-90"
            >
              <ArrowRight className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
