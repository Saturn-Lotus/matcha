import { withErrorHandler } from '@/middlewares/routes-middlewares';
import { getUserService } from '@/server/factories';
import { NextRequest, NextResponse } from 'next/server';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const viewerId = request.headers.get('x-user-id')!;
  const userService = await getUserService();
  const result = await userService.getUsersWithProfiles(viewerId);
  return NextResponse.json(result);
});
