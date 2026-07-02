'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { Check, Plus, Sparkles, RotateCcw, X, ArrowRight, ListPlus } from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────
// Einkauf-lokaler Ausstattungs-Picker (Chips + Tag-Input + optionaler Katalog).
// Bewusst PARALLEL zum Inserate-Picker gehalten (kein Import aus inserate-*), das
// 3-Zustands-Chip-Muster (erkannt / ergänzt / verfügbar) ist nachgebaut.
//   • variant "full"    → Einzelfahrzeug-Karte (alle verfügbaren Katalog-Chips sichtbar)
//   • variant "compact" → Paket-Zeile (nur gewählte Chips + „+N mehr" + Katalog-Popover)
// ─────────────────────────────────────────────────────────────────────────────

export interface EquipmentCatalogGroup {
  title: string
  items: readonly string[]
}
export type EquipmentCatalog = readonly EquipmentCatalogGroup[]

export interface EquipmentPickerProps {
  value: string[]
  onChange: (next: string[]) => void
  detected?: string[]
  catalog?: EquipmentCatalog
  searchPool?: readonly string[]
  variant?: 'full' | 'compact'
  addPlaceholder?: string
  emptyHint?: string
  id?: string
  className?: string
}

type ChipState = 'detected' | 'added' | 'available'

const STATE_CLASSES: Record<ChipState, string> = {
  detected:
    'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800',
  added:
    'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800',
  available:
    'bg-background text-foreground/80 border-foreground/40 hover:border-foreground hover:bg-muted/40',
}
const CHIP =
  'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-all'
const COMPACT_CAP = 6

const norm = (s: string) => s.trim().toLowerCase()

export function EquipmentPicker({
  value,
  onChange,
  detected = [],
  catalog,
  searchPool,
  variant = 'full',
  addPlaceholder = 'Hinzufügen…',
  emptyHint,
  id,
  className,
}: EquipmentPickerProps) {
  const detectedSet = useMemo(() => new Set(detected.map(norm)), [detected])
  const selectedSet = useMemo(() => new Set(value.map(norm)), [value])
  const [showAll, setShowAll] = useState(false)

  const chipState = (name: string): ChipState =>
    !selectedSet.has(norm(name)) ? 'available' : detectedSet.has(norm(name)) ? 'detected' : 'added'

  const known = useMemo(() => {
    const s = new Set<string>(value.map(norm))
    catalog?.forEach((g) => g.items.forEach((i) => s.add(norm(i))))
    searchPool?.forEach((i) => s.add(norm(i)))
    return s
  }, [value, catalog, searchPool])

  const addItem = (raw: string) => {
    const name = raw.trim()
    if (!name || selectedSet.has(norm(name))) return
    onChange([...value, name])
  }
  const removeItem = (name: string) => onChange(value.filter((v) => norm(v) !== norm(name)))
  const toggle = (name: string) => (selectedSet.has(norm(name)) ? removeItem(name) : addItem(name))

  const availableCatalog = useMemo(
    () => (catalog ?? []).flatMap((g) => g.items).filter((i) => !selectedSet.has(norm(i))),
    [catalog, selectedSet],
  )
  const isDirty = value.length !== detected.length || value.some((v) => !detectedSet.has(norm(v)))
  const resetToDetected = () => onChange([...detected])

  // ── COMPACT (Paket-Zeile) ──
  if (variant === 'compact') {
    const shown = showAll ? value : value.slice(0, COMPACT_CAP)
    const hidden = value.length - shown.length
    return (
      <div id={id} className={cn('flex flex-wrap items-center gap-1.5', className)}>
        {value.length === 0 && emptyHint && (
          <span className="text-[11px] text-muted-foreground">{emptyHint}</span>
        )}
        <SelectedChips items={shown} chipState={chipState} onRemove={removeItem} />
        {hidden > 0 && (
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="rounded-full border border-dashed border-border/60 px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground"
          >
            +{hidden} mehr
          </button>
        )}
        {showAll && value.length > COMPACT_CAP && (
          <button
            type="button"
            onClick={() => setShowAll(false)}
            className="rounded-full px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground"
          >
            weniger
          </button>
        )}
        <AddPill placeholder={addPlaceholder} onAdd={addItem} compact />
        {(catalog || searchPool) && (
          <CatalogPopover
            catalog={catalog}
            searchPool={searchPool}
            known={known}
            onToggle={toggle}
            isSelected={(n) => selectedSet.has(norm(n))}
            onAdd={addItem}
          />
        )}
      </div>
    )
  }

  // ── FULL (Einzelfahrzeug-Karte) ──
  return (
    <div id={id} className={cn('space-y-3', className)}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
        <LegendChip cls={STATE_CLASSES.detected} icon={<Check />} label="Erkannt (KBA/DAT)" />
        <LegendChip cls={STATE_CLASSES.added} icon={<Sparkles />} label="Manuell ergänzt" />
        <LegendChip cls={STATE_CLASSES.available} icon={<Plus />} label="Verfügbar" />
        {isDirty && (
          <button
            type="button"
            onClick={resetToDetected}
            className="ml-auto inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:underline"
          >
            <RotateCcw className="h-3 w-3" /> Auf erkannt zurücksetzen
          </button>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-1.5 max-h-[360px] overflow-y-auto pr-1">
        <SelectedChips items={value} chipState={chipState} onRemove={removeItem} />
        {availableCatalog.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => addItem(name)}
            className={cn(CHIP, STATE_CLASSES.available)}
          >
            <Plus className="h-2.5 w-2.5 opacity-60" />
            {name}
          </button>
        ))}
        <AddPill placeholder={addPlaceholder} onAdd={addItem} />
      </div>
      {searchPool && (
        <CatalogPopover
          catalog={catalog}
          searchPool={searchPool}
          known={known}
          onToggle={toggle}
          isSelected={(n) => selectedSet.has(norm(n))}
          onAdd={addItem}
        />
      )}
    </div>
  )
}

// Gewählte Chips (mit Entfernen ×) — auf Modulebene, damit sie beim Re-Render
// nicht neu erzeugt werden (react-hooks/static-components).
function SelectedChips({
  items,
  chipState,
  onRemove,
}: {
  items: string[]
  chipState: (name: string) => ChipState
  onRemove: (name: string) => void
}) {
  return (
    <>
      {items.map((name) => {
        const st = chipState(name)
        return (
          <span key={name} className={cn(CHIP, 'pr-1', STATE_CLASSES[st])}>
            {st === 'detected' ? <Check className="h-2.5 w-2.5" /> : <Sparkles className="h-2.5 w-2.5" />}
            {name}
            <button
              type="button"
              onClick={() => onRemove(name)}
              aria-label={`${name} entfernen`}
              className="ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-black/10 dark:hover:bg-white/15"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        )
      })}
    </>
  )
}

function LegendChip({ cls, icon, label }: { cls: string; icon: ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
      <span
        className={cn(
          'inline-flex h-4 w-4 items-center justify-center rounded-full border [&>svg]:h-2.5 [&>svg]:w-2.5',
          cls,
        )}
      >
        {icon}
      </span>
      {label}
    </span>
  )
}

function AddPill({
  placeholder,
  onAdd,
  compact,
}: {
  placeholder: string
  onAdd: (s: string) => void
  compact?: boolean
}) {
  const [draft, setDraft] = useState('')
  const submit = () => {
    onAdd(draft)
    setDraft('')
  }
  return (
    <div className="group/add inline-flex items-center gap-1 rounded-full border border-dashed border-foreground/35 bg-background py-1 pl-2.5 pr-1.5 focus-within:border-solid focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15">
      <Plus className="h-3 w-3 shrink-0 text-muted-foreground group-focus-within/add:text-primary" />
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            submit()
          }
        }}
        placeholder={placeholder}
        aria-label="Eigene Ausstattung hinzufügen"
        className={cn(
          'bg-transparent text-xs font-medium outline-none transition-[width] placeholder:font-normal placeholder:text-muted-foreground/70',
          compact ? 'w-6 focus:w-28' : 'w-24 focus:w-36',
        )}
      />
      {draft.trim() && (
        <button
          type="button"
          onClick={submit}
          aria-label="Hinzufügen"
          className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground animate-in zoom-in-50 active:scale-90"
        >
          <ArrowRight className="h-3 w-3" />
        </button>
      )}
    </div>
  )
}

function CatalogPopover({
  catalog,
  searchPool,
  known,
  onToggle,
  isSelected,
  onAdd,
}: {
  catalog?: EquipmentCatalog
  searchPool?: readonly string[]
  known: Set<string>
  onToggle: (n: string) => void
  isSelected: (n: string) => boolean
  onAdd: (n: string) => void
}) {
  const [q, setQ] = useState('')
  const groups = useMemo<EquipmentCatalog>(() => {
    if (!q.trim()) return catalog ?? []
    const needle = q.toLowerCase()
    const pool = searchPool ?? (catalog ?? []).flatMap((g) => g.items)
    const hits = pool.filter((i) => i.toLowerCase().includes(needle))
    return [{ title: 'Treffer', items: hits }]
  }, [q, catalog, searchPool])
  const canAddCustom = q.trim().length > 0 && !known.has(q.trim().toLowerCase())
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="h-7 gap-1 rounded-full px-2.5 text-[11px]">
          <ListPlus className="h-3 w-3" /> Katalog
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-2">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Ausstattung suchen…"
          className="h-8 text-sm"
        />
        <ScrollArea className="mt-2 h-56 pr-2">
          {groups.map((g) => (
            <div key={g.title} className="mb-2">
              <p className="mb-1 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                {g.title}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {g.items.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => onToggle(name)}
                    className={cn(CHIP, isSelected(name) ? STATE_CLASSES.added : STATE_CLASSES.available)}
                  >
                    {isSelected(name) ? (
                      <Check className="h-2.5 w-2.5" />
                    ) : (
                      <Plus className="h-2.5 w-2.5 opacity-60" />
                    )}
                    {name}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {canAddCustom && (
            <button
              type="button"
              onClick={() => {
                onAdd(q)
                setQ('')
              }}
              className="mt-1 w-full rounded-md border border-dashed border-border/60 px-2 py-1.5 text-left text-xs text-muted-foreground hover:text-foreground"
            >
              „{q.trim()}“ als eigene Ausstattung hinzufügen
            </button>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
