import {
  LayoutDashboard,
  Car,
  Phone,
  FileText,
  ReceiptText,
  MessageSquare,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  title: string
  href: string
  icon: LucideIcon
  badge?: number
  children?: { title: string; href: string }[]
}

export const navigation: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Fahrzeuge',
    href: '/fahrzeuge',
    icon: Car,
    children: [
      { title: 'Inventar', href: '/fahrzeuge' },
      { title: 'Werkstatt', href: '/fahrzeuge/werkstatt' },
    ],
  },
  {
    title: 'Callcenter',
    href: '/callcenter',
    icon: Phone,
  },
  {
    title: 'Inserate',
    href: '/inserate',
    icon: FileText,
    children: [
      { title: 'Übersicht', href: '/inserate' },
      { title: 'Neues Inserat', href: '/inserate/neu' },
    ],
  },
  {
    title: 'Buchhaltung',
    href: '/buchhaltung',
    icon: ReceiptText,
    children: [
      { title: 'Übersicht', href: '/buchhaltung' },
      { title: 'Eingangsrechnungen', href: '/buchhaltung?tab=eingang' },
      { title: 'Ausgangsrechnungen', href: '/buchhaltung?tab=ausgang' },
      { title: 'Steuerberater', href: '/buchhaltung?tab=steuerberater' },
    ],
  },
  {
    title: 'Nachrichten',
    href: '/nachrichten',
    icon: MessageSquare,
  },
  {
    title: 'Verifizierung',
    href: '/verifizierung',
    icon: ShieldCheck,
  },
]

export const escalationColors = {
  green: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', label: 'Im Plan' },
  yellow: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', label: 'Achtung' },
  red: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', label: 'Dringend' },
  darkred: { bg: 'bg-red-200 dark:bg-red-900/50', text: 'text-red-900 dark:text-red-300', label: 'Überfällig' },
} as const

export const channelConfig = {
  whatsapp:  { label: 'WhatsApp',  color: 'bg-[#25D366]',  textColor: 'text-white' },
  email:     { label: 'E-Mail',    color: 'bg-blue-500',   textColor: 'text-white' },
  sms:       { label: 'SMS',       color: 'bg-purple-500', textColor: 'text-white' },
  mobile_de: { label: 'mobile.de', color: 'bg-orange-500', textColor: 'text-white' },
  messenger: { label: 'Messenger', color: 'bg-[#0084FF]',  textColor: 'text-white' },
  instagram: { label: 'Instagram', color: 'bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF]', textColor: 'text-white' },
  telegram:  { label: 'Telegram',  color: 'bg-[#26A5E4]',  textColor: 'text-white' },
} as const

export const priceCategoryConfig = {
  sehr_gut: { label: 'Sehr gut', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  gut: { label: 'Gut', color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
  zufriedenstellend: { label: 'Zufriedenstellend', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  erhoht: { label: 'Erhöht', color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20' },
  stark_erhoht: { label: 'Stark erhöht', color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
} as const

export const kycStatusConfig = {
  eingereicht: { label: 'Eingereicht', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  in_pruefung: { label: 'In Prüfung', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
  verifiziert: { label: 'Verifiziert', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' },
  abgelehnt: { label: 'Abgelehnt', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  manuell_pruefen: { label: 'Manuell prüfen', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
} as const
