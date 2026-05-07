import { withErrorHandler } from '@/middlewares/routes-middlewares';
import { UnauthorizedException } from '@/lib/exception-http-mapper';
import { Su } from '@/lib/validator';
import { getUserService } from '@/server/factories';
import { NextRequest, NextResponse } from 'next/server';

const HeartbeatSchema = Su.object({ online: Su.boolean() });

export const POST = withErrorHandler(async (request: NextRequest) => {
  const userId = request.headers.get('x-user-id');
  if (!userId) throw new UnauthorizedException('Not authenticated');

  const body = await request.json();
  const { online } = HeartbeatSchema.parse(body);

  const userService = await getUserService();
  await userService.setOnlineStatus(userId, online);

  return NextResponse.json({ ok: true });
});
