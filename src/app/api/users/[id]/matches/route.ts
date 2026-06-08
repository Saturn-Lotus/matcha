import { withErrorHandler } from '@/middlewares/routes-middlewares';
import { NextRequest, NextResponse } from 'next/server';
import { coerceSearchParamNumber } from '@/lib/validator';
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
      throw new BadRequestException('Unauthorized access to matches');
    }

    const sp = request.nextUrl.searchParams;
    const query = SocialListQuerySchema.parse({
      page: coerceSearchParamNumber(sp, 'page'),
      pageSize: coerceSearchParamNumber(sp, 'pageSize'),
    });

    const socialService = getSocialService();
    const result = await socialService.listMatches(id, query);
    return NextResponse.json(result);
  },
);
