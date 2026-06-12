import { PostgresDB } from '@/server/db/postgres';

export interface ConversationRow {
  id: string;
  userIdA: string;
  userIdB: string;
  createdAt: Date;
}

export interface ConversationMetaRow {
  id: string;
  otherUserId: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
}

export interface ConversationListRow {
  id: string;
  createdAt: Date;
  otherUserId: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  lastBody: string | null;
  lastCreatedAt: Date | null;
  lastSenderId: string | null;
  unreadCount: number;
}

export class ConversationRepository {
  private readonly db: PostgresDB;

  constructor(db: PostgresDB) {
    this.db = db;
  }

  /** Find the conversation for a canonical pair, creating it if absent. */
  async findOrCreate(
    userA: string,
    userB: string,
    db: PostgresDB = this.db,
  ): Promise<ConversationRow> {
    await db.query(
      `INSERT INTO conversations ("userIdA", "userIdB")
       VALUES (LEAST($1::uuid, $2::uuid), GREATEST($1::uuid, $2::uuid))
       ON CONFLICT ("userIdA", "userIdB") DO NOTHING;`,
      [userA, userB],
    );
    const rows = await db.query<ConversationRow>(
      `SELECT id, "userIdA", "userIdB", "createdAt"
       FROM conversations
       WHERE "userIdA" = LEAST($1::uuid, $2::uuid)
         AND "userIdB" = GREATEST($1::uuid, $2::uuid);`,
      [userA, userB],
    );
    const conversation = rows[0];
    if (!conversation) throw new Error('Conversation upsert failed');
    return conversation;
  }

  async findById(id: string): Promise<ConversationRow | null> {
    const rows = await this.db.query<ConversationRow>(
      `SELECT id, "userIdA", "userIdB", "createdAt"
       FROM conversations WHERE id = $1;`,
      [id],
    );
    return rows[0] ?? null;
  }

  async isParticipant(
    conversationId: string,
    userId: string,
  ): Promise<boolean> {
    const rows = await this.db.query<{ exists: boolean }>(
      `SELECT EXISTS(
         SELECT 1 FROM conversations
         WHERE id = $1 AND ("userIdA" = $2 OR "userIdB" = $2)
       ) AS exists;`,
      [conversationId, userId],
    );
    return rows[0]?.exists ?? false;
  }

  /** Conversation header info for a participant, or null if not a participant. */
  async findMetaForUser(
    conversationId: string,
    userId: string,
  ): Promise<ConversationMetaRow | null> {
    const rows = await this.db.query<ConversationMetaRow>(
      `SELECT
         c.id,
         CASE WHEN c."userIdA" = $2 THEN c."userIdB" ELSE c."userIdA" END AS "otherUserId",
         up."firstName", up."lastName", up."avatarUrl"
       FROM conversations c
       JOIN user_profiles up
         ON up."userId" = CASE WHEN c."userIdA" = $2 THEN c."userIdB" ELSE c."userIdA" END
       WHERE c.id = $1 AND (c."userIdA" = $2 OR c."userIdB" = $2);`,
      [conversationId, userId],
    );
    return rows[0] ?? null;
  }

  /** List a user's conversations with the other party, last message and unread count. */
  async findByUser(userId: string): Promise<ConversationListRow[]> {
    return this.db.query<ConversationListRow>(
      `SELECT
         c.id,
         c."createdAt",
         other."userId"   AS "otherUserId",
         other."firstName",
         other."lastName",
         other."avatarUrl",
         lm.body          AS "lastBody",
         lm."createdAt"   AS "lastCreatedAt",
         lm."senderId"    AS "lastSenderId",
         COALESCE(uc.cnt, 0)::int AS "unreadCount"
       FROM conversations c
       JOIN user_profiles other
         ON other."userId" = CASE WHEN c."userIdA" = $1 THEN c."userIdB" ELSE c."userIdA" END
       LEFT JOIN LATERAL (
         SELECT m.body, m."createdAt", m."senderId"
         FROM messages m
         WHERE m."conversationId" = c.id
         ORDER BY m."createdAt" DESC, m.id DESC
         LIMIT 1
       ) lm ON TRUE
       LEFT JOIN LATERAL (
         SELECT COUNT(*) AS cnt
         FROM messages m
         WHERE m."conversationId" = c.id
           AND m."senderId" <> $1
           AND m."readAt" IS NULL
       ) uc ON TRUE
       WHERE c."userIdA" = $1 OR c."userIdB" = $1
       ORDER BY COALESCE(lm."createdAt", c."createdAt") DESC;`,
      [userId],
    );
  }
}
