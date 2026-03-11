'use client'

import { Polygon, Marker, Tooltip, Polyline } from 'react-leaflet'
import L from 'leaflet'
import type { YardArea, ParkingSpot } from '@/lib/stores/dealership-store'
import type { LatLng } from '@/lib/yard-geometry'
import { boundsCenter, rotatePoint, LAT_PER_M } from '@/lib/yard-geometry'
import type { Vehicle, VehicleLocation } from '@/lib/types'

// ─── Location colors (same as VehicleMap) ────────────────────────────────────

const LOCATION_CONFIG: Record<VehicleLocation, { color: string; label: string }> = {
  Showroom:  { color: '#3b82f6', label: 'Showroom' },
  'Hof A':   { color: '#22c55e', label: 'Hof A' },
  'Hof B':   { color: '#a855f7', label: 'Hof B' },
  Werkstatt: { color: '#f97316', label: 'Werkstatt' },
  Aufbereitung: { color: '#14b8a6', label: 'Aufbereitung' },
  Fotozone: { color: '#ec4899', label: 'Fotozone' },
  'Externer Lackierer': { color: '#64748b', label: 'Externer Lackierer' },
}

// ─── Icons ───────────────────────────────────────────────────────────────────

function createCornerIcon() {
  return L.divIcon({
    html: `<div style="width:14px;height:14px;background:white;border:2.5px solid #3b82f6;border-radius:3px;box-shadow:0 1px 6px rgba(0,0,0,.35);cursor:grab;"></div>`,
    className: '',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  })
}

function createRotationIcon() {
  return L.divIcon({
    html: `<div style="width:26px;height:26px;background:white;border:2.5px solid #3b82f6;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,.25);cursor:grab;">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
      </svg>
    </div>`,
    className: '',
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  })
}

function createRowLabelIcon(name: string, color: string) {
  return L.divIcon({
    html: `<div style="background:${color};color:white;font-size:9px;font-weight:700;padding:1px 5px;border-radius:4px;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,.2);letter-spacing:0.03em;">${name}</div>`,
    className: '',
    iconSize: [0, 0],
    iconAnchor: [-4, 8],
  })
}

// ─── Component ───────────────────────────────────────────────────────────────

interface AreaPolygonProps {
  area: YardArea
  vehicles: Vehicle[]
  isEditing: boolean
  isSelected: boolean
  assigningSpotId: string | null
  onSpotClick: (spotId: string) => void
  onAreaClick: (areaId: string) => void
  onCornerDrag: (areaId: string, cornerIdx: number, lat: number, lng: number) => void
  onRotationDrag: (areaId: string, lat: number, lng: number) => void
}

export default function AreaPolygon({
  area,
  vehicles,
  isEditing,
  isSelected,
  assigningSpotId,
  onSpotClick,
  onAreaClick,
  onCornerDrag,
  onRotationDrag,
}: AreaPolygonProps) {
  const center = boundsCenter(area.baseBounds)

  // Rotation handle position: offset above center by ~15m (rotated)
  const handleOffsetM = 15
  const handleLocal: LatLng = [center[0] + handleOffsetM * LAT_PER_M, center[1]]
  const handlePos = rotatePoint(handleLocal, center, area.rotationDeg)

  const totalSpots = area.rows.reduce((sum, r) => sum + r.spots.filter(s => !s.disabled).length, 0)
  const occupiedSpots = area.rows.reduce((sum, r) => sum + r.spots.filter(s => s.vehicleId && !s.disabled).length, 0)

  return (
    <>
      {/* Area boundary polygon */}
      <Polygon
        positions={area.polygon}
        pathOptions={{
          color: area.color,
          fillColor: area.color,
          fillOpacity: isSelected || isEditing ? 0.12 : 0.06,
          weight: isSelected || isEditing ? 2.5 : 1.5,
          dashArray: isEditing ? '8,4' : '',
        }}
        eventHandlers={{
          click: (e) => {
            L.DomEvent.stopPropagation(e)
            onAreaClick(area.id)
          },
        }}
      >
        <Tooltip sticky direction="top" offset={[0, -8]}>
          <div className="text-xs">
            <strong>{area.name}</strong>
            <br />
            <span className="text-zinc-500">{occupiedSpots} / {totalSpots} belegt</span>
          </div>
        </Tooltip>
      </Polygon>

      {/* Row labels */}
      {area.rows.map(row => {
        if (row.spots.length === 0) return null
        // Place label at the first spot's SW corner (first corner)
        const labelPos = row.spots[0].corners[0]
        return (
          <Marker
            key={`label-${row.id}`}
            position={labelPos}
            icon={createRowLabelIcon(row.name, area.color)}
            interactive={false}
          />
        )
      })}

      {/* Individual spots */}
      {area.rows.flatMap(row =>
        row.spots.map(spot => {
          const vehicle = spot.vehicleId
            ? vehicles.find(v => v.id === spot.vehicleId) ?? null
            : null
          const isDisabled = spot.disabled
          const isAssigning = assigningSpotId === spot.id

          const color = isDisabled
            ? '#ef4444'
            : vehicle ? LOCATION_CONFIG[vehicle.location].color : '#94a3b8'

          return (
            <Polygon
              key={spot.id}
              positions={spot.corners}
              pathOptions={{
                color: isAssigning ? '#3b82f6' : color,
                fillColor: isDisabled
                  ? '#fee2e2'
                  : isAssigning ? '#bfdbfe'
                  : vehicle ? color : '#f8fafc',
                fillOpacity: isDisabled ? 0.5 : vehicle ? 0.5 : (isAssigning ? 0.5 : 0.2),
                weight: isAssigning ? 2 : (isDisabled ? 1.2 : 0.8),
                dashArray: isDisabled ? '5,3' : (vehicle || isAssigning ? '' : '3,2'),
              }}
              eventHandlers={{
                click: (e) => {
                  L.DomEvent.stopPropagation(e)
                  onSpotClick(spot.id)
                },
              }}
            >
              <Tooltip sticky direction="top" offset={[0, -4]}>
                <div className="text-xs">
                  {isDisabled
                    ? <span className="text-red-500">Platz {spot.index} · Deaktiviert{isEditing ? ' (Klick zum Aktivieren)' : ''}</span>
                    : vehicle
                    ? <><strong>{vehicle.make} {vehicle.model}</strong><br />{vehicle.licensePlate}</>
                    : <span className="text-zinc-500">Platz {spot.index} · Frei{isEditing ? ' (Klick zum Deaktivieren)' : ''}</span>
                  }
                </div>
              </Tooltip>
            </Polygon>
          )
        }),
      )}

      {/* Edit mode: corner drag handles + rotation handle */}
      {isEditing && (
        <>
          {area.polygon.map((pos, idx) => (
            <Marker
              key={`corner-${area.id}-${idx}`}
              position={pos}
              icon={createCornerIcon()}
              draggable
              eventHandlers={{
                dragend(e) {
                  const { lat, lng } = e.target.getLatLng()
                  onCornerDrag(area.id, idx, lat, lng)
                },
              }}
            />
          ))}

          {/* Line from center to rotation handle */}
          <Polyline
            positions={[center, handlePos]}
            pathOptions={{ color: '#3b82f6', weight: 1.5, dashArray: '4,4', opacity: 0.5 }}
          />

          {/* Rotation handle */}
          <Marker
            position={handlePos}
            icon={createRotationIcon()}
            draggable
            eventHandlers={{
              dragend(e) {
                const { lat, lng } = e.target.getLatLng()
                onRotationDrag(area.id, lat, lng)
              },
            }}
          />
        </>
      )}
    </>
  )
}
