export const shorthands = undefined;

export const up = (pgm) => {
  pgm.sql(`
    ALTER TABLE user_profiles
      DROP COLUMN "isOnline";
  `);
};

export const down = (pgm) => {
  pgm.sql(`
    ALTER TABLE user_profiles
      ADD COLUMN "isOnline" BOOLEAN NOT NULL DEFAULT FALSE;
  `);
};
