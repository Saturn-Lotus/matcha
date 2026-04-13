-- populate_users.sql
-- Generates 500 seed users with randomised data using a PL/pgSQL loop.
-- Requires: pgcrypto extension (already enabled by migrations).
-- All users share the password "password123".

DO $$
DECLARE
  first_names  TEXT[] := ARRAY[
    'Alice','Bob','Carol','David','Eve','Frank','Grace','Hank','Ivy','Jack',
    'Karen','Leo','Mia','Noah','Olivia','Paul','Quinn','Rachel','Sam','Tina',
    'Uma','Victor','Wendy','Xander','Yara','Zack','Amira','Bruno','Chloe','Diego'
  ];
  last_names   TEXT[] := ARRAY[
    'Smith','Jones','Taylor','Brown','Wilson','Moore','Clark','Lewis','Hall','Young',
    'Allen','Wright','Scott','Green','Baker','Adams','Nelson','Carter','Mitchell','Roberts',
    'Turner','Parker','Evans','Edwards','Collins','Stewart','Morris','Murphy','Cook','Rogers'
  ];
  all_interests TEXT[] := ARRAY[
    'music','sports','travel','cooking','reading','gaming','hiking','photography',
    'yoga','cycling','dancing','art','cinema','fashion','technology','fitness',
    'surfing','climbing','coffee','wine'
  ];
  genders      TEXT[] := ARRAY['male','female'];
  prefs        TEXT[] := ARRAY['male','female','both'];

  i            INT;
  uid          UUID;
  fname        TEXT;
  lname        TEXT;
  uname        TEXT;
  uemail       TEXT;
  ugender      TEXT;
  upref        TEXT;
  ubio         TEXT;
  user_interests TEXT[];
  n_interests  INT;
  fn_len       INT := array_length(first_names, 1);
  ln_len       INT := array_length(last_names, 1);
  int_len      INT := array_length(all_interests, 1);
  -- Compute bcrypt hash once (cost 4 is fine for seed data)
  pw_hash      TEXT := crypt('password123', gen_salt('bf', 4));
BEGIN
  FOR i IN 1..500 LOOP
    uid    := uuid_generate_v4();
    fname  := first_names[1 + (floor(random() * fn_len))::int];
    lname  := last_names[1 + (floor(random() * ln_len))::int];
    uname  := 'user_' || i || '_' || substr(md5(random()::text), 1, 5);
    uemail := 'seed_user_' || i || '@example.com';
    ugender := genders[1 + (floor(random() * 2))::int];
    upref   := prefs[1 + (floor(random() * 3))::int];

    -- Pick 2–5 distinct random interests
    n_interests := 2 + (floor(random() * 4))::int;
    SELECT ARRAY(
      SELECT DISTINCT all_interests[1 + (floor(random() * int_len))::int]
      FROM generate_series(1, n_interests * 3)   -- oversample then deduplicate
      LIMIT n_interests
    ) INTO user_interests;

    ubio := 'Hi, I''m ' || fname || '! I love ' ||
            all_interests[1 + (floor(random() * int_len))::int] || ' and ' ||
            all_interests[1 + (floor(random() * int_len))::int] || '.';

    INSERT INTO users (id, username, email, "pendingEmail", "passwordHash", "isVerified")
    VALUES (uid, uname, uemail, uemail, pw_hash, TRUE)
    ON CONFLICT DO NOTHING;

    INSERT INTO user_profiles (
      "userId", "firstName", "lastName",
      bio, gender, "sexualPreference",
      interests, "isProfileComplete"
    )
    VALUES (
      uid, fname, lname,
      ubio, ugender::gender_t, upref::sexual_preference_t,
      user_interests, TRUE
    )
    ON CONFLICT DO NOTHING;

  END LOOP;

  RAISE NOTICE 'Seed complete: up to 500 users inserted.';
END;
$$;
