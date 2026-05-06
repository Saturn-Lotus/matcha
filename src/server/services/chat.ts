import {
  BadRequestException,
  HTTPError,
  NotFoundException,
} from '@/lib/exception-http-mapper';
import { chatEvents, CHAT_EVENT } from '../events';
import {
  ConversationRepository,
  MessageRepository,
  SocialRepository,
  UserRepository,
} from '../repositories';

@HTTPError(403)
export class NotConnectedError extends Error {
  constructor(message = 'Users are not connected') {
    super(message);
    this.name = 'NotConnectedError';
  }
}

@HTTPError(400)
export class MessageTooLongError extends Error {
  constructor(message = 'Message exceeds 2000 characters') {
    super(message);
    this.name = 'MessageTooLongError';
  }
}

@HTTPError(404)
export class ConversationNotFoundError extends Error {
  constructor(message = 'Conversation not found') {
    super(message);
    this.name = 'ConversationNotFoundError';
  }
}

export class ChatService {
  constructor(
    private readonly conversationRepo: ConversationRepository,
    private readonly messageRepo: MessageRepository,
    private readonly socialRepo: SocialRepository,
    private readonly userRepo: UserRepository,
  ) {}

  async sendMessage(senderId: string, conversationId: string, body: string) {
    if (body.length > 2000) {
      throw new MessageTooLongError();
    }

    const conversation = await this.conversationRepo.findById(conversationId);
    if (!conversation) {
      throw new ConversationNotFoundError();
    }

    const otherUserId = conversation.userAId === senderId ? conversation.userBId : conversation.userAId;

    // Verify connection: mutual likes and not blocked
    const isMutual = await this.socialRepo.isMutualLike(senderId, otherUserId);
    if (!isMutual) {
      throw new NotConnectedError('No mutual like');
    }

    const isBlocked = await this.socialRepo.isBlocked(senderId, otherUserId);
    if (isBlocked) {
      throw new NotConnectedError('One of the users is blocked');
    }

    const message = await this.messageRepo.create(conversationId, senderId, body);

    chatEvents.emit(CHAT_EVENT.MESSAGE_CREATED, {
      message,
      recipientId: otherUserId,
    });

    return message;
  }

  async getMessages(userId: string, conversationId: string, limit: number = 50, cursor?: string) {
    const isParticipant = await this.conversationRepo.isParticipant(conversationId, userId);
    if (!isParticipant) {
      throw new ConversationNotFoundError('You are not a participant of this conversation');
    }

    return this.messageRepo.listByConversation(conversationId, limit, cursor);
  }

  async markAsRead(userId: string, conversationId: string) {
    const isParticipant = await this.conversationRepo.isParticipant(conversationId, userId);
    if (!isParticipant) {
      throw new ConversationNotFoundError('You are not a participant of this conversation');
    }

    await this.messageRepo.markAsRead(conversationId, userId);
    
    chatEvents.emit(CHAT_EVENT.MESSAGE_READ, {
      conversationId,
      userId,
    });
  }

  async getConversations(userId: string) {
    return this.conversationRepo.findByUser(userId);
  }

  async startConversationWithUsername(currentUserId: string, username: string) {
    const trimmed = username.trim();
    if (!trimmed) {
      throw new BadRequestException('Username is required');
    }
    const other = await this.userRepo.findByUsername(trimmed);
    if (!other) {
      throw new NotFoundException('User not found');
    }
    if (other.id === currentUserId) {
      throw new BadRequestException('Cannot start a conversation with yourself');
    }
    return this.getOrCreateConversation(currentUserId, other.id);
  }

  async getOrCreateConversation(user1Id: string, user2Id: string) {
    const isMutual = await this.socialRepo.isMutualLike(user1Id, user2Id);
    if (!isMutual) {
      throw new NotConnectedError('No mutual like');
    }

    const isBlocked = await this.socialRepo.isBlocked(user1Id, user2Id);
    if (isBlocked) {
      throw new NotConnectedError('One of the users is blocked');
    }

    return this.conversationRepo.findOrCreate(user1Id, user2Id);
  }
}
