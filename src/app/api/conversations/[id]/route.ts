import { withErrorHandler } from '@/middlewares/routes-middlewares';
import { getChatService } from '@/server/factories';
import { NextRequest, NextResponse } from 'next/server';

export const GET = withErrorHandler(
  async (
    request: NextRequest,
    context: { params: Promise<{ id: string }> },
  ) => {
    const userId = request.headers.get('x-user-id')!;
    const { id } = await context.params;
    const chatService = getChatService();
    const meta = await chatService.getConversationMeta(userId, id);
    return NextResponse.json(meta);
  },
);
