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

export const TypingSchema = Su.object({
  conversationId: Su.string(),
  isTyping: Su.boolean(),
});

export type TypingInput = SuInfer<typeof TypingSchema>;

export const MessageDeliveredSchema = Su.object({
  conversationId: Su.string(),
  messageId: Su.optional(Su.string()),
});

export type MessageDeliveredInput = SuInfer<typeof MessageDeliveredSchema>;

export const MessageReadSchema = Su.object({
  conversationId: Su.string(),
});

export type MessageReadInput = SuInfer<typeof MessageReadSchema>;
