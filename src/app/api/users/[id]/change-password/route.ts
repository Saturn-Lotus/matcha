import { UnauthorizedException } from '@/lib/exception-http-mapper';
import { withErrorHandler } from '@/middlewares/routes-middlewares';
import { getUserService } from '@/server/factories';
import { ChangePasswordSchema } from '@/server/schemas';
import { NextRequest, NextResponse } from 'next/server';

export const POST = withErrorHandler(
  async (
    request: NextRequest,
    context: { params: Promise<{ id: string }> },
  ) => {
    const { id } = await context.params;
    const userId = request.headers.get('x-user-id');
    if (userId !== id) {
      throw new UnauthorizedException('You can only change your own password');
    }
    const body = await request.json();
    const { oldPassword, newPassword } = ChangePasswordSchema.parse(body);

    const userService = await getUserService();
    await userService.changePassword(id, oldPassword, newPassword);

    return NextResponse.json({ message: 'Password updated' }, { status: 200 });
  },
);
