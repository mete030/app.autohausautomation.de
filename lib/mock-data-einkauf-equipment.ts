// ─────────────────────────────────────────────────────────────────────────────
// Ausstattungs-Kataloge für den Einkauf-Picker (EquipmentPicker).
// Einkauf-lokal — KEIN Import aus lib/inserate-*. Die flache Suchliste für PKW
// stützt sich auf die zentrale MB-Extra-Liste (mercedes-inventory), die Nutz-
// fahrzeug-Nische (Kühlkoffer etc.) ist hier eigenständig gepflegt.
// ─────────────────────────────────────────────────────────────────────────────

import { mercedesExtraOptions } from '@/lib/mercedes-inventory'
import type { EquipmentCatalog } from '@/app/(dashboard)/einkauf/_components/EquipmentPicker'

export const pkwEquipmentCatalog: EquipmentCatalog = [
  { title: 'Optikpakete', items: ['AMG Line Exterieur', 'AMG Line Interieur', 'Night-Paket', 'Progressive', 'Avantgarde'] },
  {
    title: 'Komfort',
    items: [
      'Panorama-Schiebedach',
      'AIRMATIC Luftfederung',
      'Sitzheizung vorne',
      'Belüftete Sitze',
      'Massagesitze',
      'Memory-Paket',
      'Keyless-Go Komfort-Paket',
      'Standheizung',
      'Ambientebeleuchtung',
    ],
  },
  {
    title: 'Infotainment',
    items: [
      'MBUX Navigation Premium',
      'Burmester 3D-Surround-Soundsystem',
      'Head-up-Display',
      'MBUX Augmented Reality',
      'DAB+ Digitalradio',
      'Apple CarPlay / Android Auto',
    ],
  },
  {
    title: 'Assistenz & Sicherheit',
    items: [
      'Fahrassistenz-Paket Plus',
      '360-Grad-Kamera',
      'DISTRONIC',
      'Spurhalte-Assistent',
      'Totwinkel-Assistent',
      'Park-Assistent mit PARKTRONIC',
    ],
  },
  { title: 'Sonstiges', items: ['Anhängerkupplung schwenkbar', 'Lederausstattung ARTICO/Dinamica', 'DIGITAL LIGHT'] },
]

export const transporterEquipmentCatalog: EquipmentCatalog = [
  {
    title: 'Aufbau & Kühlung',
    items: [
      'Kühlkoffer 0–8 °C (FRC)',
      'Tiefkühlaufbau',
      'Standkühlung 230 V',
      'Isolierung verstärkt',
      'Trennwand mit Fenster',
      'Holzboden Laderaum',
    ],
  },
  { title: 'Fahrwerk & Zug', items: ['Luftfederung Hinterachse', 'Anhängerkupplung 3,5 t'] },
  {
    title: 'Komfort & Technik',
    items: ['Klimaautomatik', 'Standheizung', 'MBUX 10,25"', 'Rückfahrkamera', 'Tempomat', 'Park-Assistent mit PARKTRONIC'],
  },
  { title: 'Sitze & Kabine', items: ['Komfortsitze', 'Sitzheizung'] },
]

export const pkwExtraFlat: readonly string[] = mercedesExtraOptions
export const transporterExtraFlat: readonly string[] = transporterEquipmentCatalog.flatMap((g) => g.items)
