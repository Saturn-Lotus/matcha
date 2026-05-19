export interface BrowseProfile {
  id: string;
  username: string;
  firstName: string;
  age: number | null;
  distanceKm: number | null;
  fameRating: number;
  sharedTagCount?: number;
  previewPictureUrl: string | null;
  photos: string[];
  isOnline: boolean;
  lastSeenAt: string | null;
  bio: string | null;
  tags: string[];
}

export interface BrowseResponse {
  items: BrowseProfile[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
