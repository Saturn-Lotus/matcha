import { PostgresDB } from '../db/postgres';
import {
  ConversationRepository,
  MessageRepository,
  SocialRepository,
  UserRepository,
} from '../repositories';
import { ChatService } from '../services/chat';

export class ChatFactory {
  static create(db: PostgresDB): ChatService {
    const conversationRepo = new ConversationRepository(db);
    const messageRepo = new MessageRepository(db);
    const socialRepo = new SocialRepository(db);
    const userRepo = new UserRepository(db);

    return new ChatService(
      conversationRepo,
      messageRepo,
      socialRepo,
      userRepo,
    );
  }
}
