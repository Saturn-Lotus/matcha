import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/middlewares/routes-middlewares/withErrorHandler';
import { getNotificationService } from '@/server/factories';
import { MarkReadBodySchema } from '@/server/schemas';
import { UnauthorizedException } from '@/lib/exception-http-mapper';

export const POST = withErrorHandler(async (request: NextRequest) => {
  const userId = request.headers.get('x-user-id');
  if (!userId) throw new UnauthorizedException('Not authenticated');

  const body = MarkReadBodySchema.parse(await request.json());
  const service = getNotificationService();
  await service.markRead(userId, body.ids);

  return new NextResponse(null, { status: 204 });
});
