import { User, UserProfile } from '@/server/schemas';
import BaseRepositoryClass from './base';
import { PostgresDB } from '../db/postgres';
import {
  CreateUserInput,
  CreateUserProfile,
  SortBy,
  SortDirection,
} from '../types';

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
    params: GetUsersWithProfilesParams,
  ): Promise<{ rows: SuggestionRow[]; total: number }> {
    const {
      viewerId,
      viewerGender,
      allowedGenders,
      page,
      pageSize,
      interests,
      maxDistanceKm,
      minFameRating,
      maxFameRating,
      sortBy,
      sortDirection,
    } = params;

    const orderSql = ORDER_FRAGMENTS[sortBy][sortDirection];
    const offset = (page - 1) * pageSize;

    const rawRows = await this.db.query<SuggestionRow & { totalCount: string }>(
      `WITH viewer AS (
         SELECT
           COALESCE(up.interests, '{}'::TEXT[]) AS interests,
           ul.location AS location
         FROM user_profiles up
         LEFT JOIN user_locations ul ON ul."userId" = up."userId"
         WHERE up."userId" = $1
       ),
       candidates AS (
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
           ul.location AS location
         FROM users u
         JOIN user_profiles up ON up."userId" = u.id
         LEFT JOIN user_locations ul ON ul."userId" = u.id
         WHERE u.id <> $1
           AND u."isVerified" = TRUE
           AND up."isProfileComplete" = TRUE
           AND up.gender = ANY($2::gender_t[])
           AND (
             up."sexualPreference" IS NULL
             OR up."sexualPreference" = 'both'
             OR up."sexualPreference" = $3::sexual_preference_t
           )
       ),
       enriched AS (
         SELECT
           c.id,
           c.username,
           c."firstName",
           c."fameRating",
           c."isOnline",
           c."lastSeenAt",
           c."avatarUrl",
           c.pictures,
           c.interests,
           c.bio,
           cardinality(
             ARRAY(
               SELECT UNNEST(c.interests)
               INTERSECT
               SELECT UNNEST(v.interests)
             )
           )::INT AS "sharedTagCount",
           CASE
             WHEN v.location IS NULL OR c.location IS NULL THEN NULL
             ELSE ST_Distance(c.location, v.location) / 1000.0
           END AS "distanceKm"
         FROM candidates c CROSS JOIN viewer v
       ),
       filtered AS (
         SELECT * FROM enriched
         WHERE
           ($4::TEXT[] IS NULL OR interests && $4::TEXT[])
           AND ($5::FLOAT IS NULL OR ("distanceKm" IS NOT NULL AND "distanceKm" <= $5))
           AND ($6::FLOAT IS NULL OR "fameRating" >= $6)
           AND ($7::FLOAT IS NULL OR "fameRating" <= $7)
       )
       SELECT
         *,
         (COUNT(*) OVER ())::INT AS "totalCount"
       FROM filtered
       ORDER BY ${orderSql}
       LIMIT $8 OFFSET $9;`,
      [
        viewerId,
        allowedGenders,
        viewerGender,
        interests,
        maxDistanceKm,
        minFameRating,
        maxFameRating,
        pageSize,
        offset,
      ],
    );

    const total = rawRows.length > 0 ? Number(rawRows[0].totalCount) : 0;
    const rows: SuggestionRow[] = rawRows.map((row) => {
      const { totalCount, ...rest } = row;
      void totalCount;
      return rest;
    });
    return { rows, total };
  }

  async userHasLocation(userId: string): Promise<boolean> {
    const rows = await this.db.query<{ hasLocation: boolean }>(
      `SELECT (location IS NOT NULL) AS "hasLocation"
       FROM user_locations WHERE "userId" = $1 LIMIT 1;`,
      [userId],
    );
    return rows[0]?.hasLocation ?? false;
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
};

export type SuggestionRow = UserWithProfileRow & {
  sharedTagCount: number;
  distanceKm: number | null;
};

export type GetUsersWithProfilesParams = {
  viewerId: string;
  viewerGender: 'male' | 'female';
  allowedGenders: readonly ('male' | 'female')[];
  page: number;
  pageSize: number;
  interests: string[] | null;
  maxDistanceKm: number | null;
  minFameRating: number | null;
  maxFameRating: number | null;
  sortBy: SortBy;
  sortDirection: SortDirection;
};

const RELEVANCE_ORDER =
  '"distanceKm" ASC NULLS LAST, "sharedTagCount" DESC, id ASC';

const ORDER_FRAGMENTS: Record<SortBy, Record<SortDirection, string>> = {
  relevance: {
    asc: RELEVANCE_ORDER,
    desc: RELEVANCE_ORDER,
  },
  sharedTagCount: {
    desc: '"sharedTagCount" DESC, id ASC',
    asc: '"sharedTagCount" ASC, id ASC',
  },
  distance: {
    asc: '"distanceKm" ASC NULLS LAST, id ASC',
    desc: '"distanceKm" DESC NULLS LAST, id ASC',
  },
  fameRating: {
    desc: '"fameRating" DESC, id ASC',
    asc: '"fameRating" ASC, id ASC',
  },
  age: {
    asc: '"sharedTagCount" DESC, id ASC',
    desc: '"sharedTagCount" DESC, id ASC',
  },
};

export default UserRepository;
