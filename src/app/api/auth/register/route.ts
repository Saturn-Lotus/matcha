import { Mailer } from '@/lib/mailer/Mailer';
import { ValidationError } from '@/lib/validator';
import { RegisterUserSchema } from '@/server/schemas';
import { AuthService } from '@/server/services/auth';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { withErrorHandler } from '@/middlewares/routes-middlewares';
import { getUserRepository, getUserService } from '@/server/factories';

export const POST = withErrorHandler(async (request: NextRequest) => {
  const data = RegisterUserSchema.parse(await request.json());

  const userRepository = getUserRepository();
  const userService = await getUserService(userRepository);

  const userAlreadyExists = await userService.userExists(
    undefined,
    data.email,
    data.username,
  );
  if (userAlreadyExists) {
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

  return NextResponse.json(
    { id: user.id, email: user.email, isVerified: false },
    { status: 201 },
  );
});
