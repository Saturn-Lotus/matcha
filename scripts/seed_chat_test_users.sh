#!/bin/bash
# seed_chat_test_users.sh
# Creates two ready-to-use test accounts (verified + profile-complete) that are
# already matched with each other, so you can immediately test the chat feature.
# Re-running is safe: the two accounts are wiped and recreated each time.
#
# Usage:
#   bash scripts/seed_chat_test_users.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Load environment variables from .env at project root
if [ -f "$PROJECT_ROOT/.env" ]; then
  set -a
  # shellcheck source=/dev/null
  source "$PROJECT_ROOT/.env"
  set +a
else
  echo "Error: .env file not found at $PROJECT_ROOT/.env" >&2
  exit 1
fi

if [ -z "${POSTGRES_CONNECTION_STRING:-}" ]; then
  echo "Error: POSTGRES_CONNECTION_STRING is not set" >&2
  exit 1
fi

# Normalize common invalid sslmode values for psql compatibility
if [[ "${POSTGRES_CONNECTION_STRING}" == *"sslmode=enable"* ]]; then
  POSTGRES_CONNECTION_STRING="${POSTGRES_CONNECTION_STRING//sslmode=enable/sslmode=require}"
fi
if [[ "${POSTGRES_CONNECTION_STRING}" == *"sslmode=on"* ]]; then
  POSTGRES_CONNECTION_STRING="${POSTGRES_CONNECTION_STRING//sslmode=on/sslmode=require}"
fi

# ── Credentials (valid per backend rules: username [a-zA-Z0-9_], password has
#    upper + lower + digit and >= 8 chars, age >= 18) ──────────────────────────
A_USERNAME="chat_alice"
A_EMAIL="chat_alice@example.com"
A_PASSWORD="Matcha2024pwd"

B_USERNAME="chat_bob"
B_EMAIL="chat_bob@example.com"
B_PASSWORD="Latte2024pwd"

echo "Seeding two matched chat test users..."

psql "$POSTGRES_CONNECTION_STRING" -v ON_ERROR_STOP=1 <<SQL
DO \$\$
DECLARE
  a_uid UUID;
  b_uid UUID;
  a_pw  TEXT := crypt('${A_PASSWORD}', gen_salt('bf', 4));
  b_pw  TEXT := crypt('${B_PASSWORD}', gen_salt('bf', 4));
  a_pic TEXT := 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&q=80&auto=format&fit=crop';
  b_pic TEXT := 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&q=80&auto=format&fit=crop';
BEGIN
  -- Idempotent: ON DELETE CASCADE removes profiles, locations, likes, matches,
  -- conversations and messages for these accounts.
  DELETE FROM users WHERE email IN ('${A_EMAIL}', '${B_EMAIL}');

  a_uid := uuid_generate_v4();
  b_uid := uuid_generate_v4();

  INSERT INTO users (id, username, email, "pendingEmail", "passwordHash", "isVerified")
  VALUES
    (a_uid, '${A_USERNAME}', '${A_EMAIL}', '${A_EMAIL}', a_pw, TRUE),
    (b_uid, '${B_USERNAME}', '${B_EMAIL}', '${B_EMAIL}', b_pw, TRUE);

  INSERT INTO user_profiles (
    "userId", "firstName", "lastName", "birthDate",
    bio, gender, "sexualPreference",
    interests, "isProfileComplete",
    "avatarUrl", pictures, "fameRating", "lastSeenAt"
  ) VALUES
    (a_uid, 'Alice', 'Anderson', NOW() - interval '26 years',
     'Chat test account A.', 'female'::gender_t, 'both'::sexual_preference_t,
     ARRAY['matcha','books'], TRUE, a_pic, ARRAY[a_pic], 50, NOW()),
    (b_uid, 'Bob', 'Brown', NOW() - interval '28 years',
     'Chat test account B.', 'male'::gender_t, 'both'::sexual_preference_t,
     ARRAY['coffee','hiking'], TRUE, b_pic, ARRAY[b_pic], 50, NOW());

  INSERT INTO user_locations (
    "userId", latitude, longitude, city, "locationType", "consentGiven", location
  ) VALUES
    (a_uid, 48.8566, 2.3522, 'Paris', 'gps', TRUE,
     ST_SetSRID(ST_MakePoint(2.3522, 48.8566), 4326)::geography),
    (b_uid, 48.8570, 2.3490, 'Paris', 'gps', TRUE,
     ST_SetSRID(ST_MakePoint(2.3490, 48.8570), 4326)::geography);

  -- Mutual like + match so they can message each other immediately.
  INSERT INTO user_likes ("likerUserId", "likedUserId", "likedAt")
  VALUES (a_uid, b_uid, NOW()), (b_uid, a_uid, NOW())
  ON CONFLICT DO NOTHING;

  INSERT INTO matches ("userIdA", "userIdB")
  VALUES (LEAST(a_uid, b_uid), GREATEST(a_uid, b_uid))
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Created matched chat test users: % and %', a_uid, b_uid;
END \$\$;
SQL

echo ""
echo "Done. Two matched users created — log in (in two browsers/profiles) with:"
echo ""
echo "  User A"
echo "    username: ${A_USERNAME}"
echo "    password: ${A_PASSWORD}"
echo ""
echo "  User B"
echo "    username: ${B_USERNAME}"
echo "    password: ${B_PASSWORD}"
echo ""
echo "They are already matched, so open /matches and hit \"Message\" to start chatting."
