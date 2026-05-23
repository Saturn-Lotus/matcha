'use client';

import { ActivityDrawer } from './components/activity-drawer';
import { DiscoverFeed } from './components/discover-feed';

export function BrowseContent({ userId }: { userId: string }) {
  return (
    <div className="relative h-full flex flex-col">
      <DiscoverFeed userId={userId} />
      <ActivityDrawer userId={userId} />
    </div>
  );
}
