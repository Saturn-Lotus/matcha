export const shorthands = undefined;

export const up = (pgm) => {
  pgm.sql(`
    BEGIN;
    CREATE EXTENSION IF NOT EXISTS postgis;
    CREATE TABLE user_locations (
      "userId" UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      "latitude" DOUBLE PRECISION NOT NULL,
      "longitude" DOUBLE PRECISION NOT NULL,
      "city" VARCHAR(255),
      "neighborhood" VARCHAR(255),
      "locationType" VARCHAR(10) NOT NULL CHECK ("locationType" IN ('gps', 'manual')),
      "consentGiven" BOOLEAN NOT NULL DEFAULT FALSE,
      "location" GEOGRAPHY(POINT, 4326),
      "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
      "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
    );
    COMMIT;
  `);
};

export const down = (pgm) => {
  pgm.sql(`
    DROP TABLE IF EXISTS user_locations;
  `);
};
