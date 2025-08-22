import { Pool, QueryResultRow } from 'pg';
import IBaseDB from './base';
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  min: 1,
  idleTimeoutMillis: 30000, // 30 seconds
  connectionTimeoutMillis: 2000, // 2 seconds
  maxLifetimeSeconds: 60, // 1 minute
});

/**
 * @param text SQL query string.
 * @param params Optional parameters for the query.
 * @returns A promise that resolves to the result of the query.
 */
export const query = (text: string, params: any[]) => {
  return pool.query(text, params);
};

export class PostgresDB implements IBaseDB {
  async query<M extends QueryResultRow = any>(
    text: string,
    params?: any[],
  ): Promise<M[]> {
    const client = await pool.connect();
    const result = await client.query<M>(text, params,);
    client.release();
    return result.rows;
  }

  async mutate<T = any>(text: string, params?: any[]): Promise<T> {
    const client = await pool.connect();
    const result = await client.query(text, params);
    client.release();
    return result.rows as T;
  }
}
