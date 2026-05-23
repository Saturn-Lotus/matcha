/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

export const up = (pgm) => {
  pgm.sql(`
    ALTER TABLE user_profiles
      ADD COLUMN "birthDate" TIMESTAMPTZ NOT NULL;
  `);
};

export const down = (pgm) => {
  pgm.sql(`
    ALTER TABLE user_profiles
      DROP COLUMN "birthDate";
  `);
};
