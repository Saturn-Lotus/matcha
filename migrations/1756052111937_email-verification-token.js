/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

const sql = (strings, ...values) =>
  strings.reduce((prev, curr, i) => prev + curr + (values[i] ?? ''), '');

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  pgm.sql(
    sql`ALTER TABLE users ADD COLUMN "emailVerificationToken" VARCHAR(255) UNIQUE;`,
  );
  pgm.sql(sql`
	ALTER TABLE users RENAME COLUMN first_name TO "firstName";
	ALTER TABLE users RENAME COLUMN last_name TO "lastName";
	ALTER TABLE users RENAME COLUMN created_at TO "createdAt";
	ALTER TABLE users RENAME COLUMN updated_at TO "updatedAt";
	ALTER TABLE users RENAME COLUMN password_hash TO "passwordHash";
	ALTER TABLE users RENAME COLUMN is_verified TO "isVerified";
	`);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.sql(sql`ALTER TABLE users DROP COLUMN "emailVerificationToken";`);
  pgm.sql(sql`
	ALTER TABLE users RENAME COLUMN "firstName" TO first_name;
	ALTER TABLE users RENAME COLUMN "lastName" TO last_name;
	ALTER TABLE users RENAME COLUMN "createdAt" TO created_at;
	ALTER TABLE users RENAME COLUMN "updatedAt" TO updated_at;
	ALTER TABLE users RENAME COLUMN "passwordHash" TO password_hash;
	ALTER TABLE users RENAME COLUMN "isVerified" TO is_verified;
	`);
};
