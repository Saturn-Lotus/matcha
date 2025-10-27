import { GENDERS, MAX_FILE_SIZE, SEXUAL_PREFERENCES } from '@/server/config';
import { SuInfer, Su } from '@/lib/validator';

// ***********************************
// *     DB Schema and Types
// ***********************************
const UserTokenTypes = ['emailVerification', 'passwordReset'] as const;

export const UserSchema = Su.object({
  id: Su.string(),
  username: Su.string(),
  email: Su.string(),
  pendingEmail: Su.null(Su.string()),
  createdAt: Su.date(),
  updatedAt: Su.date(),
  passwordHash: Su.string(),
  isVerified: Su.boolean(),
});
export type User = SuInfer<typeof UserSchema>;

export const UserTokensSchema = Su.object({
  userId: Su.string(),
  tokenHash: Su.string(),
  tokenType: Su.literal(UserTokenTypes),
  tokenExpiry: Su.date(),
  createdAt: Su.optional(Su.date()),
});
export type UserToken = SuInfer<typeof UserTokensSchema>;

export const UserProfileSchema = Su.object({
  userId: Su.string(),
  firstName: Su.string(),
  lastName: Su.string(),
  bio: Su.null(Su.string()),
  gender: Su.null(Su.literal(GENDERS)),
  sexualPreference: Su.null(Su.literal(SEXUAL_PREFERENCES)),
  avatarUrl: Su.null(Su.string()),
  interests: Su.null(Su.array(Su.string())),
  pictures: Su.null(Su.array(Su.string())),
  createdAt: Su.optional(Su.date()),
  updatedAt: Su.optional(Su.date()),
});

export type UserProfile = SuInfer<typeof UserProfileSchema>;

// ***********************************
// *     Input validation schemas and types
// ***********************************

export const CreateUserProfileSchema = Su.object({
  gender: Su.literal(GENDERS),
  sexualPreference: Su.literal(SEXUAL_PREFERENCES),
  bio: Su.string(),
  interests: Su.array(Su.string()),
  avatar: Su.string(),
  pictures: Su.array(Su.file().image().sizeMax(MAX_FILE_SIZE)),
});

export type CreateUserProfile = SuInfer<typeof CreateUserProfileSchema>;
