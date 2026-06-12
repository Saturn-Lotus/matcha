import { Su, SuInfer } from '@/lib/validator';

export const MESSAGE_BODY_MAX = 2000;

export const SendMessageSchema = Su.object({
  conversationId: Su.string(),
  body: Su.string().length({ min: 1, max: MESSAGE_BODY_MAX }),
});

export type SendMessageInput = SuInfer<typeof SendMessageSchema>;

export const StartConversationSchema = Su.object({
  userId: Su.string(),
});

export type StartConversationInput = SuInfer<typeof StartConversationSchema>;

export const MessagesQuerySchema = Su.object({
  cursor: Su.optional(Su.string()),
  limit: Su.optional(Su.number().min(1).max(50)),
});

export type MessagesQuery = SuInfer<typeof MessagesQuerySchema>;
