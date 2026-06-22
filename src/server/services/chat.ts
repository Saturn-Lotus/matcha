import {
  HTTPError,
  NotFoundException,
  SelfActionForbiddenException,
} from '@/lib/exception-http-mapper';
import {
  ConversationRepository,
  MessageRepository,
  SocialRepository,
} from '../repositories';
import type { ConversationListRow } from '../repositories/conversation-repository';
import type { MessageRow } from '../repositories/message-repository';
import {
  ConversationListItem,
  ConversationMeta,
  MessageDTO,
  MessagesPage,
  SendMessageResult,
} from '../types';
import { MESSAGE_BODY_MAX } from '../schemas';

@HTTPError(403)
export class NotAParticipantError extends Error {
  constructor(message = 'You are not a participant in this conversation') {
    super(message);
    this.name = 'NotAParticipantError';
  }
}

@HTTPError(403)
export class NoLongerConnectedError extends Error {
  constructor(message = 'You are no longer connected with this user') {
    super(message);
    this.name = 'NoLongerConnectedError';
  }
}

@HTTPError(400)
export class MessageTooLongError extends Error {
  constructor(message = `Message exceeds ${MESSAGE_BODY_MAX} characters`) {
    super(message);
    this.name = 'MessageTooLongError';
  }
}

const DEFAULT_PAGE_SIZE = 30;

function toMessageDTO(row: MessageRow): MessageDTO {
  return {
    id: row.id,
    conversationId: row.conversationId,
    senderId: row.senderId,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
    readAt: row.readAt?.toISOString() ?? null,
  };
}

function toConversationListItem(row: ConversationListRow): ConversationListItem {
  return {
    id: row.id,
    otherUser: {
      userId: row.otherUserId,
      firstName: row.firstName ?? '',
      lastName: row.lastName ?? '',
      avatarUrl: row.avatarUrl ?? null,
    },
    lastMessage: row.lastCreatedAt
      ? {
          body: row.lastBody ?? '',
          createdAt: row.lastCreatedAt.toISOString(),
          senderId: row.lastSenderId ?? '',
        }
      : null,
    unreadCount: row.unreadCount,
    updatedAt: (row.lastCreatedAt ?? row.createdAt).toISOString(),
  };
}

export class ChatService {
  constructor(
    private readonly conversationRepository: ConversationRepository,
    private readonly messageRepository: MessageRepository,
    private readonly socialRepository: SocialRepository,
  ) {}

  startConversation = async (
    userId: string,
    otherUserId: string,
  ): Promise<{ id: string }> => {
    if (userId === otherUserId) {
      throw new SelfActionForbiddenException('Cannot message yourself');
    }
    const matched = await this.socialRepository.areMatched(userId, otherUserId);
    if (!matched) throw new NoLongerConnectedError();
    const conversation = await this.conversationRepository.findOrCreate(
      userId,
      otherUserId,
    );
    return { id: conversation.id };
  };

  getConversations = async (
    userId: string,
  ): Promise<ConversationListItem[]> => {
    const rows = await this.conversationRepository.findByUser(userId);
    return rows.map(toConversationListItem);
  };

  getConversationMeta = async (
    userId: string,
    conversationId: string,
  ): Promise<ConversationMeta> => {
    const meta = await this.conversationRepository.findMetaForUser(
      conversationId,
      userId,
    );
    if (!meta) throw new NotAParticipantError();
    const connected = await this.socialRepository.areMatched(
      userId,
      meta.otherUserId,
    );
    return {
      id: meta.id,
      otherUser: {
        userId: meta.otherUserId,
        firstName: meta.firstName ?? '',
        lastName: meta.lastName ?? '',
        avatarUrl: meta.avatarUrl ?? null,
      },
      connected,
    };
  };

  getMessages = async (
    userId: string,
    conversationId: string,
    cursor: string | null,
    limit: number = DEFAULT_PAGE_SIZE,
  ): Promise<MessagesPage> => {
    const isParticipant = await this.conversationRepository.isParticipant(
      conversationId,
      userId,
    );
    if (!isParticipant) throw new NotAParticipantError();
    const rows = await this.messageRepository.listByCursor(
      conversationId,
      cursor,
      limit,
    );
    const items = rows.map(toMessageDTO);
    const nextCursor =
      rows.length === limit ? (rows[rows.length - 1]?.createdAt.toISOString() ?? null) : null;
    return { items, nextCursor };
  };

  sendMessage = async (
    senderId: string,
    conversationId: string,
    body: string,
  ): Promise<SendMessageResult> => {
    const trimmed = body.trim();
    if (trimmed.length > MESSAGE_BODY_MAX) throw new MessageTooLongError();

    const conversation =
      await this.conversationRepository.findById(conversationId);
    if (!conversation) throw new NotFoundException('Conversation not found');
    if (
      conversation.userIdA !== senderId &&
      conversation.userIdB !== senderId
    ) {
      throw new NotAParticipantError();
    }
    const recipientId =
      conversation.userIdA === senderId
        ? conversation.userIdB
        : conversation.userIdA;

    const matched = await this.socialRepository.areMatched(
      senderId,
      recipientId,
    );
    if (!matched) throw new NoLongerConnectedError();

    const message = await this.messageRepository.create(
      conversationId,
      senderId,
      trimmed,
    );
    return { message: toMessageDTO(message), recipientId };
  };

  markRead = async (
    userId: string,
    conversationId: string,
  ): Promise<{ count: number; otherUserId: string }> => {
    const conversation =
      await this.conversationRepository.findById(conversationId);
    if (
      !conversation ||
      (conversation.userIdA !== userId && conversation.userIdB !== userId)
    ) {
      throw new NotAParticipantError();
    }
    const otherUserId =
      conversation.userIdA === userId
        ? conversation.userIdB
        : conversation.userIdA;
    const count = await this.messageRepository.markRead(conversationId, userId);
    return { count, otherUserId };
  };

  getUnreadCount = async (userId: string): Promise<number> => {
    return this.messageRepository.unreadCount(userId);
  };

  getOtherParticipant = async (
    userId: string,
    conversationId: string,
  ): Promise<string | null> => {
    const conversation =
      await this.conversationRepository.findById(conversationId);
    if (!conversation) return null;
    if (conversation.userIdA === userId) return conversation.userIdB;
    if (conversation.userIdB === userId) return conversation.userIdA;
    return null;
  };
}
