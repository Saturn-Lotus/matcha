import { AuthService } from '@/server/services/auth';
import { NextRequest, NextResponse } from 'next/server';
import { Mailer } from '@/lib/mailer/Mailer';
import { httpExceptionMapper } from '@/lib/exception-http-mapper';
import { getUserRepository } from '@/server/factories';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token') || '';
    const auth = new AuthService(getUserRepository(), new Mailer());
    await auth.verifyUser(token);
    return NextResponse.redirect(new URL('/', request.url));
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(...httpExceptionMapper(error));
  }
}
