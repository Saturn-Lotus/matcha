// Functional integration tests for NotificationRepository — exercise real
// SQL against a real Postgres so behaviors (atomicity, JOIN semantics, cursor
// pagination, rate-limit window) are actually verified rather than asserting
// that a SQL string contains the right keywords.
//
// Run with:  INTEGRATION_TESTS=1 DATABASE_URL=postgres://... bun x jest

import { NotificationRepository } from '@/server/repositories/notification-repository';
import {
  backdateNotification,
  cleanupCreatedUsers,
  createTestUser,
  describeIntegration,
  fetchNotificationRow,
  getDb,
} from './helpers/integration-db';

describeIntegration('NotificationRepository (integration)', () => {
  let repo: NotificationRepository;

  beforeAll(() => {
    repo = new NotificationRepository(getDb());
  });

  afterEach(async () => {
    await cleanupCreatedUsers();
  });

  describe('create', () => {
    it('persists a row and returns a DTO joined with the actor profile', async () => {
      const target = await createTestUser();
      const actor = await createTestUser({ firstName: 'Alice', lastName: 'X' });

      const dto = await repo.create(target, 'like', actor);

      expect(dto.type).toBe('like');
      expect(dto.actorId).toBe(actor);
      expect(dto.actorFirstName).toBe('Alice');
      expect(dto.actorLastName).toBe('X');
      expect(dto.readAt).toBeNull();

      const row = await fetchNotificationRow(dto.id);
      expect(row).not.toBeNull();
      expect(row!.userId).toBe(target);
      expect(row!.actorId).toBe(actor);
      expect(row!.readAt).toBeNull();
    });

    it('serializes the payload as JSONB and reads it back structurally', async () => {
      const target = await createTestUser();
      const actor = await createTestUser();
      const payload = { conversationId: 'conv-123' };

      const dto = await repo.create(target, 'message', actor, payload);

      expect(dto.payload).toEqual(payload);
      const row = await fetchNotificationRow(dto.id);
      expect(row!.payload).toEqual(payload);
    });

    it('succeeds when the actor exists but has no user_profiles row (LEFT JOIN safety)', async () => {
      const target = await createTestUser();
      const actor = await createTestUser({ withProfile: false });

      const dto = await repo.create(target, 'like', actor);

      expect(dto.actorId).toBe(actor);
      expect(dto.actorFirstName).toBe('');
      expect(dto.actorLastName).toBe('');
      expect(dto.actorAvatarUrl).toBeNull();
    });
  });

  describe('listByUser', () => {
    it('returns newest-first and honors the cursor + limit', async () => {
      const target = await createTestUser();
      const actor = await createTestUser();
      const older = await repo.create(target, 'like', actor);
      const middle = await repo.create(target, 'profile_view', actor);
      const newest = await repo.create(target, 'match', actor);

      const firstPage = await repo.listByUser(target, null, 2);

      expect(firstPage.map((n) => n.id)).toEqual([newest.id, middle.id]);

      const secondPage = await repo.listByUser(
        target,
        firstPage[firstPage.length - 1]!.createdAt,
        2,
      );

      expect(secondPage.map((n) => n.id)).toEqual([older.id]);
    });

    it('never leaks another user’s notifications', async () => {
      const targetA = await createTestUser();
      const targetB = await createTestUser();
      const actor = await createTestUser();
      await repo.create(targetA, 'like', actor);
      await repo.create(targetB, 'like', actor);

      const forA = await repo.listByUser(targetA, null, 20);
      const forB = await repo.listByUser(targetB, null, 20);

      expect(forA).toHaveLength(1);
      expect(forB).toHaveLength(1);
      expect(forA[0]!.id).not.toBe(forB[0]!.id);
    });
  });

  describe('unreadCount / listUnread', () => {
    it('counts and lists only unread rows', async () => {
      const target = await createTestUser();
      const actor = await createTestUser();
      const a = await repo.create(target, 'like', actor);
      const b = await repo.create(target, 'profile_view', actor);
      await repo.markRead(target, [a.id]);

      const count = await repo.unreadCount(target);
      const unread = await repo.listUnread(target);

      expect(count).toBe(1);
      expect(unread.map((n) => n.id)).toEqual([b.id]);
    });

    it('returns 0 / [] when nothing is unread', async () => {
      const target = await createTestUser();

      expect(await repo.unreadCount(target)).toBe(0);
      expect(await repo.listUnread(target)).toEqual([]);
    });
  });

  describe('markRead / markAllRead', () => {
    it('sets readAt only for the requested ids owned by that user', async () => {
      const target = await createTestUser();
      const other = await createTestUser();
      const actor = await createTestUser();
      const mine = await repo.create(target, 'like', actor);
      const otherRow = await repo.create(other, 'like', actor);

      // Attempt to also mark someone else's notification — must be ignored.
      await repo.markRead(target, [mine.id, otherRow.id]);

      const mineRow = await fetchNotificationRow(mine.id);
      const foreign = await fetchNotificationRow(otherRow.id);
      expect(mineRow!.readAt).not.toBeNull();
      expect(foreign!.readAt).toBeNull();
    });

    it('is a no-op when ids is empty (does not touch the DB)', async () => {
      const target = await createTestUser();
      const actor = await createTestUser();
      const row = await repo.create(target, 'like', actor);

      await repo.markRead(target, []);

      const after = await fetchNotificationRow(row.id);
      expect(after!.readAt).toBeNull();
    });

    it('markAllRead marks every unread row for the user', async () => {
      const target = await createTestUser();
      const actor = await createTestUser();
      const a = await repo.create(target, 'like', actor);
      const b = await repo.create(target, 'profile_view', actor);

      await repo.markAllRead(target);

      const [rowA, rowB] = await Promise.all([
        fetchNotificationRow(a.id),
        fetchNotificationRow(b.id),
      ]);
      expect(rowA!.readAt).not.toBeNull();
      expect(rowB!.readAt).not.toBeNull();
    });
  });

  describe('claimById — atomic single-row claim', () => {
    it('returns true and marks read on first call, false on second (idempotent)', async () => {
      const target = await createTestUser();
      const actor = await createTestUser();
      const row = await repo.create(target, 'like', actor);

      const first = await repo.claimById(target, row.id);
      const second = await repo.claimById(target, row.id);

      expect(first).toBe(true);
      expect(second).toBe(false);
      const after = await fetchNotificationRow(row.id);
      expect(after!.readAt).not.toBeNull();
    });

    it('will not claim another user’s notification even with a matching id', async () => {
      const target = await createTestUser();
      const attacker = await createTestUser();
      const actor = await createTestUser();
      const row = await repo.create(target, 'like', actor);

      const claimed = await repo.claimById(attacker, row.id);

      expect(claimed).toBe(false);
      const after = await fetchNotificationRow(row.id);
      expect(after!.readAt).toBeNull();
    });

    it('serializes concurrent claims — exactly one caller wins', async () => {
      const target = await createTestUser();
      const actor = await createTestUser();
      const row = await repo.create(target, 'like', actor);

      const results = await Promise.all(
        Array.from({ length: 5 }, () => repo.claimById(target, row.id)),
      );

      const winners = results.filter(Boolean).length;
      expect(winners).toBe(1);
    });
  });

  describe('claimAllUnread — atomic bulk claim for on-connect flush', () => {
    it('marks-and-returns every unread row in a single statement', async () => {
      const target = await createTestUser();
      const actor = await createTestUser();
      const a = await repo.create(target, 'like', actor);
      const b = await repo.create(target, 'profile_view', actor);

      const claimed = await repo.claimAllUnread(target);

      expect(new Set(claimed.map((n) => n.id))).toEqual(
        new Set([a.id, b.id]),
      );
      expect(await repo.unreadCount(target)).toBe(0);
    });

    it('is a no-op that returns [] when nothing is unread', async () => {
      const target = await createTestUser();

      const claimed = await repo.claimAllUnread(target);

      expect(claimed).toEqual([]);
    });

    it('two concurrent flushes hand out disjoint row sets — nothing is double-claimed', async () => {
      const target = await createTestUser();
      const actor = await createTestUser();
      await Promise.all([
        repo.create(target, 'like', actor),
        repo.create(target, 'profile_view', actor),
        repo.create(target, 'match', actor),
      ]);

      const [first, second] = await Promise.all([
        repo.claimAllUnread(target),
        repo.claimAllUnread(target),
      ]);

      const seen = new Set<string>();
      for (const n of [...first, ...second]) {
        expect(seen.has(n.id)).toBe(false);
        seen.add(n.id);
      }
      expect(seen.size).toBe(3);
    });
  });

  describe('findRecentViewNotification — 24h dedupe window', () => {
    it('is true when a profile_view exists within 24h', async () => {
      const target = await createTestUser();
      const actor = await createTestUser();
      await repo.create(target, 'profile_view', actor);

      expect(await repo.findRecentViewNotification(actor, target)).toBe(true);
    });

    it('is false once the earlier view is older than 24h', async () => {
      const target = await createTestUser();
      const actor = await createTestUser();
      const stale = await repo.create(target, 'profile_view', actor);
      await backdateNotification(stale.id, '25 hours');

      expect(await repo.findRecentViewNotification(actor, target)).toBe(false);
    });

    it('scopes on both (actor, target) and type — a like does not satisfy it', async () => {
      const target = await createTestUser();
      const actor = await createTestUser();
      await repo.create(target, 'like', actor);

      expect(await repo.findRecentViewNotification(actor, target)).toBe(false);
    });
  });
});
