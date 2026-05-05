import { PostgresDB } from '@/server/db/postgres';
import { UserLocation } from '@/server/schemas/location';

export interface UpsertLocationInput {
  latitude: number;
  longitude: number;
  city?: string | null;
  neighborhood?: string | null;
  locationType: 'gps' | 'manual';
  consentGiven: boolean;
}

export class LocationRepository {
  private readonly db: PostgresDB;

  constructor(db: PostgresDB) {
    this.db = db;
  }

  async findByUserId(userId: string): Promise<UserLocation | null> {
    const rows = await this.db.query<UserLocation>(
      `SELECT "userId", "latitude", "longitude", "city", "neighborhood",
              "locationType", "consentGiven", "createdAt", "updatedAt"
       FROM user_locations WHERE "userId" = $1 LIMIT 1;`,
      [userId],
    );
    return rows[0] ?? null;
  }

  async upsert(
    userId: string,
    data: UpsertLocationInput,
  ): Promise<UserLocation> {
    const rows = await this.db.query<UserLocation>(
      `INSERT INTO user_locations
         ("userId", "latitude", "longitude", "city", "neighborhood", "locationType", "consentGiven", "location")
       VALUES ($1, $2, $3, $4, $5, $6, $7, ST_SetSRID(ST_MakePoint($3, $2), 4326)::geography)
       ON CONFLICT ("userId") DO UPDATE SET
         "latitude"      = EXCLUDED."latitude",
         "longitude"     = EXCLUDED."longitude",
         "city"          = EXCLUDED."city",
         "neighborhood"  = EXCLUDED."neighborhood",
         "locationType"  = EXCLUDED."locationType",
         "consentGiven"  = EXCLUDED."consentGiven",
         "location"      = EXCLUDED."location",
         "updatedAt"     = CURRENT_TIMESTAMP
       RETURNING "userId", "latitude", "longitude", "city", "neighborhood",
                 "locationType", "consentGiven", "createdAt", "updatedAt";`,
      [
        userId,
        data.latitude,
        data.longitude,
        data.city ?? null,
        data.neighborhood ?? null,
        data.locationType,
        data.consentGiven,
      ],
    );
    const location = rows[0];
    if (!location) throw new Error('Location upsert failed');
    return location;
  }
}
