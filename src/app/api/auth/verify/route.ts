import { NextRequest, NextResponse } from 'next/server';
import { httpExceptionMapper } from '@/lib/exception-http-mapper';
import { getAuthService } from '@/server/factories';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token') || '';
    const auth = getAuthService();
    await auth.verifyUser(token);
    return NextResponse.redirect(new URL('/', request.url));
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(...httpExceptionMapper(error));
  }
}
