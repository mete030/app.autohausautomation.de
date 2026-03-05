'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ActivityEntry } from '@/lib/types'
import { cn, formatTimeAgo } from '@/lib/utils'
import {
  Car,
  Phone,
  FileText,
  ReceiptText,
  MessageSquare,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
} from 'lucide-react'

const moduleIcons = {
  werkstatt: Car,
  callcenter: Phone,
  inserate: FileText,
  buchhaltung: ReceiptText,
  nachrichten: MessageSquare,
  kyc: ShieldCheck,
}

const moduleColors = {
  werkstatt: 'text-blue-500',
  callcenter: 'text-orange-500',
  inserate: 'text-emerald-500',
  buchhaltung: 'text-indigo-500',
  nachrichten: 'text-violet-500',
  kyc: 'text-cyan-500',
}

const moduleBgColors = {
  werkstatt: 'bg-blue-50 dark:bg-blue-950/30',
  callcenter: 'bg-orange-50 dark:bg-orange-950/30',
  inserate: 'bg-emerald-50 dark:bg-emerald-950/30',
  buchhaltung: 'bg-indigo-50 dark:bg-indigo-950/30',
  nachrichten: 'bg-violet-50 dark:bg-violet-950/30',
  kyc: 'bg-cyan-50 dark:bg-cyan-950/30',
}

const moduleLinkLabels: Record<string, string> = {
  werkstatt: 'Fahrzeug anzeigen',
  callcenter: 'Rückruf anzeigen',
  inserate: 'Inserat anzeigen',
  buchhaltung: 'Buchhaltung öffnen',
  nachrichten: 'Konversation öffnen',
  kyc: 'Verifizierung anzeigen',
}

function ActivityItem({ entry }: { entry: ActivityEntry }) {
  const [expanded, setExpanded] = useState(false)
  const Icon = moduleIcons[entry.module]
  const color = moduleColors[entry.module]
  const bgColor = moduleBgColors[entry.module]

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          'w-full text-left flex items-start gap-3 px-3 py-3 rounded-lg transition-colors cursor-pointer',
          expanded ? 'bg-muted/50' : 'hover:bg-muted/40'
        )}
      >
        <div
          className={cn(
            'h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
            bgColor
          )}
        >
          <Icon className={cn('h-4 w-4', color)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-medium truncate">
              {entry.subject}
            </span>
          </div>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            <span className="font-medium text-foreground/80">
              {entry.action}
            </span>
            <span className="mx-1.5 text-muted-foreground/40">—</span>
            <span>{entry.description}</span>
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0 mt-1">
          <div className="text-right">
            <p className="text-xs text-muted-foreground whitespace-nowrap">
              {entry.user} · {formatTimeAgo(entry.timestamp)}
            </p>
          </div>
          <ChevronRight
            className={cn(
              'h-3.5 w-3.5 text-muted-foreground/40 transition-transform duration-200',
              expanded && 'rotate-90'
            )}
          />
        </div>
      </button>

      {/* Expandable details */}
      <div
        className={cn(
          'grid transition-all duration-200 ease-in-out',
          expanded
            ? 'grid-rows-[1fr] opacity-100'
            : 'grid-rows-[0fr] opacity-0'
        )}
      >
        <div className="overflow-hidden">
          <div className="ml-11 mr-1 mb-2 mt-0.5 p-3.5 rounded-lg bg-muted/30 border border-border/40">
            {entry.details && entry.details.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3">
                {entry.details.map((d, i) => (
                  <div key={i} className="flex flex-col gap-0.5">
                    <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                      {d.label}
                    </span>
                    <span className="text-[13px]">{d.value}</span>
                  </div>
                ))}
              </div>
            )}
            {entry.link && (
              <div className="mt-3 pt-3 border-t border-border/40">
                <Link
                  href={entry.link}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  {moduleLinkLabels[entry.module] || 'Details anzeigen'}
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export function ActivityFeed({ activities }: { activities: ActivityEntry[] }) {
  return (
    <div className="space-y-0.5">
      {activities.map((entry) => (
        <ActivityItem key={entry.id} entry={entry} />
      ))}
    </div>
  )
}
