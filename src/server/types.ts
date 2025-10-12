import { User, UserProfile } from './schemas';

export type CreateUserInput = Omit<
  User,
  | 'id'
  | 'createdAt'
  | 'updatedAt'
  | 'emailVerificationToken'
  | 'passwordResetToken'
>;

export type CreateUserProfile = Omit<UserProfile, 'createdAt' | 'updatedAt'>;
