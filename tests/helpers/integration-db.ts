// Integration test harness for tests that need a real Postgres.
//
// Enable with: INTEGRATION_TESTS=1 DATABASE_URL=postgres://... bun x jest
// Tests are skipped when INTEGRATION_TESTS is not set so unit-only runs
// (and CI without a DB service) stay green. Never point this at a shared
// or production database — every test creates rows and relies on cleanup.

import { randomUUID } from 'node:crypto';
import { PostgresDB } from '@/server/db/postgres';

export const INTEGRATION_ENABLED = process.env.INTEGRATION_TESTS === '1';

export const describeIntegration = INTEGRATION_ENABLED
  ? describe
  : describe.skip;

let sharedDb: PostgresDB | null = null;
export function getDb(): PostgresDB {
  if (!sharedDb) sharedDb = new PostgresDB();
  return sharedDb;
}

const createdUserIds = new Set<string>();

interface CreateUserOptions {
  withProfile?: boolean;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string | null;
}

/**
 * Insert a fresh test user (and optionally a matching profile) with random
 * identifiers so the row is guaranteed not to collide with real data. The
 * created id is tracked for automatic cleanup — callers do not need to
 * remember to delete rows.
 */
export async function createTestUser({
  withProfile = true,
  firstName = 'Test',
  lastName = 'User',
  avatarUrl = null,
}: CreateUserOptions = {}): Promise<string> {
  const db = getDb();
  const suffix = randomUUID().replace(/-/g, '').slice(0, 12);
  const rows = await db.query<{ id: string }>(
    `INSERT INTO users (username, email, password_hash)
     VALUES ($1, $2, 'x')
     RETURNING id;`,
    [`test_${suffix}`, `test_${suffix}@example.com`],
  );
  const id = rows[0]!.id;
  createdUserIds.add(id);
  if (withProfile) {
    await db.query(
      `INSERT INTO user_profiles ("userId", "firstName", "lastName", "avatarUrl", "birthDate")
       VALUES ($1, $2, $3, $4, '2000-01-01T00:00:00Z');`,
      [id, firstName, lastName, avatarUrl],
    );
  }
  return id;
}

/**
 * Drop every user this test module created. Notifications, profiles, blocks,
 * and other FK-dependent rows are removed automatically via ON DELETE CASCADE.
 */
export async function cleanupCreatedUsers(): Promise<void> {
  if (createdUserIds.size === 0) return;
  const ids = Array.from(createdUserIds);
  createdUserIds.clear();
  await getDb().query(`DELETE FROM users WHERE id = ANY($1::uuid[]);`, [ids]);
}

/**
 * Block a → b directly (bypassing the service) so we can arrange the block
 * state a NotificationService.emit call should observe.
 */
export async function insertBlock(
  blockerUserId: string,
  blockedUserId: string,
): Promise<void> {
  await getDb().query(
    `INSERT INTO user_blocks ("blockerUserId", "blockedUserId", "blockedAt")
     VALUES ($1, $2, CURRENT_TIMESTAMP)
     ON CONFLICT DO NOTHING;`,
    [blockerUserId, blockedUserId],
  );
}

/**
 * Read a notification row directly, bypassing DTO conversion, so tests can
 * assert against the actual persisted state (including readAt / userId /
 * payload).
 */
export async function fetchNotificationRow(id: string): Promise<{
  id: string;
  userId: string;
  type: string;
  actorId: string;
  payload: Record<string, unknown> | null;
  readAt: Date | null;
  deliveredAt: Date | null;
  createdAt: Date;
} | null> {
  const rows = await getDb().query(
    `SELECT id, "userId", type, "actorId", payload, "readAt", "deliveredAt", "createdAt"
     FROM notifications WHERE id = $1;`,
    [id],
  );
  return rows[0] ?? null;
}

/**
 * Backdate a notification's createdAt — used to test the profile_view
 * 24h dedupe window without waiting a day.
 */
export async function backdateNotification(
  id: string,
  intervalSql: string,
): Promise<void> {
  await getDb().query(
    `UPDATE notifications SET "createdAt" = NOW() - INTERVAL '${intervalSql}' WHERE id = $1;`,
    [id],
  );
}
