import { NextRequest, NextResponse } from 'next/server';
import { getAuthService, getUserRepository } from '@/server/factories';
import { withErrorHandler } from '@/middlewares/routes-middlewares/withErrorHandler';
import { cookies } from 'next/headers';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get('token') || '';
  const id = searchParams.get('id') || '';

  const userRepository = getUserRepository();
  const auth = getAuthService();

  const userBefore = await userRepository.findById(id);
  const isEmailChange = !!userBefore?.pendingEmail;

  if (isEmailChange) {
    await auth.verifyUserEmailChange(token, id);
  } else {
    await auth.verifyUser(token, id);
  }

  const [updatedUser, profile] = await Promise.all([
    userRepository.findById(id),
    userRepository.findProfileByUserId(id),
  ]);

  if (updatedUser) {
    const session = await auth.createSession(updatedUser.id, updatedUser.email, {
      isVerified: true,
      isProfileComplete: profile?.isProfileComplete ?? false,
      avatarUrl: profile?.avatarUrl ?? null,
    });
    const cookieStore = await cookies();
    cookieStore.set('session', session);
  }

  const redirectPath = isEmailChange ? '/settings' : '/onboarding';
  return NextResponse.redirect(new URL(redirectPath, request.url));
});
