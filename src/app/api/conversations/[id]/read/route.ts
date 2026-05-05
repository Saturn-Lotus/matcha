import { withErrorHandler } from '@/middlewares/routes-middlewares';
import { ChatFactory } from '@/server/factories';
import { PostgresDB } from '@/server/db/postgres';
import { NextRequest, NextResponse } from 'next/server';

export const POST = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id: conversationId } = await params;
  const userId = request.headers.get('x-user-id');
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = new PostgresDB();
  const chatService = ChatFactory.create(db);
  
  await chatService.markAsRead(userId, conversationId);
  
  return new NextResponse(null, { status: 204 });
});
