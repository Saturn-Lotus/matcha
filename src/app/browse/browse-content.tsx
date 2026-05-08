'use client';

import { Compass, Eye, Heart } from 'lucide-react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/app/components/ui/tabs';
import { DiscoverFeed } from './components/discover-feed';
import { SocialGrid } from './components/social-grid';

export function BrowseContent({ userId }: { userId: string }) {
  return (
    <Tabs defaultValue="discover" className="h-full flex flex-col">
      <TabsContent value="discover" className="mt-0 flex-1 min-h-0">
        <DiscoverFeed userId={userId} />
      </TabsContent>

      <TabsContent
        value="views"
        className="mt-0 flex-1 overflow-y-auto p-4 md:p-6 max-w-4xl mx-auto w-full"
      >
        <div className="flex items-center gap-2 mb-5">
          <Eye className="w-5 h-5 text-gray-500" />
          <h2 className="text-lg font-bold text-gray-800">Who viewed me</h2>
        </div>
        <SocialGrid userId={userId} type="view" />
      </TabsContent>

      <TabsContent
        value="likes"
        className="mt-0 flex-1 overflow-y-auto p-4 md:p-6 max-w-4xl mx-auto w-full"
      >
        <div className="flex items-center gap-2 mb-5">
          <Heart className="w-5 h-5 fill-current text-pink-500" />
          <h2 className="text-lg font-bold text-gray-800">Who liked me</h2>
        </div>
        <SocialGrid userId={userId} type="like" />
      </TabsContent>

      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
        <TabsList
          variant="default"
          className="pointer-events-auto shadow-lg bg-white/90 backdrop-blur border border-[#ffe4e6] rounded-full px-1.5 py-1 h-auto gap-1"
        >
          <TabsTrigger
            value="discover"
            className="rounded-full px-4 py-1.5 text-sm gap-1.5"
          >
            <Compass className="w-4 h-4" />
            Discover
          </TabsTrigger>
          <TabsTrigger
            value="views"
            className="rounded-full px-4 py-1.5 text-sm gap-1.5"
          >
            <Eye className="w-4 h-4" />
            Views
          </TabsTrigger>
          <TabsTrigger
            value="likes"
            className="rounded-full px-4 py-1.5 text-sm gap-1.5"
          >
            <Heart className="w-4 h-4" />
            Likes
          </TabsTrigger>
        </TabsList>
      </div>
    </Tabs>
  );
}
