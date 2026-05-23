import { BadRequestException } from '@/lib/exception-http-mapper';
import { withErrorHandler } from '@/middlewares/routes-middlewares';
import { getSocialService } from '@/server/factories';
import { CheckValidationError } from '@/lib/validator';
import { NextRequest, NextResponse } from 'next/server';
import { SocialListQuerySchema } from '@/server/schemas';

function coerceNumber(sp: URLSearchParams, key: string): number | undefined {
  const raw = sp.get(key);
  if (raw === null) return undefined;
  const value = Number(raw);
  if (Number.isNaN(value)) {
    throw new CheckValidationError(raw, `is not a valid number for '${key}'`);
  }
  return value;
}

export const GET = withErrorHandler(
  async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
    const { id } = await context.params;
    const sessionUserId = request.headers.get('x-user-id');

    if (!sessionUserId || sessionUserId !== id) {
      throw new BadRequestException('Unauthorized access to views');
    }

    const sp = request.nextUrl.searchParams;
    const query = SocialListQuerySchema.parse({
      page: coerceNumber(sp, 'page'),
      pageSize: coerceNumber(sp, 'pageSize'),
    });

    const socialService = getSocialService();
    const result = await socialService.listViewers(id, query);
    return NextResponse.json(result);
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
