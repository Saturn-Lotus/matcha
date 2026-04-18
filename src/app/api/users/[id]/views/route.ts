import { BadRequestException } from '@/lib/exception-http-mapper';
import { withErrorHandler } from '@/middlewares/routes-middlewares';
import { getSocialService } from '@/server/factories';
import { NextRequest, NextResponse } from 'next/server';

export const GET = withErrorHandler(
  async (
    _request: NextRequest,
    context: { params: Promise<{ id: string }> },
  ) => {
    const { id } = await context.params;
    const sessionUserId = _request.headers.get('x-user-id');

    if (!sessionUserId || sessionUserId !== id) {
      throw new BadRequestException('Unauthorized access to views');
    }

    const socialService = getSocialService();
    const viewers = await socialService.getViewers(id);
    return NextResponse.json(viewers);
  },
);

export const POST = withErrorHandler(
  async (
    _request: NextRequest,
    context: { params: Promise<{ id: string }> },
  ) => {
    const { id: viewedUserId } = await context.params;
    const viewerId = _request.headers.get('x-user-id');

    const isSelfView = !viewerId || viewerId === viewedUserId;

    if (!isSelfView) {
      const socialService = getSocialService();
      await socialService.recordView(viewerId, viewedUserId);
    }

    return NextResponse.json({ ok: true });
  },
);
