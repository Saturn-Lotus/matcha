import {
  ChatService,
  NoLongerConnectedError,
  MessageTooLongError,
  NotAParticipantError,
} from '@/server/services/chat';

function makeService() {
  const conversationRepo = {
    findById: jest.fn(),
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
    isBlockedEitherDirection: jest.fn().mockResolvedValue(false),
  };
  const notificationService = {
    emit: jest.fn(),
  };
  const service = new ChatService(
    conversationRepo as never,
    messageRepo as never,
    socialRepo as never,
    notificationService as never,
  );
  return { service, conversationRepo, messageRepo, socialRepo, notificationService };
}

const conversation = {
  id: 'c1',
  userIdA: 'a',
  userIdB: 'b',
  createdAt: new Date(),
};

describe('ChatService.sendMessage', () => {
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

describe('ChatService.getMessages', () => {
  it('returns history for a participant with no block', async () => {
    const { service, conversationRepo, messageRepo } = makeService();
    conversationRepo.findById.mockResolvedValue(conversation);
    messageRepo.listByCursor.mockResolvedValue([]);

    const page = await service.getMessages('a', 'c1', null);

    expect(page).toEqual({ items: [], nextCursor: null });
  });

  it('throws NotAParticipant for an outsider', async () => {
    const { service, conversationRepo, messageRepo } = makeService();
    conversationRepo.findById.mockResolvedValue(conversation);

    await expect(
      service.getMessages('z', 'c1', null),
    ).rejects.toBeInstanceOf(NotAParticipantError);
    expect(messageRepo.listByCursor).not.toHaveBeenCalled();
  });

  it('throws NoLongerConnected when either user blocked the other', async () => {
    const { service, conversationRepo, messageRepo, socialRepo } =
      makeService();
    conversationRepo.findById.mockResolvedValue(conversation);
    socialRepo.isBlockedEitherDirection.mockResolvedValue(true);

    await expect(
      service.getMessages('a', 'c1', null),
    ).rejects.toBeInstanceOf(NoLongerConnectedError);
    expect(socialRepo.isBlockedEitherDirection).toHaveBeenCalledWith('a', 'b');
    expect(messageRepo.listByCursor).not.toHaveBeenCalled();
  });
});

describe('ChatService.getConversationMeta', () => {
  it('throws NoLongerConnected when the pair is blocked', async () => {
    const { service, conversationRepo, socialRepo } = makeService();
    conversationRepo.findMetaForUser.mockResolvedValue({
      id: 'c1',
      otherUserId: 'b',
      firstName: 'B',
      lastName: 'B',
      avatarUrl: null,
    });
    socialRepo.isBlockedEitherDirection.mockResolvedValue(true);

    await expect(
      service.getConversationMeta('a', 'c1'),
    ).rejects.toBeInstanceOf(NoLongerConnectedError);
  });
});

describe('ChatService.startConversation', () => {
  it('throws NoLongerConnected when the pair is blocked', async () => {
    const { service, conversationRepo, socialRepo } = makeService();
    socialRepo.isBlockedEitherDirection.mockResolvedValue(true);

    await expect(
      service.startConversation('a', 'b'),
    ).rejects.toBeInstanceOf(NoLongerConnectedError);
    expect(conversationRepo.findOrCreate).not.toHaveBeenCalled();
  });
});
