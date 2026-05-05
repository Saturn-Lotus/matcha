import { PostgresDB } from '../db/postgres';

export interface Message {
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

  async create(conversationId: string, senderId: string, body: string): Promise<Message> {
    const rows = await this.db.query<Message>(
      `INSERT INTO messages ("conversationId", "senderId", "body")
       VALUES ($1, $2, $3)
       RETURNING *;`,
      [conversationId, senderId, body],
    );

    const message = rows[0];
    if (!message) {
      throw new Error('Failed to create message');
    }
    return message;
  }

  async listByConversation(conversationId: string, limit: number = 50, cursor?: string): Promise<Message[]> {
    let query = `
      SELECT * FROM messages
      WHERE "conversationId" = $1
    `;
    const params: any[] = [conversationId];

    if (cursor) {
      query += ` AND "createdAt" < (SELECT "createdAt" FROM messages WHERE id = $2)`;
      params.push(cursor);
    }

    query += ` ORDER BY "createdAt" DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    return this.db.query<Message>(query, params);
  }

  async markAsRead(conversationId: string, readerId: string): Promise<void> {
    await this.db.query(
      `UPDATE messages
       SET "readAt" = CURRENT_TIMESTAMP
       WHERE "conversationId" = $1 AND "senderId" != $2 AND "readAt" IS NULL;`,
      [conversationId, readerId],
    );
  }
}
