-- populate_users.sql
-- This script inserts 10 random users and their profiles into the database

INSERT INTO users (id, username, first_name, last_name, email, password_hash, is_verified)
VALUES
  (uuid_generate_v4(), 'user1', 'Alice', 'Smith', 'alice1@example.com', 'hash1', TRUE),
  (uuid_generate_v4(), 'user2', 'Bob', 'Jones', 'bob2@example.com', 'hash2', FALSE),
  (uuid_generate_v4(), 'user3', 'Carol', 'Taylor', 'carol3@example.com', 'hash3', TRUE),
  (uuid_generate_v4(), 'user4', 'David', 'Brown', 'david4@example.com', 'hash4', FALSE),
  (uuid_generate_v4(), 'user5', 'Eve', 'Wilson', 'eve5@example.com', 'hash5', TRUE),
  (uuid_generate_v4(), 'user6', 'Frank', 'Moore', 'frank6@example.com', 'hash6', FALSE),
  (uuid_generate_v4(), 'user7', 'Grace', 'Clark', 'grace7@example.com', 'hash7', TRUE),
  (uuid_generate_v4(), 'user8', 'Hank', 'Lewis', 'hank8@example.com', 'hash8', FALSE),
  (uuid_generate_v4(), 'user9', 'Ivy', 'Walker', 'ivy9@example.com', 'hash9', TRUE),
  (uuid_generate_v4(), 'user10', 'Jack', 'Hall', 'jack10@example.com', 'hash10', FALSE);

INSERT INTO user_profiles (user_id, bio, gender, sexual_preference, avatar_url, interests, pictures)
SELECT id, 'Bio for ' || username, 'male', 'both', NULL, ARRAY['music', 'sports'], ARRAY['pic1.jpg', 'pic2.jpg']
FROM users WHERE username LIKE 'user%';
