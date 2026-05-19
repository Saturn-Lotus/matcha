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

export type SortBy = 'sharedTagCount' | 'distance' | 'fameRating' | 'age';
export type SortDirection = 'asc' | 'desc';

export type BrowseSuggestion = {
  id: string;
  username: string;
  firstName: string;
  age: number | null;
  distanceKm: number | null;
  fameRating: number;
  sharedTagCount: number;
  previewPictureUrl: string | null;
  photos: string[];
  isOnline: boolean;
  lastSeenAt: string | null;
  bio: string | null;
  tags: string[];
};

export type SuggestionsResult = {
  items: BrowseSuggestion[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};
