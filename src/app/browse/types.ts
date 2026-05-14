export interface BrowseProfile {
  id: string;
  username: string;
  firstName: string;
  distanceKm: number | null;
  fameRating: number;
  previewPictureUrl: string | null;
  photos: string[];
  isOnline: boolean;
  lastSeenAt: string | null;
  bio: string | null;
  tags: string[];
}
