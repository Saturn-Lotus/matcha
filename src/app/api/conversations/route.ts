import { withErrorHandler } from '@/middlewares/routes-middlewares';
import { ChatFactory } from '@/server/factories';
import { PostgresDB } from '@/server/db/postgres';
import { NextRequest, NextResponse } from 'next/server';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const userId = request.headers.get('x-user-id');
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = new PostgresDB();
  const chatService = ChatFactory.create(db);
  
  const conversations = await chatService.getConversations(userId);
  
  return NextResponse.json(conversations);
});
