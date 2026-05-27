import 'server-only';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { withErrorHandler } from '@/middlewares/routes-middlewares/withErrorHandler';

export const GET = withErrorHandler(async () => {
  const cookieStore = await cookies();
  cookieStore.delete('session');

  return NextResponse.json({ ok: true });
});
