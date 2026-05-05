import { PostgresDB } from '../db/postgres';

export interface Conversation {
  id: string;
  userAId: string;
  userBId: string;
  createdAt: Date;
}

export class ConversationRepository {
  private readonly db: PostgresDB;

  constructor(db: PostgresDB) {
    this.db = db;
  }

  async findOrCreate(user1Id: string, user2Id: string): Promise<Conversation> {
    const [userAId, userBId] = [user1Id, user2Id].sort();

    const rows = await this.db.query<Conversation>(
      `INSERT INTO conversations ("userAId", "userBId")
       VALUES ($1, $2)
       ON CONFLICT ("userAId", "userBId") DO UPDATE SET "userAId" = EXCLUDED."userAId"
       RETURNING *;`,
      [userAId, userBId],
    );

    const conversation = rows[0];
    if (!conversation) {
      throw new Error('Failed to find or create conversation');
    }
    return conversation;
  }

  async findById(id: string): Promise<Conversation | null> {
    const rows = await this.db.query<Conversation>(
      `SELECT * FROM conversations WHERE id = $1;`,
      [id],
    );
    return rows[0] || null;
  }

  async isParticipant(conversationId: string, userId: string): Promise<boolean> {
    const rows = await this.db.query<{ exists: boolean }>(
      `SELECT EXISTS(
         SELECT 1 FROM conversations
         WHERE id = $1 AND ("userAId" = $2 OR "userBId" = $2)
       ) AS exists;`,
      [conversationId, userId],
    );
    return rows[0]?.exists ?? false;
  }

  async findByUser(userId: string) {
    // This query gets conversations for a user, 
    // including the other participant's profile, 
    // the last message, and the unread count.
    return this.db.query<any>(
      `SELECT 
        c.id,
        c."createdAt",
        CASE WHEN c."userAId" = $1 THEN c."userBId" ELSE c."userAId" END as "otherUserId",
        up."firstName",
        up."lastName",
        up."avatarUrl",
        m.body as "lastMessageBody",
        m."createdAt" as "lastMessageCreatedAt",
        (SELECT COUNT(*) FROM messages WHERE "conversationId" = c.id AND "senderId" != $1 AND "readAt" IS NULL) as "unreadCount"
      FROM conversations c
      JOIN user_profiles up ON up."userId" = (CASE WHEN c."userAId" = $1 THEN c."userBId" ELSE c."userAId" END)
      LEFT JOIN LATERAL (
        SELECT body, "createdAt"
        FROM messages
        WHERE "conversationId" = c.id
        ORDER BY "createdAt" DESC
        LIMIT 1
      ) m ON true
      WHERE c."userAId" = $1 OR c."userBId" = $1
      ORDER BY COALESCE(m."createdAt", c."createdAt") DESC;`,
      [userId],
    );
  }
}
