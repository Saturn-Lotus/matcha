export const shorthands = undefined;

export const up = (pgm) => {
  pgm.sql(`
    CREATE INDEX IF NOT EXISTS user_locations_location_gist
      ON user_locations USING GIST ("location");
  `);
};

export const down = (pgm) => {
  pgm.sql(`
    DROP INDEX IF EXISTS user_locations_location_gist;
  `);
};
