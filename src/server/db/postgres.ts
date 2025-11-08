import { Pool, PoolClient, QueryResultRow } from 'pg';
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
  private client: PoolClient | null = null;

  constructor(client?: PoolClient) {
    this.client = client || null;
  }

  async query<M extends QueryResultRow = any>(
    text: string,
    params?: any[],
  ): Promise<M[]> {
    const client = this.client ?? (await pool.connect());
    const shouldRelease = Boolean(this.client === null);

    const result = await client.query<M>(text, params);
    if (shouldRelease) {
      client.release();
      this.client = null;
    }
    return result.rows;
  }

  async mutate<T = any>(text: string, params?: any[]): Promise<T> {
    const client = this.client ?? (await pool.connect());
    const shouldRelease = Boolean(this.client === null);

    const result = await client.query(text, params);
    if (shouldRelease) {
      client.release();
      this.client = null;
    }
    return result.rows as T;
  }

  async transaction<T>(
    fn: (transactionDB: PostgresDB) => Promise<T>,
    onError?: (error: Error) => void,
  ): Promise<T> {
    const client = await pool.connect();
    const transactionDB = new PostgresDB(client);

    try {
      await client.query('BEGIN');
      const result = await fn(transactionDB);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      onError?.(error as Error);
      throw error;
    } finally {
      client.release();
    }
  }
}
