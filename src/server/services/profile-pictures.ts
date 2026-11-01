import { ValidationError } from '@/lib/validator';

export function mergeProfilePictures(
  remaining: readonly string[],
  uploaded: readonly string[],
  max: number,
): string[] {
  const merged = [...remaining, ...uploaded];
  if (merged.length > max) {
    throw new ValidationError(`A profile can have at most ${max} pictures`);
  }
  return merged;
}
