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
    CREATE TABLE IF NOT EXISTS user_blocks (
      "blockerUserId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      "blockedUserId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      "blockedAt"     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY ("blockerUserId", "blockedUserId")
    );
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = (pgm) => {
  pgm.sql(sql`
    DROP TABLE IF EXISTS user_blocks;
  `);
};
