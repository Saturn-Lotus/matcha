import { mergeProfilePictures } from '@/server/services/profile-pictures';
import { MAX_PROFILE_PICTURES } from '@/server/config';
import { ValidationError } from '@/lib/validator';

const keys = (prefix: string, count: number) =>
  Array.from({ length: count }, (_, i) => `${prefix}-${i}`);

describe('mergeProfilePictures', () => {
  it('appends uploads after kept pictures when within the cap', () => {
    const kept = keys('kept', 3);
    const uploaded = keys('new', 2);

    expect(mergeProfilePictures(kept, uploaded, MAX_PROFILE_PICTURES)).toEqual([
      ...kept,
      ...uploaded,
    ]);
  });

  it('rejects a merge that exceeds the cap', () => {
    expect(() =>
      mergeProfilePictures(
        keys('kept', 3),
        keys('new', 3),
        MAX_PROFILE_PICTURES,
      ),
    ).toThrow(ValidationError);
  });

  it('keeps a full gallery when nothing is uploaded', () => {
    const kept = keys('kept', MAX_PROFILE_PICTURES);

    expect(mergeProfilePictures(kept, [], MAX_PROFILE_PICTURES)).toEqual(kept);
  });
});
