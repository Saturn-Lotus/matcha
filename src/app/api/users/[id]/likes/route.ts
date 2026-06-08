import { withErrorHandler } from '@/middlewares/routes-middlewares';
import { NextRequest, NextResponse } from 'next/server';
import { ValidationError, coerceSearchParamNumber } from '@/lib/validator';
import { getSocialService } from '@/server/factories';
import { BadRequestException } from '@/lib/exception-http-mapper';
import { SocialListQuerySchema } from '@/server/schemas';

export const GET = withErrorHandler(
  async (
    request: NextRequest,
    context: { params: Promise<{ id: string }> },
  ) => {
    const { id } = await context.params;
    const sessionUserId = request.headers.get('x-user-id');
    if (!sessionUserId || sessionUserId !== id) {
      throw new BadRequestException('Unauthorized access to likes');
    }

    const sp = request.nextUrl.searchParams;
    const query = SocialListQuerySchema.parse({
      page: coerceSearchParamNumber(sp, 'page'),
      pageSize: coerceSearchParamNumber(sp, 'pageSize'),
    });

    const socialService = getSocialService();
    const result = await socialService.listLikers(id, query);
    return NextResponse.json(result);
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
    const { matched } = await socialService.likeUser(likerUserId, likedUserId);
    return NextResponse.json({ ok: true, matched }, { status: 201 });
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
