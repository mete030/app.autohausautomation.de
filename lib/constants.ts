import {
  LayoutDashboard,
  Car,
  ShoppingCart,
  Phone,
  FileText,
  ReceiptText,
  MessageSquare,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react'
import type { CallAgent, Employee, EscalationRule, SlaConfig } from '@/lib/types'

export interface NavItem {
  title: string
  href: string
  icon: LucideIcon
  badge?: number
  children?: { title: string; href: string }[]
}

export const featureVisibility = {
  buchhaltung: false,
  verifizierung: false,
  dashboard: false,
  fahrzeuge: false,
  einkauf: false,
  inserate: false,
} as const

export const navigation: NavItem[] = [
  ...(featureVisibility.dashboard
    ? [{
        title: 'Dashboard' as const,
        href: '/dashboard',
        icon: LayoutDashboard,
      }]
    : []),
  ...(featureVisibility.fahrzeuge
    ? [{
        title: 'Fahrzeuge',
        href: '/fahrzeuge/hofsteuerung',
        icon: Car,
        children: [
          { title: 'Hofsteuerung', href: '/fahrzeuge/hofsteuerung' },
          { title: 'Inventar', href: '/fahrzeuge' },
          { title: 'Werkstatt', href: '/fahrzeuge/werkstatt' },
        ],
      }]
    : []),
  ...(featureVisibility.einkauf
    ? [{
        title: 'Einkauf',
        href: '/einkauf',
        icon: ShoppingCart,
      }]
    : []),
  {
    title: 'Callcenter',
    href: '/callcenter',
    icon: Phone,
  },
  ...(featureVisibility.inserate
    ? [{
        title: 'Inserate',
        href: '/inserate',
        icon: FileText,
        children: [
          { title: 'Übersicht', href: '/inserate' },
          { title: 'Neues Inserat', href: '/inserate/neu' },
        ],
      }]
    : []),
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
  ...(featureVisibility.verifizierung
    ? [{
        title: 'Verifizierung' as const,
        href: '/verifizierung',
        icon: ShieldCheck,
      }]
    : []),
]

export const escalationColors = {
  green: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', label: 'Im Plan' },
  yellow: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', label: 'Achtung' },
  red: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', label: 'Dringend' },
  darkred: { bg: 'bg-red-200 dark:bg-red-900/50', text: 'text-red-900 dark:text-red-300', label: 'Überfällig' },
} as const

export const channelConfig = {
  whatsapp:        { label: 'WhatsApp',         color: 'bg-[#25D366]',  textColor: 'text-white' },
  email:           { label: 'E-Mail',           color: 'bg-blue-500',   textColor: 'text-white' },
  sms:             { label: 'SMS',              color: 'bg-purple-500', textColor: 'text-white' },
  mobile_de:       { label: 'mobile.de',        color: 'bg-orange-500', textColor: 'text-white' },
  messenger:       { label: 'Messenger',        color: 'bg-[#0084FF]',  textColor: 'text-white' },
  instagram:       { label: 'Instagram',        color: 'bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF]', textColor: 'text-white' },
  telegram:        { label: 'Telegram',         color: 'bg-[#26A5E4]',  textColor: 'text-white' },
  website:         { label: 'Website',          color: 'bg-indigo-500', textColor: 'text-white' },
  website_chatbot: { label: 'Website Chatbot',  color: 'bg-teal-500',   textColor: 'text-white' },
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
  { id: 'agent-msc', name: 'Marina Schittenhelm', type: 'mensch' },
  { id: 'agent-js', name: 'Justine Schuch', type: 'mensch' },
  { id: 'agent-jh', name: 'Jessica Haizmann', type: 'mensch' },
  { id: 'agent-jm', name: 'Joelle Müller', type: 'mensch' },
  { id: 'agent-dp', name: 'Dominic Pitzke', type: 'mensch' },
  { id: 'agent-ki-luna', name: 'KI-Agent Luna', type: 'ki' },
  { id: 'agent-ki-max', name: 'KI-Agent Max', type: 'ki' },
]

// ---- Nachrichten Perspektive ----

export interface NachrichtenPerspective {
  type: 'admin' | 'serviceberater' | 'callcenter'
  userName?: string
  label: string
}

// ---- Employee / Mitarbeiter ----

export const employeeRoleConfig = {
  verkaufer:          { label: 'Verkäufer',          color: 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400' },
  serviceberater:     { label: 'Serviceberater',     color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' },
  werkstattleiter:    { label: 'Werkstattleiter',    color: 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400' },
  callcenter_agent:   { label: 'Call Center',        color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-400' },
  backoffice:         { label: 'Backoffice',         color: 'bg-gray-100 text-gray-700 dark:bg-gray-800/40 dark:text-gray-400' },
  geschaeftsfuehrung: { label: 'Geschäftsführung',   color: 'bg-violet-100 text-violet-700 dark:bg-violet-950/30 dark:text-violet-400' },
} as const

export const employeeStatusConfig = {
  aktiv:    { label: 'Aktiv',    dot: 'bg-emerald-500' },
  abwesend: { label: 'Abwesend', dot: 'bg-gray-400' },
  pause:    { label: 'Pause',    dot: 'bg-amber-500' },
} as const

export const escalationLevelConfig = {
  1: { label: 'Stufe 1 — Berater',      color: 'text-blue-600 dark:text-blue-400',  bg: 'bg-blue-100 dark:bg-blue-950/30' },
  2: { label: 'Stufe 2 — Teamleitung',  color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-950/30' },
  3: { label: 'Stufe 3 — Management',   color: 'text-red-600 dark:text-red-400',    bg: 'bg-red-100 dark:bg-red-950/30' },
} as const

export const slaDurationOptions: { value: number; label: string }[] = [
  { value: 5,   label: '5 Minuten' },
  { value: 10,  label: '10 Minuten' },
  { value: 15,  label: '15 Minuten' },
  { value: 30,  label: '30 Minuten' },
  { value: 60,  label: '1 Stunde' },
  { value: 120, label: '2 Stunden' },
]

export const defaultSlaConfig: SlaConfig = {
  defaultMinutes: 30,
  perPriority: {
    dringend: 5,
    hoch: 15,
    mittel: 30,
    niedrig: 60,
  },
}

export const mockEmployees: Employee[] = [
  // Geschäftsführung
  { id: 'emp-mp', name: 'Markus Pross',           role: 'geschaeftsfuehrung', email: 'm.pross@wackenhut.de',         phone: '+49 7452 6031122', status: 'aktiv', isCallAgent: false, isSupervisor: true,  createdAt: '2024-01-01T00:00:00' },
  // Werkstattleiter
  { id: 'emp-rh', name: 'Ralf Hammann',           role: 'werkstattleiter',    email: 'r.hammann@wackenhut.de',       phone: '+49 7452 6031450', status: 'aktiv', isCallAgent: false, isSupervisor: true,  createdAt: '2024-01-01T00:00:00' },
  { id: 'emp-ar', name: 'Andreas Rötlich',        role: 'werkstattleiter',    email: 'a.roetlich@wackenhut.de',      phone: '+49 7032 97593244', status: 'aktiv', isCallAgent: false, isSupervisor: true, createdAt: '2024-01-01T00:00:00' },
  // Serviceberater
  { id: 'emp-ae', name: 'Alexander Eckhardt',     role: 'serviceberater',     email: 'a.eckhardt@wackenhut.de',      phone: '+49 7051 93103321', status: 'aktiv', isCallAgent: false, isSupervisor: false, createdAt: '2024-01-01T00:00:00' },
  { id: 'emp-cb', name: 'Cedric Bauerdick',       role: 'serviceberater',     email: 'c.bauerdick@wackenhut.de',     phone: '+49 7221 6862442', status: 'aktiv', isCallAgent: false, isSupervisor: false, createdAt: '2024-01-01T00:00:00' },
  { id: 'emp-go', name: 'Gabriel Otlik',          role: 'serviceberater',     email: 'g.otlik@wackenhut.de',         phone: '+49 7032 97593220', status: 'aktiv', isCallAgent: false, isSupervisor: false, createdAt: '2024-01-01T00:00:00' },
  // Verkäufer
  { id: 'emp-ad', name: 'Alexander Dittus',       role: 'verkaufer',          email: 'a.dittus@wackenhut.de',        phone: '+49 7452 6031200', status: 'aktiv', isCallAgent: false, isSupervisor: false, createdAt: '2024-01-01T00:00:00' },
  { id: 'emp-as', name: 'Alexander Seez',         role: 'verkaufer',          email: 'a.seez@wackenhut.de',          phone: '+49 7452 6031213', status: 'aktiv', isCallAgent: false, isSupervisor: false, createdAt: '2024-01-01T00:00:00' },
  { id: 'emp-db', name: 'Daniel Bühler',          role: 'verkaufer',          email: 'd.buehler@wackenhut.de',       phone: '+49 7221 6862220', status: 'aktiv', isCallAgent: false, isSupervisor: false, createdAt: '2024-06-01T00:00:00' },
  { id: 'emp-se', name: 'Sebastian Erhard',       role: 'verkaufer',          email: 's.erhard@wackenhut.de',        phone: '+49 7221 6862213', status: 'aktiv', isCallAgent: false, isSupervisor: false, createdAt: '2024-06-01T00:00:00' },
  // Call-Center-Agenten
  { id: 'emp-msc', name: 'Marina Schittenhelm',  role: 'callcenter_agent',   email: 'm.schittenhelm@wackenhut.de',  phone: '+49 711 100009', status: 'aktiv', isCallAgent: true,  isSupervisor: false, createdAt: '2024-01-01T00:00:00' },
  { id: 'emp-jsc', name: 'Justine Schuch',       role: 'callcenter_agent',   email: 'j.schuch@wackenhut.de',        phone: '+49 711 100010', status: 'aktiv', isCallAgent: true,  isSupervisor: false, createdAt: '2024-01-01T00:00:00' },
  { id: 'emp-jhz', name: 'Jessica Haizmann',     role: 'callcenter_agent',   email: 'j.haizmann@wackenhut.de',      phone: '+49 711 100011', status: 'aktiv', isCallAgent: true,  isSupervisor: false, createdAt: '2024-01-01T00:00:00' },
  { id: 'emp-jom', name: 'Joelle Müller',        role: 'callcenter_agent',   email: 'j.mueller@wackenhut.de',       phone: '+49 711 100012', status: 'aktiv', isCallAgent: true,  isSupervisor: false, createdAt: '2024-01-01T00:00:00' },
  { id: 'emp-dpi', name: 'Dominic Pitzke',       role: 'callcenter_agent',   email: 'd.pitzke@wackenhut.de',        phone: '+49 711 100013', status: 'aktiv', isCallAgent: true,  isSupervisor: false, createdAt: '2024-01-01T00:00:00' },
]

export const mockEscalationRules: EscalationRule[] = [
  { id: 'rule-1', name: 'Erinnerung per E-Mail (L1)', triggerAfterMinutes: 30, fromLevel: 1, toLevel: 2, notifyChannels: ['email'], isActive: true },
  { id: 'rule-2', name: 'Eskalation an Teamleitung (L2)', triggerAfterMinutes: 90, fromLevel: 2, toLevel: 3, notifyChannels: ['app', 'email'], isActive: true },
]
