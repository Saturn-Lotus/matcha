import { useNotificationStore } from '@/lib/stores/notification-store';
import type { NotificationDTO } from '@/server/types';

function makeNotif(id: string): NotificationDTO {
  return {
    id,
    type: 'like',
    actorId: `actor-${id}`,
    actorFirstName: 'A',
    actorLastName: 'B',
    actorAvatarUrl: null,
    payload: null,
    readAt: null,
    createdAt: new Date().toISOString(),
  };
}

beforeEach(() => {
  useNotificationStore.getState().reset();
});

describe('useNotificationStore', () => {
  it('init sets unreadCount when not yet hydrated', () => {
    useNotificationStore.getState().init(7);

    expect(useNotificationStore.getState().unreadCount).toBe(7);
  });

  it('addOne increments and hydrates', () => {
    const n = makeNotif('1');

    useNotificationStore.getState().addOne(n);

    const state = useNotificationStore.getState();
    expect(state.unreadCount).toBe(1);
    expect(state.recent).toEqual([n]);
    expect(state.hydrated).toBe(true);
  });

  it('init is a no-op after addOne — late HTTP count cannot overwrite WS state', () => {
    useNotificationStore.getState().addOne(makeNotif('1'));
    useNotificationStore.getState().init(99);

    expect(useNotificationStore.getState().unreadCount).toBe(1);
  });

  it('addPending replaces unreadCount on first hydration (no double count)', () => {
    useNotificationStore.getState().init(3);
    const pending = [makeNotif('a'), makeNotif('b'), makeNotif('c')];

    useNotificationStore.getState().addPending(pending);

    expect(useNotificationStore.getState().unreadCount).toBe(3);
  });

  it('addPending replaces on reconnect — the flush is the full unread set', () => {
    useNotificationStore.getState().addPending([makeNotif('a'), makeNotif('b')]);
    expect(useNotificationStore.getState().unreadCount).toBe(2);

    useNotificationStore
      .getState()
      .addPending([makeNotif('a'), makeNotif('b'), makeNotif('c')]);

    const state = useNotificationStore.getState();
    expect(state.unreadCount).toBe(3);
    expect(state.recent.map((n) => n.id)).toEqual(['a', 'b', 'c']);
  });

  it('init is a no-op once pending has hydrated, even with a stale higher count', () => {
    useNotificationStore.getState().addPending([makeNotif('a')]);
    useNotificationStore.getState().init(50);

    expect(useNotificationStore.getState().unreadCount).toBe(1);
  });

  it('recent is capped at 5 items, newest first', () => {
    const store = useNotificationStore.getState();
    for (let i = 0; i < 7; i++) store.addOne(makeNotif(String(i)));

    const state = useNotificationStore.getState();
    expect(state.recent).toHaveLength(5);
    expect(state.recent[0]!.id).toBe('6');
    expect(state.recent[4]!.id).toBe('2');
  });

  it('clearAll resets the badge but keeps recent and hydrated', () => {
    useNotificationStore.getState().addOne(makeNotif('1'));
    useNotificationStore.getState().addOne(makeNotif('2'));

    useNotificationStore.getState().clearAll();

    const state = useNotificationStore.getState();
    expect(state.unreadCount).toBe(0);
    expect(state.recent).toHaveLength(2);
    expect(state.hydrated).toBe(true);
  });
});
