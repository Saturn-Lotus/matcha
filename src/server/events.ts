import { EventEmitter } from 'events';

export const chatEvents = new EventEmitter();

export const CHAT_EVENT = {
  MESSAGE_CREATED: 'message.created',
  MESSAGE_READ: 'message.read',
  CONVERSATION_UPDATED: 'conversation.updated',
};
