/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;


const sql = (strings, ...values) =>
  strings.reduce((prev, curr, i) => prev + curr + (values[i] ?? ""), "");

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
    pgm.sql(sql`
		CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
		CREATE EXTENSION IF NOT EXISTS pgcrypto;

	`);

    pgm.sql(sql`
		CREATE TYPE gender_t AS ENUM ('male', 'female');
		CREATE TYPE sexual_preference_t AS ENUM ('male', 'female', 'both');
	`);

    pgm.sql(sql`
		-- Create the users table if it does not exist
		CREATE TABLE IF NOT EXISTS users (
			id UUID PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL UNIQUE,
			username VARCHAR(50) NOT NULL UNIQUE,
			first_name VARCHAR(50) NOT NULL,
			last_name VARCHAR(50) NOT NULL,
			email VARCHAR(255) NOT NULL UNIQUE, 
			created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
			password_hash TEXT NOT NULL,
			is_verified BOOLEAN DEFAULT FALSE NOT NULL
		);
	`);

    pgm.sql(sql`
		-- Create the user_profiles table if it does not exist
		CREATE TABLE IF NOT EXISTS user_profiles (
			user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
			bio TEXT,
			gender gender_t NOT NULL,
			sexual_preference sexual_preference_t DEFAULT 'both' NOT NULL,
			avatar_url VARCHAR(255),
			interests TEXT[],
			pictures VARCHAR(255)[],
			created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL

		);
	`);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
    pgm.sql(sql`
		DROP TABLE IF EXISTS user_profiles;
		DROP TABLE IF EXISTS users;
		DROP TYPE IF EXISTS gender_t;
	`);
    pgm.sql(sql`
		DROP EXTENSION IF EXISTS "uuid-ossp";
		DROP EXTENSION IF EXISTS pgcrypto;
	`);
};
