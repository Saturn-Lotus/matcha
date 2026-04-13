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
    CREATE TABLE IF NOT EXISTS profile_views (
      "viewerId"     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      "viewedUserId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      "viewedAt"     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY ("viewerId", "viewedUserId")
    );

    -- Fast lookup for "who viewed me?" queries (filter by viewedUserId)
    CREATE INDEX idx_profile_views_viewed_user_id ON profile_views ("viewedUserId");
  `);

  pgm.sql(sql`
    CREATE TABLE IF NOT EXISTS user_likes (
      "likerUserId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      "likedUserId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      "likedAt"     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY ("likerUserId", "likedUserId")
    );

    -- Fast lookup for "who liked me?" queries (filter by likedUserId)
    CREATE INDEX idx_user_likes_liked_user_id ON user_likes ("likedUserId");
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = (pgm) => {
  pgm.sql(sql`
    DROP TABLE IF EXISTS user_likes;
    DROP TABLE IF EXISTS profile_views;
  `);
};
