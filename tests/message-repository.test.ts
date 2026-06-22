import { MessageRepository } from '@/server/repositories/message-repository';

describe('MessageRepository.markRead', () => {
  it('only marks the other party unread messages as read', async () => {
    const query = jest.fn().mockResolvedValue([{ id: 'm1' }, { id: 'm2' }]);
    const repo = new MessageRepository({ query } as never);

    const count = await repo.markRead('conv-1', 'reader-1');

    expect(count).toBe(2);
    const [sql, params] = query.mock.calls[0];
    expect(sql).toContain('SET "readAt" = NOW()');
    expect(sql).toContain('"senderId" <> $2');
    expect(sql).toContain('"readAt" IS NULL');
    expect(params).toEqual(['conv-1', 'reader-1']);
  });
});
