import { NotificationService } from '@/server/services/notification';

const SOCKET_INTERNAL_URL = 'http://localhost:4001';
const SOCKET_INTERNAL_SECRET = 'test-secret';

function makeService() {
  const notificationRepo = {
    create: jest.fn(),
    listByUser: jest.fn(),
    unreadCount: jest.fn(),
    markRead: jest.fn(),
    markAllRead: jest.fn(),
    findRecentViewNotification: jest.fn(),
    claimById: jest.fn(),
    claimAllUnread: jest.fn(),
  };
  const socialRepo = {
    isBlockedEitherDirection: jest.fn(),
    isNotificationMuted: jest.fn().mockResolvedValue(false),
  };
  const service = new NotificationService(
    notificationRepo as never,
    socialRepo as never,
  );
  return { service, notificationRepo, socialRepo };
}

const persistedNotification = {
  id: 'n1',
  type: 'like' as const,
  actorId: 'actor-1',
  actorFirstName: 'Alice',
  actorLastName: 'Smith',
  actorAvatarUrl: null,
  payload: null,
  readAt: null,
  createdAt: new Date().toISOString(),
};

beforeEach(() => {
  process.env.SOCKET_INTERNAL_URL = SOCKET_INTERNAL_URL;
  process.env.SOCKET_INTERNAL_SECRET = SOCKET_INTERNAL_SECRET;
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('NotificationService.emit', () => {
  it('skips creation when the actor is blocked', async () => {
    const { service, notificationRepo, socialRepo } = makeService();
    socialRepo.isBlockedEitherDirection.mockResolvedValue(true);
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(null, { status: 200 }),
    );

    await service.emit('target-1', 'like', 'actor-1');

    expect(socialRepo.isBlockedEitherDirection).toHaveBeenCalledWith(
      'target-1',
      'actor-1',
    );
    expect(notificationRepo.create).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('skips creation when the recipient unliked the actor (muted)', async () => {
    const { service, notificationRepo, socialRepo } = makeService();
    socialRepo.isBlockedEitherDirection.mockResolvedValue(false);
    socialRepo.isNotificationMuted.mockResolvedValue(true);
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(null, { status: 200 }),
    );

    await service.emit('target-1', 'profile_view', 'actor-1');

    expect(socialRepo.isNotificationMuted).toHaveBeenCalledWith(
      'target-1',
      'actor-1',
    );
    expect(notificationRepo.create).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('skips profile_view when a recent one exists (rate-limit)', async () => {
    const { service, notificationRepo, socialRepo } = makeService();
    socialRepo.isBlockedEitherDirection.mockResolvedValue(false);
    notificationRepo.findRecentViewNotification.mockResolvedValue(true);
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(null, { status: 200 }),
    );

    await service.emit('target-1', 'profile_view', 'actor-1');

    expect(
      notificationRepo.findRecentViewNotification,
    ).toHaveBeenCalledWith('actor-1', 'target-1');
    expect(notificationRepo.create).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('creates notification and pushes to socket for normal flow', async () => {
    const { service, notificationRepo, socialRepo } = makeService();
    socialRepo.isBlockedEitherDirection.mockResolvedValue(false);
    notificationRepo.create.mockResolvedValue(persistedNotification);
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(null, { status: 200 }),
    );

    await service.emit('target-1', 'like', 'actor-1');

    expect(notificationRepo.create).toHaveBeenCalledWith(
      'target-1',
      'like',
      'actor-1',
      undefined,
    );
    expect(fetchSpy).toHaveBeenCalledWith(
      `${SOCKET_INTERNAL_URL}/notify`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: SOCKET_INTERNAL_SECRET,
          userId: 'target-1',
          notification: persistedNotification,
        }),
      },
    );
  });

  it('includes the recipient userId in the push body so the socket can route', async () => {
    const { service, notificationRepo, socialRepo } = makeService();
    socialRepo.isBlockedEitherDirection.mockResolvedValue(false);
    notificationRepo.create.mockResolvedValue(persistedNotification);
    const fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(new Response(null, { status: 200 }));

    await service.emit('recipient-42', 'like', 'actor-1');

    const body = JSON.parse(fetchSpy.mock.calls[0]![1]!.body as string);
    expect(body.userId).toBe('recipient-42');
    expect(body.notification).toEqual(persistedNotification);
  });

  it('never throws when the block check fails — callers must not be impacted', async () => {
    const { service, socialRepo } = makeService();
    socialRepo.isBlockedEitherDirection.mockRejectedValue(
      new Error('db down'),
    );
    jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(
      service.emit('target-1', 'like', 'actor-1'),
    ).resolves.toBeUndefined();
  });

  it('never throws when the create fails — caller flow continues', async () => {
    const { service, notificationRepo, socialRepo } = makeService();
    socialRepo.isBlockedEitherDirection.mockResolvedValue(false);
    notificationRepo.create.mockRejectedValue(new Error('db down'));
    jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(
      service.emit('target-1', 'message', 'actor-1', {
        conversationId: 'c1',
      }),
    ).resolves.toBeUndefined();
  });

  it('does not push to socket when env vars are not set', async () => {
    const { service, notificationRepo, socialRepo } = makeService();
    socialRepo.isBlockedEitherDirection.mockResolvedValue(false);
    notificationRepo.create.mockResolvedValue(persistedNotification);
    delete process.env.SOCKET_INTERNAL_URL;
    delete process.env.SOCKET_INTERNAL_SECRET;
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(null, { status: 200 }),
    );

    await service.emit('target-1', 'like', 'actor-1');

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('tolerates socket server being unavailable', async () => {
    const { service, notificationRepo, socialRepo } = makeService();
    socialRepo.isBlockedEitherDirection.mockResolvedValue(false);
    notificationRepo.create.mockResolvedValue(persistedNotification);
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('connection refused'));

    await expect(
      service.emit('target-1', 'like', 'actor-1'),
    ).resolves.toBeUndefined();
  });

  it('passes payload to create when provided', async () => {
    const { service, notificationRepo, socialRepo } = makeService();
    socialRepo.isBlockedEitherDirection.mockResolvedValue(false);
    notificationRepo.create.mockResolvedValue({
      ...persistedNotification,
      payload: { conversationId: 'conv-1' },
    });
    jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(null, { status: 200 }),
    );

    await service.emit('target-1', 'message', 'actor-1', {
      conversationId: 'conv-1',
    });

    expect(notificationRepo.create).toHaveBeenCalledWith(
      'target-1',
      'message',
      'actor-1',
      { conversationId: 'conv-1' },
    );
  });
});

describe('NotificationService.list', () => {
  it('delegates to the repository', async () => {
    const { service, notificationRepo } = makeService();
    const expected = [persistedNotification];
    notificationRepo.listByUser.mockResolvedValue(expected);

    const result = await service.list('u1', 'cursor-1', 10);

    expect(notificationRepo.listByUser).toHaveBeenCalledWith('u1', 'cursor-1', 10);
    expect(result).toBe(expected);
  });
});

describe('NotificationService.unreadCount', () => {
  it('delegates to the repository', async () => {
    const { service, notificationRepo } = makeService();
    notificationRepo.unreadCount.mockResolvedValue(5);

    const result = await service.unreadCount('u1');

    expect(notificationRepo.unreadCount).toHaveBeenCalledWith('u1');
    expect(result).toBe(5);
  });
});

describe('NotificationService.markRead', () => {
  it('calls markAllRead when ids is empty', async () => {
    const { service, notificationRepo } = makeService();

    await service.markRead('u1', []);

    expect(notificationRepo.markAllRead).toHaveBeenCalledWith('u1');
    expect(notificationRepo.markRead).not.toHaveBeenCalled();
  });

  it('calls markRead with ids when non-empty', async () => {
    const { service, notificationRepo } = makeService();

    await service.markRead('u1', ['n1', 'n2']);

    expect(notificationRepo.markRead).toHaveBeenCalledWith('u1', ['n1', 'n2']);
    expect(notificationRepo.markAllRead).not.toHaveBeenCalled();
  });
});
