import 'server-only';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/middlewares/routes-middlewares/withErrorHandler';
import { getUserService } from '@/server/factories';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const userId = request.headers.get('x-user-id');

  if (userId) {
    const userService = await getUserService();
    await userService.setOnlineStatus(userId, false);
  }

  const cookieStore = await cookies();
  cookieStore.delete('session');

  return NextResponse.json({ ok: true });
});
