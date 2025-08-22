import { SuInfer, Su } from '../lib/validator';

export const UserSchema = Su.object({
  id: Su.string(),
  username: Su.string(),
  first_name: Su.string(),
  last_name: Su.string(),
  email: Su.string(),
  created_at: Su.optional(Su.date()),
  updated_at: Su.optional(Su.date()),
  password_hash: Su.string(),
  is_verified: Su.boolean(),
});

export type User = SuInfer<typeof UserSchema>;

export const UserProfileSchema = Su.object({
  user_id: Su.string(),
  bio: Su.string(),
  gender: Su.literal(['male', 'female']),
  sexual_preference: Su.literal(['male', 'female', 'both']),
  avatar_url: Su.string(),
  interests: Su.array(Su.string()),
  pictures: Su.array(Su.string()),
  created_at: Su.optional(Su.date()),
  updated_at: Su.optional(Su.date()),
});

export type UserProfile = SuInfer<typeof UserProfileSchema>;

export type UserWithProfile = Omit<User, 'password_hash'> &
  Omit<UserProfile, 'user_id' | 'created_at' | 'updated_at'>;
