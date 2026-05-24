import { withErrorHandler } from '@/middlewares/routes-middlewares';
import { getUserService } from '@/server/factories';
import { BrowseQuerySchema } from '@/server/schemas';
import { coerceSearchParamNumber } from '@/lib/validator';
import { NextRequest, NextResponse } from 'next/server';

function coerceBrowseQuery(sp: URLSearchParams) {
  const interests = sp.getAll('interests');
  return {
    page: coerceSearchParamNumber(sp, 'page'),
    pageSize: coerceSearchParamNumber(sp, 'pageSize'),
    interests: interests.length > 0 ? interests : undefined,
    maxDistanceKm: coerceSearchParamNumber(sp, 'maxDistanceKm'),
    minFameRating: coerceSearchParamNumber(sp, 'minFameRating'),
    maxFameRating: coerceSearchParamNumber(sp, 'maxFameRating'),
    age: coerceSearchParamNumber(sp, 'age'),
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
