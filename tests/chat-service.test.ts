import { ChatService, NotConnectedError, MessageTooLongError, ConversationNotFoundError } from '../src/server/services/chat';
import { ConversationRepository } from '../src/server/repositories/conversation-repository';
import { MessageRepository } from '../src/server/repositories/message-repository';
import { SocialRepository } from '../src/server/repositories/social-repository';
import { PostgresDB } from '../src/server/db/postgres';

jest.mock('../src/server/db/postgres');
jest.mock('../src/server/repositories/conversation-repository');
jest.mock('../src/server/repositories/message-repository');
jest.mock('../src/server/repositories/social-repository');

describe('ChatService', () => {
  let chatService: ChatService;
  let conversationRepo: jest.Mocked<ConversationRepository>;
  let messageRepo: jest.Mocked<MessageRepository>;
  let socialRepo: jest.Mocked<SocialRepository>;
  let db: jest.Mocked<PostgresDB>;

  beforeEach(() => {
    db = new PostgresDB() as jest.Mocked<PostgresDB>;
    conversationRepo = new ConversationRepository(db) as jest.Mocked<ConversationRepository>;
    messageRepo = new MessageRepository(db) as jest.Mocked<MessageRepository>;
    socialRepo = new SocialRepository(db) as jest.Mocked<SocialRepository>;
    chatService = new ChatService(conversationRepo, messageRepo, socialRepo);
  });

  describe('sendMessage', () => {
    const senderId = 'user-1';
    const conversationId = 'conv-1';
    const otherUserId = 'user-2';
    const body = 'Hello';

    it('should send a message when users are connected and not blocked', async () => {
      conversationRepo.findById.mockResolvedValue({
        id: conversationId,
        userAId: senderId,
        userBId: otherUserId,
        createdAt: new Date(),
      });
      socialRepo.isMutualLike.mockResolvedValue(true);
      socialRepo.isBlocked.mockResolvedValue(false);
      messageRepo.create.mockResolvedValue({
        id: 'msg-1',
        conversationId,
        senderId,
        body,
        createdAt: new Date(),
        readAt: null,
      });

      const result = await chatService.sendMessage(senderId, conversationId, body);

      expect(result.body).toBe(body);
      expect(messageRepo.create).toHaveBeenCalledWith(conversationId, senderId, body);
    });

    it('should throw NotConnectedError if no mutual like', async () => {
      conversationRepo.findById.mockResolvedValue({
        id: conversationId,
        userAId: senderId,
        userBId: otherUserId,
        createdAt: new Date(),
      });
      socialRepo.isMutualLike.mockResolvedValue(false);

      await expect(chatService.sendMessage(senderId, conversationId, body))
        .rejects.toThrow(NotConnectedError);
    });

    it('should throw NotConnectedError if blocked', async () => {
      conversationRepo.findById.mockResolvedValue({
        id: conversationId,
        userAId: senderId,
        userBId: otherUserId,
        createdAt: new Date(),
      });
      socialRepo.isMutualLike.mockResolvedValue(true);
      socialRepo.isBlocked.mockResolvedValue(true);

      await expect(chatService.sendMessage(senderId, conversationId, body))
        .rejects.toThrow(NotConnectedError);
    });

    it('should throw MessageTooLongError if body > 2000 chars', async () => {
      const longBody = 'a'.repeat(2001);
      await expect(chatService.sendMessage(senderId, conversationId, longBody))
        .rejects.toThrow(MessageTooLongError);
    });
  });
});
