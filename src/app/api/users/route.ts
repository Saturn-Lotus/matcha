import { withErrorHandler } from '@/middlewares/routes-middlewares';
import { getUserService } from '@/server/factories';
import { NextRequest, NextResponse } from 'next/server';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const viewerId = request.headers.get('x-user-id')!;
  const rawMaxDistance = request.nextUrl.searchParams.get('maxDistance');
  const maxDistanceKm = rawMaxDistance !== null ? parseFloat(rawMaxDistance) : undefined;
  const userService = await getUserService();
  const suggestions = await userService.getUsersWithProfiles(
    viewerId,
    Number.isFinite(maxDistanceKm) ? maxDistanceKm : undefined,
  );
  return NextResponse.json(suggestions);
});
