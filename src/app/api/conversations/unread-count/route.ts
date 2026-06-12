import { withErrorHandler } from '@/middlewares/routes-middlewares';
import { getChatService } from '@/server/factories';
import { NextRequest, NextResponse } from 'next/server';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const userId = request.headers.get('x-user-id')!;
  const chatService = getChatService();
  const count = await chatService.getUnreadCount(userId);
  return NextResponse.json({ count });
});
