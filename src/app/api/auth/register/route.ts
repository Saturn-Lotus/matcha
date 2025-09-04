import { httpExceptionMapper } from '@/lib/exception-http-mapper';
import { Mailer } from '@/lib/mailer/Mailer';
import { ValidationError } from '@/lib/validator';
import { RegisterUserSchema } from '@/schemas';
import { PostgresDB } from '@/server/db/postgres';
import { UserRepository } from '@/server/repositories';
import { AuthService } from '@/server/services/auth';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';

const getUserRepository = () => {
  return new UserRepository(new PostgresDB());
};

export async function POST(request: NextRequest) {
  try {
    const data = RegisterUserSchema.parse(await request.json());

    const userRepository = getUserRepository();

    const existingUsers = await userRepository.query(
      'email = $1 OR username = $2',
      [data.email, data.username],
    );
    if (existingUsers.length > 0) {
      throw new ValidationError(
        'User with this email or username already exists',
      );
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await userRepository.create({
      username: data.username,
      email: data.email,
      passwordHash: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      isVerified: false,
    });

    const auth = new AuthService(userRepository, new Mailer());
    await auth.sendVerificationEmail(data.email, user.id);
    
    const session = await auth.createSession(user.id, user.email);
    const cookieStore = await cookies();
    cookieStore.set('session', session);

    return NextResponse.redirect(new URL('/', request.url));
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(...httpExceptionMapper(error));
  }
}
