import { withErrorHandler } from '@/middlewares/routes-middlewares';
import { getChatService } from '@/server/factories';
import { StartConversationSchema } from '@/server/schemas';
import { NextRequest, NextResponse } from 'next/server';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const userId = request.headers.get('x-user-id')!;
  const chatService = getChatService();
  const conversations = await chatService.getConversations(userId);
  return NextResponse.json(conversations);
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const userId = request.headers.get('x-user-id')!;
  const body = StartConversationSchema.parse(await request.json());
  const chatService = getChatService();
  const conversation = await chatService.startConversation(userId, body.userId);
  return NextResponse.json(conversation, { status: 201 });
});
