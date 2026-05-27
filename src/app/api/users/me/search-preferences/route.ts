import { withErrorHandler } from '@/middlewares/routes-middlewares';
import { getUserService } from '@/server/factories';
import { SearchPreferencesSchema } from '@/server/schemas';
import { NextRequest, NextResponse } from 'next/server';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const viewerId = request.headers.get('x-user-id')!;
  const userService = await getUserService();
  const prefs = await userService.getSearchPreferences(viewerId);
  return NextResponse.json(prefs);
});

export const PATCH = withErrorHandler(async (request: NextRequest) => {
  const viewerId = request.headers.get('x-user-id')!;
  const body = await request.json();
  SearchPreferencesSchema.parse(body);
  const userService = await getUserService();
  const prefs = await userService.updateSearchPreferences(viewerId, body);
  return NextResponse.json(prefs);
});
