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
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "userIdA"   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      "userIdB"   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE ("userIdA", "userIdB"),
      CHECK ("userIdA" < "userIdB")
    );

    CREATE INDEX idx_conversations_user_id_a ON conversations ("userIdA");
    CREATE INDEX idx_conversations_user_id_b ON conversations ("userIdB");
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = (pgm) => {
  pgm.sql(sql`
    DROP TABLE IF EXISTS conversations;
  `);
};
