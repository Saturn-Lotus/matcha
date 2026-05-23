import { withErrorHandler } from '@/middlewares/routes-middlewares';
import { getSocialService } from '@/server/factories';
import { NextRequest, NextResponse } from 'next/server';

export const GET = withErrorHandler(
  async (
    _request: NextRequest,
    context: { params: Promise<{ id: string }> },
  ) => {
    const { id } = await context.params;
    const socialService = getSocialService();
    const profile = await socialService.getPublicProfile(id);
    return NextResponse.json(profile);
  },
);
