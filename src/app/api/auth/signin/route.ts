import { withErrorHandler } from '@/middlewares/routes-middlewares';
import { getAuthService, getUserRepository } from '@/server/factories';
import { CredentialsSchema } from '@/server/schemas';

import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export const POST = withErrorHandler(async (request: NextRequest) => {
  const credentials = CredentialsSchema.parse(await request.json());
  const auth = getAuthService();

  const user = await auth.authenticate(
    credentials.username,
    credentials.password,
  );
  const userRepository = getUserRepository();
  const profile = await userRepository.findProfileByUserId(user.id);
  const session = await auth.createSession(user.id, user.email, {
    isVerified: user.isVerified,
    isProfileComplete: profile?.isProfileComplete ?? false,
    avatarUrl: profile?.avatarUrl ?? null,
  });
  const cookieStore = await cookies();
  cookieStore.set('session', session);
  return NextResponse.json({ id: user.id, email: user.email });
});
