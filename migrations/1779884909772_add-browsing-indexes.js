/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = (pgm) => {
  pgm.sql(`
    CREATE INDEX IF NOT EXISTS idx_user_profiles_fame_rating
      ON user_profiles ("fameRating" DESC);
  `);
  pgm.sql(`
    CREATE INDEX IF NOT EXISTS idx_user_profiles_birth_date
      ON user_profiles ("birthDate");
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = (pgm) => {
  pgm.sql(`DROP INDEX IF EXISTS idx_user_profiles_fame_rating;`);
  pgm.sql(`DROP INDEX IF EXISTS idx_user_profiles_birth_date;`);
};
