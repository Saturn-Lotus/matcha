import { NextRequest, NextResponse } from 'next/server';
import { httpExceptionMapper } from '@/lib/exception-http-mapper';
import { getAuthService } from '@/server/factories';
import { withErrorHandler } from '@/middlewares/routes-middlewares/withErrorHandler';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get('token') || '';
  const auth = getAuthService();
  await auth.verifyUser(token);
  return NextResponse.redirect(new URL('/', request.url));
});
