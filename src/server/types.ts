import { User, UserProfile } from './schemas';

export type CreateUserInput = Omit<User, 'id' | 'createdAt' | 'updatedAt'>;

export type CreateUserProfile = Omit<
  UserProfile,
  'createdAt' | 'updatedAt' | 'isProfileComplete' | 'fameRating' | 'lastSeenAt' | 'isOnline'
>;

export type RegisterUserInput = {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
};
