import {
  Gender,
  genderValues,
  Interests,
  SexualPreference,
  User,
  UserProfile,
} from '@/app/types';

const isNotNullObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isArrayofStrings = (value: unknown): value is string[] => {
  return (
    Array.isArray(value) && value.every((item) => typeof item === 'string')
  );
};

const hasAlienProperties = (
  value: Record<string, unknown>,
  allowedProperties: string[],
): boolean => {
  return Object.keys(value).some((key) => !allowedProperties.includes(key));
};

export function isUser(value: unknown): value is User {
  if (!isNotNullObject(value)) {
    return false;
  }

  if (
    hasAlienProperties(value, [
      'id',
      'username',
      'first_name',
      'last_name',
      'email',
      'password_hash',
      'is_verified',
      'created_at',
      'updated_at',
    ])
  ) {
    return false;
  }

  const user = value as User;
  return (
    typeof user.id === 'string' &&
    typeof user.username === 'string' &&
    typeof user.first_name === 'string' &&
    typeof user.last_name === 'string' &&
    typeof user.email === 'string' &&
    (user.created_at === undefined || user.created_at instanceof Date) &&
    (user.updated_at === undefined || user.updated_at instanceof Date) &&
    typeof user.password_hash === 'string' &&
    typeof user.is_verified === 'boolean'
  );
}

export function isGender(value: unknown): value is Gender {
  return (
    typeof value === 'string' &&
    (genderValues as readonly string[]).includes(value)
  );
}

export function isSexualPreference(value: unknown): value is SexualPreference {
  return (
    typeof value === 'string' &&
    ((genderValues as readonly string[]).includes(value) || value === 'both')
  );
}

export function isInterests(value: unknown): value is Interests {
  return isArrayofStrings(value);
}

export function isUserProfile(value: unknown): value is UserProfile {
  if (!isNotNullObject(value)) {
    return false;
  }

  if (
    hasAlienProperties(value, [
      'user_id',
      'bio',
      'gender',
      'sexual_preference',
      'avatar_url',
      'interests',
      'pictures',
      'created_at',
      'updated_at',
    ])
  ) {
    return false;
  }

  const profile = value as UserProfile;
  return (
    typeof profile.user_id === 'string' &&
    typeof profile.bio === 'string' &&
    isGender(profile.gender) &&
    isSexualPreference(profile.sexual_preference) &&
    typeof profile.avatar_url === 'string' &&
    isInterests(profile.interests) &&
    isArrayofStrings(profile.pictures) &&
    (profile.created_at === undefined || profile.created_at instanceof Date) &&
    (profile.updated_at === undefined || profile.updated_at instanceof Date)
  );
}
