'use client'

import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { VehicleLocation } from '@/lib/types'

const DEALERSHIP_CENTER: [number, number] = [48.7758, 9.1829]

const LOCATION_COORDS: Record<VehicleLocation, [number, number]> = {
  Showroom:  [48.77620, 9.18290],
  'Hof A':   [48.77570, 9.18225],
  'Hof B':   [48.77570, 9.18360],
  Werkstatt: [48.77520, 9.18290],
  Aufbereitung: [48.77595, 9.18305],
  Fotozone: [48.77602, 9.18245],
  'Externer Lackierer': [48.77510, 9.18420],
}

const LOCATION_COLORS: Record<VehicleLocation, string> = {
  Showroom:  '#3b82f6',
  'Hof A':   '#22c55e',
  'Hof B':   '#a855f7',
  Werkstatt: '#f97316',
  Aufbereitung: '#14b8a6',
  Fotozone: '#ec4899',
  'Externer Lackierer': '#64748b',
}

function createMiniZoneIcon(loc: VehicleLocation, active: boolean) {
  const color = LOCATION_COLORS[loc]
  const size = active ? 48 : 36
  const glow = active ? `, 0 0 0 4px ${color}44` : ''
  return L.divIcon({
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${active ? color : 'rgba(255,255,255,0.85)'};
      border:2.5px solid ${color};
      border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      box-shadow:0 2px 10px rgba(0,0,0,.3)${glow};
    ">
      ${active
        ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M3 12l2-5h14l2 5" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/>
            <rect x="2" y="12" width="20" height="6" rx="2" fill="#fff" fill-opacity=".2" stroke="#fff" stroke-width="1.5"/>
            <circle cx="7" cy="18" r="1.8" fill="#fff"/>
            <circle cx="17" cy="18" r="1.8" fill="#fff"/>
          </svg>`
        : `<div style="width:8px;height:8px;border-radius:50%;background:${color}"></div>`
      }
    </div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

export default function MiniVehicleMap({ location }: { location: VehicleLocation }) {
  return (
    <MapContainer
      center={DEALERSHIP_CENTER}
      zoom={17}
      className="h-full w-full"
      zoomControl={false}
      scrollWheelZoom={false}
      dragging={false}
      doubleClickZoom={false}
      attributionControl={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxNativeZoom={19}
        maxZoom={22}
      />
      {(Object.keys(LOCATION_COORDS) as VehicleLocation[]).map(loc => (
        <Marker
          key={loc}
          position={LOCATION_COORDS[loc]}
          icon={createMiniZoneIcon(loc, loc === location)}
        />
      ))}
    </MapContainer>
  )
}
