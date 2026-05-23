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
  birthDate: string;
};

export type SortBy =
  | 'relevance'
  | 'sharedTagCount'
  | 'distance'
  | 'fameRating'
  | 'age';
export type SortDirection = 'asc' | 'desc';

export type BrowseSuggestion = {
  id: string;
  username: string;
  firstName: string;
  age: number;
  distanceKm: number | null;
  fameRating: number;
  sharedTagCount: number;
  previewPictureUrl: string | null;
  photos: string[];
  isOnline: boolean;
  lastSeenAt: string | null;
  bio: string | null;
  tags: string[];
  viewerLiked: boolean;
  targetLiked: boolean;
  targetViewedViewer: boolean;
  connected: boolean;
};

export type SuggestionsResult = {
  items: BrowseSuggestion[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

export type LikerEntry = {
  userId: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  likedAt: string;
};

export type ViewerEntry = {
  userId: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  viewedAt: string;
};

export type UserSearchResult = {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
};

export type PublicProfile = {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  bio: string | null;
  gender: 'male' | 'female' | null;
  sexualPreference: 'male' | 'female' | 'both' | null;
  avatarUrl: string | null;
  interests: string[] | null;
  pictures: string[] | null;
  fameRating: number;
  isOnline: boolean;
  lastSeenAt: string | null;
  viewerLiked: boolean;
  targetLiked: boolean;
  targetViewedViewer: boolean;
  connected: boolean;
};
