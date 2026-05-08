import { withErrorHandler } from '@/middlewares/routes-middlewares';
import { getUserService } from '@/server/factories';
import { NextRequest, NextResponse } from 'next/server';

export const GET = withErrorHandler(async (_request: NextRequest) => {
  const userService = await getUserService();
  const suggestions = await userService.getUsersWithProfiles();
  return NextResponse.json(suggestions);
});
