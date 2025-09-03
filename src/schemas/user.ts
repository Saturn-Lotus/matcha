import { SuInfer, Su } from '../lib/validator';

export const UserSchema = Su.object({
  id: Su.string(),
  username: Su.string(),
  firstName: Su.string(),
  lastName: Su.string(),
  email: Su.string(),
  createdAt: Su.optional(Su.date()),
  updatedAt: Su.optional(Su.date()),
  passwordHash: Su.string(),
  isVerified: Su.boolean(),
  emailVerificationToken: Su.optional(Su.null(Su.string())),
  passwordResetToken: Su.optional(Su.null(Su.string())),
});

export type User = SuInfer<typeof UserSchema>;

export const UserProfileSchema = Su.object({
  userId: Su.string(),
  bio: Su.string(),
  gender: Su.literal(['male', 'female']),
  sexualPreference: Su.literal(['male', 'female', 'both']),
  avatarUrl: Su.string(),
  interests: Su.array(Su.string()),
  pictures: Su.array(Su.string()),
  createdAt: Su.optional(Su.date()),
  updatedAt: Su.optional(Su.date()),
});

export type UserProfile = SuInfer<typeof UserProfileSchema>;

export type UserWithProfile = Omit<
  User,
  'passwordHash' | 'emailVerificationToken' | 'passwordResetToken'
> &
  Omit<UserProfile, 'userId' | 'createdAt' | 'updatedAt'>;
