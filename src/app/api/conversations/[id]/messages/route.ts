import { withErrorHandler } from '@/middlewares/routes-middlewares';
import { getChatService } from '@/server/factories';
import { MessagesQuerySchema } from '@/server/schemas';
import { coerceSearchParamNumber } from '@/lib/validator';
import { NextRequest, NextResponse } from 'next/server';

export const GET = withErrorHandler(
  async (
    request: NextRequest,
    context: { params: Promise<{ id: string }> },
  ) => {
    const userId = request.headers.get('x-user-id')!;
    const { id } = await context.params;
    const sp = request.nextUrl.searchParams;
    const query = MessagesQuerySchema.parse({
      cursor: sp.get('cursor') ?? undefined,
      limit: coerceSearchParamNumber(sp, 'limit'),
    });
    const chatService = getChatService();
    const page = await chatService.getMessages(
      userId,
      id,
      query.cursor ?? null,
      query.limit,
    );
    return NextResponse.json(page);
  },
);
