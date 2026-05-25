/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  pgm.sql(`
    CREATE TABLE user_blocks (
      "blockerUserId" uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      "blockedUserId" uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      "blockedAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY ("blockerUserId", "blockedUserId"),
      CHECK ("blockerUserId" <> "blockedUserId")
    );

    CREATE INDEX user_blocks_blocked_idx ON user_blocks ("blockedUserId");
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.sql(`DROP TABLE IF EXISTS user_blocks;`);
};
