-- seed_users.sql
-- Seeds the database with 500 users for browse/feed testing.
-- Populates: users, user_profiles (with pictures, fameRating, isOnline),
--            and user_locations (with PostGIS geometry) near Paris.
--
-- All users share the password "password123".
-- Run via: bash scripts/seed_users.sh

DO $$
DECLARE
  first_names TEXT[] := ARRAY[
    'Alice','Bob','Carol','David','Eve','Frank','Grace','Hank','Ivy','Jack',
    'Karen','Leo','Mia','Noah','Olivia','Paul','Quinn','Rachel','Sam','Tina',
    'Uma','Victor','Wendy','Xander','Yara','Zack','Amira','Bruno','Chloe','Diego',
    'Elena','Felix','Gia','Hugo','Iris','Jules','Kira','Liam','Maya','Nico',
    'Petra','Remy','Sofia','Theo','Ursula','Vance','Wren','Xio','Yasmin','Zion'
  ];
  last_names TEXT[] := ARRAY[
    'Smith','Jones','Taylor','Brown','Wilson','Moore','Clark','Lewis','Hall','Young',
    'Allen','Wright','Scott','Green','Baker','Adams','Nelson','Carter','Mitchell','Roberts',
    'Turner','Parker','Evans','Edwards','Collins','Stewart','Morris','Murphy','Cook','Rogers',
    'Durand','Martin','Bernard','Thomas','Petit','Robert','Richard','Simon','Laurent','Leblanc'
  ];

  -- Tag vocabulary matching the browse feed design
  all_tags TEXT[] := ARRAY[
    'matcha','tea','hiking','film-photo','vegan','vinyl','baking',
    'running','cycling','climbing','yoga','design','books','reading',
    'poetry','painting','ceramics','jazz','indie','dogs','cats',
    'plants','cooking','coffee','cinema','travel','gaming','fitness',
    'photography','surfing','climbing','fashion','music','dancing','art'
  ];

  -- Bio templates
  bio_templates TEXT[] := ARRAY[
    'Matcha latte loyalist. Weekend hiker. Film photos only.',
    'Tea ceremony curious. Vinyl-first. Best mochi in the city.',
    'Trail runner who plans dates around bakeries.',
    'Architecture student. I will redesign your bookshelf.',
    'Cycling, jazz, ramen. Looking for a partner in carb crime.',
    'Ceramicist. Slow mornings. Tea before talking.',
    'Climber and amateur cook. Always on a film set.',
    'Painter. Plant person. I''ll teach you sun salutations.',
    'Dog person trying to become a cat person. Send help.',
    'I make sourdough at 6am and think that''s a personality.',
    'Looking for someone who also reads the menu before arriving.',
    'Avid reader, terrible at finishing series. Let''s discuss.',
    'Coffee snob, hiking enthusiast, mediocre chess player.',
    'I take photos of food but I promise I''m fun at dinner.',
    'Passionate about good music and even better conversation.',
    'Bookshop regular. Film festival regular. Very regular.',
    'Part-time yogi, full-time overthinker. Balance, etc.',
    'Into long walks and strong opinions about coffee.',
    'Art school dropout who still thinks about it. Wanna talk?',
    'Growing a balcony garden. Only partially failing.'
  ];

  -- Female-presenting Unsplash portrait IDs
  female_photos TEXT[] := ARRAY[
    '1494790108377-be9c29b29330',
    '1517841905240-472988babdf9',
    '1438761681033-6461ffad8d80',
    '1531123897727-8f129e1688ce',
    '1502823403499-6ccfcf4fb453',
    '1521252659862-eec69941b071',
    '1495216875107-c6c043eb703f',
    '1488426862026-3ee34a7d66df',
    '1525134479668-1bee5c7c6845',
    '1496440737103-cd596325d314',
    '1529626455594-4ff0802cfb7e',
    '1534528741775-53994a69daeb',
    '1488716820095-cbe80883c496',
    '1513956589380-4e8df07c3c72',
    '1522075469751-3a6694fb2f61'
  ];

  -- Male-presenting Unsplash portrait IDs
  male_photos TEXT[] := ARRAY[
    '1500648767791-00dcc994a43e',
    '1504593811423-6dd665756598',
    '1492562080023-ab3db95bfbce',
    '1539571696357-5a69c17a67c6',
    '1503185912284-5271ff81b9a8',
    '1519345182560-3f2917c472ef',
    '1507003211169-0a1dd7228f2d',
    '1506794778202-cad84cf45f1d',
    '1472099645785-5658abf4ff4e',
    '1463453091185-61582044d556',
    '1514222709925-d8755257a370',
    '1570295999919-56ceb5ecca61',
    '1511367461989-f85a21fda167',
    '1522529599102-193c0d76b5b6',
    '1519058082700-08a9b5cb9a42'
  ];

  genders  TEXT[] := ARRAY['male','female'];
  prefs    TEXT[] := ARRAY['male','female','both'];

  -- Paris as the seed center (~48.8566°N, 2.3522°E)
  center_lat  FLOAT := 48.8566;
  center_lng  FLOAT := 2.3522;

  i            INT;
  uid          UUID;
  fname        TEXT;
  lname        TEXT;
  uname        TEXT;
  uemail       TEXT;
  ugender      TEXT;
  upref        TEXT;
  ubio         TEXT;
  user_tags    TEXT[];
  n_tags       INT;
  user_pics    TEXT[];
  avatar       TEXT;
  photo_id     TEXT;
  photo_pool   TEXT[];
  n_pics       INT;
  j            INT;
  user_fame    FLOAT;
  user_online  BOOLEAN;
  user_seen    TIMESTAMPTZ;
  ulat         FLOAT;
  ulng         FLOAT;
  ubirthdate   TIMESTAMPTZ;

  fn_len  INT := array_length(first_names,  1);
  ln_len  INT := array_length(last_names,   1);
  tag_len INT := array_length(all_tags,     1);
  bio_len INT := array_length(bio_templates,1);
  fp_len  INT := array_length(female_photos,1);
  mp_len  INT := array_length(male_photos,  1);

  pw_hash TEXT := crypt('password123', gen_salt('bf', 4));
BEGIN
  FOR i IN 1..500 LOOP
    uid    := uuid_generate_v4();
    fname  := first_names [1 + (floor(random() * fn_len ))::int];
    lname  := last_names  [1 + (floor(random() * ln_len ))::int];
    uname  := 'user_' || i || '_' || substr(md5(random()::text), 1, 5);
    uemail := 'seed_' || i || '@example.com';
    ugender := genders[1 + (floor(random() * 2))::int];
    upref   := prefs  [1 + (floor(random() * 3))::int];
    ubio    := bio_templates[1 + (floor(random() * bio_len))::int];

    -- 3–5 distinct random tags
    n_tags := 3 + (floor(random() * 3))::int;
    SELECT ARRAY(
      SELECT DISTINCT all_tags[1 + (floor(random() * tag_len))::int]
      FROM generate_series(1, n_tags * 4)
      LIMIT n_tags
    ) INTO user_tags;

    -- Pick photo pool based on gender; assign 2–4 photos
    IF ugender = 'female' THEN
      photo_pool := female_photos;
    ELSE
      photo_pool := male_photos;
    END IF;
    n_pics := 2 + (floor(random() * 3))::int;  -- 2, 3, or 4 photos
    user_pics := '{}';
    FOR j IN 1..n_pics LOOP
      photo_id := photo_pool[1 + (floor(random() * array_length(photo_pool, 1)))::int];
      user_pics := array_append(
        user_pics,
        'https://images.unsplash.com/photo-' || photo_id || '?w=800&q=80&auto=format&fit=crop'
      );
    END LOOP;
    avatar := user_pics[1];

    -- Fame rating: long-tail distribution (most users 10–200, a few up to 500)
    user_fame := least(500, greatest(10, (random() ^ 0.5) * 400 + 10));

    -- ~30% online right now; others last seen 0–72 h ago
    user_online := (random() < 0.30);
    IF user_online THEN
      user_seen := NOW();
    ELSE
      user_seen := NOW() - (random() * interval '72 hours');
    END IF;

    -- Location: spread within ~50 km of Paris center
    ulat := center_lat + (random() - 0.5) * 0.9;   -- ±~50 km latitude
    ulng := center_lng + (random() - 0.5) * 1.1;   -- ±~50 km longitude at 48°N

    -- Birth date: random age between 18 and 55 years old
    ubirthdate := NOW()
                  - (interval '18 years')
                  - (random() * interval '37 years');

    -- ── users ──────────────────────────────────────────────────────────────
    INSERT INTO users (id, username, email, "pendingEmail", "passwordHash", "isVerified")
    VALUES (uid, uname, uemail, uemail, pw_hash, TRUE)
    ON CONFLICT DO NOTHING;

    -- ── user_profiles ──────────────────────────────────────────────────────
    INSERT INTO user_profiles (
      "userId", "firstName", "lastName", "birthDate",
      bio, gender, "sexualPreference",
      interests, "isProfileComplete",
      "avatarUrl", pictures,
      "fameRating", "isOnline", "lastSeenAt"
    )
    VALUES (
      uid, fname, lname, ubirthdate,
      ubio, ugender::gender_t, upref::sexual_preference_t,
      user_tags, TRUE,
      avatar, user_pics,
      user_fame, user_online, user_seen
    )
    ON CONFLICT DO NOTHING;

    -- ── user_locations ─────────────────────────────────────────────────────
    INSERT INTO user_locations (
      "userId", latitude, longitude,
      city, "locationType", "consentGiven",
      location
    )
    VALUES (
      uid, ulat, ulng,
      'Paris', 'gps', TRUE,
      ST_SetSRID(ST_MakePoint(ulng, ulat), 4326)::geography
    )
    ON CONFLICT DO NOTHING;

  END LOOP;

  RAISE NOTICE 'Seed complete: up to 500 users inserted with locations and pictures.';
END;
$$;
