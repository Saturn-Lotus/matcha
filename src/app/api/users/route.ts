import { withErrorHandler } from '@/middlewares/routes-middlewares';
import { getUserService } from '@/server/factories';
import { BrowseQuerySchema } from '@/server/schemas';
import { CheckValidationError } from '@/lib/validator';
import { NextRequest, NextResponse } from 'next/server';

function coerceNumber(sp: URLSearchParams, key: string): number | undefined {
  const raw = sp.get(key);
  if (raw === null) return undefined;
  const value = Number(raw);
  if (Number.isNaN(value)) {
    throw new CheckValidationError(raw, `is not a valid number for '${key}'`);
  }
  return value;
}

function coerceBrowseQuery(sp: URLSearchParams) {
  const interests = sp.getAll('interests');
  return {
    page: coerceNumber(sp, 'page'),
    pageSize: coerceNumber(sp, 'pageSize'),
    interests: interests.length > 0 ? interests : undefined,
    maxDistanceKm: coerceNumber(sp, 'maxDistanceKm'),
    minFameRating: coerceNumber(sp, 'minFameRating'),
    maxFameRating: coerceNumber(sp, 'maxFameRating'),
    age: coerceNumber(sp, 'age'),
    sortBy: sp.get('sortBy') ?? undefined,
    sortDirection: sp.get('sortDirection') ?? undefined,
  };
}

export const GET = withErrorHandler(async (request: NextRequest) => {
  const viewerId = request.headers.get('x-user-id')!;
  const filters = BrowseQuerySchema.parse(
    coerceBrowseQuery(request.nextUrl.searchParams),
  );
  const userService = await getUserService();
  const result = await userService.getUsersWithProfiles(viewerId, filters);
  return NextResponse.json(result);
});
