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
    CREATE TABLE account_reports (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "reporterUserId" uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      "reportedUserId" uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      reason text NOT NULL,
      "createdAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT account_reports_no_self CHECK ("reporterUserId" <> "reportedUserId"),
      CONSTRAINT account_reports_unique_pair UNIQUE ("reporterUserId", "reportedUserId")
    );

    CREATE INDEX account_reports_reported_idx ON account_reports ("reportedUserId");
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.sql(`DROP TABLE IF EXISTS account_reports;`);
};
