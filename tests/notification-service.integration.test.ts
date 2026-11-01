// Functional integration tests for NotificationService — verify end-to-end
// behavior (block suppression, profile_view dedupe, error tolerance, push
// payload) against a real Postgres. The socket-server push is stubbed via a
// fetch spy so we can assert what the service sent without needing the socket
// process to be running.
//
// Run with:  INTEGRATION_TESTS=1 DATABASE_URL=postgres://... bun x jest

import { NotificationRepository } from '@/server/repositories/notification-repository';
import { SocialRepository } from '@/server/repositories/social-repository';
import { NotificationService } from '@/server/services/notification';
import {
  cleanupCreatedUsers,
  createTestUser,
  describeIntegration,
  getDb,
  insertBlock,
} from './helpers/integration-db';

describeIntegration('NotificationService (integration)', () => {
  const SOCKET_URL = 'http://localhost:4001';
  const SECRET = 'test-secret';

  let repo: NotificationRepository;
  let service: NotificationService;

  beforeAll(() => {
    const db = getDb();
    repo = new NotificationRepository(db);
    service = new NotificationService(repo, new SocialRepository(db));
  });

  beforeEach(() => {
    process.env.SOCKET_INTERNAL_URL = SOCKET_URL;
    process.env.SOCKET_INTERNAL_SECRET = SECRET;
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await cleanupCreatedUsers();
  });

  it('emit inserts a row and posts to /notify with the recipient userId', async () => {
    const target = await createTestUser({ firstName: 'Rec' });
    const actor = await createTestUser({ firstName: 'Ally' });
    const fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(new Response(null, { status: 200 }));

    await service.emit(target, 'like', actor);
    // The push is fire-and-forget — flush the microtask queue so the fetch
    // spy sees the call before we assert.
    await new Promise((r) => setImmediate(r));

    const stored = await repo.listByUser(target, null, 20);
    expect(stored).toHaveLength(1);
    expect(stored[0]!.type).toBe('like');
    expect(stored[0]!.actorId).toBe(actor);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(url).toBe(`${SOCKET_URL}/notify`);
    const body = JSON.parse(init!.body as string);
    expect(body.secret).toBe(SECRET);
    expect(body.userId).toBe(target);
    expect(body.notification.id).toBe(stored[0]!.id);
  });

  it('does not create a row when either direction is blocked', async () => {
    const target = await createTestUser();
    const actor = await createTestUser();
    await insertBlock(target, actor);
    const fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(new Response(null, { status: 200 }));

    await service.emit(target, 'like', actor);

    expect(await repo.listByUser(target, null, 20)).toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('dedupes profile_view within the 24h window — a second emit is skipped', async () => {
    const target = await createTestUser();
    const actor = await createTestUser();
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(new Response(null, { status: 200 }));

    await service.emit(target, 'profile_view', actor);
    await service.emit(target, 'profile_view', actor);

    const rows = await repo.listByUser(target, null, 20);
    expect(rows).toHaveLength(1);
  });

  it('never throws when the socket server is unreachable — caller flow is protected', async () => {
    const target = await createTestUser();
    const actor = await createTestUser();
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('ECONNREFUSED'));

    await expect(service.emit(target, 'like', actor)).resolves.toBeUndefined();

    // Row still persists — offline flush will deliver it on next connect.
    expect(await repo.listByUser(target, null, 20)).toHaveLength(1);
  });

  it('markRead with empty ids marks every unread row for that user', async () => {
    const target = await createTestUser();
    const actor = await createTestUser();
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(new Response(null, { status: 200 }));
    await service.emit(target, 'like', actor);
    await service.emit(target, 'match', actor);

    await service.markRead(target, []);

    expect(await service.unreadCount(target)).toBe(0);
  });

  it('markRead with explicit ids only affects those rows', async () => {
    const target = await createTestUser();
    const actor = await createTestUser();
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(new Response(null, { status: 200 }));
    await service.emit(target, 'like', actor);
    await service.emit(target, 'match', actor);
    const list = await service.list(target, null, 20);

    await service.markRead(target, [list[0]!.id]);

    expect(await service.unreadCount(target)).toBe(1);
  });

  it('unlike mutes the unliked user toward the unliker only; a new like unmutes', async () => {
    const unliker = await createTestUser();
    const unliked = await createTestUser();
    const social = new SocialRepository(getDb());
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(new Response(null, { status: 200 }));

    await social.likeUser(unliker, unliked);
    await social.unlikeUser(unliker, unliked);
    await service.emit(unliker, 'profile_view', unliked);
    await service.emit(unliked, 'profile_view', unliker);

    expect(await repo.listByUser(unliker, null, 20)).toHaveLength(0);
    expect(await repo.listByUser(unliked, null, 20)).toHaveLength(1);

    await social.likeUser(unliker, unliked);
    await service.emit(unliker, 'like', unliked);

    expect(await repo.listByUser(unliker, null, 20)).toHaveLength(1);
  });
});
