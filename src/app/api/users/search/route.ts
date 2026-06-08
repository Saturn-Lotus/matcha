import { withErrorHandler } from '@/middlewares/routes-middlewares';
import { getUserService } from '@/server/factories';
import { SearchQuerySchema } from '@/server/schemas';
import { coerceSearchParamNumber } from '@/lib/validator';
import { NextRequest, NextResponse } from 'next/server';

const DEFAULT_LIMIT = 5;

export const GET = withErrorHandler(async (request: NextRequest) => {
  const viewerId = request.headers.get('x-user-id')!;
  const sp = request.nextUrl.searchParams;

  const rawQ = sp.get('q')?.trim() ?? '';
  if (!rawQ) return NextResponse.json([]);

  const { q, limit } = SearchQuerySchema.parse({
    q: rawQ,
    limit: coerceSearchParamNumber(sp, 'limit'),
  });

  const userService = await getUserService();
  const results = await userService.searchUsers(
    viewerId,
    q,
    limit ?? DEFAULT_LIMIT,
  );
  return NextResponse.json(results);
});
