'use client'

import { useState, useRef, useEffect } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useHydrated } from '@/hooks/useHydrated'
import { useConversationStore, type ConversationInboxView } from '@/lib/stores/conversation-store'
import { cn } from '@/lib/utils'
import { mockCallAgents, type NachrichtenPerspective } from '@/lib/constants'
import { mockAdvisors } from '@/lib/mock-data'
import type { Conversation, MessageChannel, ConversationStatus } from '@/lib/types'
import {
  Search, Send, ChevronDown,
  Star, Trash2, AlertCircle, Users, UserX, Mail,
  ArrowLeftRight, UserPlus, X, Tag, Clock, CheckCircle2, MoreHorizontal,
  Phone, AtSign, FolderOpen, Plus, Settings, Paperclip,
  Smile, Image as ImageIcon, Hash, PenSquare, Check, Zap, Filter, ChevronLeft,
  Sparkles, Shield, FileText, StickyNote, Bot, Plug, Globe, Download, Eye,
  Calendar, Link2, MousePointerClick, ExternalLink,
} from 'lucide-react'

// ─── Brand SVG Icons ──────────────────────────────────────────────────────────

const WhatsAppSVG = ({ cls }: { cls?: string }) => (
  <svg viewBox="0 0 24 24" className={cls} fill="white">
    <path d="M12.001 2C6.478 2 2 6.478 2 12c0 1.85.504 3.585 1.38 5.074L2.05 21.95l5.02-1.312A9.955 9.955 0 0012.001 22c5.523 0 10-4.477 10-10s-4.477-10-10-10zm0 18a7.944 7.944 0 01-4.233-1.217l-.303-.18-3.134.82.838-3.046-.197-.314A7.946 7.946 0 014 12c0-4.411 3.589-8 8.001-8C16.41 4 20 7.589 20 12s-3.589 8-7.999 8zm4.404-5.944c-.24-.12-1.42-.7-1.64-.78-.22-.08-.38-.12-.54.12s-.62.78-.76.94c-.14.16-.28.18-.52.06-.24-.12-1.014-.374-1.931-1.192-.714-.637-1.196-1.424-1.337-1.664-.14-.24-.015-.37.105-.49.108-.107.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.195-.468-.393-.404-.54-.412l-.46-.008a.88.88 0 00-.64.3c-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.694 2.587 4.106 3.627.574.248 1.022.396 1.372.507.576.183 1.1.157 1.514.095.462-.068 1.42-.582 1.62-1.143.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28z" />
  </svg>
)
const MessengerSVG = ({ cls }: { cls?: string }) => (
  <svg viewBox="0 0 24 24" className={cls} fill="white">
    <path d="M12 2C6.477 2 2 6.145 2 11.259c0 2.913 1.454 5.512 3.726 7.21V21.5l3.405-1.869c.91.252 1.874.388 2.869.388 5.523 0 10-4.145 10-9.26C22 6.145 17.523 2 12 2zm1.008 12.464l-2.548-2.717-4.976 2.717 5.476-5.813 2.608 2.717 4.916-2.717-5.476 5.813z" />
  </svg>
)
const InstagramSVG = ({ cls }: { cls?: string }) => (
  <svg viewBox="0 0 24 24" className={cls} fill="white">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
)
const TelegramSVG = ({ cls }: { cls?: string }) => (
  <svg viewBox="0 0 24 24" className={cls} fill="white">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
  </svg>
)
const EmailSVG = ({ cls }: { cls?: string }) => (
  <svg viewBox="0 0 24 24" className={cls} fill="white">
    <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
  </svg>
)
const SmsSVG = ({ cls }: { cls?: string }) => (
  <svg viewBox="0 0 24 24" className={cls} fill="white">
    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
  </svg>
)
const MobileDeSVG = ({ cls }: { cls?: string }) => (
  <svg viewBox="0 0 24 24" className={cls} fill="white">
    <path d="M18.92 6.01L15 2H9L5.08 6.01C4.4 6.73 4 7.7 4 8.75V19c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8.75c0-1.05-.4-2.02-1.08-2.74zM12 17.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 12.5 12 12.5s2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5zM9.5 7l1.5-3h2l1.5 3h-5z" />
  </svg>
)
const WebsiteSVG = ({ cls }: { cls?: string }) => (
  <svg viewBox="0 0 24 24" className={cls} fill="white">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
  </svg>
)
const WebsiteChatbotSVG = ({ cls }: { cls?: string }) => (
  <svg viewBox="0 0 24 24" className={cls} fill="white">
    <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1.07A7.001 7.001 0 0 1 7.07 19H6a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h-1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2zM9.5 14a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm5 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z" />
  </svg>
)

// ─── Channel Icon ─────────────────────────────────────────────────────────────

const chBg: Record<MessageChannel, string> = {
  whatsapp:        'bg-[#25D366]',
  messenger:       'bg-[#0084FF]',
  instagram:       'bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF]',
  telegram:        'bg-[#26A5E4]',
  email:           'bg-[#EA4335]',
  sms:             'bg-[#8B5CF6]',
  mobile_de:       'bg-[#FF6600]',
  website:         'bg-indigo-500',
  website_chatbot: 'bg-teal-500',
}

type IconSize = 'xs' | 'sm' | 'md' | 'lg'

function ChannelIcon({ ch, size = 'md' }: { ch: MessageChannel; size?: IconSize }) {
  const outer = { xs: 'w-4 h-4', sm: 'w-5 h-5', md: 'w-7 h-7', lg: 'w-9 h-9' }[size]
  const inner = { xs: 'w-2.5 h-2.5', sm: 'w-3 h-3', md: 'w-4 h-4', lg: 'w-5 h-5' }[size]
  const map: Record<MessageChannel, React.ReactNode> = {
    whatsapp:        <WhatsAppSVG        cls={inner} />,
    messenger:       <MessengerSVG       cls={inner} />,
    instagram:       <InstagramSVG       cls={inner} />,
    telegram:        <TelegramSVG        cls={inner} />,
    email:           <EmailSVG           cls={inner} />,
    sms:             <SmsSVG             cls={inner} />,
    mobile_de:       <MobileDeSVG        cls={inner} />,
    website:         <WebsiteSVG         cls={inner} />,
    website_chatbot: <WebsiteChatbotSVG  cls={inner} />,
  }
  return (
    <div className={cn('rounded-full flex items-center justify-center shrink-0', outer, chBg[ch])}>
      {map[ch]}
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtTime(iso: string) {
  const d = new Date(iso), now = new Date()
  const diff = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diff === 0) return d.toLocaleTimeString('de', { hour: '2-digit', minute: '2-digit' })
  if (diff === 1) return 'Gestern'
  if (diff < 7)   return d.toLocaleDateString('de', { weekday: 'short' })
  return d.toLocaleDateString('de', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
function fmtMsgTime(iso: string) {
  return new Date(iso).toLocaleTimeString('de', { hour: '2-digit', minute: '2-digit' })
}
function dayLabel(iso: string) {
  const d = new Date(iso), now = new Date()
  const diff = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diff === 0) return 'Heute'
  if (diff === 1) return 'Gestern'
  return d.toLocaleDateString('de', { weekday: 'long', day: '2-digit', month: 'long' })
}

// Label colour map — refined pastel pills
const labelCls: Record<string, { pill: string; dot: string }> = {
  Marketing: { pill: 'bg-pink-50/80 text-pink-600 border-pink-100',   dot: 'bg-pink-400'   },
  VIP:       { pill: 'bg-amber-50/80 text-amber-600 border-amber-100', dot: 'bg-amber-400'  },
  B2B:       { pill: 'bg-blue-50/80 text-blue-600 border-blue-100',    dot: 'bg-blue-400'   },
}

// ─── View dropdown ────────────────────────────────────────────────────────────

const viewLabel: Record<ConversationInboxView, string> = {
  alle: 'Alle Unterhaltungen', ungelesen: 'Ungelesen', mir: 'Mir zugewiesen',
  nicht: 'Nicht zugewiesen', markiert: 'Markiert', papierkorb: 'Papierkorb', spam: 'Spam',
  Zentrale: 'Zentrale', 'Standort Berlin': 'Standort Berlin',
  'Standort München': 'Standort München', Vertrieb: 'Vertrieb', Marketing: 'Marketing',
  vip: 'VIP-Kunden', 'berlin-mktg': 'Berliner Marketing', 'london-mktg': 'Londoner Marketing',
}

function ViewDropdown({
  current,
  onChange,
  allConversations,
}: {
  current: ConversationInboxView
  onChange: (v: ConversationInboxView) => void
  allConversations: Conversation[]
}) {
  const [open, setOpen] = useState(false)
  const mounted = useHydrated()
  const unread = allConversations.filter(c => c.unread).length
  const mktgCnt = allConversations.filter(c => c.inbox === 'Marketing').length

  const renderItem = ({
    id,
    icon,
    label,
    count,
  }: {
    id: ConversationInboxView
    icon: React.ReactNode
    label: string
    count?: number
  }) => {
    const active = current === id
    return (
      <button
        onClick={() => { onChange(id); setOpen(false) }}
        className={cn(
          'w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] transition-colors text-left',
          active ? 'bg-blue-50/60 text-[#2563EB] font-medium' : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
        )}
      >
        <span className="shrink-0 opacity-70">{icon}</span>
        <span className="flex-1 truncate">{label}</span>
        {active && <Check className="w-3 h-3 shrink-0" />}
        {!active && count !== undefined && count > 0 && (
          <span className="text-[10px] bg-muted rounded-full px-1.5 py-0.5 font-medium tabular-nums">{count}</span>
        )}
      </button>
    )
  }

  return (
    mounted ? (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger className="flex min-w-0 max-w-full items-center gap-1 font-semibold text-[14px] text-foreground transition-colors hover:text-foreground/70">
          <span className="truncate">{viewLabel[current]}</span>
          <ChevronDown className={cn('w-3.5 h-3.5 text-muted-foreground/50 transition-transform duration-150', open && 'rotate-180')} />
        </PopoverTrigger>
        <PopoverContent align="start" sideOffset={10} className="w-60 p-1.5">
          {renderItem({ id: 'alle', icon: <Hash className="w-3.5 h-3.5"/>, label: 'Alle Unterhaltungen', count: allConversations.length })}
          {renderItem({ id: 'ungelesen', icon: <Mail className="w-3.5 h-3.5"/>, label: 'Ungelesen', count: unread })}
          {renderItem({ id: 'mir', icon: <Users className="w-3.5 h-3.5"/>, label: 'Mir zugewiesen' })}
          {renderItem({ id: 'nicht', icon: <UserX className="w-3.5 h-3.5"/>, label: 'Nicht zugewiesen' })}
          {renderItem({ id: 'markiert', icon: <Star className="w-3.5 h-3.5"/>, label: 'Markiert' })}
          {renderItem({ id: 'papierkorb', icon: <Trash2 className="w-3.5 h-3.5"/>, label: 'Papierkorb' })}
          {renderItem({ id: 'spam', icon: <AlertCircle className="w-3.5 h-3.5"/>, label: 'Spam' })}

          <Separator className="my-1.5" />
          <p className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Postfächer</p>
          {renderItem({ id: 'Zentrale', icon: <FolderOpen className="w-3.5 h-3.5"/>, label: 'Zentrale' })}
          {renderItem({ id: 'Standort Berlin', icon: <FolderOpen className="w-3.5 h-3.5"/>, label: 'Standort Berlin' })}
          {renderItem({ id: 'Standort München', icon: <FolderOpen className="w-3.5 h-3.5"/>, label: 'Standort München' })}
          {renderItem({ id: 'Vertrieb', icon: <FolderOpen className="w-3.5 h-3.5"/>, label: 'Vertrieb' })}
          {renderItem({ id: 'Marketing', icon: <FolderOpen className="w-3.5 h-3.5"/>, label: 'Marketing', count: mktgCnt })}
          <button className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors">
            <Plus className="w-3.5 h-3.5" /><span>Neues Postfach</span>
          </button>

          <Separator className="my-1.5" />
          <p className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Gespeicherte Filter</p>
          {renderItem({ id: 'vip', icon: <Tag className="w-3.5 h-3.5"/>, label: 'VIP-Kunden' })}
          {renderItem({ id: 'berlin-mktg', icon: <Tag className="w-3.5 h-3.5"/>, label: 'Berliner Marketing' })}
          {renderItem({ id: 'london-mktg', icon: <Tag className="w-3.5 h-3.5"/>, label: 'Londoner Marketing' })}
          <button className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors">
            <Settings className="w-3.5 h-3.5" /><span>Filter verwalten</span>
          </button>
          <button className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors">
            <Plus className="w-3.5 h-3.5" /><span>Filter erstellen</span>
          </button>
        </PopoverContent>
      </Popover>
    ) : (
      <button type="button" className="flex min-w-0 max-w-full items-center gap-1 font-semibold text-[14px] text-foreground transition-colors hover:text-foreground/70">
        <span className="truncate">{viewLabel[current]}</span>
        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/50" />
      </button>
    )
  )
}

// ─── Conversation List ────────────────────────────────────────────────────────

function ConversationList({
  allConversations,
  conversations, selected, onSelect,
  view, onViewChange, status, onStatusChange,
}: {
  allConversations: Conversation[]
  conversations: Conversation[]
  selected: Conversation | null
  onSelect: (c: Conversation) => void
  view: ConversationInboxView
  onViewChange: (v: ConversationInboxView) => void
  status: ConversationStatus
  onStatusChange: (s: ConversationStatus) => void
}) {
  const [search, setSearch] = useState('')
  const normalizedSearch = search.trim().toLowerCase()

  const filtered = conversations.filter(c => {
    const mStatus = (c.status ?? 'offen') === status
    const mSearch = !normalizedSearch
      || c.customerName.toLowerCase().includes(normalizedSearch)
      || c.lastMessage.toLowerCase().includes(normalizedSearch)
      || c.messages.some((message) => message.content.toLowerCase().includes(normalizedSearch))
      || c.vehicleInterest?.toLowerCase().includes(normalizedSearch)
      || c.inbox?.toLowerCase().includes(normalizedSearch)
    return mStatus && mSearch
  })

  const tabs: { value: ConversationStatus; label: string }[] = [
    { value: 'offen',    label: 'Offen'    },
    { value: 'spaeter',  label: 'Später'   },
    { value: 'erledigt', label: 'Erledigt' },
  ]
  const statusDescription: Record<ConversationStatus, string> = {
    offen: 'Neue Nachrichten und aktive Rückfragen zuerst.',
    spaeter: 'Wiedervorlagen mit bewusst verschobener Priorität.',
    erledigt: 'Abgeschlossene Gespräche ohne offene Aktion.',
  }

  return (
    <div className="w-full border-r border-border/50 flex flex-col h-full bg-background lg:w-[288px] lg:shrink-0 xl:w-[336px]">

      {/* ── Top header ── */}
      <div className="border-b border-border/40 bg-white px-3.5 pt-3.5 pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <ViewDropdown current={view} onChange={onViewChange} allConversations={allConversations} />
            <span className="inline-flex h-5.5 shrink-0 items-center rounded-md bg-muted/60 px-2 text-[11px] font-medium tabular-nums text-muted-foreground">
              {filtered.length}
            </span>
          </div>
          <button
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-foreground text-background shadow-sm transition-all hover:opacity-80 active:scale-95"
            title="Neue Unterhaltung"
          >
            <PenSquare className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="mt-2.5 flex items-center gap-1.5">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/50" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Suchen..."
              className="h-8 rounded-lg border-transparent bg-muted/50 pl-8 pr-3 text-[13px] shadow-none placeholder:text-muted-foreground/40 focus-visible:bg-white focus-visible:border-border"
            />
          </div>
          <button className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground">
            <Filter className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="mt-2.5 grid grid-cols-3 gap-0.5 rounded-lg bg-muted/50 p-0.5">
          {tabs.map(t => (
            <button
              key={t.value}
              onClick={() => onStatusChange(t.value)}
              className={cn(
                'rounded-md px-2.5 py-1.5 text-[12px] font-medium transition-all',
                status === t.value
                  ? 'bg-white text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-2.5 flex items-center justify-between">
          <button className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground">
            Am neuesten <ChevronDown className="h-3 w-3" />
          </button>
          <div className="flex items-center gap-0.5">
            {search && (
              <button
                onClick={() => setSearch('')}
                className="rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                Suche löschen
              </button>
            )}
            <button className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground">
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── List ── */}
      <ScrollArea className="flex-1">
        <div className="px-1.5 py-1.5">
        {filtered.length === 0 && (
          <div className="flex h-40 flex-col items-center justify-center gap-2 mx-2 rounded-xl border border-dashed border-border/60 text-muted-foreground/60">
            <Mail className="w-6 h-6" />
            <span className="text-[12px]">
              {search ? 'Keine Treffer für diese Suche' : 'Keine Unterhaltungen'}
            </span>
          </div>
        )}
        {filtered.map(conv => {
          const isSelected = selected?.id === conv.id
          const lc = conv.label ? labelCls[conv.label] : null
          return (
            <button
              key={conv.id}
              onClick={() => onSelect(conv)}
              className={cn(
                'w-full rounded-lg px-3 py-2.5 text-left transition-all group relative',
                isSelected
                  ? 'bg-blue-50/70'
                  : 'hover:bg-muted/40'
              )}
            >
              {isSelected && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-full bg-[#2563EB]" />
              )}
              <div className="flex items-start gap-2.5">
                {/* Channel icon as avatar */}
                <ChannelIcon ch={conv.channel} size="lg" />

                <div className="flex-1 min-w-0">
                  {/* Row 1: name + time */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className={cn(
                          'text-[13px] truncate',
                          conv.unread ? 'font-semibold text-foreground' : 'font-normal text-foreground/80'
                        )}>
                          {conv.customerName}
                        </span>
                        {conv.unread && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#2563EB]" />}
                      </div>
                      {conv.inbox && (
                        <p className="mt-0.5 text-[11px] text-muted-foreground/60 truncate">
                          {conv.inbox}
                        </p>
                      )}
                    </div>
                    <span className={cn(
                      'pt-0.5 text-[10px] shrink-0 tabular-nums',
                      conv.unread ? 'text-[#2563EB] font-medium' : 'text-muted-foreground/50'
                    )}>
                      {fmtTime(conv.lastMessageAt)}
                    </span>
                  </div>

                  {/* Row 2: preview + unread badge */}
                  <div className="mt-1.5 flex min-w-0 items-start gap-2">
                    <p className={cn(
                      'min-w-0 flex-1 overflow-hidden text-[12px] leading-[1.4] break-words [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]',
                      conv.unread ? 'text-foreground/70' : 'text-muted-foreground/60'
                    )}>
                      {conv.lastMessage}
                    </p>
                    {conv.unreadCount > 0 && (
                      <span className="mt-0.5 flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full bg-[#2563EB] px-1 text-[9px] font-bold text-white">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>

                  {/* Label pill */}
                  {lc && (
                    <span className={cn(
                      'inline-flex items-center gap-1 mt-1.5 text-[10px] px-1.5 py-px rounded-md font-medium',
                      lc.pill
                    )}>
                      {conv.label}
                    </span>
                  )}
                </div>
              </div>
            </button>
          )
        })}
        </div>
      </ScrollArea>
    </div>
  )
}

// ─── Chat View ────────────────────────────────────────────────────────────────

const suggestedReplies = [
  'Fahrzeug ist noch verfügbar!',
  'Probefahrt vereinbaren?',
  'Details per E-Mail zusenden',
]

function ChatView({
  conv,
  onBack,
  onOpenContact,
}: {
  conv: Conversation | null
  onBack?: () => void
  onOpenContact?: () => void
}) {
  const [input, setInput] = useState('')
  const sendMessage = useConversationStore((state) => state.sendMessage)
  const updateConversationStatus = useConversationStore((state) => state.updateConversationStatus)
  const toggleLabel = useConversationStore((state) => state.toggleLabel)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [labelOpen, setLabelOpen] = useState(false)

  const handleSend = () => {
    if (!conv || !input.trim()) return
    sendMessage(conv.id, input.trim())
    setInput('')
  }

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      const el = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (el) el.scrollTop = el.scrollHeight
    }
  }, [conv?.messages.length])

  if (!conv) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-muted/20 text-muted-foreground gap-2">
        <div className="w-12 h-12 rounded-xl bg-muted/40 flex items-center justify-center">
          <Mail className="w-5 h-5 opacity-20" />
        </div>
        <p className="text-[13px] font-medium text-foreground/50">Keine Unterhaltung ausgewählt</p>
        <p className="text-[11px] text-muted-foreground/40 max-w-[200px] text-center leading-relaxed">
          Wähle links eine Konversation aus, um sie hier zu öffnen.
        </p>
      </div>
    )
  }

  const lc = conv.label ? labelCls[conv.label] : null

  // Group messages by day
  const groups: { label: string; msgs: typeof conv.messages }[] = []
  conv.messages.forEach(msg => {
    const lbl = dayLabel(msg.timestamp)
    const last = groups[groups.length - 1]
    if (!last || last.label !== lbl) groups.push({ label: lbl, msgs: [msg] })
    else last.msgs.push(msg)
  })

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-white">

      {/* ── Chat header ── */}
      <div className="px-4 py-2.5 border-b border-border/40 flex items-center gap-2.5 bg-white min-h-[52px] sm:px-5">
        {onBack && (
          <button
            onClick={onBack}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
            title="Zurück zur Liste"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
        <Avatar className="w-8 h-8 shrink-0">
          <AvatarFallback className="text-[10px] font-semibold bg-muted/80 text-foreground/60">
            {conv.customerName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[14px] text-foreground">{conv.customerName}</span>
            {lc && (
              <span className={cn('text-[10px] px-1.5 py-px rounded-md font-medium', lc.pill)}>
                {conv.label}
              </span>
            )}
          </div>
        </div>
        {/* Right actions */}
        <div className="hidden items-center gap-0.5 shrink-0 sm:flex">
          {conv.assignedTo && (
            <div className="flex items-center gap-1.5 mr-1.5 px-2 py-1 rounded-md bg-muted/40">
              <Avatar className="w-5 h-5">
                <AvatarFallback className="text-[8px] font-bold bg-[#2563EB] text-white">
                  {conv.assignedTo.split(' ').map(n => n[0]).join('').slice(0,2)}
                </AvatarFallback>
              </Avatar>
              <span className="text-[11px] text-muted-foreground font-medium">
                {conv.assignedTo.split(' ')[0]}
              </span>
            </div>
          )}
          <Popover open={labelOpen} onOpenChange={setLabelOpen}>
            <PopoverTrigger asChild>
              <button title="Label"
                className="p-1.5 rounded-md text-muted-foreground/60 hover:text-foreground hover:bg-muted/50 transition-colors">
                <Tag className="w-3.5 h-3.5" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" sideOffset={6} className="w-44 p-1.5">
              <p className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">Label</p>
              {['Marketing', 'VIP', 'B2B'].map(l => (
                <button key={l} onClick={() => { toggleLabel(conv.id, l); setLabelOpen(false) }}
                  className={cn('w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[13px] transition-colors text-left',
                    conv.label === l ? 'bg-blue-50/60 text-[#2563EB] font-medium' : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                  )}>
                  <span className={cn('w-2 h-2 rounded-full', labelCls[l]?.dot ?? 'bg-gray-400')} />
                  <span className="flex-1">{l}</span>
                  {conv.label === l && <Check className="w-3 h-3 shrink-0" />}
                </button>
              ))}
            </PopoverContent>
          </Popover>
          <button title="Erinnern"
            className="p-1.5 rounded-md text-muted-foreground/60 hover:text-foreground hover:bg-muted/50 transition-colors">
            <Clock className="w-3.5 h-3.5" />
          </button>
          <button title="Erledigen"
            onClick={() => {
              const next = (conv.status ?? 'offen') === 'erledigt' ? 'offen' : 'erledigt'
              updateConversationStatus(conv.id, next)
            }}
            className={cn('p-1.5 rounded-md transition-colors',
              (conv.status ?? 'offen') === 'erledigt'
                ? 'text-emerald-600 hover:bg-emerald-50'
                : 'text-muted-foreground/60 hover:text-foreground hover:bg-muted/50'
            )}>
            <CheckCircle2 className="w-3.5 h-3.5" />
          </button>
          <button title="Mehr"
            className="p-1.5 rounded-md text-muted-foreground/60 hover:text-foreground hover:bg-muted/50 transition-colors">
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>
        {onOpenContact && (
          <button
            onClick={onOpenContact}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
            title="Kontakt öffnen"
          >
            <Users className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* ── Messages ── */}
      <ScrollArea className="flex-1 bg-[#F7F8FA]" ref={scrollRef}>
        <div className="px-4 py-4 sm:px-6">
          {groups.map((group, gi) => (
            <div key={group.label}>
              {/* Channel indicator — shown above first group */}
              {gi === 0 && (
                <div className="flex flex-col items-center mb-5 mt-1 gap-1">
                  <ChannelIcon ch={conv.channel} size="md" />
                  {conv.customerPhone && (
                    <p className="text-[10px] text-muted-foreground/50 font-medium">via {conv.customerPhone}</p>
                  )}
                </div>
              )}
              {/* Day divider */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-border/30" />
                <span className="text-muted-foreground/50 text-[10px] font-medium shrink-0">
                  {group.label}
                </span>
                <div className="flex-1 h-px bg-border/30" />
              </div>
              <div className="space-y-2">
                {group.msgs.map(msg => {
                  const isAdvisor = msg.sender === 'advisor'
                  return (
                    <div key={msg.id} className={cn('flex gap-2', isAdvisor ? 'justify-end' : 'justify-start')}>
                      <div className={cn(
                        'max-w-[80%] rounded-[18px] px-3.5 py-2 sm:max-w-[70%] lg:max-w-[60%]',
                        isAdvisor
                          ? 'bg-[#2563EB] text-white'
                          : 'bg-white text-foreground shadow-[0_1px_3px_rgba(0,0,0,0.06)]'
                      )}>
                        <p className="text-[13px] leading-[1.55]">{msg.content}</p>
                        <div className={cn(
                          'flex items-center gap-1 mt-0.5 justify-end',
                          isAdvisor ? 'opacity-50' : 'opacity-30'
                        )}>
                          <span className="text-[10px] tabular-nums">{fmtMsgTime(msg.timestamp)}</span>
                          {isAdvisor && (
                            <svg viewBox="0 0 16 10" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="1 5 4 8 9 2" />
                              <polyline points="6 5 9 8 14 2" opacity=".55" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* ── AI suggested replies + Composer ── */}
      <div className="bg-white border-t border-border/40">
        {/* AI suggestions */}
        <div className="px-4 pt-3 pb-2">
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-violet-500" />
            <span className="text-[11px] font-medium text-muted-foreground">KI-Vorschläge</span>
            <span className="text-[10px] text-muted-foreground/40">— wird erst nach Freigabe gesendet</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {suggestedReplies.map((r, i) => (
              <button
                key={i}
                onClick={() => setInput(r)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/60 bg-white hover:bg-violet-50 hover:border-violet-200 text-foreground/80 text-[12px] font-medium transition-all group shadow-xs"
              >
                <Zap className="w-2.5 h-2.5 shrink-0 text-violet-400 group-hover:text-violet-500 transition-colors" />
                <span>{r}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Composer */}
        <div className="px-4 pt-1 pb-3">
          <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-white px-3 py-1.5 focus-within:border-[#2563EB]/40 focus-within:shadow-[0_0_0_3px_rgba(37,99,235,0.08)] transition-all">
            <div className="flex items-center gap-0.5 shrink-0">
              <button className="p-1 rounded-md text-muted-foreground/40 hover:text-foreground hover:bg-muted/40 transition-colors">
                <Paperclip className="w-4 h-4" />
              </button>
              <button className="p-1 rounded-md text-muted-foreground/40 hover:text-foreground hover:bg-muted/40 transition-colors">
                <ImageIcon className="w-4 h-4" />
              </button>
            </div>
            <Textarea
              placeholder="Nachricht schreiben..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
              className="flex-1 min-h-0 max-h-28 resize-none border-0 bg-transparent px-0 py-1 text-[13px] leading-6 focus-visible:ring-0 shadow-none placeholder:text-muted-foreground/40"
              rows={1}
            />
            <div className="flex items-center gap-0.5 shrink-0">
              <button className="p-1 rounded-md text-muted-foreground/40 hover:text-foreground hover:bg-muted/40 transition-colors">
                <Smile className="w-4 h-4" />
              </button>
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center transition-all',
                  input.trim() ? 'bg-[#2563EB] text-white hover:bg-[#1d4ed8] shadow-sm' : 'bg-muted/50 text-muted-foreground/30'
                )}
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Contact Panel ────────────────────────────────────────────────────────────

function ContactPanel({
  conv,
  onBack,
  isAdmin,
}: {
  conv: Conversation | null
  onBack?: () => void
  isAdmin?: boolean
}) {
  const [attrsOpen, setAttrsOpen] = useState(true)
  const [convOpen,  setConvOpen]  = useState(true)
  const [assignOpen, setAssignOpen] = useState(false)
  const [filesOpen, setFilesOpen] = useState(false)
  const [notesOpen, setNotesOpen] = useState(false)
  const [autoOpen, setAutoOpen] = useState(false)
  const [intOpen, setIntOpen] = useState(false)
  const [trackOpen, setTrackOpen] = useState(false)
  const mounted = useHydrated()
  const assignConversation = useConversationStore((state) => state.assignConversation)

  if (!conv) return null
  const lc = conv.label ? labelCls[conv.label] : null

  return (
    <div className="w-full border-t flex flex-col h-full bg-background lg:w-[280px] lg:shrink-0 lg:border-l lg:border-t-0 border-border/40">

      {/* Header */}
      <div className="px-4 py-2.5 border-b border-border/40 flex items-center justify-between min-h-[52px]">
        <div className="flex items-center gap-1.5">
          {onBack && (
            <button
              onClick={onBack}
              className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
              title="Zurück zum Chat"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
          <span className="font-semibold text-[13px]">Kontakt</span>
        </div>
        <div className="flex items-center gap-0.5">
          <button title="Weiterleiten"
            className="p-1.5 rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-muted/50 transition-colors">
            <ArrowLeftRight className="w-3.5 h-3.5" />
          </button>
          {isAdmin && mounted ? (
            <Popover open={assignOpen} onOpenChange={setAssignOpen}>
              <PopoverTrigger asChild>
                <button title="Zuweisen"
                  className={cn(
                    'p-1.5 rounded-md transition-colors',
                    conv.assignedTo
                      ? 'text-[#2563EB] hover:bg-blue-50/50'
                      : 'text-muted-foreground/50 hover:text-foreground hover:bg-muted/50'
                  )}>
                  <UserPlus className="w-3.5 h-3.5" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" sideOffset={6} className="w-56 p-1.5">
                <p className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Zuweisen an
                </p>
                <button
                  onClick={() => { assignConversation(conv.id, null); setAssignOpen(false) }}
                  className={cn(
                    'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[13px] transition-colors text-left',
                    !conv.assignedTo ? 'bg-blue-50/60 text-[#2563EB] font-medium' : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                  )}
                >
                  <UserX className="w-3.5 h-3.5 shrink-0" />
                  <span>Nicht zugewiesen</span>
                  {!conv.assignedTo && <Check className="w-3 h-3 shrink-0 ml-auto" />}
                </button>
                <Separator className="my-1" />
                {mockAdvisors.map(a => (
                  <button
                    key={a.id}
                    onClick={() => { assignConversation(conv.id, a.name); setAssignOpen(false) }}
                    className={cn(
                      'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[13px] transition-colors text-left',
                      conv.assignedTo === a.name ? 'bg-blue-50/60 text-[#2563EB] font-medium' : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                    )}
                  >
                    <Avatar className="w-5 h-5 shrink-0">
                      <AvatarFallback className="text-[8px] font-bold bg-muted text-foreground/70">
                        {a.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="flex-1 truncate">{a.name}</span>
                    {conv.assignedTo === a.name && <Check className="w-3 h-3 shrink-0" />}
                  </button>
                ))}
              </PopoverContent>
            </Popover>
          ) : (
            <button title="Zuweisen"
              className={cn(
                'p-1.5 rounded-md transition-colors',
                isAdmin && conv.assignedTo
                  ? 'text-[#2563EB] hover:bg-blue-50/50'
                  : 'text-muted-foreground/50 hover:text-foreground hover:bg-muted/50'
              )}>
              <UserPlus className="w-3.5 h-3.5" />
            </button>
          )}
          <button title="Schließen"
            className="p-1.5 rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-muted/50 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <ScrollArea className="flex-1">

        {/* Kontaktlisten */}
        <div className="px-4 py-3 border-b border-border/30">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground/50 font-medium mb-2">Kontaktlisten</p>
          <div className="flex flex-wrap items-center gap-1.5">
            {lc && (
              <span className={cn('text-[10px] px-2 py-0.5 rounded-md font-medium', lc.pill)}>
                {conv.label}
              </span>
            )}
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-muted/60 text-muted-foreground font-medium">
              New Leads
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-muted/40 text-muted-foreground/60 font-medium cursor-pointer hover:bg-muted/70 transition-colors">
              +2
            </span>
          </div>
        </div>

        {/* Letzte Unterhaltungen */}
        <div className="border-b border-border/30">
          <button
            onClick={() => setConvOpen(v => !v)}
            className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-muted/20 transition-colors"
          >
            <span className="text-[12px] font-medium text-foreground/80">
              Letzte Unterhaltungen
              <span className="ml-1.5 text-muted-foreground/40 text-[11px]">2</span>
            </span>
            <ChevronDown className={cn('w-3 h-3 text-muted-foreground/40 transition-transform', !convOpen && '-rotate-90')} />
          </button>
          {convOpen && (
            <div className="px-4 pb-3 space-y-2.5">
              {[
                { ch: 'whatsapp' as MessageChannel, label: 'Zentrale',  date: 'Gestern',    preview: 'Freut mich, wieder von dir zu hören! Hier…' },
                { ch: 'instagram' as MessageChannel, label: 'Marketing', date: '20.12.2024', preview: 'Danke, dass Sie das Dokument geteilt ha…' },
              ].map(r => (
                <div key={r.label} className="flex items-start gap-2 group cursor-pointer rounded-md px-1 py-1 -mx-1 hover:bg-muted/20 transition-colors">
                  <ChannelIcon ch={r.ch} size="xs" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-1">
                      <span className="text-[11px] font-medium text-foreground/80">{r.label}</span>
                      <span className="text-[10px] text-muted-foreground/40 shrink-0">{r.date}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground/50 truncate">{r.preview}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Attribute */}
        <div className="border-b border-border/30">
          <button
            onClick={() => setAttrsOpen(v => !v)}
            className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-muted/20 transition-colors"
          >
            <span className="text-[12px] font-medium text-foreground/80">Attribute</span>
            <ChevronDown className={cn('w-3 h-3 text-muted-foreground/40 transition-transform', !attrsOpen && '-rotate-90')} />
          </button>
          {attrsOpen && (
            <div className="px-4 pb-3 space-y-2">
                {[
                  { icon: <Users className="w-3 h-3"/>, label: 'Vorname',  value: conv.customerName.split(' ')[0] },
                  { icon: <Users className="w-3 h-3"/>, label: 'Nachname', value: conv.customerName.split(' ').slice(1).join(' ') || '—' },
                  { icon: <AtSign className="w-3 h-3"/>, label: 'E-Mail',  value: conv.customerEmail ?? '—' },
                  { icon: <Phone className="w-3 h-3"/>,  label: 'Telefon', value: conv.customerPhone ?? '—' },
                ].map(row => (
                  <div key={row.label} className="flex items-center gap-2 min-w-0">
                    <span className="text-muted-foreground/40 shrink-0">{row.icon}</span>
                    <span className="text-[11px] text-muted-foreground/50 w-[52px] shrink-0">{row.label}</span>
                    <span className={cn('text-[11px] truncate flex-1', row.value === '—' ? 'text-muted-foreground/30' : 'text-foreground/80')}>{row.value}</span>
                  </div>
                ))}
              <button className="text-[11px] text-[#2563EB] hover:text-[#1d4ed8] mt-1 font-medium transition-colors">Alle anzeigen</button>
            </div>
          )}
        </div>

        {/* Dateien */}
        <div className="border-b border-border/30">
          <button onClick={() => setFilesOpen(v => !v)}
            className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-muted/20 transition-colors">
            <span className="text-[12px] font-medium text-foreground/80">Dateien</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] bg-muted/60 text-muted-foreground/60 rounded-md px-1.5 py-px font-medium tabular-nums">3</span>
              <ChevronDown className={cn('w-3 h-3 text-muted-foreground/40 transition-transform', !filesOpen && '-rotate-90')} />
            </div>
          </button>
          {filesOpen && (
            <div className="px-4 pb-3 space-y-2">
              {[
                { name: 'Fahrzeugschein_320d.pdf', size: '245 KB', date: '02.03.2026', icon: <FileText className="w-3.5 h-3.5" /> },
                { name: 'Angebot_BMW_320d.pdf', size: '128 KB', date: '01.03.2026', icon: <FileText className="w-3.5 h-3.5" /> },
                { name: 'Foto_Fahrzeug.jpg', size: '1.2 MB', date: '28.02.2026', icon: <ImageIcon className="w-3.5 h-3.5" /> },
              ].map(f => (
                <div key={f.name} className="flex items-center gap-2 group cursor-pointer rounded-md px-1 py-1 -mx-1 hover:bg-muted/20 transition-colors">
                  <span className="text-muted-foreground/50 shrink-0">{f.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium text-foreground/80 truncate">{f.name}</p>
                    <p className="text-[10px] text-muted-foreground/40">{f.size} · {f.date}</p>
                  </div>
                  <Download className="w-3 h-3 text-muted-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notizen */}
        <div className="border-b border-border/30">
          <button onClick={() => setNotesOpen(v => !v)}
            className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-muted/20 transition-colors">
            <span className="text-[12px] font-medium text-foreground/80">Notizen</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] bg-muted/60 text-muted-foreground/60 rounded-md px-1.5 py-px font-medium tabular-nums">2</span>
              <ChevronDown className={cn('w-3 h-3 text-muted-foreground/40 transition-transform', !notesOpen && '-rotate-90')} />
            </div>
          </button>
          {notesOpen && (
            <div className="px-4 pb-3 space-y-2">
              {[
                { text: 'Kunde bevorzugt Finanzierung über 48 Monate. Schufa-Score anfragen.', author: 'Thomas', date: '04.03.2026' },
                { text: 'Interesse an Garantieverlängerung. Angebot nachreichen.', author: 'Sarah', date: '02.03.2026' },
              ].map((n, i) => (
                <div key={i} className="rounded-md bg-amber-50/40 border border-amber-100/50 px-2.5 py-2">
                  <p className="text-[11px] text-foreground/80 leading-relaxed">{n.text}</p>
                  <p className="text-[10px] text-muted-foreground/40 mt-1">{n.author} · {n.date}</p>
                </div>
              ))}
              <button className="w-full flex items-center justify-center gap-1 py-1.5 rounded-md text-[11px] font-medium text-[#2563EB] hover:bg-blue-50/50 transition-colors">
                <Plus className="w-3 h-3" /> Notiz hinzufügen
              </button>
            </div>
          )}
        </div>

        {/* Automations */}
        <div className="border-b border-border/30">
          <button onClick={() => setAutoOpen(v => !v)}
            className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-muted/20 transition-colors">
            <span className="text-[12px] font-medium text-foreground/80">Automations</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] bg-muted/60 text-muted-foreground/60 rounded-md px-1.5 py-px font-medium tabular-nums">1</span>
              <ChevronDown className={cn('w-3 h-3 text-muted-foreground/40 transition-transform', !autoOpen && '-rotate-90')} />
            </div>
          </button>
          {autoOpen && (
            <div className="px-4 pb-3 space-y-2">
              <div className="flex items-start gap-2 rounded-md px-1 py-1 -mx-1">
                <Bot className="w-3.5 h-3.5 text-violet-500 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-medium text-foreground/80">Follow-up nach 48h</p>
                  <p className="text-[10px] text-muted-foreground/40">Automatische Erinnerung wenn keine Antwort</p>
                  <span className="inline-flex items-center mt-1 text-[9px] font-medium px-1.5 py-px rounded bg-emerald-50 text-emerald-600">Aktiv</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Integrations */}
        <div className="border-b border-border/30">
          <button onClick={() => setIntOpen(v => !v)}
            className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-muted/20 transition-colors">
            <span className="text-[12px] font-medium text-foreground/80">Integrations</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] bg-muted/60 text-muted-foreground/60 rounded-md px-1.5 py-px font-medium tabular-nums">2</span>
              <ChevronDown className={cn('w-3 h-3 text-muted-foreground/40 transition-transform', !intOpen && '-rotate-90')} />
            </div>
          </button>
          {intOpen && (
            <div className="px-4 pb-3 space-y-2">
              {[
                { name: 'mobile.de', status: 'Verbunden', icon: <Link2 className="w-3.5 h-3.5" />, color: 'text-orange-500' },
                { name: 'AutoScout24', status: 'Verbunden', icon: <ExternalLink className="w-3.5 h-3.5" />, color: 'text-blue-500' },
              ].map(int => (
                <div key={int.name} className="flex items-center gap-2 rounded-md px-1 py-1 -mx-1">
                  <span className={cn('shrink-0', int.color)}>{int.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium text-foreground/80">{int.name}</p>
                  </div>
                  <span className="text-[9px] font-medium px-1.5 py-px rounded bg-emerald-50 text-emerald-600">{int.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Web-Tracking */}
        <div className="border-b border-border/30">
          <button onClick={() => setTrackOpen(v => !v)}
            className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-muted/20 transition-colors">
            <span className="text-[12px] font-medium text-foreground/80">Web-Tracking</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] bg-muted/60 text-muted-foreground/60 rounded-md px-1.5 py-px font-medium tabular-nums">4</span>
              <ChevronDown className={cn('w-3 h-3 text-muted-foreground/40 transition-transform', !trackOpen && '-rotate-90')} />
            </div>
          </button>
          {trackOpen && (
            <div className="px-4 pb-3 space-y-2">
              {[
                { page: 'BMW 320d Touring - Detailseite', time: 'Heute, 10:42', duration: '3:24 Min', icon: <Eye className="w-3 h-3" /> },
                { page: 'Finanzierungsrechner', time: 'Heute, 10:38', duration: '1:48 Min', icon: <MousePointerClick className="w-3 h-3" /> },
                { page: 'Startseite', time: 'Heute, 10:35', duration: '0:32 Min', icon: <Globe className="w-3 h-3" /> },
                { page: 'BMW Fahrzeuge - Übersicht', time: 'Gestern, 16:12', duration: '5:10 Min', icon: <Eye className="w-3 h-3" /> },
              ].map((t, i) => (
                <div key={i} className="flex items-start gap-2 rounded-md px-1 py-1 -mx-1">
                  <span className="text-muted-foreground/40 shrink-0 mt-0.5">{t.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium text-foreground/80 truncate">{t.page}</p>
                    <p className="text-[10px] text-muted-foreground/40">{t.time} · {t.duration}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="h-4" />
      </ScrollArea>
    </div>
  )
}

// ─── Perspective Selector ────────────────────────────────────────────────────

const humanCallAgents = mockCallAgents.filter(a => a.type === 'mensch')

function PerspectiveSelector({
  perspective,
  onChange,
}: {
  perspective: NachrichtenPerspective
  onChange: (p: NachrichtenPerspective) => void
}) {
  const [open, setOpen] = useState(false)
  const mounted = useHydrated()

  const renderItem = (p: NachrichtenPerspective, subtitle?: string) => {
    const active = perspective.type === p.type && perspective.userName === p.userName
    return (
      <button
        key={p.label}
        onClick={() => { onChange(p); setOpen(false) }}
        className={cn(
          'w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] transition-colors text-left',
          active ? 'bg-blue-50/60 text-[#2563EB] font-medium' : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
        )}
      >
        <span className="flex-1 truncate">
          {p.userName ?? p.label}
          {subtitle && <span className="ml-1.5 text-[11px] text-muted-foreground/60">{subtitle}</span>}
        </span>
        {active && <Check className="w-3 h-3 shrink-0" />}
      </button>
    )
  }

  if (!mounted) {
    return (
      <div className="flex items-center gap-2 px-4 py-1.5 border-b border-border/30 bg-muted/10">
        <Shield className="w-3 h-3 text-muted-foreground/40" />
        <span className="text-[11px] text-muted-foreground/50 font-medium">Perspektive:</span>
        <span className="text-[12px] font-medium text-foreground/70">{perspective.label}</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 px-4 py-1.5 border-b border-border/30 bg-muted/10">
      <Shield className="w-3 h-3 text-muted-foreground/40" />
      <span className="text-[11px] text-muted-foreground/50 font-medium">Perspektive:</span>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[12px] font-medium text-foreground/70 hover:bg-muted/40 transition-colors">
          <span>{perspective.label}</span>
          <ChevronDown className={cn('w-3 h-3 text-muted-foreground/40 transition-transform duration-150', open && 'rotate-180')} />
        </PopoverTrigger>
        <PopoverContent align="start" sideOffset={6} className="w-60 p-1.5">
          {renderItem({ type: 'admin', label: 'Admin (Alle)' })}

          <Separator className="my-1.5" />
          <p className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">Serviceberater</p>
          {mockAdvisors.map(a =>
            renderItem(
              { type: 'serviceberater', userName: a.name, label: a.name },
              a.role,
            )
          )}

          <Separator className="my-1.5" />
          <p className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">Call-Center-Mitarbeiter</p>
          {humanCallAgents.map(a =>
            renderItem(
              { type: 'callcenter', userName: a.name, label: a.name },
            )
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NachrichtenPage() {
  const conversations = useConversationStore((state) => state.conversations)
  const view = useConversationStore((state) => state.view)
  const setView = useConversationStore((state) => state.setView)
  const convStatus = useConversationStore((state) => state.statusFilter)
  const setConvStatus = useConversationStore((state) => state.setStatusFilter)
  const selectedConversationId = useConversationStore((state) => state.selectedConversationId)
  const setSelectedConversation = useConversationStore((state) => state.setSelectedConversation)
  const perspective = useConversationStore((state) => state.perspective)
  const setPerspective = useConversationStore((state) => state.setPerspective)
  const [mobilePanel, setMobilePanel] = useState<'list' | 'chat' | 'contact'>('list')

  const isAdmin = perspective.type === 'admin'

  // Step 1: Filter by perspective
  const perspectiveFiltered = (() => {
    if (isAdmin) return conversations
    return conversations.filter(c => !c.assignedTo || c.assignedTo === perspective.userName)
  })()

  // Step 2: Filter by inbox view
  const visible = (() => {
    switch (view) {
      case 'alle':       return perspectiveFiltered
      case 'ungelesen':  return perspectiveFiltered.filter(c => c.unread)
      case 'mir':        return perspectiveFiltered.filter(c => c.assignedTo === perspective.userName)
      case 'nicht':      return perspectiveFiltered.filter(c => !c.assignedTo)
      case 'vip':        return perspectiveFiltered.filter(c => c.label === 'VIP')
      case 'berlin-mktg':
      case 'london-mktg': return perspectiveFiltered.filter(c => c.label === 'Marketing')
      case 'markiert':
      case 'papierkorb':
      case 'spam':       return perspectiveFiltered
      default:           return perspectiveFiltered.filter(c => c.inbox === view)
    }
  })()

  const selected = conversations.find((conversation) => conversation.id === selectedConversationId) ?? null

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PerspectiveSelector perspective={perspective} onChange={setPerspective} />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div className={cn('h-full w-full lg:w-[288px] lg:shrink-0 xl:w-[336px]', mobilePanel === 'list' ? 'flex' : 'hidden lg:flex')}>
          <ConversationList
            allConversations={perspectiveFiltered}
            conversations={visible}
            selected={selected}
            onSelect={(conversation) => {
              setSelectedConversation(conversation.id)
              setMobilePanel('chat')
            }}
            view={view}
            onViewChange={setView}
            status={convStatus}
            onStatusChange={setConvStatus}
          />
        </div>

        <div className={cn('h-full min-w-0 flex-1', mobilePanel === 'chat' ? 'flex' : 'hidden lg:flex')}>
          <ChatView
            conv={selected}
            onBack={() => setMobilePanel('list')}
            onOpenContact={() => setMobilePanel('contact')}
          />
        </div>

        {(selected || mobilePanel === 'contact') && (
          <div className={cn('h-full w-full lg:w-[280px] lg:shrink-0', mobilePanel === 'contact' ? 'flex' : 'hidden lg:flex')}>
            <ContactPanel
              conv={selected}
              onBack={() => setMobilePanel('chat')}
              isAdmin={isAdmin}
            />
          </div>
        )}
      </div>
    </div>
  )
}
