import { create } from 'zustand';
import type { MessageDTO } from '@/server/types';

interface ChatState {
  currentUserId: string | null;
  unreadTotal: number;
  unreadByConversation: Record<string, number>;
  activeConversationId: string | null;

  init: (userId: string, unreadTotal: number) => void;
  setUnreadTotal: (count: number) => void;
  setConversationUnreads: (map: Record<string, number>) => void;
  setActiveConversation: (id: string | null) => void;
  receiveMessage: (message: MessageDTO) => void;
  markReadLocal: (conversationId: string) => void;
  reset: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  currentUserId: null,
  unreadTotal: 0,
  unreadByConversation: {},
  activeConversationId: null,

  init: (userId, unreadTotal) => set({ currentUserId: userId, unreadTotal }),

  setUnreadTotal: (count) => set({ unreadTotal: count }),

  setConversationUnreads: (map) =>
    set(() => {
      const unreadTotal = Object.values(map).reduce((sum, n) => sum + n, 0);
      return { unreadByConversation: map, unreadTotal };
    }),

  setActiveConversation: (id) => set({ activeConversationId: id }),

  receiveMessage: (message) =>
    set((state) => {
      const isOwn = message.senderId === state.currentUserId;
      const isActive = message.conversationId === state.activeConversationId;
      if (isOwn || isActive) return {};
      const prev = state.unreadByConversation[message.conversationId] ?? 0;
      return {
        unreadByConversation: {
          ...state.unreadByConversation,
          [message.conversationId]: prev + 1,
        },
        unreadTotal: state.unreadTotal + 1,
      };
    }),

  markReadLocal: (conversationId) =>
    set((state) => {
      const count = state.unreadByConversation[conversationId] ?? 0;
      if (count === 0) return {};
      const next = { ...state.unreadByConversation };
      delete next[conversationId];
      return {
        unreadByConversation: next,
        unreadTotal: Math.max(0, state.unreadTotal - count),
      };
    }),

  reset: () =>
    set({
      currentUserId: null,
      unreadTotal: 0,
      unreadByConversation: {},
      activeConversationId: null,
    }),
}));
