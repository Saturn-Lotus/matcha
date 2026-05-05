import { withErrorHandler } from '@/middlewares/routes-middlewares';
import { ChatFactory } from '@/server/factories';
import { PostgresDB } from '@/server/db/postgres';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const MessageSchema = z.object({
  body: z.string().min(1).max(2000),
});

export const POST = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id: conversationId } = await params;
  const userId = request.headers.get('x-user-id');
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { body } = MessageSchema.parse(await request.json());
  
  const db = new PostgresDB();
  const chatService = ChatFactory.create(db);
  
  const message = await chatService.sendMessage(userId, conversationId, body);
  
  return NextResponse.json(message, { status: 201 });
});

export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id: conversationId } = await params;
  const userId = request.headers.get('x-user-id');
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '50');
  const cursor = searchParams.get('cursor') || undefined;
  
  const db = new PostgresDB();
  const chatService = ChatFactory.create(db);
  
  const messages = await chatService.getMessages(userId, conversationId, limit, cursor);
  
  return NextResponse.json(messages);
});
