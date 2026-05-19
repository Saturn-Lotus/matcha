import { BrowseQuerySchema } from '@/server/schemas';
import { ValidationError } from '@/lib/validator';

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
    expect(() =>
      BrowseQuerySchema.parse({ sortBy: 'nonsense' }),
    ).toThrow(ValidationError);
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
});
