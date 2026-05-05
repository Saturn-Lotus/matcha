import { UnauthorizedException } from '@/lib/exception-http-mapper';
import { withErrorHandler } from '@/middlewares/routes-middlewares';
import { getLocationService } from '@/server/factories';
import { SetLocationSchema } from '@/server/schemas/location';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export const GET = withErrorHandler(async () => {
  const headersList = await headers();
  const userId = headersList.get('x-user-id');
  if (!userId) {
   throw new UnauthorizedException('Unauthorized');
  }

  const service = getLocationService();
  const location = await service.getLocation(userId);
  return NextResponse.json(location);
});

export const PATCH = withErrorHandler(async (request: NextRequest) => {
  const headersList = await headers();
  const userId = headersList.get('x-user-id');
  if (!userId) {
    throw new UnauthorizedException('Unauthorized');
  }

  const body = await request.json();
  const data = SetLocationSchema.parse(body);

  const service = getLocationService();
  const location = await service.setLocation(userId, data);
  return NextResponse.json(location);
});
