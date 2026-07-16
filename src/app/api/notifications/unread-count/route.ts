import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/middlewares/routes-middlewares/withErrorHandler';
import { getNotificationService } from '@/server/factories';
import { UnauthorizedException } from '@/lib/exception-http-mapper';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const userId = request.headers.get('x-user-id');
  if (!userId) throw new UnauthorizedException('Not authenticated');

  const service = getNotificationService();
  const count = await service.unreadCount(userId);

  return NextResponse.json({ count });
});
