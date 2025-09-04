import { httpExceptionMapper } from '@/lib/exception-http-mapper';
import { Mailer } from '@/lib/mailer/Mailer';
import { CredentialsSchema } from '@/schemas';
import { PostgresDB } from '@/server/db/postgres';
import { UserRepository } from '@/server/repositories/user-repository';
import { AuthService } from '@/server/services/auth';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const getUserRepository = () => {
  return new UserRepository(new PostgresDB());
};

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
    return NextResponse.redirect(new URL('/', request.url));
  } catch (error) {
    console.log(error);
    return NextResponse.json(...httpExceptionMapper(error));
  }
}
