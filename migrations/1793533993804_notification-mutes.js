export const shorthands = undefined;

const sql = (strings, ...values) =>
  strings.reduce((prev, curr, i) => prev + curr + (values[i] ?? ''), '');

export const up = (pgm) => {
  pgm.sql(sql`
    CREATE TABLE notification_mutes (
      "muterUserId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      "mutedUserId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
      PRIMARY KEY ("muterUserId", "mutedUserId")
    );
  `);
};

export const down = (pgm) => {
  pgm.sql(sql`
    DROP TABLE IF EXISTS notification_mutes;
  `);
};
