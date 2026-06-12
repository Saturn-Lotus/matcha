import { ConversationRepository } from '@/server/repositories/conversation-repository';

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
