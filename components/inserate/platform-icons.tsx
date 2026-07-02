/**
 * Shared brand icons + metadata for the export platforms (mobile.de,
 * AutoScout24, TruckScout24). Used by the Inserate overview (expandable cards),
 * the listing detail page and export dialogs.
 */

export const MobileDeIcon = ({ size = 40 }: { size?: number }) => (
  <div className="rounded-2xl flex items-center justify-center shrink-0" style={{ width: size, height: size, background: '#FF6600' }}>
    <svg viewBox="0 0 24 24" style={{ width: size * 0.58, height: size * 0.58 }} fill="white">
      <path d="M18.92 6.01L15 2H9L5.08 6.01C4.4 6.73 4 7.7 4 8.75V19c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8.75c0-1.05-.4-2.02-1.08-2.74zM12 17.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 12.5 12 12.5s2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5zM9.5 7l1.5-3h2l1.5 3h-5z" />
    </svg>
  </div>
)

export const AutoScout24Icon = ({ size = 40 }: { size?: number }) => (
  <div className="rounded-2xl flex items-center justify-center shrink-0" style={{ width: size, height: size, background: '#003F87' }}>
    <svg viewBox="0 0 24 24" style={{ width: size * 0.58, height: size * 0.58 }} fill="none">
      <circle cx="10.5" cy="10" r="6" stroke="white" strokeWidth="2" />
      <line x1="15" y1="14.5" x2="21" y2="20.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M7.5 10.5h6M8.5 8.5l.9-1.5h2.2l.9 1.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9.2" cy="11.8" r="0.9" fill="white" />
      <circle cx="12.8" cy="11.8" r="0.9" fill="white" />
    </svg>
  </div>
)

export const TruckScout24Icon = ({ size = 40 }: { size?: number }) => (
  <div className="rounded-2xl flex items-center justify-center shrink-0" style={{ width: size, height: size, background: '#009C3B' }}>
    <svg viewBox="0 0 24 24" style={{ width: size * 0.58, height: size * 0.58 }} fill="white">
      <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9 1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
    </svg>
  </div>
)

export interface ExportPlatform {
  id: string
  name: string
  description: string
  color: string
  borderColor: string
  bgColor: string
  viewUrl: string
}

export const EXPORT_PLATFORMS: ExportPlatform[] = [
  {
    id: 'mobile_de',
    name: 'mobile.de',
    description: 'Größter deutscher Automarkt',
    color: '#FF6600',
    borderColor: 'border-orange-200 dark:border-orange-800',
    bgColor: 'bg-orange-50 dark:bg-orange-950/30',
    viewUrl: 'https://www.mobile.de',
  },
  {
    id: 'autoscout24',
    name: 'AutoScout24',
    description: 'Europäisches Automarktportal',
    color: '#003F87',
    borderColor: 'border-blue-200 dark:border-blue-900',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    viewUrl: 'https://www.autoscout24.de',
  },
  {
    id: 'truckscout24',
    name: 'TruckScout24',
    description: 'Nutzfahrzeuge & Transporter',
    color: '#009C3B',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    viewUrl: 'https://www.truckscout24.de',
  },
]

export const platformIconById: Record<string, ({ size }: { size?: number }) => React.ReactElement> = {
  mobile_de: MobileDeIcon,
  autoscout24: AutoScout24Icon,
  truckscout24: TruckScout24Icon,
}

/** Is this listing already live on the given platform (per its platform list)?
 *  Normalizes both sides to alphanumerics so "mobile.de" matches id "mobile_de". */
export function listingOnPlatform(platforms: string[], platformId: string): boolean {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
  const target = norm(platformId)
  return platforms.some((pl) => norm(pl).includes(target))
}
