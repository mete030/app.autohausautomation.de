/**
 * Shared mock data + contracts for the new Inserate "Fotos" workflow:
 *   - Daten / Fotos tab split on the listing-creation page
 *   - Autofox-style desktop photo gallery (status + before/after)
 *   - Mobile capture wizard (background → VIN OCR → beauty positions → upload)
 *   - 3-state equipment toggles (DAT = green, manual = yellow, available = white)
 *
 * All assets live in public/inserate-demo/ and are generated via fal.ai
 * (scripts/generate-inserate-foto-assets.mjs). Images that may not exist yet
 * (still generating / failed) carry a `fallback` to a guaranteed existing file;
 * components should wire `onError` to swap in the fallback.
 */

import {
  mercedesListingCreationVinMock as VIN_MOCK,
  mercedesSeriesOptions,
  mercedesExtraOptions,
} from './mercedes-inventory'

const asset = (name: string) => `/inserate-demo/${name}.png`

/**
 * Flip to `true` AFTER running scripts/generate-inserate-foto-assets.mjs with a
 * valid FAL_AI_KEY — then each position shows its bespoke generated image
 * (Seite/Front/Heck angles + real interior shots). Until then we reuse the 5
 * existing GLC exterior images (same vehicle, so it stays consistent) and the
 * gallery / wizard are fully functional with believable before/after.
 */
export const ASSETS_GENERATED = true

// ─── Beauty positions (gallery tiles + mobile capture tiles) ──────────────────

export type PositionGroup = 'exterior' | 'interior'

export interface BeautyPosition {
  /** stable id, also used as the capture key */
  id: string
  /** German label shown on the tile */
  label: string
  group: PositionGroup
  /** raw "as shot" dealership-lot image (the BEFORE / freistellung input) */
  lot: string
  /** clean studio "freigestellt" image (the AFTER) */
  studio: string
  /** faint ghost guide shown as a shooting-angle overlay in the camera step */
  guide: string
  /** line-art alignment overlay (AR guide) shown in the camera + on the tile */
  overlay: string
}

/** (generated lot/studio basenames, existing reuse lot/studio basenames) */
type PosSpec = [id: string, label: string, group: PositionGroup, gen: string, reuse: string]

const POS: PosSpec[] = [
  // Exterior — 8 angles
  // NB: the photo is paired to match each position's /overlays line-art angle.
  // The Autofox "Front-Left" overlay frames a nose-RIGHT car, so `vorne_links`
  // uses the nose-right photo (glc_front_right) and `vorne_rechts` the nose-left
  // one — otherwise the captured shot mirrors the wireframe and looks wrong.
  ['vorne_links', 'Vorne links', 'exterior', 'glc_front_right', 'glc_front_right'],
  ['vorne_rechts', 'Vorne rechts', 'exterior', 'glc_front_left', 'glc_front_left'],
  ['hinten_links', 'Hinten links', 'exterior', 'glc_rear_left', 'glc_rear_left'],
  ['hinten_rechts', 'Hinten rechts', 'exterior', 'glc_rear_right', 'glc_rear_right'],
  ['seite_links', 'Seite links', 'exterior', 'glc_seite_links', 'glc_front_left'],
  ['seite_rechts', 'Seite rechts', 'exterior', 'glc_seite_rechts', 'glc_front_right'],
  ['front', 'Front', 'exterior', 'glc_front', 'glc_front_left'],
  ['heck', 'Heck', 'exterior', 'glc_heck', 'glc_rear_left'],
  // Interior / detail — 6 shots
  ['cockpit', 'Cockpit', 'interior', 'glc_cockpit', 'glc_kofferraum'],
  ['lenkrad', 'Lenkrad & Tacho', 'interior', 'glc_lenkrad', 'glc_kofferraum'],
  ['sitze_vorne', 'Sitze vorne', 'interior', 'glc_sitze_vorne', 'glc_rear_right'],
  ['einstieg_fahrer', 'Einstieg Fahrer', 'interior', 'glc_einstieg_fahrer', 'glc_front_left'],
  ['ruckbank', 'Rückbank', 'interior', 'glc_ruckbank', 'glc_rear_left'],
  ['kofferraum', 'Kofferraum', 'interior', 'glc_kofferraum', 'glc_kofferraum'],
]

export const beautyPositions: BeautyPosition[] = POS.map(([id, label, group, gen, reuse]) => {
  // Interiors have no studio counterpart → studio === lot (freistellung n/a).
  const lotName = ASSETS_GENERATED ? `${gen}_lot` : `${reuse}_lot`
  const studioName = group === 'interior' && ASSETS_GENERATED
    ? `${gen}_lot`
    : ASSETS_GENERATED ? `${gen}_studio` : `${reuse}_studio`
  return {
    id, label, group,
    lot: asset(lotName),
    studio: asset(studioName),
    guide: asset(studioName),
    overlay: `/overlays/${id}.png`,
  }
})

export const POSITION_COUNT = beautyPositions.length

// ─── Mobile capture: background options (Hintergrund wählen) ──────────────────

export interface BackdropOption {
  id: 'standard' | 'smart' | 'mercedes'
  label: string
  hint: string
  /** base studio backdrop image (shared) */
  image: string
  /** brand emblem the component overlays on the backdrop (rendered, not baked) */
  emblem: 'none' | 'smart' | 'mercedes'
}

export const backdropOptions: BackdropOption[] = [
  { id: 'standard', label: 'Autohaus Standard', hint: 'Neutraler Wackenhut-Studiohintergrund', image: asset('wackenhut_backdrop'), emblem: 'none' },
  { id: 'smart', label: 'smart + Logo', hint: 'Studiohintergrund mit smart-Emblem', image: asset('wackenhut_backdrop'), emblem: 'smart' },
  { id: 'mercedes', label: 'Mercedes-Benz + Logo', hint: 'Studiohintergrund mit Stern-Emblem', image: asset('wackenhut_backdrop'), emblem: 'mercedes' },
]

// ─── Mobile capture: recognized VIN (OCR step) ───────────────────────────────

export const CAPTURE_VIN: string = VIN_MOCK.vin // 'W1N2546021F789012'
export const CAPTURE_VEHICLE: string = `${VIN_MOCK.make} ${VIN_MOCK.model}`

/** Realistic German registration document (Fahrzeugschein) for the VIN-scan step. */
export const fahrzeugscheinImg = asset('fahrzeugschein')

// ─── Photo upload / freistellung status machine ──────────────────────────────

export type PhotoStatus = 'pending' | 'uploading' | 'processing' | 'done' | 'error'

export const photoStatusMeta: Record<PhotoStatus, { label: string; tone: 'muted' | 'sky' | 'amber' | 'emerald' | 'red' }> = {
  pending:    { label: 'Bereit',              tone: 'muted' },
  uploading:  { label: 'Wird hochgeladen…',   tone: 'sky' },
  processing: { label: 'Freistellung läuft…', tone: 'amber' },
  done:       { label: 'Fertig',              tone: 'emerald' },
  error:      { label: 'Fehlgeschlagen',      tone: 'red' },
}

/** Tailwind classes per tone — keeps colour usage consistent across components. */
export const toneClasses: Record<'muted' | 'sky' | 'amber' | 'emerald' | 'red', { text: string; bg: string; border: string; dot: string }> = {
  muted:   { text: 'text-muted-foreground',                    bg: 'bg-muted',                              border: 'border-border',                          dot: 'bg-muted-foreground/50' },
  sky:     { text: 'text-sky-700 dark:text-sky-400',           bg: 'bg-sky-50 dark:bg-sky-950/30',          border: 'border-sky-200 dark:border-sky-800',     dot: 'bg-sky-500' },
  amber:   { text: 'text-amber-700 dark:text-amber-400',       bg: 'bg-amber-50 dark:bg-amber-950/30',      border: 'border-amber-200 dark:border-amber-800', dot: 'bg-amber-500' },
  emerald: { text: 'text-emerald-700 dark:text-emerald-400',   bg: 'bg-emerald-50 dark:bg-emerald-950/30',  border: 'border-emerald-200 dark:border-emerald-800', dot: 'bg-emerald-500' },
  red:     { text: 'text-red-600 dark:text-red-400',           bg: 'bg-red-50 dark:bg-red-950/30',          border: 'border-red-200 dark:border-red-800',     dot: 'bg-red-500' },
}

// ─── 3-state equipment model (DAT green / manual yellow / available white) ────

export type EquipmentSource = 'dat' | 'catalog'
export type EquipmentState = 'dat' | 'manual' | 'available'

export interface EquipmentGroup {
  key: 'serie' | 'sonder'
  title: string
  /** full catalog: every DAT item first (source 'dat'), then remaining options */
  items: { name: string; source: EquipmentSource }[]
  /** the subset delivered by DAT (selected & green by default) */
  datItems: string[]
}

function buildGroup(
  key: 'serie' | 'sonder',
  title: string,
  datList: readonly string[],
  catalog: readonly string[],
): EquipmentGroup {
  const datSet = new Set<string>(datList)
  const items: { name: string; source: EquipmentSource }[] = [
    ...datList.map((name) => ({ name, source: 'dat' as const })),
    ...catalog.filter((c) => !datSet.has(c)).map((name) => ({ name, source: 'catalog' as const })),
  ]
  return { key, title, items, datItems: [...datList] }
}

export const equipmentGroups: EquipmentGroup[] = [
  buildGroup('serie', 'Serienausstattung', VIN_MOCK.serienausstattung, mercedesSeriesOptions),
  buildGroup('sonder', 'Sonderausstattung', VIN_MOCK.sonderausstattung, mercedesExtraOptions),
]

/** All DAT-provided equipment names (used to seed the default selection). */
export const datEquipmentNames: string[] = equipmentGroups.flatMap((g) => g.datItems)

/** Resolve the 3-state for a given item, given the current selection set. */
export function equipmentState(name: string, selected: Set<string>, datSet: Set<string>): EquipmentState {
  if (!selected.has(name)) return 'available'
  return datSet.has(name) ? 'dat' : 'manual'
}
