'use client';

import { ActivityDrawer } from './components/activity-drawer';
import { DiscoverFeed } from './components/discover-feed';

interface BrowseContentProps {
  userId: string;
  viewerHasAvatar: boolean;
}

export function BrowseContent({ userId, viewerHasAvatar }: BrowseContentProps) {
  return (
    <div className="relative h-full flex flex-col">
      <DiscoverFeed userId={userId} viewerHasAvatar={viewerHasAvatar} />
      <ActivityDrawer userId={userId} />
    </div>
  );
}
