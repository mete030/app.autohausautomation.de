'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { mockDashboardStats, mockActivity } from '@/lib/mock-data'
import { ActivityFeed } from '@/components/dashboard/activity-feed'
import { Wrench, Phone, FileText, ReceiptText, MessageSquare, ShieldCheck, ArrowUpRight, AlertTriangle, Clock } from 'lucide-react'

const stats = mockDashboardStats

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Willkommen bei Wackenhut Autohaus Management</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">

        {/* 1. Werkstatt – wartende Fahrzeuge */}
        <Link href="/fahrzeuge/werkstatt">
          <Card className="group hover:shadow-md transition-all duration-200 cursor-pointer border-border/60 h-full">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-md bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center shrink-0">
                    <Wrench className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-sm font-semibold">Werkstatt</span>
                </div>
                <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
              </div>
              <div className="text-3xl font-bold tracking-tight tabular-nums">{stats.werkstatt.wartend}</div>
              <p className="text-xs text-muted-foreground mt-0.5">Fahrzeuge warten auf Service</p>
              <div className="mt-3 pt-2.5 border-t border-border/40">
                {stats.werkstatt.ueberfaellig > 0 ? (
                  <span className="text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 shrink-0" />
                    {stats.werkstatt.ueberfaellig} überfällig
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">Alles im Plan</span>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* 2. Rückrufe */}
        <Link href="/callcenter">
          <Card className="group hover:shadow-md transition-all duration-200 cursor-pointer border-border/60 h-full">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-md bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center shrink-0">
                    <Phone className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <span className="text-sm font-semibold">Rückrufe</span>
                </div>
                <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
              </div>
              <div className="text-3xl font-bold tracking-tight tabular-nums">{stats.rueckrufe.offen}</div>
              <p className="text-xs text-muted-foreground mt-0.5">offene Rückrufe</p>
              <div className="mt-3 pt-2.5 border-t border-border/40">
                {stats.rueckrufe.ueberfaellig > 0 ? (
                  <span className="text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 shrink-0" />
                    {stats.rueckrufe.ueberfaellig} überfällig
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">Alles im Plan</span>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* 3. Inserate – dual metric */}
        <Link href="/inserate">
          <Card className="group hover:shadow-md transition-all duration-200 cursor-pointer border-border/60 h-full">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-md bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center shrink-0">
                    <FileText className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="text-sm font-semibold">Inserate</span>
                </div>
                <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
              </div>
              <div className="grid grid-cols-2 gap-x-3">
                <div>
                  <div className="text-3xl font-bold tracking-tight tabular-nums">{stats.inserate.zuErstellen}</div>
                  <p className="text-xs text-muted-foreground mt-0.5">zu erstellen</p>
                </div>
                <div className="border-l border-border/50 pl-3">
                  <div className="text-3xl font-bold tracking-tight tabular-nums">{stats.inserate.zuVeroeffentlichen}</div>
                  <p className="text-xs text-muted-foreground mt-0.5">zu veröffentlichen</p>
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-border/40">
                <span className="text-xs text-muted-foreground">
                  {stats.inserate.zuErstellen + stats.inserate.zuVeroeffentlichen} Inserate ausstehend
                </span>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* 4. Nachrichten */}
        <Link href="/buchhaltung">
          <Card className="group hover:shadow-md transition-all duration-200 cursor-pointer border-border/60 h-full">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-md bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center shrink-0">
                    <ReceiptText className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <span className="text-sm font-semibold">Buchhaltung</span>
                </div>
                <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
              </div>
              <div className="text-3xl font-bold tracking-tight tabular-nums">{stats.buchhaltung.offen}</div>
              <p className="text-xs text-muted-foreground mt-0.5">offene Belege</p>
              <div className="mt-3 pt-2.5 border-t border-border/40">
                {stats.buchhaltung.kritisch > 0 ? (
                  <span className="text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 shrink-0" />
                    {stats.buchhaltung.kritisch} kritisch
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">Alles im Plan</span>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* 5. Nachrichten */}
        <Link href="/nachrichten">
          <Card className="group hover:shadow-md transition-all duration-200 cursor-pointer border-border/60 h-full">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-md bg-violet-50 dark:bg-violet-950/30 flex items-center justify-center shrink-0">
                    <MessageSquare className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                  </div>
                  <span className="text-sm font-semibold">Nachrichten</span>
                </div>
                <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
              </div>
              <div className="text-3xl font-bold tracking-tight tabular-nums">{stats.nachrichten.ungelesen}</div>
              <p className="text-xs text-muted-foreground mt-0.5">ungelesene Nachrichten</p>
              <div className="mt-3 pt-2.5 border-t border-border/40">
                <span className="text-xs text-muted-foreground">
                  +{stats.nachrichten.heuteNeu} heute neu
                </span>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* 6. Verifizierungen */}
        <Link href="/verifizierung">
          <Card className="group hover:shadow-md transition-all duration-200 cursor-pointer border-border/60 h-full">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-md bg-cyan-50 dark:bg-cyan-950/30 flex items-center justify-center shrink-0">
                    <ShieldCheck className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <span className="text-sm font-semibold">Verifizierungen</span>
                </div>
                <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
              </div>
              <div className="text-3xl font-bold tracking-tight tabular-nums">{stats.kyc.offen}</div>
              <p className="text-xs text-muted-foreground mt-0.5">offene Verifizierungen</p>
              <div className="mt-3 pt-2.5 border-t border-border/40">
                {stats.kyc.zuPruefen > 0 ? (
                  <span className="text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 shrink-0" />
                    {stats.kyc.zuPruefen} manuell zu prüfen
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">Alles im Plan</span>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>

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
