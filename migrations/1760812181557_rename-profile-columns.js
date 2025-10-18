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
  pgm.sql(sql`
		ALTER TABLE user_profiles RENAME COLUMN sexual_preference TO "sexualPreference";
		ALTER TABLE user_profiles RENAME COLUMN avatar_url TO "avatarUrl";
		ALTER TABLE user_profiles RENAME COLUMN created_at TO "createdAt";
		ALTER TABLE user_profiles RENAME COLUMN updated_at TO "updatedAt";
	`);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.sql(sql`
		ALTER TABLE user_profiles RENAME COLUMN "sexualPreference" TO sexual_preference;
		ALTER TABLE user_profiles RENAME COLUMN "avatarUrl" TO avatar_url;
		ALTER TABLE user_profiles RENAME COLUMN "createdAt" TO created_at;
		ALTER TABLE user_profiles RENAME COLUMN "updatedAt" TO updated_at;
	`);
};
