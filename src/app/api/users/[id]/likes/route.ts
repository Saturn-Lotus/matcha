import { withErrorHandler } from '@/middlewares/routes-middlewares';
import { NextRequest, NextResponse } from 'next/server';
import { ValidationError } from '@/lib/validator';
import { getSocialService } from '@/server/factories';
import { BadRequestException } from '@/lib/exception-http-mapper';

export const GET = withErrorHandler(
  async (
    _request: NextRequest,
    context: { params: Promise<{ id: string }> },
  ) => {
    const { id } = await context.params;
    const sessionUserId = _request.headers.get('x-user-id');
    if (!sessionUserId || sessionUserId !== id) {
      throw new BadRequestException('Unauthorized access to likes');
    }

    const socialService = getSocialService();

    const likers = await socialService.listLikers(id);
    return NextResponse.json(likers);
  },
);

export const POST = withErrorHandler(
  async (
    _request: NextRequest,
    context: { params: Promise<{ id: string }> },
  ) => {
    const { id: likedUserId } = await context.params;
    const likerUserId = _request.headers.get('x-user-id');

    if (!likerUserId || likerUserId === likedUserId) {
      throw new BadRequestException('Unable to like yourself');
    }

    const socialService = getSocialService();
    await socialService.likeUser(likerUserId, likedUserId);
    return NextResponse.json({ ok: true }, { status: 201 });
  },
);

export const DELETE = withErrorHandler(
  async (
    _request: NextRequest,
    context: { params: Promise<{ id: string }> },
  ) => {
    const { id: likedUserId } = await context.params;
    const likerUserId = _request.headers.get('x-user-id');

    if (!likerUserId) throw new ValidationError('Not authenticated');

    const socialService = getSocialService();
    await socialService.unlikeUser(likerUserId, likedUserId);
    return NextResponse.json({ ok: true });
  },
);
