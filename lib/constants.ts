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
import type { CallAgent } from '@/lib/types'

export interface NavItem {
  title: string
  href: string
  icon: LucideIcon
  badge?: number
  children?: { title: string; href: string }[]
}

export const featureVisibility = {
  buchhaltung: false,
} as const

export const navigation: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Fahrzeuge',
    href: '/fahrzeuge/hofsteuerung',
    icon: Car,
    children: [
      { title: 'Hofsteuerung', href: '/fahrzeuge/hofsteuerung' },
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
  ...(featureVisibility.buchhaltung
    ? [{
        title: 'Buchhaltung',
        href: '/buchhaltung',
        icon: ReceiptText,
        children: [
          { title: 'Übersicht', href: '/buchhaltung' },
          { title: 'Eingangsrechnungen', href: '/buchhaltung?tab=eingang' },
          { title: 'Ausgangsrechnungen', href: '/buchhaltung?tab=ausgang' },
          { title: 'Steuerberater', href: '/buchhaltung?tab=steuerberater' },
        ],
      }]
    : []),
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

export const kycDocumentStatusConfig = {
  nicht_eingereicht: { label: 'Ausstehend', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  hochgeladen: { label: 'Hochgeladen', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  wird_geprueft: { label: 'Wird geprüft', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  verifiziert: { label: 'Verifiziert', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  abgelehnt: { label: 'Abgelehnt', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  manuell_pruefen: { label: 'Manuell prüfen', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
} as const

// ---- Callcenter Admin ----

export const callSourceConfig = {
  telefon:  { label: 'Telefon',  color: 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400' },
  website:  { label: 'Website',  color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400' },
  whatsapp: { label: 'WhatsApp', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' },
  ki_agent: { label: 'KI-Agent', color: 'bg-violet-100 text-violet-700 dark:bg-violet-950/30 dark:text-violet-400' },
  manuell:  { label: 'Manuell',  color: 'bg-gray-100 text-gray-700 dark:bg-gray-800/40 dark:text-gray-400' },
} as const

export const callbackStatusConfig = {
  offen:          { label: 'Offen',          color: 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400' },
  in_bearbeitung: { label: 'In Bearbeitung', color: 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400' },
  ueberfaellig:   { label: 'Überfällig',     color: 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400' },
  erledigt:       { label: 'Erledigt',       color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' },
} as const

export const callbackPriorityConfig = {
  niedrig:  { label: 'Niedrig',  color: 'bg-slate-100 text-slate-600 dark:bg-slate-800/40 dark:text-slate-400' },
  mittel:   { label: 'Mittel',   color: 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400' },
  hoch:     { label: 'Hoch',     color: 'bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400' },
  dringend: { label: 'Dringend', color: 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400' },
} as const

export interface MockCustomer {
  id: string
  name: string
  phone: string
  email?: string
  vehicleInterest?: string
}

export const mockCustomers: MockCustomer[] = [
  { id: 'cust-1', name: 'Hans Gruber', phone: '+49 711 1234567', email: 'h.gruber@email.de', vehicleInterest: 'BMW 320d Touring' },
  { id: 'cust-2', name: 'Maria Schneider', phone: '+49 711 2345678', email: 'maria.schneider@web.de', vehicleInterest: 'Mercedes C200' },
  { id: 'cust-3', name: 'Peter Wagner', phone: '+49 711 3456789', email: 'p.wagner@gmx.de' },
  { id: 'cust-4', name: 'Anna Hoffmann', phone: '+49 711 4567890', email: 'anna.h@outlook.de', vehicleInterest: 'VW Golf 7' },
  { id: 'cust-5', name: 'Klaus Becker', phone: '+49 711 5678901', email: 'k.becker@t-online.de', vehicleInterest: 'Tesla Model 3' },
  { id: 'cust-6', name: 'Stefanie Klein', phone: '+49 711 6789012', vehicleInterest: 'Porsche Cayenne' },
  { id: 'cust-7', name: 'Jürgen Fischer', phone: '+49 711 7890123', email: 'j.fischer@email.de' },
  { id: 'cust-8', name: 'Christina Braun', phone: '+49 711 8901234', email: 'c.braun@web.de', vehicleInterest: 'Audi A4' },
  { id: 'cust-9', name: 'Robert Meier', phone: '+49 711 9012345', email: 'r.meier@gmx.de' },
  { id: 'cust-10', name: 'Markus Lehmann', phone: '+49 711 1112233', email: 'markus.l@email.de', vehicleInterest: 'VW Golf 7' },
  { id: 'cust-11', name: 'Sabine Wolf', phone: '+49 711 4445566', email: 's.wolf@outlook.de', vehicleInterest: 'Audi A4 Avant' },
  { id: 'cust-12', name: 'Frank Neumann', phone: '+49 711 7778899', email: 'frank.n@t-online.de', vehicleInterest: 'Mercedes GLC' },
  { id: 'cust-13', name: 'Elena Richter', phone: '+49 711 5556677', email: 'elena.r@web.de', vehicleInterest: 'Tesla Model 3 LR' },
  { id: 'cust-14', name: 'Dieter Schwarz', phone: '+49 711 9990011', email: 'd.schwarz@email.de', vehicleInterest: 'BMW iX' },
  { id: 'cust-15', name: 'Monika Schulz', phone: '+49 711 3334455', email: 'monika.s@gmx.de', vehicleInterest: 'VW ID.4' },
  { id: 'cust-16', name: 'Wolfgang Hartmann', phone: '+49 711 6667788', email: 'w.hartmann@web.de' },
  { id: 'cust-17', name: 'Susanne Berg', phone: '+49 711 2223344', email: 's.berg@outlook.de', vehicleInterest: 'Mercedes E-Klasse' },
  { id: 'cust-18', name: 'Thomas Keller', phone: '+49 711 8889900', email: 't.keller@t-online.de', vehicleInterest: 'Audi Q5' },
  { id: 'cust-19', name: 'Petra Zimmermann', phone: '+49 711 1119922', email: 'p.zimmermann@email.de' },
  { id: 'cust-20', name: 'Andreas Koch', phone: '+49 711 4447733', email: 'a.koch@gmx.de', vehicleInterest: 'BMW 530e' },
]

export const mockCallAgents: CallAgent[] = [
  { id: 'agent-tm', name: 'Thomas Müller', type: 'mensch' },
  { id: 'agent-sw', name: 'Sarah Weber', type: 'mensch' },
  { id: 'agent-ms', name: 'Michael Schmidt', type: 'mensch' },
  { id: 'agent-lk', name: 'Lisa Kramer', type: 'mensch' },
  { id: 'agent-ki-luna', name: 'KI-Agent Luna', type: 'ki' },
  { id: 'agent-ki-max', name: 'KI-Agent Max', type: 'ki' },
]
