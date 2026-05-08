export const shorthands = undefined;

export const up = (pgm) => {
  pgm.sql(`
    ALTER TABLE user_profiles
      ADD COLUMN "fameRating"  FLOAT        NOT NULL DEFAULT 0,
      ADD COLUMN "lastSeenAt"  TIMESTAMPTZ,
      ADD COLUMN "isOnline"    BOOLEAN      NOT NULL DEFAULT FALSE;
  `);
};

export const down = (pgm) => {
  pgm.sql(`
    ALTER TABLE user_profiles
      DROP COLUMN "fameRating",
      DROP COLUMN "lastSeenAt",
      DROP COLUMN "isOnline";
  `);
};
