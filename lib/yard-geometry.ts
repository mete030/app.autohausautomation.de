// ─── Yard Geometry Utilities ──────────────────────────────────────────────────
// Pure functions for coordinate math: rotation, polygon computation, spot generation.

export type LatLng = [number, number]
export type AxisAlignedBounds = [LatLng, LatLng] // [SW, NE]

export interface SpotParams {
  spotW: number // spot width in meters (default 2.5)
  spotD: number // spot depth in meters (default 5.0)
  lane:  number // lane width in meters (default 6.0)
}

export const DEFAULT_SPOT_PARAMS: SpotParams = { spotW: 2.5, spotD: 5.0, lane: 6.0 }

export const LAT_PER_M = 1 / 111_139

export function lngPerM(lat: number): number {
  return 1 / (111_139 * Math.cos(lat * (Math.PI / 180)))
}

// ─── Rotation ────────────────────────────────────────────────────────────────

/** Rotate a point around a center by `deg` degrees clockwise. */
export function rotatePoint(
  point: LatLng,
  center: LatLng,
  deg: number,
): LatLng {
  if (deg === 0) return point
  const rad = (deg * Math.PI) / 180
  const cosA = Math.cos(rad)
  const sinA = Math.sin(rad)
  const dLat = point[0] - center[0]
  const dLng = point[1] - center[1]
  return [
    center[0] + dLat * cosA - dLng * sinA,
    center[1] + dLat * sinA + dLng * cosA,
  ]
}

/** Compute 4 rotated corner points from axis-aligned bounds + rotation angle. */
export function computePolygon(
  baseBounds: AxisAlignedBounds,
  rotationDeg: number,
): [LatLng, LatLng, LatLng, LatLng] {
  const [[swLat, swLng], [neLat, neLng]] = baseBounds
  const center: LatLng = [(swLat + neLat) / 2, (swLng + neLng) / 2]
  const sw: LatLng = [swLat, swLng]
  const nw: LatLng = [neLat, swLng]
  const ne: LatLng = [neLat, neLng]
  const se: LatLng = [swLat, neLng]
  return [
    rotatePoint(sw, center, rotationDeg),
    rotatePoint(nw, center, rotationDeg),
    rotatePoint(ne, center, rotationDeg),
    rotatePoint(se, center, rotationDeg),
  ]
}

/** Get center of axis-aligned bounds. */
export function boundsCenter(bounds: AxisAlignedBounds): LatLng {
  return [
    (bounds[0][0] + bounds[1][0]) / 2,
    (bounds[0][1] + bounds[1][1]) / 2,
  ]
}

/** Compute dimensions of bounds in meters. */
export function boundsDimensionsM(bounds: AxisAlignedBounds): { widthM: number; heightM: number; areaM2: number } {
  const [[swLat, swLng], [neLat, neLng]] = bounds
  const avgLat = (swLat + neLat) / 2
  const widthM = (neLng - swLng) / lngPerM(avgLat)
  const heightM = (neLat - swLat) / LAT_PER_M
  return { widthM, heightM, areaM2: Math.round(widthM * heightM) }
}

// ─── Angle ───────────────────────────────────────────────────────────────────

/** Compute the angle (degrees, clockwise from north) from center to a target point. */
export function angleBetween(center: LatLng, point: LatLng): number {
  const dLat = point[0] - center[0]
  const dLng = point[1] - center[1]
  const rad = Math.atan2(dLng, dLat)
  const deg = (rad * 180) / Math.PI
  return ((deg % 360) + 360) % 360
}

// ─── Row / Spot generation ───────────────────────────────────────────────────

export interface RowSpec {
  id: string
  name: string
  offsetY: number
}

export interface SpotSpec {
  id: string
  index: number
  corners: [LatLng, LatLng, LatLng, LatLng]
}

const BORDER = 2.0

/**
 * Auto-generate row specs for an area based on its dimensions and spotParams.
 * Uses 2-row blocks separated by lanes (same logic as the previous system).
 */
export function autoGenerateRows(
  areaId: string,
  baseBounds: AxisAlignedBounds,
  params: SpotParams = DEFAULT_SPOT_PARAMS,
): RowSpec[] {
  const { heightM } = boundsDimensionsM(baseBounds)
  const { spotD, lane } = params
  const BLOCK_H = spotD * 2 + lane
  const availH = heightM - 2 * BORDER

  if (availH < spotD) return []

  const blocks = Math.floor(availH / BLOCK_H)
  const rows: RowSpec[] = []

  for (let b = 0; b < blocks; b++) {
    for (let rowInBlock = 0; rowInBlock < 2; rowInBlock++) {
      const offsetY = BORDER + b * BLOCK_H + (rowInBlock === 0 ? 0 : spotD + lane)
      rows.push({
        id: `${areaId}_row-${rows.length}`,
        name: `Reihe ${rows.length + 1}`,
        offsetY,
      })
    }
  }
  return rows
}

/**
 * Generate spot specs for a single row within an area.
 * Computes spot corners in local (unrotated) coordinates, then rotates them.
 */
export function generateRowSpots(
  baseBounds: AxisAlignedBounds,
  rotationDeg: number,
  params: SpotParams,
  row: RowSpec,
): SpotSpec[] {
  const [[swLat, swLng], [neLat, neLng]] = baseBounds
  const avgLat = (swLat + neLat) / 2
  const widthM = (neLng - swLng) / lngPerM(avgLat)
  const { spotW, spotD } = params
  const availW = widthM - 2 * BORDER

  if (availW < spotW) return []

  const cols = Math.floor(availW / spotW)
  const center = boundsCenter(baseBounds)
  const spots: SpotSpec[] = []

  for (let c = 0; c < cols; c++) {
    // Local (unrotated) spot corners
    const localSW: LatLng = [
      swLat + row.offsetY * LAT_PER_M,
      swLng + (BORDER + c * spotW) * lngPerM(avgLat),
    ]
    const localNW: LatLng = [
      swLat + (row.offsetY + spotD) * LAT_PER_M,
      swLng + (BORDER + c * spotW) * lngPerM(avgLat),
    ]
    const localNE: LatLng = [
      swLat + (row.offsetY + spotD) * LAT_PER_M,
      swLng + (BORDER + (c + 1) * spotW) * lngPerM(avgLat),
    ]
    const localSE: LatLng = [
      swLat + row.offsetY * LAT_PER_M,
      swLng + (BORDER + (c + 1) * spotW) * lngPerM(avgLat),
    ]

    spots.push({
      id: `${row.id}_spot-${c}`,
      index: c + 1,
      corners: [
        rotatePoint(localSW, center, rotationDeg),
        rotatePoint(localNW, center, rotationDeg),
        rotatePoint(localNE, center, rotationDeg),
        rotatePoint(localSE, center, rotationDeg),
      ],
    })
  }
  return spots
}
