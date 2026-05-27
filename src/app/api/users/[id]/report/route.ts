import { withErrorHandler } from '@/middlewares/routes-middlewares';
import { NextRequest, NextResponse } from 'next/server';
import { ValidationError } from '@/lib/validator';
import { getSocialService } from '@/server/factories';
import { ReportBodySchema } from '@/server/schemas';

export const POST = withErrorHandler(
  async (
    request: NextRequest,
    context: { params: Promise<{ id: string }> },
  ) => {
    const { id: targetId } = await context.params;
    const viewerId = request.headers.get('x-user-id');
    if (!viewerId) throw new ValidationError('Not authenticated');

    const body = await request.json();
    const { reason } = ReportBodySchema.parse(body);

    const socialService = getSocialService();
    await socialService.report(viewerId, targetId, reason);
    return new NextResponse(null, { status: 204 });
  },
);
