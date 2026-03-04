'use client'

import { create } from 'zustand'
import { mockConversations } from '@/lib/mock-data'
import type { Conversation, ConversationStatus } from '@/lib/types'

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
  setView: (view: ConversationInboxView) => void
  setStatusFilter: (status: ConversationStatus) => void
  setSelectedConversation: (conversationId: string | null) => void
  updateConversationStatus: (conversationId: string, status: ConversationStatus) => void
  assignConversation: (conversationId: string, advisorName: string | null) => void
}

export const useConversationStore = create<ConversationStoreState>((set) => ({
  conversations: initialConversations,
  view: 'alle',
  statusFilter: 'offen',
  selectedConversationId: initialConversations[0]?.id ?? null,

  setView: (view) => set({ view }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),
  setSelectedConversation: (selectedConversationId) => set({ selectedConversationId }),

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
}))
