'use client';

import { useEffect, useState } from 'react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/app/components/ui/tabs';
import { Compass, Eye, Heart, Clock, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { cn, relativeTime } from '@/lib/utils';

interface SocialEntry {
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  viewedAt?: string;
  likedAt?: string;
}

function SocialCard({
  entry,
  type,
}: {
  entry: SocialEntry;
  type: 'view' | 'like';
}) {
  const timestamp = entry.viewedAt ?? entry.likedAt;
  const initials =
    `${entry.firstName?.[0] ?? ''}${entry.lastName?.[0] ?? ''}`.toUpperCase();

  return (
    <div className="group flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm border border-[#ffe4e6] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
      <div className="relative aspect-[3/4] bg-pink-50">
        {entry.avatarUrl ? (
          <Image
            src={entry.avatarUrl}
            alt={entry.firstName}
            fill
            unoptimized
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-pink-300">
            {initials}
          </div>
        )}
        <div
          className={cn(
            'absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center shadow-sm',
            type === 'like'
              ? 'bg-pink-500 text-white'
              : 'bg-white/90 text-gray-500',
          )}
        >
          {type === 'like' ? (
            <Heart className="w-3.5 h-3.5 fill-current" />
          ) : (
            <Eye className="w-3.5 h-3.5" />
          )}
        </div>
      </div>
      <div className="px-3 py-2.5 flex flex-col gap-0.5">
        <p className="text-sm font-semibold text-gray-800 truncate">
          {entry.firstName} {entry.lastName}
        </p>
        {timestamp && (
          <p className="text-xs text-gray-400 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {relativeTime(timestamp)}
          </p>
        )}
      </div>
    </div>
  );
}

function SocialGrid({
  userId,
  type,
}: {
  userId: string;
  type: 'view' | 'like';
}) {
  const [entries, setEntries] = useState<SocialEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const endpoint =
    type === 'view'
      ? `/api/users/${userId}/views`
      : `/api/users/${userId}/likes`;

  useEffect(() => {
    fetch(endpoint)
      .then((r) => r.json())
      .then((data) => setEntries(Array.isArray(data) ? data : []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [endpoint]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="aspect-[3/4] rounded-2xl bg-gray-100 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
        {type === 'view' ? (
          <Eye className="w-10 h-10" />
        ) : (
          <Heart className="w-10 h-10" />
        )}
        <p className="text-sm text-center max-w-[200px]">
          {type === 'view'
            ? 'No one has visited your profile yet'
            : "You haven't received any likes yet"}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {entries.map((entry, i) => (
        <SocialCard key={i} entry={entry} type={type} />
      ))}
    </div>
  );
}

function DiscoverPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center px-4">
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-100 to-green-100 flex items-center justify-center">
        <Sparkles className="w-9 h-9 text-pink-400" />
      </div>
      <div className="space-y-1.5">
        <h2 className="text-xl font-bold text-gray-800">
          Your suggestions will appear here
        </h2>
        <p className="text-sm text-gray-500 max-w-xs">
          Browse is coming soon — for now, check who&apos;s been visiting your
          profile.
        </p>
      </div>
    </div>
  );
}

function FilterSidebar() {
  return (
    <aside className="hidden md:flex flex-col gap-5 w-56 shrink-0 bg-white/70 backdrop-blur-md border-r border-gray-100 px-4 py-5 overflow-y-auto">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
          Sort by
        </p>
        <select className="w-full h-9 px-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white outline-none cursor-pointer focus:border-pink-300 focus:ring-2 focus:ring-pink-100">
          <option>Distance ↑</option>
          <option>Age</option>
          <option>Fame rating</option>
          <option>Shared interests</option>
        </select>
      </div>

      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
          Age range
        </p>
        <div className="space-y-1.5">
          <div className="h-1 rounded-full bg-gray-200 relative">
            <div
              className="absolute h-full rounded-full bg-gradient-to-r from-pink-400 to-green-400"
              style={{ left: '10%', width: '55%' }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>20</span>
            <span>34</span>
          </div>
        </div>
      </div>

      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
          Max distance
        </p>
        <div className="space-y-1.5">
          <div className="h-1 rounded-full bg-gray-200 relative">
            <div
              className="absolute h-full rounded-full bg-gradient-to-r from-pink-400 to-green-400"
              style={{ left: '0', width: '40%' }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>0 km</span>
            <span>50 km</span>
          </div>
        </div>
      </div>

      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
          Interests
        </p>
        <div className="flex flex-wrap gap-1.5">
          {['hiking', 'tea', 'vinyl', 'design', 'cats', 'baking'].map((t) => (
            <span
              key={t}
              className="px-2.5 py-1 rounded-full text-xs font-medium bg-pink-50 text-pink-700 cursor-pointer hover:bg-pink-100 transition-colors"
            >
              #{t}
            </span>
          ))}
        </div>
      </div>
    </aside>
  );
}

export function BrowseContent({ userId }: { userId: string }) {
  return (
    <Tabs defaultValue="discover" className="h-full">
      <div className="sticky top-0 z-10 bg-white/60 backdrop-blur-md border-b border-gray-100 px-4">
        <TabsList variant="line" className="w-full justify-start gap-1 h-12">
          <TabsTrigger value="discover" className="gap-1.5 px-3">
            <Compass className="w-4 h-4" />
            Discover
          </TabsTrigger>
          <TabsTrigger value="views" className="gap-1.5 px-3">
            <Eye className="w-4 h-4" />
            Views
          </TabsTrigger>
          <TabsTrigger value="likes" className="gap-1.5 px-3">
            <Heart className="w-4 h-4" />
            Likes
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="discover" className="mt-0">
        <div className="flex min-h-[calc(100vh-12rem)]">
          <FilterSidebar />
          <div className="flex-1">
            <DiscoverPlaceholder />
          </div>
        </div>
      </TabsContent>

      <TabsContent
        value="views"
        className="mt-0 p-4 md:p-6 max-w-4xl mx-auto w-full"
      >
        <div className="flex items-center gap-2 mb-5">
          <Eye className="w-5 h-5 text-gray-500" />
          <h2 className="text-lg font-bold text-gray-800">Who viewed me</h2>
        </div>
        <SocialGrid userId={userId} type="view" />
      </TabsContent>

      <TabsContent
        value="likes"
        className="mt-0 p-4 md:p-6 max-w-4xl mx-auto w-full"
      >
        <div className="flex items-center gap-2 mb-5">
          <Heart className="w-5 h-5 fill-current text-pink-500" />
          <h2 className="text-lg font-bold text-gray-800">Who liked me</h2>
        </div>
        <SocialGrid userId={userId} type="like" />
      </TabsContent>
    </Tabs>
  );
}
