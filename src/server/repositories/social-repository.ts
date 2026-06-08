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

export interface UserMatch {
  userId: string;
  matchedAt: Date;

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
  async getViewers(
    viewedUserId: string,
    options: { limit: number; offset: number },
  ): Promise<ProfileView[]> {
    return this.db.query<ProfileView>(
      `SELECT pv."viewerId", pv."viewedUserId", pv."viewedAt",
              up."firstName", up."lastName", up."avatarUrl"
       FROM profile_views pv
       JOIN user_profiles up ON up."userId" = pv."viewerId"
       WHERE pv."viewedUserId" = $1
         AND NOT EXISTS (
           SELECT 1 FROM user_blocks ub
           WHERE (ub."blockerUserId" = $1 AND ub."blockedUserId" = pv."viewerId")
              OR (ub."blockerUserId" = pv."viewerId" AND ub."blockedUserId" = $1)
         )
       ORDER BY pv."viewedAt" DESC
       LIMIT $2 OFFSET $3;`,
      [viewedUserId, options.limit, options.offset],
    );
  }

  /** Insert a like row, creating a match if it becomes mutual.
   *  `inserted` is false if the pair already existed.
   *  `matched` is true when this like completed a mutual like (a new match). */
  async likeUser(
    likerUserId: string,
    likedUserId: string,
  ): Promise<{ inserted: boolean; matched: boolean }> {
    return this.db.transaction(async (tx) => {
      const rows = await tx.query<{ likerUserId: string }>(
        `INSERT INTO user_likes ("likerUserId", "likedUserId", "likedAt")
         VALUES ($1, $2, CURRENT_TIMESTAMP)
         ON CONFLICT DO NOTHING
         RETURNING "likerUserId";`,
        [likerUserId, likedUserId],
      );
      if (rows.length === 0) return { inserted: false, matched: false };

      const reciprocal = await tx.query<{ exists: boolean }>(
        `SELECT EXISTS(
           SELECT 1 FROM user_likes
           WHERE "likerUserId" = $2 AND "likedUserId" = $1
         ) AS exists;`,
        [likerUserId, likedUserId],
      );
      const matched = reciprocal[0]?.exists ?? false;
      if (matched) {
        await tx.query(
          `INSERT INTO matches ("userIdA", "userIdB", "matchedAt")
           VALUES (LEAST($1::uuid, $2::uuid), GREATEST($1::uuid, $2::uuid), CURRENT_TIMESTAMP)
           ON CONFLICT DO NOTHING;`,
          [likerUserId, likedUserId],
        );
      }
      return { inserted: true, matched };
    });
  }

  /** Delete a like row and any match between the pair. Returns false if no like existed. */
  async unlikeUser(likerUserId: string, likedUserId: string): Promise<boolean> {
    return this.db.transaction(async (tx) => {
      const rows = await tx.query<{ likerUserId: string }>(
        `DELETE FROM user_likes WHERE "likerUserId" = $1 AND "likedUserId" = $2
         RETURNING "likerUserId";`,
        [likerUserId, likedUserId],
      );
      if (rows.length === 0) return false;
      await tx.query(
        `DELETE FROM matches
         WHERE "userIdA" = LEAST($1::uuid, $2::uuid) AND "userIdB" = GREATEST($1::uuid, $2::uuid);`,
        [likerUserId, likedUserId],
      );
      return true;
    });
  }

  /** Get people who liked a user, most recent first */
  async getLikers(
    likedUserId: string,
    options: { limit: number; offset: number },
  ): Promise<UserLike[]> {
    return this.db.query<UserLike>(
      `SELECT ul."likerUserId", ul."likedUserId", ul."likedAt",
              up."firstName", up."lastName", up."avatarUrl"
       FROM user_likes ul
       JOIN user_profiles up ON up."userId" = ul."likerUserId"
       WHERE ul."likedUserId" = $1
       ORDER BY ul."likedAt" DESC
       LIMIT $2 OFFSET $3;`,
      [likedUserId, options.limit, options.offset],
    );
  }

  async getLikesCount(userId: string): Promise<number> {
    const rows = await this.db.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM user_likes WHERE "likedUserId" = $1;`,
      [userId],
    );
    return parseInt(rows[0]?.count ?? '0', 10);
  }

  async getViewsCount(userId: string): Promise<number> {
    const rows = await this.db.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM profile_views pv
       WHERE pv."viewedUserId" = $1
         AND NOT EXISTS (
           SELECT 1 FROM user_blocks ub
           WHERE (ub."blockerUserId" = $1 AND ub."blockedUserId" = pv."viewerId")
              OR (ub."blockerUserId" = pv."viewerId" AND ub."blockedUserId" = $1)
         );`,
      [userId],
    );
    return parseInt(rows[0]?.count ?? '0', 10);
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

  /** Check if a user has viewed another user's profile */
  async hasViewed(viewerId: string, viewedUserId: string): Promise<boolean> {
    const rows = await this.db.query<{ exists: boolean }>(
      `SELECT EXISTS(
         SELECT 1 FROM profile_views
         WHERE "viewerId" = $1 AND "viewedUserId" = $2
       ) AS exists;`,
      [viewerId, viewedUserId],
    );
    return rows[0]?.exists ?? false;
  }

  /** Block a user — inserts the block row and deletes likes both directions atomically.
   *  Returns false if the block already existed. */
  async blockUser(
    blockerUserId: string,
    blockedUserId: string,
  ): Promise<boolean> {
    return this.db.transaction(async (tx) => {
      const rows = await tx.query<{ blockerUserId: string }>(
        `INSERT INTO user_blocks ("blockerUserId", "blockedUserId", "blockedAt")
         VALUES ($1, $2, CURRENT_TIMESTAMP)
         ON CONFLICT DO NOTHING
         RETURNING "blockerUserId";`,
        [blockerUserId, blockedUserId],
      );
      if (rows.length === 0) return false;
      await tx.query(
        `DELETE FROM user_likes
         WHERE ("likerUserId" = $1 AND "likedUserId" = $2)
            OR ("likerUserId" = $2 AND "likedUserId" = $1);`,
        [blockerUserId, blockedUserId],
      );
      await tx.query(
        `DELETE FROM matches
         WHERE "userIdA" = LEAST($1::uuid, $2::uuid) AND "userIdB" = GREATEST($1::uuid, $2::uuid);`,
        [blockerUserId, blockedUserId],
      );
      return true;
    });
  }

  /** Check whether either user has blocked the other */
  async isBlockedEitherDirection(
    userA: string,
    userB: string,
  ): Promise<boolean> {
    const rows = await this.db.query<{ exists: boolean }>(
      `SELECT EXISTS(
         SELECT 1 FROM user_blocks
         WHERE ("blockerUserId" = $1 AND "blockedUserId" = $2)
            OR ("blockerUserId" = $2 AND "blockedUserId" = $1)
       ) AS exists;`,
      [userA, userB],
    );
    return rows[0]?.exists ?? false;
  }

  /** Insert a new report row and delete any match between the pair.
   *  Returns false if a report already exists for this (reporter, reported) pair. */
  async report(
    reporterUserId: string,
    reportedUserId: string,
    reason: string,
  ): Promise<boolean> {
    return this.db.transaction(async (tx) => {
      const rows = await tx.query<{ id: string }>(
        `INSERT INTO account_reports ("reporterUserId", "reportedUserId", reason, "createdAt")
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
         ON CONFLICT ON CONSTRAINT account_reports_unique_pair DO NOTHING
         RETURNING id;`,
        [reporterUserId, reportedUserId, reason],
      );
      await tx.query(
        `DELETE FROM matches
         WHERE "userIdA" = LEAST($1::uuid, $2::uuid) AND "userIdB" = GREATEST($1::uuid, $2::uuid);`,
        [reporterUserId, reportedUserId],
      );
      return rows.length > 0;
    });
  }

  /** Get the relational state between viewer and target in a single query */
  async getRelationState(
    viewerId: string,
    targetId: string,
  ): Promise<{
    viewerLiked: boolean;
    targetLiked: boolean;
    targetViewedViewer: boolean;
    connected: boolean;
  }> {
    const rows = await this.db.query<{
      viewerLiked: boolean;
      targetLiked: boolean;
      targetViewedViewer: boolean;
      connected: boolean;
    }>(
      `SELECT
         EXISTS(SELECT 1 FROM user_likes WHERE "likerUserId" = $1 AND "likedUserId" = $2) AS "viewerLiked",
         EXISTS(SELECT 1 FROM user_likes WHERE "likerUserId" = $2 AND "likedUserId" = $1) AS "targetLiked",
         EXISTS(SELECT 1 FROM profile_views WHERE "viewerId" = $2 AND "viewedUserId" = $1) AS "targetViewedViewer",
         EXISTS(SELECT 1 FROM matches WHERE "userIdA" = LEAST($1::uuid, $2::uuid) AND "userIdB" = GREATEST($1::uuid, $2::uuid)) AS "connected";`,
      [viewerId, targetId],
    );
    const row = rows[0] ?? {
      viewerLiked: false,
      targetLiked: false,
      targetViewedViewer: false,
      connected: false,
    };
    return {
      viewerLiked: row.viewerLiked,
      targetLiked: row.targetLiked,
      targetViewedViewer: row.targetViewedViewer,
      connected: row.connected,
    };
  }

  /** Get a user's matches (the other party in each), most recent first */
  async getMatches(
    userId: string,
    options: { limit: number; offset: number },
  ): Promise<UserMatch[]> {
    return this.db.query<UserMatch>(
      `SELECT
         CASE WHEN m."userIdA" = $1 THEN m."userIdB" ELSE m."userIdA" END AS "userId",
         m."matchedAt",
         up."firstName", up."lastName", up."avatarUrl"
       FROM matches m
       JOIN user_profiles up
         ON up."userId" = CASE WHEN m."userIdA" = $1 THEN m."userIdB" ELSE m."userIdA" END
       WHERE m."userIdA" = $1 OR m."userIdB" = $1
       ORDER BY m."matchedAt" DESC
       LIMIT $2 OFFSET $3;`,
      [userId, options.limit, options.offset],
    );
  }

  async getMatchesCount(userId: string): Promise<number> {
    const rows = await this.db.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM matches
       WHERE "userIdA" = $1 OR "userIdB" = $1;`,
      [userId],
    );
    return parseInt(rows[0]?.count ?? '0', 10);
  }
}
