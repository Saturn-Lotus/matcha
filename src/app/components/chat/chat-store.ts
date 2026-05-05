import { create } from 'zustand';
import { Message } from '@/server/repositories/message-repository';

interface ChatState {
  conversations: any[];
  messages: Record<string, Message[]>;
  unreadCount: number;
  
  setConversations: (conversations: any[]) => void;
  addMessage: (conversationId: string, message: Message) => void;
  setMessages: (conversationId: string, messages: Message[]) => void;
  markAsRead: (conversationId: string) => void;
  setUnreadCount: (count: number) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  messages: {},
  unreadCount: 0,

  setConversations: (conversations) => set({ conversations }),
  
  addMessage: (conversationId, message) => set((state) => {
    const conversationMessages = state.messages[conversationId] || [];
    return {
      messages: {
        ...state.messages,
        [conversationId]: [message, ...conversationMessages],
      },
    }
  }),

  setMessages: (conversationId, messages) => set((state) => ({
    messages: {
      ...state.messages,
      [conversationId]: messages,
    }
  })),

  markAsRead: (conversationId) => set((state) => {
    const conversations = state.conversations.map((c) => 
      c.id === conversationId ? { ...c, unreadCount: 0 } : c
    );
    return { conversations };
  }),

  setUnreadCount: (count) => set({ unreadCount: count }),
}));
