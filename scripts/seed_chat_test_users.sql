DO $$
DECLARE
  a_uid UUID;
  b_uid UUID;
  a_pw  TEXT := crypt('Matcha2024pwd', gen_salt('bf', 4));
  b_pw  TEXT := crypt('Latte2024pwd', gen_salt('bf', 4));
  a_pic TEXT := 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&q=80&auto=format&fit=crop';
  b_pic TEXT := 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&q=80&auto=format&fit=crop';
BEGIN
  DELETE FROM users WHERE email IN ('chat_alice@example.com', 'chat_bob@example.com');

  a_uid := uuid_generate_v4();
  b_uid := uuid_generate_v4();

  INSERT INTO users (id, username, email, "pendingEmail", "passwordHash", "isVerified")
  VALUES
    (a_uid, 'chat_alice', 'chat_alice@example.com', 'chat_alice@example.com', a_pw, TRUE),
    (b_uid, 'chat_bob', 'chat_bob@example.com', 'chat_bob@example.com', b_pw, TRUE);

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

  INSERT INTO user_likes ("likerUserId", "likedUserId", "likedAt")
  VALUES (a_uid, b_uid, NOW()), (b_uid, a_uid, NOW())
  ON CONFLICT DO NOTHING;

  INSERT INTO matches ("userIdA", "userIdB")
  VALUES (LEAST(a_uid, b_uid), GREATEST(a_uid, b_uid))
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Created matched chat test users: % and %', a_uid, b_uid;
END $$;
