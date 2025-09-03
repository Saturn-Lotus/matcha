import { httpExceptionMapper } from '@/lib/exception-http-mapper';
import { Mailer } from '@/lib/mailer/Mailer';
import { ResetPasswordSchema } from '@/schemas';
import { PostgresDB } from '@/server/db/postgres';
import { UserRepository } from '@/server/repositories';
import { AuthService } from '@/server/services/auth';
import { NextRequest, NextResponse } from 'next/server';

const getUserRepository = () => {
  return new UserRepository(new PostgresDB());
};

export async function PATCH(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token') || '';
    const { newPassword } = ResetPasswordSchema.parse(await request.json());

    const userRepository = getUserRepository();
    const auth = new AuthService(userRepository, new Mailer());

    await auth.resetPassword(token, newPassword);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(...httpExceptionMapper(error));
  }
}
