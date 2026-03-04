'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { mockDashboardStats, mockActivity } from '@/lib/mock-data'
import { ActivityFeed } from '@/components/dashboard/activity-feed'
import { Car, Phone, FileText, MessageSquare, ShieldCheck, ArrowUpRight, AlertTriangle, Clock } from 'lucide-react'

const kpiCards = [
  {
    title: 'Werkstatt',
    icon: Car,
    value: mockDashboardStats.werkstatt.aktiv,
    label: 'aktive Fahrzeuge',
    alert: mockDashboardStats.werkstatt.ueberfaellig,
    alertLabel: 'überfällig',
    href: '/fahrzeuge/werkstatt',
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
  },
  {
    title: 'Rückrufe',
    icon: Phone,
    value: mockDashboardStats.rueckrufe.offen,
    label: 'offen',
    alert: mockDashboardStats.rueckrufe.ueberfaellig,
    alertLabel: 'überfällig',
    href: '/callcenter',
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-50 dark:bg-orange-950/30',
  },
  {
    title: 'Inserate',
    icon: FileText,
    value: mockDashboardStats.inserate.live,
    label: 'live',
    secondary: mockDashboardStats.inserate.entwuerfe,
    secondaryLabel: 'Entwürfe',
    href: '/inserate',
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
  },
  {
    title: 'Nachrichten',
    icon: MessageSquare,
    value: mockDashboardStats.nachrichten.ungelesen,
    label: 'ungelesen',
    secondary: mockDashboardStats.nachrichten.heuteNeu,
    secondaryLabel: 'heute neu',
    href: '/nachrichten',
    color: 'text-violet-600 dark:text-violet-400',
    bg: 'bg-violet-50 dark:bg-violet-950/30',
  },
  {
    title: 'Verifizierung',
    icon: ShieldCheck,
    value: mockDashboardStats.kyc.offen,
    label: 'offen',
    secondary: mockDashboardStats.kyc.zuPruefen,
    secondaryLabel: 'zu prüfen',
    href: '/verifizierung',
    color: 'text-cyan-600 dark:text-cyan-400',
    bg: 'bg-cyan-50 dark:bg-cyan-950/30',
  },
]

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Willkommen bei Wackenhut Autohaus Management</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {kpiCards.map((card) => {
          const Icon = card.icon
          return (
            <Link key={card.title} href={card.href}>
              <Card className="group hover:shadow-md transition-all duration-200 cursor-pointer border-border/60 h-full">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`h-9 w-9 rounded-lg ${card.bg} flex items-center justify-center`}>
                      <Icon className={`h-[18px] w-[18px] ${card.color}`} />
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                  </div>
                  <div className="text-2xl font-semibold tracking-tight">{card.value}</div>
                  <p className="text-xs text-muted-foreground mt-0.5">{card.label}</p>
                  <div className="mt-3 pt-3 border-t border-border/50">
                    {card.alert !== undefined && card.alert > 0 ? (
                      <span className="text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {card.alert} {card.alertLabel}
                      </span>
                    ) : card.secondary !== undefined ? (
                      <span className="text-xs text-muted-foreground">
                        +{card.secondary} {card.secondaryLabel}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Alles im Plan</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Activity Feed */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            Letzte Aktivitäten
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityFeed activities={mockActivity} />
        </CardContent>
      </Card>
    </div>
  )
}
