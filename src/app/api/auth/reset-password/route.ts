import { ForgotPasswordSchema, ResetPasswordSchema } from '@/server/schemas';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthService } from '@/server/factories/auth-factory';
import { withErrorHandler } from '@/middlewares/routes-middlewares';

export const POST = withErrorHandler(async (request: NextRequest) => {
  const { email } = ForgotPasswordSchema.parse(await request.json());
  const auth = getAuthService();

  await auth.requestPasswordReset(email);

  return NextResponse.json({ success: true }, { status: 200 });
});

export const PATCH = withErrorHandler(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get('token') || '';
  const id = searchParams.get('id') || '';
  const { newPassword } = ResetPasswordSchema.parse(await request.json());

  const auth = getAuthService();

  await auth.resetPassword(token, id, newPassword);

  return NextResponse.json({ success: true }, { status: 200 });
});
