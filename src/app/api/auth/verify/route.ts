import { NextRequest, NextResponse } from 'next/server';
import { getAuthService, getUserRepository } from '@/server/factories';
import { withErrorHandler } from '@/middlewares/routes-middlewares/withErrorHandler';
import { cookies } from 'next/headers';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get('token') || '';
  const id = searchParams.get('id') || '';
  const auth = getAuthService();
  await auth.verifyUser(token, id);

  const userRepository = getUserRepository();
  const [user, profile] = await Promise.all([
    userRepository.findById(id),
    userRepository.findProfileByUserId(id),
  ]);

  if (user) {
    const session = await auth.createSession(user.id, user.email, {
      isVerified: true,
      isProfileComplete: profile?.isProfileComplete ?? false,
      avatarUrl: profile?.avatarUrl ?? null,
    });
    const cookieStore = await cookies();
    cookieStore.set('session', session);
  }

  return NextResponse.redirect(new URL('/onboarding', request.url));
});
