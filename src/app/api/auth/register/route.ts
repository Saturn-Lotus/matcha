import { ValidationError } from '@/lib/validator';
import { RegisterUserSchema } from '@/server/schemas';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/middlewares/routes-middlewares';
import { getAuthService, getUserService } from '@/server/factories';

export const POST = withErrorHandler(async (request: NextRequest) => {
  const data = RegisterUserSchema.parse(await request.json());

  const userService = await getUserService();

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

  const user = await userService.registerUser(data);

  const auth = getAuthService();
  await auth.sendVerificationEmail(data.email, user.id);

  const session = await auth.createSession(user.id, user.email, { isVerified: false, isProfileComplete: false, avatarUrl: null });
  const cookieStore = await cookies();
  cookieStore.set('session', session);

  return NextResponse.json(
    { id: user.id, email: user.email, isVerified: false },
    { status: 201 },
  );
});
