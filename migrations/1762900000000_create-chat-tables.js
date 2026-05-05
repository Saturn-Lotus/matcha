/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

const sql = (strings, ...values) =>
  strings.reduce((prev, curr, i) => prev + curr + (values[i] ?? ''), '');

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = (pgm) => {
  pgm.sql(sql`
    CREATE TABLE IF NOT EXISTS conversations (
      "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      "userAId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      "userBId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE ("userAId", "userBId"),
      CHECK ("userAId" < "userBId")
    );

    CREATE TABLE IF NOT EXISTS messages (
      "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      "conversationId" UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      "senderId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      "body" TEXT NOT NULL,
      "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "readAt" TIMESTAMP WITH TIME ZONE,
      CONSTRAINT body_length CHECK (char_length(body) <= 2000)
    );

    CREATE INDEX IF NOT EXISTS idx_messages_conversation_id_created_at ON messages ("conversationId", "createdAt" DESC);
    CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages ("conversationId", "senderId", "readAt") WHERE "readAt" IS NULL;
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = (pgm) => {
  pgm.sql(sql`
    DROP TABLE IF EXISTS messages;
    DROP TABLE IF EXISTS conversations;
  `);
};
