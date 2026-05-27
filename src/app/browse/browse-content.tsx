'use client';

import { ActivityDrawer } from './components/activity-drawer';
import { DiscoverFeed } from './components/discover-feed';
import type { StoredSearchPreferences } from '@/server/schemas';

interface BrowseContentProps {
  userId: string;
  viewerHasAvatar: boolean;
  searchPreferences: StoredSearchPreferences;
}

export function BrowseContent({
  userId,
  viewerHasAvatar,
  searchPreferences,
}: BrowseContentProps) {
  return (
    <div className="relative h-full flex flex-col">
      <DiscoverFeed
        userId={userId}
        viewerHasAvatar={viewerHasAvatar}
        searchPreferences={searchPreferences}
      />
      <ActivityDrawer userId={userId} />
    </div>
  );
}
