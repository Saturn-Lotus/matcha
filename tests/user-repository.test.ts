import { UserRepository } from '@/server/repositories/user-repository';

describe('UserRepository.getUsersWithProfiles', () => {
  it('filters selected interests as an all-tags match', async () => {
    const query = jest.fn().mockResolvedValue([]);
    const repository = new UserRepository({ query } as any);

    await repository.getUsersWithProfiles({
      viewerId: 'viewer-id',
      viewerGender: 'female',
      allowedGenders: ['male'],
      page: 2,
      pageSize: 20,
      interests: ['music', 'hiking'],
      maxDistanceKm: 50,
      minFameRating: 10,
      maxFameRating: 90,
      age: 35,
      minAge: 25,
      sortBy: 'relevance',
      sortDirection: 'asc',
    });

    expect(query).toHaveBeenCalledTimes(1);
    const [sql, params] = query.mock.calls[0];

    expect(sql).toContain(
      "$4::TEXT[] <@ COALESCE(interests, '{}'::TEXT[])",
    );
    expect(sql).not.toContain('interests && $4::TEXT[]');
    expect(params).toEqual([
      'viewer-id',
      ['male'],
      'female',
      ['music', 'hiking'],
      50,
      10,
      90,
      35,
      25,
      20,
      20,
    ]);
  });
});
