'use client'

import { useState } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useConversationStore, type ConversationInboxView } from '@/lib/stores/conversation-store'
import { cn } from '@/lib/utils'
import type { Conversation, MessageChannel, ConversationStatus } from '@/lib/types'
import {
  Search, Send, Sparkles, ChevronDown,
  Star, Trash2, AlertCircle, Users, UserX, Mail,
  ArrowLeftRight, UserPlus, X, Tag, Clock, CheckCircle2, MoreHorizontal,
  Phone, AtSign, FolderOpen, Plus, Settings, Paperclip,
  Smile, Image, Hash, PenSquare, Check, Zap, Filter,
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

// ─── Channel Icon ─────────────────────────────────────────────────────────────

const chBg: Record<MessageChannel, string> = {
  whatsapp:  'bg-[#25D366]',
  messenger: 'bg-[#0084FF]',
  instagram: 'bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF]',
  telegram:  'bg-[#26A5E4]',
  email:     'bg-[#EA4335]',
  sms:       'bg-[#8B5CF6]',
  mobile_de: 'bg-[#FF6600]',
}

type IconSize = 'xs' | 'sm' | 'md' | 'lg'

function ChannelIcon({ ch, size = 'md' }: { ch: MessageChannel; size?: IconSize }) {
  const outer = { xs: 'w-4 h-4', sm: 'w-5 h-5', md: 'w-7 h-7', lg: 'w-9 h-9' }[size]
  const inner = { xs: 'w-2.5 h-2.5', sm: 'w-3 h-3', md: 'w-4 h-4', lg: 'w-5 h-5' }[size]
  const map: Record<MessageChannel, React.ReactNode> = {
    whatsapp:  <WhatsAppSVG  cls={inner} />,
    messenger: <MessengerSVG cls={inner} />,
    instagram: <InstagramSVG cls={inner} />,
    telegram:  <TelegramSVG  cls={inner} />,
    email:     <EmailSVG     cls={inner} />,
    sms:       <SmsSVG       cls={inner} />,
    mobile_de: <MobileDeSVG  cls={inner} />,
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

// Label colour map — pastel pills
const labelCls: Record<string, { pill: string; dot: string }> = {
  Marketing: { pill: 'bg-pink-50 text-pink-600 border-pink-200',   dot: 'bg-pink-400'   },
  VIP:       { pill: 'bg-amber-50 text-amber-600 border-amber-200', dot: 'bg-amber-400'  },
  B2B:       { pill: 'bg-blue-50 text-blue-600 border-blue-200',    dot: 'bg-blue-400'   },
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
          active ? 'bg-[#EBF5FB] text-[#1a73e8] font-medium' : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
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
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1 font-semibold text-[15px] text-foreground hover:text-muted-foreground transition-colors">
          {viewLabel[current]}
          <ChevronDown className={cn('w-4 h-4 text-muted-foreground/70 transition-transform duration-150', open && 'rotate-180')} />
        </button>
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

  const filtered = conversations.filter(c => {
    const mStatus = (c.status ?? 'offen') === status
    const mSearch = !search
      || c.customerName.toLowerCase().includes(search.toLowerCase())
      || c.lastMessage.toLowerCase().includes(search.toLowerCase())
    return mStatus && mSearch
  })

  const tabs: { value: ConversationStatus; label: string }[] = [
    { value: 'offen',    label: 'Offen'    },
    { value: 'spaeter',  label: 'Später'   },
    { value: 'erledigt', label: 'Erledigt' },
  ]

  return (
    <div className="w-[280px] border-r flex flex-col h-full shrink-0 bg-background">

      {/* ── Top header ── */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <ViewDropdown current={view} onChange={onViewChange} allConversations={allConversations} />
        <div className="flex items-center gap-1">
          <button className="p-1.5 rounded-full text-muted-foreground hover:bg-muted transition-colors" title="Suchen">
            <Search className="w-[15px] h-[15px]" />
          </button>
          {/* Teal compose button — signature Superchat element */}
          <button className="w-7 h-7 rounded-full bg-[#00BCD4] hover:bg-[#00ACC1] flex items-center justify-center transition-colors shadow-sm" title="Neue Unterhaltung">
            <PenSquare className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      </div>

      {/* ── Status tabs — pill style ── */}
      <div className="px-4 pb-2 flex gap-1">
        {tabs.map(t => (
          <button
            key={t.value}
            onClick={() => onStatusChange(t.value)}
            className={cn(
              'flex-1 py-1 text-[12px] font-medium rounded-full transition-colors',
              status === t.value
                ? 'bg-[#1a73e8] text-white shadow-sm'
                : 'text-muted-foreground hover:bg-muted'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Sort + filter bar ── */}
      <div className="px-4 py-1 flex items-center justify-between">
        <button className="flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground transition-colors">
          Am neuesten <ChevronDown className="w-3 h-3" />
        </button>
        <div className="flex items-center gap-1">
          <button className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <Filter className="w-3 h-3" />
          </button>
          <button className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <MoreHorizontal className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* ── List ── */}
      <ScrollArea className="flex-1">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center h-36 gap-2 text-muted-foreground/50">
            <Mail className="w-7 h-7" />
            <span className="text-xs">Keine Unterhaltungen</span>
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
                'w-full px-4 py-3 border-b text-left transition-colors group',
                isSelected ? 'bg-[#EBF5FB]' : 'hover:bg-muted/30'
              )}
            >
              <div className="flex items-start gap-3">
                {/* Channel icon as avatar — key Superchat pattern */}
                <ChannelIcon ch={conv.channel} size="lg" />

                <div className="flex-1 min-w-0">
                  {/* Row 1: name + time */}
                  <div className="flex items-baseline justify-between gap-1">
                    <span className={cn(
                      'text-[13px] truncate',
                      conv.unread ? 'font-semibold text-foreground' : 'font-medium text-foreground/80'
                    )}>
                      {conv.customerName}
                    </span>
                    <span className={cn(
                      'text-[11px] shrink-0 tabular-nums',
                      conv.unread ? 'text-[#1a73e8] font-medium' : 'text-muted-foreground'
                    )}>
                      {fmtTime(conv.lastMessageAt)}
                    </span>
                  </div>

                  {/* Row 2: inbox folder */}
                  {conv.inbox && (
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                      ▸ {conv.inbox}
                    </p>
                  )}

                  {/* Row 3: unread badge + preview */}
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {conv.unreadCount > 0 && (
                      <span className="shrink-0 min-w-[16px] h-4 px-1 rounded-full bg-[#1a73e8] text-white text-[9px] font-bold flex items-center justify-center">
                        {conv.unreadCount}
                      </span>
                    )}
                    <p className={cn(
                      'text-[11px] truncate',
                      conv.unread ? 'text-foreground/80' : 'text-muted-foreground'
                    )}>
                      {conv.lastMessage}
                    </p>
                  </div>

                  {/* Row 4: label pill */}
                  {lc && (
                    <span className={cn(
                      'inline-flex items-center gap-1 mt-1.5 text-[10px] px-2 py-0.5 rounded-full border font-semibold tracking-wide',
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

function ChatView({ conv }: { conv: Conversation | null }) {
  const [input, setInput] = useState('')

  if (!conv) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#F8FAFB] text-muted-foreground gap-3">
        <div className="w-16 h-16 rounded-full bg-muted/40 flex items-center justify-center">
          <Mail className="w-7 h-7 opacity-25" />
        </div>
        <p className="text-sm font-medium">Wähle eine Unterhaltung aus</p>
        <p className="text-xs text-muted-foreground/60 max-w-[180px] text-center leading-relaxed">
          Klicke links auf eine Nachricht, um sie hier zu öffnen.
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
    <div className="flex-1 flex flex-col min-w-0 bg-background">

      {/* ── Chat header ── */}
      <div className="px-5 py-3 border-b flex items-center gap-3 bg-white min-h-[57px]">
        {/* Initials avatar (Superchat uses initials in the chat header, not channel icon) */}
        <Avatar className="w-8 h-8 shrink-0">
          <AvatarFallback className="text-xs font-bold bg-muted text-foreground/70">
            {conv.customerName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[14px]">{conv.customerName}</span>
            {lc && (
              <span className={cn('text-[10px] px-2 py-0.5 rounded-full border font-semibold', lc.pill)}>
                {conv.label}
              </span>
            )}
          </div>
        </div>
        {/* Right actions */}
        <div className="flex items-center gap-0.5 shrink-0">
          {conv.assignedTo && (
            <div className="flex items-center -space-x-1 mr-2">
              <Avatar className="w-6 h-6 ring-2 ring-white">
                <AvatarFallback className="text-[8px] font-bold bg-[#1a73e8] text-white">
                  {conv.assignedTo.split(' ').map(n => n[0]).join('').slice(0,2)}
                </AvatarFallback>
              </Avatar>
              <span className="ml-2 text-[11px] text-muted-foreground font-medium">
                {conv.assignedTo.split(' ')[0]}
              </span>
            </div>
          )}
          {([
            { icon: <Tag className="w-4 h-4"/>,          title: 'Label' },
            { icon: <Clock className="w-4 h-4"/>,         title: 'Erinnern' },
            { icon: <CheckCircle2 className="w-4 h-4"/>,  title: 'Erledigen' },
            { icon: <MoreHorizontal className="w-4 h-4"/>, title: 'Mehr' },
          ] as const).map(a => (
            <button key={a.title} title={a.title}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              {a.icon}
            </button>
          ))}
        </div>
      </div>

      {/* ── Messages ── */}
      <ScrollArea className="flex-1 bg-[#F8FAFB]">
        <div className="px-5 py-4">
          {groups.map((group, gi) => (
            <div key={group.label}>
              {/* Channel indicator — shown above first group like Superchat */}
              {gi === 0 && (
                <div className="flex flex-col items-center mb-5 mt-1 gap-1.5">
                  <ChannelIcon ch={conv.channel} size="md" />
                  {conv.customerPhone && (
                    <p className="text-[11px] text-muted-foreground">via {conv.customerPhone}</p>
                  )}
                </div>
              )}
              {/* Day divider */}
              <div className="flex items-center justify-center mb-4">
                <span className="bg-white border text-muted-foreground text-[10px] px-3 py-1 rounded-full font-medium shadow-xs">
                  {group.label}
                </span>
              </div>
              <div className="space-y-2.5">
                {group.msgs.map(msg => {
                  const isAdvisor = msg.sender === 'advisor'
                  return (
                    <div key={msg.id} className={cn('flex gap-2', isAdvisor ? 'justify-end' : 'justify-start')}>
                      <div className={cn(
                        'max-w-[65%] rounded-2xl px-3.5 py-2.5',
                        isAdvisor
                          ? 'bg-[#1a73e8] text-white rounded-br-[4px]'
                          : 'bg-white border border-border/60 text-foreground rounded-bl-[4px] shadow-xs'
                      )}>
                        <p className="text-[13px] leading-[1.5]">{msg.content}</p>
                        <div className={cn(
                          'flex items-center gap-1 mt-1 justify-end',
                          isAdvisor ? 'opacity-60' : 'opacity-40'
                        )}>
                          <span className="text-[10px] tabular-nums">{fmtMsgTime(msg.timestamp)}</span>
                          {isAdvisor && (
                            /* double-tick checkmark */
                            <svg viewBox="0 0 16 10" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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

      {/* ── AI suggested replies — Superchat full-width button style ── */}
      <div className="px-5 pt-3 pb-1 bg-white border-t space-y-1.5">
        {suggestedReplies.map((r, i) => (
          <button
            key={i}
            onClick={() => setInput(r)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-[#1a73e8]/30 bg-[#EBF5FB]/60 hover:bg-[#EBF5FB] text-[#1a73e8] text-[12px] font-medium transition-colors"
          >
            <Zap className="w-3 h-3 shrink-0" />
            {r}
          </button>
        ))}
      </div>

      {/* ── Composer ── */}
      <div className="px-4 py-3 bg-white border-t">
        <div className="flex items-end gap-2 rounded-xl border bg-muted/20 px-3 py-2 focus-within:ring-1 focus-within:ring-[#1a73e8]/40 transition-shadow">
          <div className="flex items-center gap-0.5 shrink-0 pb-0.5">
            <button className="p-1.5 rounded-md text-muted-foreground hover:text-foreground transition-colors">
              <Paperclip className="w-4 h-4" />
            </button>
            <button className="p-1.5 rounded-md text-muted-foreground hover:text-foreground transition-colors">
              <Image className="w-4 h-4" />
            </button>
          </div>
          <Textarea
            placeholder={`Hi ${conv.customerName.split(' ')[0]},`}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); setInput('') } }}
            className="flex-1 min-h-0 max-h-28 resize-none border-0 bg-transparent p-0 text-[13px] focus-visible:ring-0 shadow-none"
            rows={1}
          />
          <div className="flex items-center gap-0.5 shrink-0 pb-0.5">
            <button className="p-1.5 rounded-md text-muted-foreground hover:text-foreground transition-colors">
              <Smile className="w-4 h-4" />
            </button>
            <button
              onClick={() => setInput('')}
              disabled={!input.trim()}
              className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center transition-colors',
                input.trim() ? 'bg-[#1a73e8] text-white hover:bg-[#1557b0]' : 'bg-muted text-muted-foreground'
              )}
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Contact Panel ────────────────────────────────────────────────────────────

function ContactPanel({ conv }: { conv: Conversation | null }) {
  const [attrsOpen, setAttrsOpen] = useState(true)
  const [convOpen,  setConvOpen]  = useState(true)

  if (!conv) return null
  const lc = conv.label ? labelCls[conv.label] : null

  return (
    <div className="w-[272px] border-l flex flex-col h-full shrink-0 bg-background">

      {/* Header */}
      <div className="px-4 py-3 border-b flex items-center justify-between min-h-[57px]">
        <span className="font-semibold text-[14px]">Kontakt</span>
        <div className="flex items-center gap-0.5">
          {([
            { icon: <ArrowLeftRight className="w-3.5 h-3.5"/>, title: 'Weiterleiten' },
            { icon: <UserPlus      className="w-3.5 h-3.5"/>, title: 'Zuweisen'     },
            { icon: <X             className="w-3.5 h-3.5"/>, title: 'Schließen'    },
          ] as const).map(a => (
            <button key={a.title} title={a.title}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              {a.icon}
            </button>
          ))}
        </div>
      </div>

      <ScrollArea className="flex-1">

        {/* Kontaktlisten */}
        <div className="px-4 py-3 border-b">
          <p className="text-[11px] text-muted-foreground font-medium mb-2">Kontaktlisten</p>
          <div className="flex flex-wrap items-center gap-1.5">
            {lc && (
              <span className={cn('text-[11px] px-2 py-0.5 rounded-md border font-semibold', lc.pill)}>
                {conv.label}
              </span>
            )}
            <span className="text-[11px] px-2 py-0.5 rounded-md border bg-muted/50 text-muted-foreground font-medium">
              New Leads
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-md border bg-muted/50 text-muted-foreground font-medium cursor-pointer hover:bg-muted">
              +2
            </span>
          </div>
        </div>

        {/* Letzte Unterhaltungen */}
        <div className="border-b">
          <button
            onClick={() => setConvOpen(v => !v)}
            className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-muted/30 transition-colors"
          >
            <span className="text-[12px] font-semibold">
              Letzte Unterhaltungen
              <span className="ml-1.5 text-muted-foreground font-normal">2</span>
            </span>
            <ChevronDown className={cn('w-3.5 h-3.5 text-muted-foreground/60 transition-transform', !convOpen && '-rotate-90')} />
          </button>
          {convOpen && (
            <div className="px-4 pb-3 space-y-3">
              {[
                { ch: 'whatsapp' as MessageChannel, label: 'Zentrale',  date: 'Gestern',    preview: 'Freut mich, wieder von dir zu hören! Hier…' },
                { ch: 'instagram' as MessageChannel, label: 'Marketing', date: '20.12.2024', preview: 'Danke, dass Sie das Dokument geteilt ha…' },
              ].map(r => (
                <div key={r.label} className="flex items-start gap-2.5">
                  <ChannelIcon ch={r.ch} size="xs" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-1">
                      <span className="text-[12px] font-medium">{r.label}</span>
                      <span className="text-[10px] text-muted-foreground shrink-0">{r.date}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">{r.preview}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Attribute */}
        <div className="border-b">
          <button
            onClick={() => setAttrsOpen(v => !v)}
            className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-muted/30 transition-colors"
          >
            <span className="text-[12px] font-semibold">Attribute</span>
            <ChevronDown className={cn('w-3.5 h-3.5 text-muted-foreground/60 transition-transform', !attrsOpen && '-rotate-90')} />
          </button>
          {attrsOpen && (
            <div className="px-4 pb-3 space-y-2.5">
              {[
                { icon: <Users className="w-3 h-3"/>, label: 'Vorname',  value: conv.customerName.split(' ')[0] },
                { icon: <Users className="w-3 h-3"/>, label: 'Nachname', value: conv.customerName.split(' ').slice(1).join(' ') || '—' },
                { icon: <AtSign className="w-3 h-3"/>, label: 'E-Mail',  value: conv.customerEmail ?? '—' },
                { icon: <Phone className="w-3 h-3"/>,  label: 'Telefon', value: conv.customerPhone ?? '—' },
              ].map(row => (
                <div key={row.label} className="flex items-center gap-2 min-w-0">
                  <span className="text-muted-foreground shrink-0">{row.icon}</span>
                  <span className="text-[11px] text-muted-foreground w-[52px] shrink-0">{row.label}</span>
                  <span className="text-[11px] text-foreground truncate flex-1">{row.value}</span>
                </div>
              ))}
              <button className="text-[11px] text-[#1a73e8] hover:underline mt-0.5 font-medium">Alle anzeigen</button>
            </div>
          )}
        </div>

        {/* Expandable sections */}
        {[
          { label: 'Dateien',      count: undefined },
          { label: 'Notizen',      count: undefined },
          { label: 'Automations',  count: 1         },
          { label: 'Integrations', count: 1         },
          { label: 'Web-Tracking', count: undefined },
        ].map(s => (
          <button key={s.label}
            className="w-full px-4 py-3 border-b flex items-center justify-between hover:bg-muted/30 transition-colors"
          >
            <span className="text-[12px] font-medium">{s.label}</span>
            <div className="flex items-center gap-1.5">
              {s.count !== undefined && (
                <span className="text-[10px] bg-muted text-muted-foreground rounded-full w-5 h-5 flex items-center justify-center font-medium">
                  {s.count}
                </span>
              )}
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/60 -rotate-90" />
            </div>
          </button>
        ))}
        <div className="h-4" />
      </ScrollArea>
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

  const visible = (() => {
    switch (view) {
      case 'alle':       return conversations
      case 'ungelesen':  return conversations.filter(c => c.unread)
      case 'mir':        return conversations.filter(c => !!c.assignedTo)
      case 'nicht':      return conversations.filter(c => !c.assignedTo)
      case 'vip':        return conversations.filter(c => c.label === 'VIP')
      case 'berlin-mktg':
      case 'london-mktg': return conversations.filter(c => c.label === 'Marketing')
      case 'markiert':
      case 'papierkorb':
      case 'spam':       return conversations
      default:           return conversations.filter(c => c.inbox === view)
    }
  })()

  const selected = conversations.find((conversation) => conversation.id === selectedConversationId) ?? null

  return (
    <div className="flex h-full overflow-hidden">
      <ConversationList
        allConversations={conversations}
        conversations={visible}
        selected={selected}
        onSelect={(conversation) => setSelectedConversation(conversation.id)}
        view={view}
        onViewChange={setView}
        status={convStatus}
        onStatusChange={setConvStatus}
      />
      <ChatView conv={selected} />
      <ContactPanel conv={selected} />
    </div>
  )
}
