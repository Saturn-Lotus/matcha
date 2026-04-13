import { withErrorHandler } from '@/middlewares/routes-middlewares';
import { getUserService } from '@/server/factories';
import { NextRequest, NextResponse } from 'next/server';

export const GET = withErrorHandler(
  async (
    _request: NextRequest,
    context: { params: Promise<{ id: string }> },
  ) => {
    const { id } = await context.params;
    const userService = await getUserService();
    const { buffer, contentType } = await userService.getAvatarFile(id);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  },
);
