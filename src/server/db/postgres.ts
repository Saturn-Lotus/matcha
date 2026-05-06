import { Pool, PoolClient, QueryResultRow } from 'pg';
import IBaseDB from './base';

function connectionString(): string {
  const url =
    process.env.POSTGRES_CONNECTION_STRING?.trim() ||
    process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error(
      'Set POSTGRES_CONNECTION_STRING or DATABASE_URL for PostgreSQL',
    );
  }
  return url;
}

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: connectionString(),
      max: 20,
      min: 1,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      maxLifetimeSeconds: 3600,
    });
  }
  return pool;
}

export const query = (text: string, params: any[]) => {
  return getPool().query(text, params);
};

export async function closePostgresPool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

export class PostgresDB implements IBaseDB {
  private client: PoolClient | null = null;

  constructor(client?: PoolClient) {
    this.client = client || null;
  }

  async query<M extends QueryResultRow = any>(
    text: string,
    params?: any[],
  ): Promise<M[]> {
    const client = this.client ?? (await getPool().connect());
    const shouldRelease = Boolean(this.client === null);

    const result = await client.query<M>(text, params);
    if (shouldRelease) {
      client.release();
      this.client = null;
    }
    return result.rows;
  }

  async mutate<T = any>(text: string, params?: any[]): Promise<T> {
    const client = this.client ?? (await getPool().connect());
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
    const client = await getPool().connect();
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
