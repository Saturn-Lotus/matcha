export interface BrowseProfile {
  id: string;
  username: string;
  firstName: string;
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
}
