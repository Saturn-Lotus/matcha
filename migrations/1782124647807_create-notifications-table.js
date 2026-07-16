export const shorthands = undefined;

const sql = (strings, ...values) =>
  strings.reduce((prev, curr, i) => prev + curr + (values[i] ?? ''), '');

export const up = (pgm) => {
  pgm.sql(sql`
    CREATE TYPE notification_type AS ENUM (
      'like',
      'profile_view',
      'message',
      'match',
      'unmatch'
    );

    CREATE TABLE notifications (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "userId"    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type        notification_type NOT NULL,
      "actorId"   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      payload     JSONB,
      "readAt"    TIMESTAMPTZ,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX idx_notifications_user_unread
      ON notifications ("userId", "createdAt" DESC)
      WHERE "readAt" IS NULL;

    CREATE INDEX idx_notifications_user_created
      ON notifications ("userId", "createdAt" DESC);
  `);
};

export const down = (pgm) => {
  pgm.sql(sql`
    DROP TABLE IF EXISTS notifications;
    DROP TYPE IF EXISTS notification_type;
  `);
};
