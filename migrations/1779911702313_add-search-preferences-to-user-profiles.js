/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = (pgm) => {
  pgm.sql(`
    ALTER TABLE user_profiles
      ADD COLUMN "prefMinAge" INT,
      ADD COLUMN "prefMaxAge" INT,
      ADD COLUMN "prefMinFame" INT,
      ADD COLUMN "prefMaxFame" INT,
      ADD COLUMN "prefMaxDistanceKm" FLOAT,
      ADD COLUMN "prefTags" TEXT[];
  `);
  pgm.sql(`
    CREATE INDEX IF NOT EXISTS idx_user_profiles_pref_tags
      ON user_profiles USING GIN ("prefTags");
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = (pgm) => {
  pgm.sql(`DROP INDEX IF EXISTS idx_user_profiles_pref_tags;`);
  pgm.sql(`
    ALTER TABLE user_profiles
      DROP COLUMN IF EXISTS "prefMinAge",
      DROP COLUMN IF EXISTS "prefMaxAge",
      DROP COLUMN IF EXISTS "prefMinFame",
      DROP COLUMN IF EXISTS "prefMaxFame",
      DROP COLUMN IF EXISTS "prefMaxDistanceKm",
      DROP COLUMN IF EXISTS "prefTags";
  `);
};
