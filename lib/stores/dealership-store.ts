import { create } from 'zustand'
import {
  type LatLng,
  type AxisAlignedBounds,
  type SpotParams,
  type SpotSpec,
  DEFAULT_SPOT_PARAMS,
  computePolygon,
  autoGenerateRows,
  generateRowSpots,
  boundsCenter,
} from '@/lib/yard-geometry'

// Re-export for consumers
export { DEFAULT_SPOT_PARAMS }
export type { SpotParams, LatLng, AxisAlignedBounds }

// ─── Area colors ─────────────────────────────────────────────────────────────

const AREA_COLORS = [
  '#3b82f6', '#22c55e', '#a855f7', '#f97316',
  '#14b8a6', '#ec4899', '#eab308', '#64748b',
]

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ParkingSpot {
  id: string
  index: number
  corners: [LatLng, LatLng, LatLng, LatLng]
  vehicleId: string | null
  disabled: boolean
}

export interface YardRow {
  id: string
  name: string
  offsetY: number
  spots: ParkingSpot[]
}

export interface YardArea {
  id: string
  name: string
  baseBounds: AxisAlignedBounds
  rotationDeg: number
  polygon: [LatLng, LatLng, LatLng, LatLng]
  spotParams: SpotParams
  rows: YardRow[]
  color: string
}

export interface DealershipConfig {
  isConfigured: boolean
  address: string
  center: LatLng
  areas: YardArea[]
}

interface DealershipStore extends DealershipConfig {
  // Setup
  configure: (address: string, center: LatLng) => void
  reset: () => void

  // Area CRUD
  addArea: (baseBounds: AxisAlignedBounds, name?: string) => string
  removeArea: (areaId: string) => void
  updateAreaBounds: (areaId: string, baseBounds: AxisAlignedBounds) => void
  updateAreaRotation: (areaId: string, rotationDeg: number) => void
  renameArea: (areaId: string, name: string) => void
  updateAreaSpotParams: (areaId: string, params: Partial<SpotParams>) => void

  // Row CRUD
  addRow: (areaId: string, name?: string) => void
  removeRow: (areaId: string, rowId: string) => void
  renameRow: (areaId: string, rowId: string, name: string) => void

  // Spot operations
  assignVehicle: (spotId: string, vehicleId: string | null) => void
  toggleSpot: (spotId: string) => void

  // Derived
  getAllSpots: () => ParkingSpot[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

let areaCounter = 0

function nextAreaId(): string {
  return `area-${Date.now()}-${(areaCounter++).toString(36)}`
}

function areaLetter(index: number): string {
  return String.fromCharCode(65 + (index % 26))
}

/** Rebuild spots for all rows in an area, preserving vehicle assignments. */
function rebuildAreaSpots(area: YardArea): YardArea {
  const oldSpotMap = new Map<string, { vehicleId: string | null; disabled: boolean }>()
  for (const row of area.rows) {
    for (const spot of row.spots) {
      oldSpotMap.set(spot.id, { vehicleId: spot.vehicleId, disabled: spot.disabled })
    }
  }

  const polygon = computePolygon(area.baseBounds, area.rotationDeg)
  const rows: YardRow[] = area.rows.map(row => {
    const specs: SpotSpec[] = generateRowSpots(area.baseBounds, area.rotationDeg, area.spotParams, row)
    const spots: ParkingSpot[] = specs.map(s => {
      const old = oldSpotMap.get(s.id)
      return {
        ...s,
        vehicleId: old?.vehicleId ?? null,
        disabled: old?.disabled ?? false,
      }
    })
    return { ...row, spots }
  })

  return { ...area, polygon, rows }
}

// ─── Store ────────────────────────────────────────────────────────────────────

const INITIAL: DealershipConfig = {
  isConfigured: false,
  address: '',
  center: [48.7758, 9.1829],
  areas: [],
}

export const useDealershipStore = create<DealershipStore>((set, get) => ({
  ...INITIAL,

  configure(address, center) {
    set({ isConfigured: true, address, center })
  },

  reset() {
    set({ ...INITIAL })
  },

  // ── Area CRUD ──────────────────────────────────────────────────────────

  addArea(baseBounds, name) {
    const state = get()
    const id = nextAreaId()
    const colorIdx = state.areas.length
    const areaName = name ?? `Bereich ${areaLetter(colorIdx)}`
    const params = DEFAULT_SPOT_PARAMS

    const rowSpecs = autoGenerateRows(id, baseBounds, params)
    const skeleton: YardArea = {
      id,
      name: areaName,
      baseBounds,
      rotationDeg: 0,
      polygon: computePolygon(baseBounds, 0),
      spotParams: params,
      rows: rowSpecs.map(r => ({ ...r, spots: [] })),
      color: AREA_COLORS[colorIdx % AREA_COLORS.length],
    }
    const area = rebuildAreaSpots(skeleton)

    set({
      isConfigured: true,
      areas: [...state.areas, area],
    })
    return id
  },

  removeArea(areaId) {
    set(state => ({
      areas: state.areas.filter(a => a.id !== areaId),
    }))
  },

  updateAreaBounds(areaId, baseBounds) {
    set(state => ({
      areas: state.areas.map(a => {
        if (a.id !== areaId) return a
        // Regenerate rows for new dimensions
        const rowSpecs = autoGenerateRows(areaId, baseBounds, a.spotParams)
        const rows: YardRow[] = rowSpecs.map((rs, i) => {
          const existingRow = a.rows[i]
          return existingRow
            ? { ...existingRow, offsetY: rs.offsetY, id: rs.id }
            : { ...rs, spots: [] }
        })
        return rebuildAreaSpots({ ...a, baseBounds, rows })
      }),
    }))
  },

  updateAreaRotation(areaId, rotationDeg) {
    set(state => ({
      areas: state.areas.map(a => {
        if (a.id !== areaId) return a
        return rebuildAreaSpots({ ...a, rotationDeg })
      }),
    }))
  },

  renameArea(areaId, name) {
    set(state => ({
      areas: state.areas.map(a => a.id === areaId ? { ...a, name } : a),
    }))
  },

  updateAreaSpotParams(areaId, params) {
    set(state => ({
      areas: state.areas.map(a => {
        if (a.id !== areaId) return a
        const merged = { ...a.spotParams, ...params }
        const rowSpecs = autoGenerateRows(areaId, a.baseBounds, merged)
        const rows: YardRow[] = rowSpecs.map((rs, i) => {
          const existingRow = a.rows[i]
          return existingRow
            ? { ...existingRow, offsetY: rs.offsetY, id: rs.id, name: existingRow.name }
            : { ...rs, spots: [] }
        })
        return rebuildAreaSpots({ ...a, spotParams: merged, rows })
      }),
    }))
  },

  // ── Row CRUD ───────────────────────────────────────────────────────────

  addRow(areaId, name) {
    set(state => ({
      areas: state.areas.map(a => {
        if (a.id !== areaId) return a
        const lastRow = a.rows[a.rows.length - 1]
        const offsetY = lastRow
          ? lastRow.offsetY + a.spotParams.spotD + a.spotParams.lane
          : 2.0
        const rowId = `${areaId}_row-${a.rows.length}`
        const newRow: YardRow = {
          id: rowId,
          name: name ?? `Reihe ${a.rows.length + 1}`,
          offsetY,
          spots: [],
        }
        return rebuildAreaSpots({ ...a, rows: [...a.rows, newRow] })
      }),
    }))
  },

  removeRow(areaId, rowId) {
    set(state => ({
      areas: state.areas.map(a => {
        if (a.id !== areaId) return a
        return rebuildAreaSpots({ ...a, rows: a.rows.filter(r => r.id !== rowId) })
      }),
    }))
  },

  renameRow(areaId, rowId, name) {
    set(state => ({
      areas: state.areas.map(a => {
        if (a.id !== areaId) return a
        return {
          ...a,
          rows: a.rows.map(r => r.id === rowId ? { ...r, name } : r),
        }
      }),
    }))
  },

  // ── Spot operations ────────────────────────────────────────────────────

  assignVehicle(spotId, vehicleId) {
    set(state => ({
      areas: state.areas.map(a => ({
        ...a,
        rows: a.rows.map(r => ({
          ...r,
          spots: r.spots.map(s => {
            // Unassign from other spots first
            if (vehicleId && s.vehicleId === vehicleId && s.id !== spotId) {
              return { ...s, vehicleId: null }
            }
            if (s.id === spotId) return { ...s, vehicleId }
            return s
          }),
        })),
      })),
    }))
  },

  toggleSpot(spotId) {
    set(state => ({
      areas: state.areas.map(a => ({
        ...a,
        rows: a.rows.map(r => ({
          ...r,
          spots: r.spots.map(s =>
            s.id === spotId
              ? { ...s, disabled: !s.disabled, vehicleId: s.disabled ? s.vehicleId : null }
              : s,
          ),
        })),
      })),
    }))
  },

  // ── Derived ────────────────────────────────────────────────────────────

  getAllSpots() {
    return get().areas.flatMap(a => a.rows.flatMap(r => r.spots))
  },
}))
