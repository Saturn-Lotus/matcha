import { PostgresDB } from '@/server/db/postgres';
import {
  ConversationRepository,
  MessageRepository,
  SocialRepository,
} from '../repositories';
import { ChatService } from '../services/chat';
import { getPostgresDB } from './db-factory';

export const getConversationRepository = (
  db?: PostgresDB,
): ConversationRepository => {
  return new ConversationRepository(db ?? getPostgresDB());
};

export const getMessageRepository = (db?: PostgresDB): MessageRepository => {
  return new MessageRepository(db ?? getPostgresDB());
};

export const getChatService = (): ChatService => {
  return new ChatService(
    getConversationRepository(),
    getMessageRepository(),
    new SocialRepository(getPostgresDB()),
  );
};
