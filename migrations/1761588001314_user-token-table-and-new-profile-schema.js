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
  		BEGIN;
		-- alter existing optional columns
		ALTER TABLE user_profiles ALTER COLUMN "gender" DROP NOT NULL;

		-- move firstName and lastName from users to user_profiles
		ALTER TABLE user_profiles ADD COLUMN "lastName" VARCHAR(50) NOT NULL;
		ALTER TABLE user_profiles ADD COLUMN "firstName" VARCHAR(50) NOT NULL;
		INSERT INTO user_profiles ("userId", "firstName", "lastName")
		SELECT id, "firstName", "lastName" FROM users;

		-- drop firstName and lastName from users
		ALTER TABLE users DROP COLUMN "firstName";
		ALTER TABLE users DROP COLUMN "lastName";

		-- add pending email column to users
		ALTER TABLE users ADD COLUMN "pendingEmail" VARCHAR(255) NOT NULL UNIQUE;

		-- new user_tokens table one to many relationship with users
		CREATE TABLE IF NOT EXISTS user_tokens (
			userId UUID REFERENCES users(id) ON DELETE CASCADE,
			tokenHash TEXT NOT NULL UNIQUE,
			tokenType VARCHAR(50) NOT NULL,
			tokenExpiry TIMESTAMP WITH TIME ZONE NOT NULL,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
		);
		ALTER TABLE users DROP COLUMN "emailVerificationToken";
		ALTER TABLE users DROP COLUMN "passwordResetToken";
 
		COMMIT;
		`);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.sql(sql`
  		BEGIN;
		-- move firstName and lastName from user_profiles to users
		ALTER TABLE users ADD COLUMN "lastName" VARCHAR(50) NOT NULL;
		ALTER TABLE users ADD COLUMN "firstName" VARCHAR(50) NOT NULL;
		UPDATE users SET "firstName" = up."firstName", "lastName" = up."lastName"
		FROM user_profiles up
		WHERE users.id = up."userId";

		-- drop firstName and lastName from user_profiles
		ALTER TABLE user_profiles DROP COLUMN "firstName";
		ALTER TABLE user_profiles DROP COLUMN "lastName";

		-- alter existing optional columns
		ALTER TABLE user_profiles ALTER COLUMN "gender" SET NOT NULL;

		-- drop user_tokens table
		DROP TABLE IF EXISTS user_tokens;
		
		-- add back emailVerificationToken and passwordResetToken to users
		ALTER TABLE users ADD COLUMN "emailVerificationToken" VARCHAR(255) UNIQUE;
		ALTER TABLE users ADD COLUMN "passwordResetToken" VARCHAR(255) UNIQUE;
		COMMIT;
		`);
};
