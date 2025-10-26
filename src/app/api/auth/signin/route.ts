import { httpExceptionMapper } from '@/lib/exception-http-mapper';
import { Mailer } from '@/lib/mailer/Mailer';
import { getUserRepository } from '@/server/factories';
import { CredentialsSchema } from '@/server/schemas';

import { AuthService } from '@/server/services/auth';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const credentials = CredentialsSchema.parse(await request.json());
    const auth = new AuthService(getUserRepository(), new Mailer());

    const user = await auth.authenticate(
      credentials.username,
      credentials.password,
    );
    const session = await auth.createSession(user.id, user.email);
    const cookieStore = await cookies();
    cookieStore.set('session', session);
    return NextResponse.json({ id: user.id, email: user.email });
  } catch (error) {
    console.error(error);
    return NextResponse.json(...httpExceptionMapper(error));
  }
}
