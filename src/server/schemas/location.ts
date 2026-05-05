import { Su, SuInfer } from '@/lib/validator';

const LOCATION_TYPES = ['gps', 'manual'] as const;

export const UserLocationSchema = Su.object({
  userId: Su.string(),
  latitude: Su.number(),
  longitude: Su.number(),
  city: Su.null(Su.string()),
  neighborhood: Su.null(Su.string()),
  locationType: Su.literal(LOCATION_TYPES),
  consentGiven: Su.boolean(),
  createdAt: Su.optional(Su.date()),
  updatedAt: Su.optional(Su.date()),
});

export type UserLocation = SuInfer<typeof UserLocationSchema>;

export const SetLocationSchema = Su.object({
  latitude: Su.number(),
  longitude: Su.number(),
  city: Su.optional(Su.string()),
  neighborhood: Su.optional(Su.string()),
  locationType: Su.literal(LOCATION_TYPES),
  consentGiven: Su.boolean(),
});

export type SetLocationInput = SuInfer<typeof SetLocationSchema>;
