import 'server-only';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/middlewares/routes-middlewares/withErrorHandler';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const cookieStore = await cookies();
  cookieStore.delete('session');

  return NextResponse.redirect(new URL('/', request.url));
});
