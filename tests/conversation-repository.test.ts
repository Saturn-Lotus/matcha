import { ConversationRepository } from '@/server/repositories/conversation-repository';
import {
  cleanupCreatedUsers,
  createTestUser,
  describeIntegration,
  getDb,
  insertBlock,
} from './helpers/integration-db';

describe('ConversationRepository.findOrCreate', () => {
  it('upserts the canonical sorted pair and returns the row', async () => {
    const row = {
      id: 'c1',
      userIdA: 'a',
      userIdB: 'b',
      createdAt: new Date(),
    };
    const query = jest
      .fn()
      .mockResolvedValueOnce([]) // INSERT ... ON CONFLICT DO NOTHING
      .mockResolvedValueOnce([row]); // SELECT
    const repo = new ConversationRepository({ query } as never);

    const result = await repo.findOrCreate('b', 'a');

    expect(result).toBe(row);

    const insertSql = query.mock.calls[0][0] as string;
    expect(insertSql).toContain('LEAST($1::uuid, $2::uuid)');
    expect(insertSql).toContain('GREATEST($1::uuid, $2::uuid)');
    expect(insertSql).toContain(
      'ON CONFLICT ("userIdA", "userIdB") DO NOTHING',
    );

    const selectSql = query.mock.calls[1][0] as string;
    expect(selectSql).toContain('WHERE "userIdA" = LEAST($1::uuid, $2::uuid)');
    expect(selectSql).toContain('"userIdB" = GREATEST($1::uuid, $2::uuid)');
  });
});

describe('ConversationRepository.findByUser', () => {
  it('filters out pairs with a block in either direction', async () => {
    const query = jest.fn().mockResolvedValue([]);
    const repo = new ConversationRepository({ query } as never);

    await repo.findByUser('viewer');

    const sql = query.mock.calls[0][0] as string;
    expect(sql).toContain('NOT EXISTS');
    expect(sql).toContain(
      'ub."blockerUserId" = $1 AND ub."blockedUserId" = other."userId"',
    );
    expect(sql).toContain(
      'ub."blockerUserId" = other."userId" AND ub."blockedUserId" = $1',
    );
  });
});

describeIntegration('ConversationRepository.findByUser (integration)', () => {
  let repo: ConversationRepository;

  beforeAll(() => {
    repo = new ConversationRepository(getDb());
  });

  afterEach(async () => {
    await cleanupCreatedUsers();
  });

  it('lists a conversation between unblocked users', async () => {
    const viewer = await createTestUser();
    const other = await createTestUser();
    const conversation = await repo.findOrCreate(viewer, other);

    const rows = await repo.findByUser(viewer);

    expect(rows.map((r) => r.id)).toEqual([conversation.id]);
  });

  it.each([
    ['the viewer blocked the other user', true],
    ['the other user blocked the viewer', false],
  ])('hides the conversation when %s', async (_label, viewerIsBlocker) => {
    const viewer = await createTestUser();
    const other = await createTestUser();
    await repo.findOrCreate(viewer, other);
    if (viewerIsBlocker) await insertBlock(viewer, other);
    else await insertBlock(other, viewer);

    expect(await repo.findByUser(viewer)).toEqual([]);
    expect(await repo.findByUser(other)).toEqual([]);
  });
});
