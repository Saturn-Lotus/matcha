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

  addPending: (ns) =>
    set((state) => ({
      // First WS hydration replaces (pending IS the authoritative unread set).
      // Subsequent flushes (e.g. after a reconnect) add to the count.
      unreadCount: state.hydrated ? state.unreadCount + ns.length : ns.length,
      recent: [...ns, ...state.recent].slice(0, 5),
      hydrated: true,
    })),

  clearAll: () => set((state) => ({ ...state, unreadCount: 0 })),

  reset: () => set({ unreadCount: 0, recent: [], hydrated: false }),
}));
