import { User } from '@/schemas';
import BaseRepositoryClass from './base';
import { PostgresDB } from '../db/postgres';

export type CreateUserInput = Omit<
  User,
  'id' | 'createdAt' | 'updatedAt' | 'emailVerificationToken'
>;

export class UserRepository extends BaseRepositoryClass<User> {
  private readonly db: PostgresDB;
  private readonly usersTable: string = 'users';
  // private readonly graphDb: IGraphDB;

  constructor(db: PostgresDB) {
    super();
    this.db = db;
  }

  async create(item: CreateUserInput): Promise<User> {
    const rows = await this.db.query<User>(
      `INSERT INTO ${this.usersTable}("username", "firstName", "lastName", "email", "passwordHash", "isVerified")
			VALUES ($1, $2, $3, $4, crypt($5, gen_salt('bf')), $6) RETURNING *;
			`,
      [
        item.username,
        item.firstName,
        item.lastName,
        item.email,
        item.passwordHash,
        item.isVerified,
      ],
    );
    const user = rows[0];
    if (!user) {
      throw new Error('User creation failed');
    }
    return user;
  }
  async findById(id: string): Promise<User | null> {
    const rows = await this.db.query<User>(
      `SELECT TOP 1 * FROM ${this.usersTable} WHERE id = $1;`,
      [id],
    );
    if (rows.length === 0) {
      return null;
    }
    return rows[0];
  }

  async query(conditionsSql: string, params: any[]): Promise<User[]> {
    const rows = await this.db.query<User>(
      `SELECT * FROM ${this.usersTable} WHERE ${conditionsSql};`,
      params,
    );
    return rows;
  }

  async findAll(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    conditions: Record<string, any>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    limit?: number,
  ): Promise<User[]> {
    throw new Error('Method not implemented.');
  }

  async update(id: string, item: Partial<User>): Promise<User> {
    const setClause = Object.entries(item)
      .map(([columnName, value]) => {
        return `"${columnName}" = ${
          typeof value === 'string' ? `'${value}'` : value
        }`;
      })
      .join(', ');
    const query = `UPDATE ${this.usersTable} SET ${setClause} WHERE id = $1 RETURNING *;`;
    const rows = await this.db.query<User>(query, [id]);
    if (rows.length === 0) {
      throw new Error(`User with id ${id} not found`);
    }
    return rows[0];
  }
  async delete(id: string): Promise<void> {
    await this.db.query<User>(`DELETE FROM ${this.usersTable} WHERE id = $1;`, [
      id,
    ]);
    // ! handle error if no rows were deleted
  }
}

export default UserRepository;
