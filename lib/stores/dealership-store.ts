import { create } from 'zustand'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SpotParams {
  spotW: number   // spot width  in meters (default 2.5)
  spotD: number   // spot depth  in meters (default 5.0)
  lane:  number   // lane width  in meters (default 6.0)
}

export const DEFAULT_SPOT_PARAMS: SpotParams = { spotW: 2.5, spotD: 5.0, lane: 6.0 }

export interface ParkingSpot {
  id: string
  index: number                                   // human-readable "Platz X"
  bounds: [[number, number], [number, number]]    // [SW, NE] in [lat, lng]
  vehicleId: string | null
  disabled: boolean                               // user-toggled off
}

export interface DealershipConfig {
  isConfigured: boolean
  address: string
  center: [number, number]
  lotBounds: [[number, number], [number, number]]
  areaM2: number
  spots: ParkingSpot[]
  spotParams: SpotParams
}

interface DealershipStore extends DealershipConfig {
  configure: (
    address: string,
    center: [number, number],
    bounds: [[number, number], [number, number]],
    maxSpots?: number,
    params?: SpotParams,
  ) => void
  updateLot: (
    bounds: [[number, number], [number, number]],
    params?: SpotParams,
    maxSpots?: number,
  ) => void
  assignVehicle: (spotId: string, vehicleId: string | null) => void
  toggleSpot:   (spotId: string) => void
  reset: () => void
}

// ─── Spot generation ──────────────────────────────────────────────────────────

export function generateSpots(
  sw: [number, number],
  ne: [number, number],
  params: SpotParams = DEFAULT_SPOT_PARAMS,
): { spots: Omit<ParkingSpot, 'vehicleId' | 'disabled'>[]; areaM2: number } {
  const [swLat, swLng] = sw
  const [neLat, neLng] = ne
  const avgLat = (swLat + neLat) / 2

  const LAT_PER_M = 1 / 111_139
  const LNG_PER_M = 1 / (111_139 * Math.cos(avgLat * (Math.PI / 180)))

  const widthM  = (neLng - swLng) / LNG_PER_M
  const heightM = (neLat - swLat) / LAT_PER_M
  const areaM2  = Math.round(widthM * heightM)

  const BORDER  = 2.0
  const BLOCK_H = params.spotD * 2 + params.lane

  const availW = widthM  - 2 * BORDER
  const availH = heightM - 2 * BORDER

  if (availW < params.spotW || availH < params.spotD) return { spots: [], areaM2 }

  const cols   = Math.floor(availW / params.spotW)
  const blocks = Math.floor(availH / BLOCK_H)
  const spots: Omit<ParkingSpot, 'vehicleId' | 'disabled'>[] = []
  let idx = 0

  for (let b = 0; b < blocks; b++) {
    for (let rowInBlock = 0; rowInBlock < 2; rowInBlock++) {
      const rowLatOffsetM = BORDER + b * BLOCK_H + (rowInBlock === 0 ? 0 : params.spotD + params.lane)
      for (let c = 0; c < cols; c++) {
        const spotSwLat = swLat + rowLatOffsetM              * LAT_PER_M
        const spotNeLat = swLat + (rowLatOffsetM + params.spotD) * LAT_PER_M
        const spotSwLng = swLng + (BORDER + c * params.spotW)            * LNG_PER_M
        const spotNeLng = swLng + (BORDER + c * params.spotW + params.spotW) * LNG_PER_M
        spots.push({ id: `spot-${idx}`, index: idx + 1, bounds: [[spotSwLat, spotSwLng], [spotNeLat, spotNeLng]] })
        idx++
      }
    }
  }

  return { spots, areaM2 }
}

// ─── Store ────────────────────────────────────────────────────────────────────

const INITIAL: DealershipConfig = {
  isConfigured: false,
  address:    '',
  center:     [48.7758, 9.1829],
  lotBounds:  [[48.7750, 9.1820], [48.7766, 9.1838]],
  areaM2:     0,
  spots:      [],
  spotParams: DEFAULT_SPOT_PARAMS,
}

export const useDealershipStore = create<DealershipStore>((set, get) => ({
  ...INITIAL,

  configure(address, center, bounds, maxSpots, params = DEFAULT_SPOT_PARAMS) {
    const { spots: raw, areaM2 } = generateSpots(bounds[0], bounds[1], params)
    const limited = maxSpots ? raw.slice(0, maxSpots) : raw
    const spots: ParkingSpot[] = limited.map(s => ({ ...s, vehicleId: null, disabled: false }))
    set({ isConfigured: true, address, center, lotBounds: bounds, spots, areaM2, spotParams: params })
  },

  updateLot(bounds, params, maxSpots) {
    const p = params ?? get().spotParams
    const { spots: raw, areaM2 } = generateSpots(bounds[0], bounds[1], p)
    const limited = maxSpots ? raw.slice(0, maxSpots) : raw
    const oldSpots = get().spots

    // Preserve vehicleId + disabled state for matching index
    const spots: ParkingSpot[] = limited.map((s, i) => ({
      ...s,
      vehicleId: oldSpots[i]?.vehicleId ?? null,
      disabled:  oldSpots[i]?.disabled  ?? false,
    }))
    set({ lotBounds: bounds, areaM2, spots, spotParams: p, isConfigured: true })
  },

  assignVehicle(spotId, vehicleId) {
    set(state => ({
      spots: state.spots.map(s => {
        if (vehicleId && s.vehicleId === vehicleId && s.id !== spotId) return { ...s, vehicleId: null }
        if (s.id === spotId) return { ...s, vehicleId }
        return s
      }),
    }))
  },

  toggleSpot(spotId) {
    set(state => ({
      spots: state.spots.map(s =>
        s.id === spotId ? { ...s, disabled: !s.disabled, vehicleId: s.disabled ? s.vehicleId : null } : s
      ),
    }))
  },

  reset() {
    set({ ...INITIAL })
  },
}))
