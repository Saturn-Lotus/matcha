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

export type MatchEntry = {
  userId: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  matchedAt: string;
};

export type MessageDTO = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
  readAt: string | null;
};

export type MessagesPage = {
  items: MessageDTO[];
  nextCursor: string | null;
};

export type ConversationOtherUser = {
  userId: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
};

export type ConversationListItem = {
  id: string;
  otherUser: ConversationOtherUser;
  lastMessage: {
    body: string;
    createdAt: string;
    senderId: string;
  } | null;
  unreadCount: number;
  updatedAt: string;
};

export type ConversationMeta = {
  id: string;
  otherUser: ConversationOtherUser;
  connected: boolean;
};

export type SendMessageResult = {
  message: MessageDTO;
  recipientId: string;
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
  age: number | null;
  bio: string | null;
  gender: 'male' | 'female' | null;
  sexualPreference: 'male' | 'female' | 'both' | null;
  avatarUrl: string | null;
  interests: string[] | null;
  pictures: string[] | null;
  fameRating: number;
  likesCount: number;
  isOnline: boolean;
  lastSeenAt: string | null;
  distanceKm: number | null;
  city: string | null;
  memberSince: string | null;
  viewerLiked: boolean;
  targetLiked: boolean;
  targetViewedViewer: boolean;
  connected: boolean;
};
