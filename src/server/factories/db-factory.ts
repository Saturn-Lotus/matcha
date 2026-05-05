import { PostgresDB } from '@/server/db/postgres';

const getPostgresDB = (): PostgresDB => {
  return new PostgresDB();
};

export { getPostgresDB };