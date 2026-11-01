import {
  BrowseQuerySchema,
  RegisterUserSchema,
  SearchPreferencesSchema,
} from '@/server/schemas';
import { ValidationError } from '@/lib/validator';
import { UserService } from '@/server/services/user';
import { UserRepository } from '@/server/repositories/user-repository';
import { IStorage } from '@/server/storage';

describe('RegisterUserSchema', () => {
  const validPayload = {
    username: 'alice42',
    email: 'alice@example.com',
    firstName: 'Alice',
    lastName: 'Liddell',
    password: 'StrongPass1!',
    birthDate: '1995-06-15',
  };

  it('accepts a valid payload that includes birthDate', () => {
    expect(() => RegisterUserSchema.parse(validPayload)).not.toThrow();
  });

  it('rejects a payload missing birthDate', () => {
    const { birthDate: _b, ...rest } = validPayload;
    void _b;
    expect(() => RegisterUserSchema.parse(rest)).toThrow(ValidationError);
  });
});

describe('BrowseQuerySchema', () => {
  it('accepts an empty object (all fields optional)', () => {
    expect(() => BrowseQuerySchema.parse({})).not.toThrow();
  });

  it('accepts a fully populated valid query', () => {
    expect(() =>
      BrowseQuerySchema.parse({
        page: 2,
        pageSize: 25,
        interests: ['music', 'hiking'],
        maxDistanceKm: 50,
        minFameRating: 10,
        maxFameRating: 90,
        age: 25,
        sortBy: 'fameRating',
        sortDirection: 'desc',
      }),
    ).not.toThrow();
  });

  it('rejects page < 1', () => {
    expect(() => BrowseQuerySchema.parse({ page: 0 })).toThrow(ValidationError);
  });

  it('rejects pageSize > 50', () => {
    expect(() => BrowseQuerySchema.parse({ pageSize: 51 })).toThrow(
      ValidationError,
    );
  });

  it('rejects unknown sortBy', () => {
    expect(() => BrowseQuerySchema.parse({ sortBy: 'nonsense' })).toThrow(
      ValidationError,
    );
  });

  it('accepts every supported sortBy value', () => {
    for (const value of [
      'relevance',
      'sharedTagCount',
      'distance',
      'fameRating',
      'age',
    ]) {
      expect(() => BrowseQuerySchema.parse({ sortBy: value })).not.toThrow();
    }
  });

  it('rejects negative minFameRating', () => {
    expect(() => BrowseQuerySchema.parse({ minFameRating: -1 })).toThrow(
      ValidationError,
    );
  });

  it('rejects non-numeric coerced values (string passed through)', () => {
    expect(() => BrowseQuerySchema.parse({ page: '2' })).toThrow(
      ValidationError,
    );
  });

  it('rejects interests with too many items', () => {
    const tooMany = Array.from({ length: 21 }, (_, i) => `tag${i}`);
    expect(() => BrowseQuerySchema.parse({ interests: tooMany })).toThrow(
      ValidationError,
    );
  });

  it('rejects unknown sortDirection', () => {
    expect(() =>
      BrowseQuerySchema.parse({ sortDirection: 'sideways' }),
    ).toThrow(ValidationError);
  });

  it('accepts a city filter', () => {
    expect(() => BrowseQuerySchema.parse({ city: 'Lyon' })).not.toThrow();
  });

  it('rejects a non-string city', () => {
    expect(() => BrowseQuerySchema.parse({ city: 42 })).toThrow(
      ValidationError,
    );
  });

  it('rejects a city longer than 100 characters', () => {
    expect(() => BrowseQuerySchema.parse({ city: 'a'.repeat(101) })).toThrow(
      ValidationError,
    );
  });
});

describe('SearchPreferencesSchema', () => {
  it('accepts a city, null, or an empty string for prefCity', () => {
    for (const prefCity of ['Paris', null, '']) {
      expect(() => SearchPreferencesSchema.parse({ prefCity })).not.toThrow();
    }
  });

  it('rejects a non-string prefCity', () => {
    expect(() => SearchPreferencesSchema.parse({ prefCity: 7 })).toThrow(
      ValidationError,
    );
  });
});

describe('UserService city handling', () => {
  const viewerProfile = { gender: 'female', sexualPreference: 'male' };

  function buildService(hasLocation: boolean) {
    const repository = {
      findProfileByUserId: jest.fn().mockResolvedValue(viewerProfile),
      userHasLocation: jest.fn().mockResolvedValue(hasLocation),
      getUsersWithProfiles: jest.fn().mockResolvedValue({ rows: [], total: 0 }),
      updateSearchPreferences: jest.fn().mockResolvedValue({}),
    };
    const service = new UserService(
      repository as unknown as UserRepository,
      {} as IStorage,
    );
    return { service, repository };
  }

  it('stores an empty or blank prefCity as unset', async () => {
    const { service, repository } = buildService(true);
    await service.updateSearchPreferences('viewer-id', { prefCity: '   ' });
    expect(repository.updateSearchPreferences).toHaveBeenCalledWith(
      'viewer-id',
      expect.objectContaining({ prefCity: null }),
    );
  });

  it('ignores an empty city filter when browsing', async () => {
    const { service, repository } = buildService(true);
    await service.getUsersWithProfiles('viewer-id', { city: '' });
    expect(repository.getUsersWithProfiles).toHaveBeenCalledWith(
      expect.objectContaining({ city: null }),
    );
  });

  it('passes a trimmed city filter through when browsing', async () => {
    const { service, repository } = buildService(true);
    await service.getUsersWithProfiles('viewer-id', { city: ' Paris ' });
    expect(repository.getUsersWithProfiles).toHaveBeenCalledWith(
      expect.objectContaining({ city: 'Paris' }),
    );
  });

  it('refuses suggestions when the viewer has no stored location', async () => {
    const { service, repository } = buildService(false);
    await expect(service.getUsersWithProfiles('viewer-id')).rejects.toThrow(
      ValidationError,
    );
    expect(repository.getUsersWithProfiles).not.toHaveBeenCalled();
  });
});
