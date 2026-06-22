import { PostgresDB } from '@/server/db/postgres';

export interface MessageRow {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: Date;
  readAt: Date | null;
}

export class MessageRepository {
  private readonly db: PostgresDB;

  constructor(db: PostgresDB) {
    this.db = db;
  }

  async create(
    conversationId: string,
    senderId: string,
    body: string,
    db: PostgresDB = this.db,
  ): Promise<MessageRow> {
    const rows = await db.query<MessageRow>(
      `INSERT INTO messages ("conversationId", "senderId", body)
       VALUES ($1, $2, $3)
       RETURNING id, "conversationId", "senderId", body, "createdAt", "readAt";`,
      [conversationId, senderId, body],
    );
    const message = rows[0];
    if (!message) throw new Error('Message creation failed');
    return message;
  }

  /** Newest-first keyset pagination. `cursor` is the `createdAt` of the oldest loaded row. */
  async listByCursor(
    conversationId: string,
    cursor: string | null,
    limit: number,
  ): Promise<MessageRow[]> {
    return this.db.query<MessageRow>(
      `SELECT id, "conversationId", "senderId", body, "createdAt", "readAt"
       FROM messages
       WHERE "conversationId" = $1
         AND ($2::timestamptz IS NULL OR "createdAt" < $2::timestamptz)
       ORDER BY "createdAt" DESC, id DESC
       LIMIT $3;`,
      [conversationId, cursor, limit],
    );
  }

  /** Mark the other party's unread messages as read. Returns the count affected. */
  async markRead(
    conversationId: string,
    readerId: string,
    db: PostgresDB = this.db,
  ): Promise<number> {
    const rows = await db.query<{ id: string }>(
      `UPDATE messages
       SET "readAt" = NOW()
       WHERE "conversationId" = $1
         AND "senderId" <> $2
         AND "readAt" IS NULL
       RETURNING id;`,
      [conversationId, readerId],
    );
    return rows.length;
  }

  async unreadCount(userId: string): Promise<number> {
    const rows = await this.db.query<{ count: string }>(
      `SELECT COUNT(*) AS count
       FROM messages m
       JOIN conversations c ON c.id = m."conversationId"
       WHERE (c."userIdA" = $1 OR c."userIdB" = $1)
         AND m."senderId" <> $1
         AND m."readAt" IS NULL;`,
      [userId],
    );
    return parseInt(rows[0]?.count ?? '0', 10);
  }
}
