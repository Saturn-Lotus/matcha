import { withErrorHandler } from '@/middlewares/routes-middlewares';
import { getAuthService } from '@/server/factories';
import { NextRequest, NextResponse } from 'next/server';

export const POST = withErrorHandler(async (request: NextRequest) => {
  const userId = request.headers.get('x-user-id')!;
  const auth = getAuthService();
  await auth.resendVerificationEmail(userId);
  return NextResponse.json(
    { message: 'Verification email sent. Please check your inbox.' },
    { status: 200 },
  );
});
