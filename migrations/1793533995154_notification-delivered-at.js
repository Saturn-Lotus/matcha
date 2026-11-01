export const shorthands = undefined;

const sql = (strings, ...values) =>
  strings.reduce((prev, curr, i) => prev + curr + (values[i] ?? ''), '');

export const up = (pgm) => {
  pgm.sql(sql`
    ALTER TABLE notifications ADD COLUMN "deliveredAt" TIMESTAMPTZ;
  `);
};

export const down = (pgm) => {
  pgm.sql(sql`
    ALTER TABLE notifications DROP COLUMN IF EXISTS "deliveredAt";
  `);
};
