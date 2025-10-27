import { User, UserProfile } from '@/server/schemas';
import BaseRepositoryClass from './base';
import { PostgresDB } from '../db/postgres';
import { CreateUserInput, CreateUserProfile } from '../types';

export class UserRepository extends BaseRepositoryClass<User> {
  private readonly db: PostgresDB;

  private readonly usersTable: string = 'users';
  private readonly userProfilesTable: string = 'user_profiles';

  constructor(db: PostgresDB) {
    super();
    this.db = db;
  }

  async create(item: CreateUserInput): Promise<User> {
    const rows = await this.db.query<User>(
      `INSERT INTO ${this.usersTable}("username", "email","pendingEmail", "passwordHash", "isVerified")
			VALUES ($1, $2, $3, $4, $5) RETURNING *;
			`,
      [
        item.username,
        item.email,
        item.pendingEmail,
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

  async profileCreate(item: CreateUserProfile): Promise<UserProfile> {
    const rows = await this.db.query<UserProfile>(
      `Insert INTO ${this.userProfilesTable}
      ( 
      "userId",
      "firstName",
      "lastName",
      "gender",
      "sexualPreference",
      "bio",
      "interests",
      "pictures",
      "avatarUrl"
    )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *;
      `,
      [
        item.userId,
        item.firstName,
        item.lastName,
        item.gender,
        item.sexualPreference,
        item.bio,
        item.interests,
        item.pictures,
        item.avatarUrl,
      ],
    );

    const profile = rows[0];
    if (!profile) {
      throw new Error('User profile creation failed');
    }
    return profile;
  }

  async findById(id: string): Promise<User | null> {
    const rows = await this.db.query<User>(
      `SELECT * FROM ${this.usersTable} WHERE "id" = $1 LIMIT 1;`,
      [id],
    );
    if (rows.length === 0) {
      return null;
    }
    return rows[0];
  }

  async findProfileByUserId(userId: string): Promise<UserProfile | null> {
    const rows = await this.db.query<UserProfile>(
      `SELECT * FROM ${this.userProfilesTable} WHERE "userId" = $1 LIMIT 1;`,
      [userId],
    );
    if (rows.length === 0) {
      return null;
    }
    return rows[0];
  }

  async findByUsername(username: string): Promise<User | null> {
    const rows = await this.db.query<User>(
      `SELECT * FROM ${this.usersTable} WHERE "username" = $1 LIMIT 1;`,
      [username],
    );
    if (rows.length === 0) {
      return null;
    }
    return rows[0];
  }

  async findByEmail(email: string): Promise<User | null> {
    const rows = await this.db.query<User>(
      `SELECT * FROM ${this.usersTable} WHERE email = $1 LIMIT 1;`,
      [email],
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

  async queryProfile(
    conditionsSql: string,
    params: any[],
  ): Promise<UserProfile[]> {
    const rows = await this.db.query<UserProfile>(
      `SELECT * FROM ${this.userProfilesTable} WHERE ${conditionsSql};`,
      params,
    );
    return rows;
  }

  async update(id: string, item: Partial<User>): Promise<User> {
    const setClause = Object.entries(item)
      .map(([columnName, value]) => {
        return `"${columnName}" = ${typeof value === 'string' ? `'${value}'` : value}`;
      })
      .join(', ');

    const query = `UPDATE ${this.usersTable} SET ${setClause} WHERE id = $1 RETURNING *;`;
    const rows = await this.db.query<User>(query, [id]);
    if (rows.length === 0) {
      throw new Error(`User with id ${id} not found`);
    }
    return rows[0];
  }

  async updateProfile(
    userId: string,
    item: Partial<Omit<UserProfile, 'userId'>>,
  ): Promise<UserProfile> {
    const setClause = Object.entries(item)
      .map(([columnName, value]) => {
        return `"${columnName}" = ${typeof value === 'string' ? `'${value}'` : value}`;
      })
      .join(', ');

    const query = `UPDATE ${this.userProfilesTable} SET ${setClause} WHERE userId = $1 RETURNING *;`;
    const rows = await this.db.query<UserProfile>(query, [userId]);
    if (rows.length === 0) {
      throw new Error(`User profile with userId ${userId} not found`);
    }
    return rows[0];
  }

  async delete(id: string): Promise<void> {
    await this.db.query<User>(`DELETE FROM ${this.usersTable} WHERE id = $1;`, [
      id,
    ]);
    // ! handle error if no rows were deleted
  }

  async deleteProfile(userId: string): Promise<void> {
    await this.db.query<UserProfile>(
      `DELETE FROM ${this.userProfilesTable} WHERE userId = $1;`,
      [userId],
    );
    // ! handle error if no rows were deleted
  }
}

export default UserRepository;
