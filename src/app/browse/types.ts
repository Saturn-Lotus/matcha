export interface BrowseProfile {
  id: string;
  username: string;
  firstName: string;
  fameRating: number;
  previewPictureUrl: string | null;
  photos: string[];
  isOnline: boolean;
  lastSeenAt: string | null;
  bio: string | null;
  tags: string[];
}
