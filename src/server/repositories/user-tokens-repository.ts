import BaseRepositoryClass from './base';
import { PostgresDB } from '@/server/db/postgres';
import { UserToken } from '@/server/schemas';

export class UserTokensRepository extends BaseRepositoryClass<UserToken> {
  private readonly db: PostgresDB;
  private readonly table: string = 'user_tokens';

  constructor(db: PostgresDB) {
    super();
    this.db = db;
  }

  async create(item: UserToken): Promise<UserToken> {
    const rows = await this.db.query<UserToken>(
      `INSERT INTO ${this.table} ("userId", "tokenHash", "tokenType", "tokenExpiry") VALUES ($1, $2, $3, $4) RETURNING *;`,
      [item.userId, item.tokenHash, item.tokenType, item.tokenExpiry],
    );
    const token = rows[0];
    if (!token) throw new Error('User token creation failed');
    return token;
  }

  async findById(tokenHash: string): Promise<UserToken | null> {
    const rows = await this.db.query<UserToken>(
      `SELECT * FROM ${this.table} WHERE "tokenHash" = $1 LIMIT 1;`,
      [tokenHash],
    );
    if (rows.length === 0) return null;
    return rows[0];
  }

  async findByUserId(userId: string): Promise<UserToken[]> {
    const rows = await this.db.query<UserToken>(
      `SELECT * FROM ${this.table} WHERE "userId" = $1;`,
      [userId],
    );
    return rows;
  }

  async query(conditionsSql: string, params: any[]): Promise<UserToken[]> {
    const rows = await this.db.query<UserToken>(
      `SELECT * FROM ${this.table} WHERE ${conditionsSql};`,
      params,
    );
    return rows;
  }

  async update(
    tokenHash: string,
    item: Partial<UserToken>,
  ): Promise<UserToken> {
    const setClause = Object.entries(item)
      .map(([columnName, value]) => {
        return `"${columnName}" = ${typeof value === 'string' ? `'${value}'` : value}`;
      })
      .join(', ');

    const query = `UPDATE ${this.table} SET ${setClause} WHERE "tokenHash" = $1 RETURNING *;`;
    const rows = await this.db.query<UserToken>(query, [tokenHash]);
    if (rows.length === 0) {
      throw new Error(`User token with id ${tokenHash} not found`);
    }
    return rows[0];
  }

  async delete(tokenHash: string): Promise<void> {
    await this.db.query<UserToken>(
      `DELETE FROM ${this.table} WHERE "tokenHash" = $1;`,
      [tokenHash],
    );
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.db.query<UserToken>(
      `DELETE FROM ${this.table} WHERE "userId" = $1;`,
      [userId],
    );
  }
}

export default UserTokensRepository;
