import { PostgresDB } from '@/server/db/postgres';

export interface ProfileView {
  viewerId: string;
  viewedUserId: string;
  viewedAt: Date;

  firstName?: string;
  lastName?: string;
  avatarUrl?: string | null;
}

export interface UserLike {
  likerUserId: string;
  likedUserId: string;
  likedAt: Date;

  firstName?: string;
  lastName?: string;
  avatarUrl?: string | null;
}

export class SocialRepository {
  private readonly db: PostgresDB;

  constructor(db: PostgresDB) {
    this.db = db;
  }
  /** Record a view of a user's profile */
  async recordView(viewerId: string, viewedUserId: string): Promise<void> {
    await this.db.query(
      `INSERT INTO profile_views ("viewerId", "viewedUserId", "viewedAt")
       VALUES ($1, $2, CURRENT_TIMESTAMP)
       ON CONFLICT ("viewerId", "viewedUserId")
       DO UPDATE SET "viewedAt" = CURRENT_TIMESTAMP;`,
      [viewerId, viewedUserId],
    );
  }

  /** Get people who viewed a user's profile, most recent first */
  async getViewers(viewedUserId: string): Promise<ProfileView[]> {
    return this.db.query<ProfileView>(
      `SELECT pv."viewerId", pv."viewedUserId", pv."viewedAt",
              up."firstName", up."lastName", up."avatarUrl"
       FROM profile_views pv
       JOIN user_profiles up ON up."userId" = pv."viewerId"
       WHERE pv."viewedUserId" = $1
       ORDER BY pv."viewedAt" DESC;`,
      [viewedUserId],
    );
  }

  async likeUser(likerUserId: string, likedUserId: string): Promise<void> {
    await this.db.query(
      `INSERT INTO user_likes ("likerUserId", "likedUserId", "likedAt")
       VALUES ($1, $2, CURRENT_TIMESTAMP)
       ON CONFLICT DO NOTHING;`,
      [likerUserId, likedUserId],
    );
  }

  async unlikeUser(likerUserId: string, likedUserId: string): Promise<void> {
    await this.db.query(
      `DELETE FROM user_likes WHERE "likerUserId" = $1 AND "likedUserId" = $2;`,
      [likerUserId, likedUserId],
    );
  }

  /** Get people who liked a user, most recent first */
  async getLikers(likedUserId: string): Promise<UserLike[]> {
    return this.db.query<UserLike>(
      `SELECT ul."likerUserId", ul."likedUserId", ul."likedAt",
              up."firstName", up."lastName", up."avatarUrl"
       FROM user_likes ul
       JOIN user_profiles up ON up."userId" = ul."likerUserId"
       WHERE ul."likedUserId" = $1
       ORDER BY ul."likedAt" DESC;`,
      [likedUserId],
    );
  }

  /** Check if a user has liked another user */
  async hasLiked(likerUserId: string, likedUserId: string): Promise<boolean> {
    const rows = await this.db.query<{ exists: boolean }>(
      `SELECT EXISTS(
         SELECT 1 FROM user_likes
         WHERE "likerUserId" = $1 AND "likedUserId" = $2
       ) AS exists;`,
      [likerUserId, likedUserId],
    );
    return rows[0]?.exists ?? false;
  }
}
