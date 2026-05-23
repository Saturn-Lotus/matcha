import { withErrorHandler } from '@/middlewares/routes-middlewares';
import { getUserService } from '@/server/factories';
import { SearchQuerySchema } from '@/server/schemas';
import { CheckValidationError } from '@/lib/validator';
import { NextRequest, NextResponse } from 'next/server';

const DEFAULT_LIMIT = 5;

function coerceLimit(sp: URLSearchParams): number | undefined {
  const raw = sp.get('limit');
  if (raw === null) return undefined;
  const value = Number(raw);
  if (Number.isNaN(value)) {
    throw new CheckValidationError(raw, "is not a valid number for 'limit'");
  }
  return value;
}

export const GET = withErrorHandler(async (request: NextRequest) => {
  const viewerId = request.headers.get('x-user-id')!;
  const sp = request.nextUrl.searchParams;

  const rawQ = sp.get('q')?.trim() ?? '';
  if (!rawQ) return NextResponse.json([]);

  const { q, limit } = SearchQuerySchema.parse({
    q: rawQ,
    limit: coerceLimit(sp),
  });

  const userService = await getUserService();
  const results = await userService.searchUsers(
    viewerId,
    q,
    limit ?? DEFAULT_LIMIT,
  );
  return NextResponse.json(results);
});
