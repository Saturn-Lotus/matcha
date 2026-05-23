import { withErrorHandler } from '@/middlewares/routes-middlewares';
import { ForbiddenException } from '@/lib/exception-http-mapper';
import { getSocialService } from '@/server/factories';
import { NextRequest, NextResponse } from 'next/server';

export const GET = withErrorHandler(
  async (
    _request: NextRequest,
    context: { params: Promise<{ id: string }> },
  ) => {
    const { id } = await context.params;
    const viewerId = _request.headers.get('x-user-id');
    if (!viewerId) throw new ForbiddenException('Not authenticated');
    const socialService = getSocialService();
    const profile = await socialService.getPublicProfile(id, viewerId);
    return NextResponse.json(profile);
  },
);
