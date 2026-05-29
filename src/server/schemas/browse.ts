import { Su, SuInfer } from '@/lib/validator';

const SORT_KEYS = [
  'relevance',
  'sharedTagCount',
  'distance',
  'fameRating',
  'age',
] as const;
const SORT_DIRECTIONS = ['asc', 'desc'] as const;

export const BrowseQuerySchema = Su.object({
  page: Su.optional(Su.number().min(1)),
  pageSize: Su.optional(Su.number().min(1).max(50)),
  interests: Su.optional(Su.array(Su.string()).length({ max: 20 })),
  maxDistanceKm: Su.optional(Su.number().min(0).max(20000)),
  minFameRating: Su.optional(Su.number().min(0).max(100)),
  maxFameRating: Su.optional(Su.number().min(0).max(100)),
  minAge: Su.optional(Su.number().min(18).max(120)),
  age: Su.optional(Su.number().min(18).max(120)),
  sortBy: Su.optional(Su.literal(SORT_KEYS)),
  sortDirection: Su.optional(Su.literal(SORT_DIRECTIONS)),
});

export type BrowseQuery = SuInfer<typeof BrowseQuerySchema>;

export const SearchQuerySchema = Su.object({
  q: Su.string().length({ min: 1, max: 100 }),
  limit: Su.optional(Su.number().min(1).max(10)),
});

export type SearchQuery = SuInfer<typeof SearchQuerySchema>;

export const SearchPreferencesSchema = Su.object({
  prefMinAge: Su.optional(Su.null(Su.number().min(18).max(120))),
  prefMaxAge: Su.optional(Su.null(Su.number().min(18).max(120))),
  prefMinFame: Su.optional(Su.null(Su.number().min(0).max(100))),
  prefMaxFame: Su.optional(Su.null(Su.number().min(0).max(100))),
  prefMaxDistanceKm: Su.optional(Su.null(Su.number().min(0).max(20000))),
  prefTags: Su.optional(Su.null(Su.array(Su.string()).length({ max: 20 }))),
});

export type SearchPreferences = SuInfer<typeof SearchPreferencesSchema>;

export type StoredSearchPreferences = {
  prefMinAge: number | null;
  prefMaxAge: number | null;
  prefMinFame: number | null;
  prefMaxFame: number | null;
  prefMaxDistanceKm: number | null;
  prefTags: string[] | null;
};
