'use client'

import { create } from 'zustand'
import { mockConversations } from '@/lib/mock-data'
import type { Conversation, ConversationStatus } from '@/lib/types'
import type { NachrichtenPerspective } from '@/lib/constants'

export type ConversationInboxView =
  | 'alle'
  | 'ungelesen'
  | 'mir'
  | 'nicht'
  | 'markiert'
  | 'papierkorb'
  | 'spam'
  | 'Zentrale'
  | 'Standort Berlin'
  | 'Standort München'
  | 'Vertrieb'
  | 'Marketing'
  | 'vip'
  | 'berlin-mktg'
  | 'london-mktg'

const initialConversations = mockConversations.map((conversation) => ({
  ...conversation,
  messages: [...conversation.messages],
}))

interface ConversationStoreState {
  conversations: Conversation[]
  view: ConversationInboxView
  statusFilter: ConversationStatus
  selectedConversationId: string | null
  perspective: NachrichtenPerspective
  setView: (view: ConversationInboxView) => void
  setStatusFilter: (status: ConversationStatus) => void
  setSelectedConversation: (conversationId: string | null) => void
  updateConversationStatus: (conversationId: string, status: ConversationStatus) => void
  assignConversation: (conversationId: string, advisorName: string | null) => void
  setPerspective: (perspective: NachrichtenPerspective) => void
  sendMessage: (conversationId: string, content: string) => void
  toggleLabel: (conversationId: string, label: string) => void
}

export const useConversationStore = create<ConversationStoreState>((set) => ({
  conversations: initialConversations,
  view: 'alle',
  statusFilter: 'offen',
  selectedConversationId: initialConversations[0]?.id ?? null,
  perspective: { type: 'admin', label: 'Admin (Alle)' },

  setView: (view) => set({ view }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),
  setSelectedConversation: (selectedConversationId) => set({ selectedConversationId }),
  setPerspective: (perspective) => set({ perspective }),

  updateConversationStatus: (conversationId, status) => {
    set((state) => ({
      conversations: state.conversations.map((conversation) => {
        if (conversation.id !== conversationId) return conversation
        return {
          ...conversation,
          status,
          unread: status === 'erledigt' ? false : conversation.unread,
          unreadCount: status === 'erledigt' ? 0 : conversation.unreadCount,
        }
      }),
    }))
  },

  assignConversation: (conversationId, advisorName) => {
    set((state) => ({
      conversations: state.conversations.map((conversation) => {
        if (conversation.id !== conversationId) return conversation

        if (!advisorName) {
          return {
            ...conversation,
            assignedTo: undefined,
          }
        }

        return {
          ...conversation,
          assignedTo: advisorName,
        }
      }),
    }))
  },

  sendMessage: (conversationId, content) => {
    const now = new Date().toISOString()
    set((state) => ({
      conversations: state.conversations.map((conversation) => {
        if (conversation.id !== conversationId) return conversation
        const newMsg = {
          id: `msg-${Date.now()}`,
          conversationId,
          content,
          sender: 'advisor' as const,
          senderName: state.perspective.userName ?? 'Admin',
          timestamp: now,
          read: true,
          channel: conversation.channel,
        }
        return {
          ...conversation,
          messages: [...conversation.messages, newMsg],
          lastMessage: content,
          lastMessageAt: now,
        }
      }),
    }))
  },

  toggleLabel: (conversationId, label) => {
    set((state) => ({
      conversations: state.conversations.map((conversation) => {
        if (conversation.id !== conversationId) return conversation
        return {
          ...conversation,
          label: conversation.label === label ? undefined : label,
        }
      }),
    }))
  },
}))
