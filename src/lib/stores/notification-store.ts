import { create } from 'zustand';
import type { NotificationDTO } from '@/server/types';

interface NotificationState {
  unreadCount: number;
  recent: NotificationDTO[];
  // True once any WS event has hydrated the store. After that, the HTTP-backed
  // init() becomes a no-op so a late-arriving DB count cannot overwrite the
  // authoritative socket-delivered state.
  hydrated: boolean;

  init: (count: number) => void;
  addOne: (n: NotificationDTO) => void;
  addPending: (ns: NotificationDTO[]) => void;
  clearAll: () => void;
  reset: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadCount: 0,
  recent: [],
  hydrated: false,

  init: (count) =>
    set((state) => (state.hydrated ? state : { ...state, unreadCount: count })),

  addOne: (n) =>
    set((state) => ({
      unreadCount: state.unreadCount + 1,
      recent: [n, ...state.recent].slice(0, 5),
      hydrated: true,
    })),

  // Every flush is the full server-side unread set, so it replaces the count
  // rather than adding to it — a reconnect must not double count.
  addPending: (ns) =>
    set((state) => {
      const pendingIds = new Set(ns.map((n) => n.id));
      return {
        unreadCount: ns.length,
        recent: [
          ...ns,
          ...state.recent.filter((n) => !pendingIds.has(n.id)),
        ].slice(0, 5),
        hydrated: true,
      };
    }),

  clearAll: () => set((state) => ({ ...state, unreadCount: 0 })),

  reset: () => set({ unreadCount: 0, recent: [], hydrated: false }),
}));
