import {
  ChatService,
  NoLongerConnectedError,
  MessageTooLongError,
} from '@/server/services/chat';

function makeService() {
  const conversationRepo = {
    findById: jest.fn(),
    isParticipant: jest.fn(),
    findByUser: jest.fn(),
    findOrCreate: jest.fn(),
    findMetaForUser: jest.fn(),
  };
  const messageRepo = {
    create: jest.fn(),
    listByCursor: jest.fn(),
    markRead: jest.fn(),
    unreadCount: jest.fn(),
  };
  const socialRepo = {
    areMatched: jest.fn(),
  };
  const service = new ChatService(
    conversationRepo as never,
    messageRepo as never,
    socialRepo as never,
  );
  return { service, conversationRepo, messageRepo, socialRepo };
}

describe('ChatService.sendMessage', () => {
  const conversation = {
    id: 'c1',
    userIdA: 'a',
    userIdB: 'b',
    createdAt: new Date(),
  };

  it('trims, persists, and returns the message with the recipient', async () => {
    const { service, conversationRepo, messageRepo, socialRepo } =
      makeService();
    conversationRepo.findById.mockResolvedValue(conversation);
    socialRepo.areMatched.mockResolvedValue(true);
    const createdAt = new Date('2026-06-10T10:00:00.000Z');
    messageRepo.create.mockResolvedValue({
      id: 'm1',
      conversationId: 'c1',
      senderId: 'a',
      body: 'hi',
      createdAt,
      readAt: null,
    });

    const result = await service.sendMessage('a', 'c1', '  hi  ');

    expect(messageRepo.create).toHaveBeenCalledWith('c1', 'a', 'hi');
    expect(result.recipientId).toBe('b');
    expect(result.message).toEqual({
      id: 'm1',
      conversationId: 'c1',
      senderId: 'a',
      body: 'hi',
      createdAt: createdAt.toISOString(),
      readAt: null,
    });
  });

  it('throws NoLongerConnected when no live match exists', async () => {
    const { service, conversationRepo, socialRepo, messageRepo } =
      makeService();
    conversationRepo.findById.mockResolvedValue(conversation);
    socialRepo.areMatched.mockResolvedValue(false);

    await expect(service.sendMessage('a', 'c1', 'hi')).rejects.toBeInstanceOf(
      NoLongerConnectedError,
    );
    expect(messageRepo.create).not.toHaveBeenCalled();
  });

  it('throws MessageTooLong before touching the database', async () => {
    const { service, conversationRepo } = makeService();
    const body = 'x'.repeat(2001);

    await expect(service.sendMessage('a', 'c1', body)).rejects.toBeInstanceOf(
      MessageTooLongError,
    );
    expect(conversationRepo.findById).not.toHaveBeenCalled();
  });
});
