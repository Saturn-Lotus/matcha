import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/middlewares/routes-middlewares/withErrorHandler';
import { getNotificationService } from '@/server/factories';
import { NotificationsQuerySchema } from '@/server/schemas';
import { coerceSearchParamNumber } from '@/lib/validator';
import { UnauthorizedException } from '@/lib/exception-http-mapper';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const userId = request.headers.get('x-user-id');
  if (!userId) throw new UnauthorizedException('Not authenticated');

  const sp = request.nextUrl.searchParams;
  const query = NotificationsQuerySchema.parse({
    cursor: sp.get('cursor') ?? undefined,
    limit: coerceSearchParamNumber(sp, 'limit'),
  });
  const limit = query.limit ?? 20;

  const service = getNotificationService();
  const items = await service.list(userId, query.cursor ?? null, limit);

  const nextCursor =
    items.length === limit ? items[items.length - 1]!.createdAt : null;

  return NextResponse.json({ items, nextCursor });
});
