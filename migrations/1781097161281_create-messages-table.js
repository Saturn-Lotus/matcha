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
    CREATE TABLE IF NOT EXISTS messages (
      id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "conversationId" UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      "senderId"       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      body             TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
      "createdAt"      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "readAt"         TIMESTAMP WITH TIME ZONE
    );

    CREATE INDEX idx_messages_conversation_created
      ON messages ("conversationId", "createdAt" DESC);
    CREATE INDEX idx_messages_unread
      ON messages ("conversationId", "senderId")
      WHERE "readAt" IS NULL;
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = (pgm) => {
  pgm.sql(sql`
    DROP TABLE IF EXISTS messages;
  `);
};
