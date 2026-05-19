import { withErrorHandler } from '@/middlewares/routes-middlewares';
import { UnauthorizedException } from '@/lib/exception-http-mapper';
import { getUserService } from '@/server/factories';
import { NextRequest, NextResponse } from 'next/server';

export const POST = withErrorHandler(async (request: NextRequest) => {
  const userId = request.headers.get('x-user-id');
  if (!userId) throw new UnauthorizedException('Not authenticated');

  const online = request.nextUrl.searchParams.get('online') !== 'false';

  const userService = await getUserService();
  await userService.setOnlineStatus(userId, online);

  return NextResponse.json({ ok: true });
});
