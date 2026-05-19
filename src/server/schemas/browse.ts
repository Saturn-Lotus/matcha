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
  age: Su.optional(Su.number().min(18).max(120)),
  sortBy: Su.optional(Su.literal(SORT_KEYS)),
  sortDirection: Su.optional(Su.literal(SORT_DIRECTIONS)),
});

export type BrowseQuery = SuInfer<typeof BrowseQuerySchema>;
