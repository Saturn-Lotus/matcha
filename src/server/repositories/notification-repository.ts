import { PostgresDB } from '@/server/db/postgres';
import type { NotificationDTO, NotificationType } from '@/server/types';

interface NotificationRow {
  id: string;
  userId: string;
  type: NotificationType;
  actorId: string;
  payload: Record<string, string> | null;
  readAt: Date | null;
  createdAt: Date;
  actorFirstName: string | null;
  actorLastName: string | null;
  actorAvatarUrl: string | null;
}

function toDTO(row: NotificationRow): NotificationDTO {
  return {
    id: row.id,
    type: row.type,
    actorId: row.actorId,
    actorFirstName: row.actorFirstName ?? '',
    actorLastName: row.actorLastName ?? '',
    actorAvatarUrl: row.actorAvatarUrl ?? null,
    payload: row.payload,
    readAt: row.readAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export class NotificationRepository {
  constructor(private readonly db: PostgresDB) {}

  async create(
    userId: string,
    type: NotificationType,
    actorId: string,
    payload?: Record<string, string>,
  ): Promise<NotificationDTO> {
    const rows = await this.db.query<NotificationRow>(
      `WITH inserted AS (
         INSERT INTO notifications ("userId", type, "actorId", payload)
         VALUES ($1, $2, $3, $4)
         RETURNING *
       )
       SELECT i.*, up."firstName" AS "actorFirstName", up."lastName" AS "actorLastName", up."avatarUrl" AS "actorAvatarUrl"
       FROM inserted i
       LEFT JOIN user_profiles up ON up."userId" = i."actorId";`,
      [userId, type, actorId, payload ?? null],
    );
    return toDTO(rows[0]!);
  }

  async listByUser(
    userId: string,
    cursor: string | null,
    limit: number = 20,
  ): Promise<NotificationDTO[]> {
    const rows = await this.db.query<NotificationRow>(
      `SELECT n.id, n."userId", n.type, n."actorId", n.payload, n."readAt", n."createdAt",
              up."firstName" AS "actorFirstName", up."lastName" AS "actorLastName", up."avatarUrl" AS "actorAvatarUrl"
       FROM notifications n
       LEFT JOIN user_profiles up ON up."userId" = n."actorId"
       WHERE n."userId" = $1
         AND ($2::timestamptz IS NULL OR n."createdAt" < $2::timestamptz)
       ORDER BY n."createdAt" DESC
       LIMIT $3;`,
      [userId, cursor ?? null, limit],
    );
    return rows.map(toDTO);
  }

  async listUnread(userId: string): Promise<NotificationDTO[]> {
    const rows = await this.db.query<NotificationRow>(
      `SELECT n.id, n."userId", n.type, n."actorId", n.payload, n."readAt", n."createdAt",
              up."firstName" AS "actorFirstName", up."lastName" AS "actorLastName", up."avatarUrl" AS "actorAvatarUrl"
       FROM notifications n
       LEFT JOIN user_profiles up ON up."userId" = n."actorId"
       WHERE n."userId" = $1 AND n."readAt" IS NULL
       ORDER BY n."createdAt" DESC;`,
      [userId],
    );
    return rows.map(toDTO);
  }

  async unreadCount(userId: string): Promise<number> {
    const rows = await this.db.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM notifications WHERE "userId" = $1 AND "readAt" IS NULL;`,
      [userId],
    );
    return parseInt(rows[0]?.count ?? '0', 10);
  }

  /** Mark a notification delivered. Returns true only for the caller that delivered it. */
  async claimById(userId: string, id: string): Promise<boolean> {
    const rows = await this.db.query<{ id: string }>(
      `UPDATE notifications SET "deliveredAt" = NOW()
       WHERE "userId" = $1 AND id = $2 AND "deliveredAt" IS NULL
       RETURNING id;`,
      [userId, id],
    );
    return rows.length > 0;
  }

  /** Return every unread notification and mark it delivered. Read state is untouched. */
  async claimAllUnread(userId: string): Promise<NotificationDTO[]> {
    const rows = await this.db.query<NotificationRow>(
      `WITH claimed AS (
         UPDATE notifications SET "deliveredAt" = COALESCE("deliveredAt", NOW())
         WHERE "userId" = $1 AND "readAt" IS NULL
         RETURNING *
       )
       SELECT c.*, up."firstName" AS "actorFirstName", up."lastName" AS "actorLastName", up."avatarUrl" AS "actorAvatarUrl"
       FROM claimed c
       LEFT JOIN user_profiles up ON up."userId" = c."actorId"
       ORDER BY c."createdAt" DESC;`,
      [userId],
    );
    return rows.map(toDTO);
  }

  async markRead(userId: string, ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    await this.db.mutate(
      `UPDATE notifications SET "readAt" = NOW()
       WHERE "userId" = $1 AND id = ANY($2::uuid[]) AND "readAt" IS NULL;`,
      [userId, ids],
    );
  }

  async markAllRead(userId: string): Promise<void> {
    await this.db.mutate(
      `UPDATE notifications SET "readAt" = NOW()
       WHERE "userId" = $1 AND "readAt" IS NULL;`,
      [userId],
    );
  }

  async findRecentViewNotification(
    actorId: string,
    userId: string,
  ): Promise<boolean> {
    const rows = await this.db.query<{ exists: boolean }>(
      `SELECT EXISTS(
         SELECT 1 FROM notifications
         WHERE "actorId" = $1 AND "userId" = $2 AND type = 'profile_view'
           AND "createdAt" > NOW() - INTERVAL '24 hours'
       ) AS exists;`,
      [actorId, userId],
    );
    return rows[0]?.exists ?? false;
  }
}
