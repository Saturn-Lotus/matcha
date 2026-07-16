import { withErrorHandler } from '@/middlewares/routes-middlewares';
import { getUserService } from '@/server/factories';
import { TagsQuerySchema } from '@/server/schemas';
import { coerceSearchParamNumber } from '@/lib/validator';
import { UnauthorizedException } from '@/lib/exception-http-mapper';
import { NextRequest, NextResponse } from 'next/server';

const DEFAULT_LIMIT = 20;

export const GET = withErrorHandler(async (request: NextRequest) => {
  const userId = request.headers.get('x-user-id');
  if (!userId) throw new UnauthorizedException('Not authenticated');

  const sp = request.nextUrl.searchParams;
  const { q, limit } = TagsQuerySchema.parse({
    q: sp.get('q') ?? undefined,
    limit: coerceSearchParamNumber(sp, 'limit'),
  });

  const userService = await getUserService();
  const tags = await userService.searchTags(q ?? '', limit ?? DEFAULT_LIMIT);
  return NextResponse.json(tags);
});
