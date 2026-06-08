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
    CREATE TABLE IF NOT EXISTS matches (
      "userIdA"   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      "userIdB"   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      "matchedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY ("userIdA", "userIdB"),
      CHECK ("userIdA" < "userIdB")
    );

    CREATE INDEX idx_matches_user_id_a ON matches ("userIdA");
    CREATE INDEX idx_matches_user_id_b ON matches ("userIdB");

    -- Backfill matches for users who already mutually like each other.
    INSERT INTO matches ("userIdA", "userIdB")
    SELECT LEAST(l1."likerUserId", l1."likedUserId"),
           GREATEST(l1."likerUserId", l1."likedUserId")
    FROM user_likes l1
    JOIN user_likes l2
      ON l2."likerUserId" = l1."likedUserId"
     AND l2."likedUserId" = l1."likerUserId"
    WHERE l1."likerUserId" < l1."likedUserId"
    ON CONFLICT DO NOTHING;
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = (pgm) => {
  pgm.sql(sql`
    DROP TABLE IF EXISTS matches;
  `);
};
