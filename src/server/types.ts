import { User, UserProfile } from './schemas';

export type CreateUserInput = Omit<User, 'id' | 'createdAt' | 'updatedAt'>;

export type CreateUserProfile = Omit<
  UserProfile,
  | 'createdAt'
  | 'updatedAt'
  | 'isProfileComplete'
  | 'fameRating'
  | 'lastSeenAt'
  | 'isOnline'
>;

export type RegisterUserInput = {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
};

export type BrowseSuggestion = {
  id: string;
  username: string;
  firstName: string;
  age: number;
  distanceKm: number;
  fameRating: number;
  sharedTagCount: number;
  previewPictureUrl: string | null;
  photos: string[];
  isOnline: boolean;
  lastSeenAt: string | null;
  bio: string | null;
  tags: string[];
};

export type SuggestionFilters = {
  limit?: number;
};

export type SuggestionsResult = {
  items: BrowseSuggestion[];
};
