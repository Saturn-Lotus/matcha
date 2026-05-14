import { User, UserProfile } from '@/server/schemas';
import BaseRepositoryClass from './base';
import { PostgresDB } from '../db/postgres';
import { CreateUserInput, CreateUserProfile } from '../types';

type CreateUserWithProfileInput = {
  user: CreateUserInput;
  profile: Omit<CreateUserProfile, 'userId'>;
};

export class UserRepository extends BaseRepositoryClass<User> {
  private readonly db: PostgresDB;

  private readonly usersTable: string = 'users';
  private readonly userProfilesTable: string = 'user_profiles';

  constructor(db: PostgresDB) {
    super();
    this.db = db;
  }

  async create(item: CreateUserInput, db: PostgresDB = this.db): Promise<User> {
    const rows = await db.query<User>(
      `INSERT INTO ${this.usersTable}("username", "email", "pendingEmail", "passwordHash", "isVerified")
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

  async profileCreate(
    item: CreateUserProfile,
    db: PostgresDB = this.db,
  ): Promise<UserProfile> {
    const rows = await db.query<UserProfile>(
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

  async createWithProfile({
    user,
    profile,
  }: CreateUserWithProfileInput): Promise<User> {
    return this.db.transaction(async (txDB) => {
      const newUser = await this.create(user, txDB);
      await this.profileCreate({ ...profile, userId: newUser.id }, txDB);
      return newUser;
    });
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
    const entries = Object.entries(item).filter(([, v]) => v !== undefined);
    const params: any[] = [id];
    let paramIdx = 2;
    const setClause = entries
      .map(([col, val]) => {
        params.push(val);
        return `"${col}" = $${paramIdx++}`;
      })
      .join(', ');

    const query = `UPDATE ${this.usersTable} SET ${setClause} WHERE id = $1 RETURNING *;`;
    const rows = await this.db.query<User>(query, params);
    if (rows.length === 0) {
      throw new Error(`User with id ${id} not found`);
    }
    return rows[0];
  }

  async updateProfile(
    userId: string,
    item: Partial<Omit<UserProfile, 'userId'>>,
  ): Promise<UserProfile> {
    const entries = Object.entries(item).filter(([, v]) => v !== undefined);
    const params: any[] = [userId];
    let paramIdx = 2;
    const setClause = entries
      .map(([col, val]) => {
        params.push(val);
        return `"${col}" = $${paramIdx++}`;
      })
      .join(', ');

    const query = `UPDATE ${this.userProfilesTable} SET ${setClause} WHERE "userId" = $1 RETURNING *;`;
    const rows = await this.db.query<UserProfile>(query, params);
    if (rows.length === 0) {
      throw new Error(`User profile with userId ${userId} not found`);
    }
    return rows[0];
  }

  async setOnline(userId: string, isOnline: boolean): Promise<void> {
    await this.db.query(
      `UPDATE ${this.userProfilesTable}
       SET "isOnline" = $1, "lastSeenAt" = NOW()
       WHERE "userId" = $2;`,
      [isOnline, userId],
    );
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

  async getUsersWithProfiles(
    viewerId: string,
    viewerGender: 'male' | 'female',
    allowedGenders: readonly ('male' | 'female')[],
    maxDistanceMeters?: number,
  ): Promise<UserWithProfileRow[]> {
    const params: unknown[] = [viewerId, allowedGenders, viewerGender];
    let distanceFilter = '';
    if (maxDistanceMeters !== undefined) {
      params.push(maxDistanceMeters);
      distanceFilter = `AND (
           vl."location" IS NULL
           OR ul."location" IS NULL
           OR ST_DWithin(vl."location", ul."location", $${params.length})
         )`;
    }

    return this.db.query<UserWithProfileRow>(
      `WITH viewer_loc AS (
         SELECT "userId", "location"
         FROM user_locations WHERE "userId" = $1
       )
       SELECT
         u.id,
         u.username,
         up."firstName",
         up."fameRating",
         up."isOnline",
         up."lastSeenAt",
         up."avatarUrl",
         up.pictures,
         up.interests,
         up.bio,
         CASE
           WHEN vl."location" IS NOT NULL AND ul."location" IS NOT NULL
             THEN ST_Distance(vl."location", ul."location")
           ELSE NULL
         END AS "distanceMeters"
       FROM users u
       JOIN user_profiles up ON up."userId" = u.id
       LEFT JOIN user_locations ul ON ul."userId" = u.id
       LEFT JOIN viewer_loc vl ON TRUE
       WHERE up."isProfileComplete" = TRUE
         AND u."isVerified" = TRUE
         AND u.id <> $1
         AND up.gender = ANY($2::gender_t[])
         AND (
           up."sexualPreference" IS NULL
           OR up."sexualPreference" = 'both'
           OR up."sexualPreference" = $3::sexual_preference_t
         )
         ${distanceFilter}
       ORDER BY "distanceMeters" ASC NULLS LAST, u.id ASC
       LIMIT 20;`,
      params,
    );
  }
}

export type UserWithProfileRow = {
  id: string;
  username: string;
  firstName: string;
  fameRating: number;
  isOnline: boolean;
  lastSeenAt: Date | null;
  avatarUrl: string | null;
  pictures: string[] | null;
  interests: string[] | null;
  bio: string | null;
  distanceMeters: number | null;
};

export default UserRepository;
