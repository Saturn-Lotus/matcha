'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';
import { Eye, Heart } from 'lucide-react';
import Image from 'next/image';

interface SocialUser {
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  viewedAt?: string;
  likedAt?: string;
}

function Avatar({ user }: { user: SocialUser }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
      <div className="relative w-10 h-10 rounded-full overflow-hidden bg-pink-100 flex-shrink-0">
        {user.avatarUrl ? (
          <Image
            src={user.avatarUrl}
            alt={user.firstName}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-pink-400 font-bold text-sm">
            {user.firstName?.[0]?.toUpperCase()}
          </div>
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-800">
          {user.firstName} {user.lastName}
        </p>
        <p className="text-xs text-gray-400">
          {user.viewedAt
            ? new Date(user.viewedAt).toLocaleDateString()
            : user.likedAt
              ? new Date(user.likedAt).toLocaleDateString()
              : ''}
        </p>
      </div>
    </div>
  );
}

function SocialList({
  title,
  icon,
  endpoint,
  emptyMessage,
}: {
  title: string;
  icon: React.ReactNode;
  endpoint: string;
  emptyMessage: string;
}) {
  const [users, setUsers] = useState<SocialUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(endpoint)
      .then((r) => r.json())
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, [endpoint]);

  return (
    <Card className="glass-effect border-0 shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          {icon}
          {title}
          {!loading && (
            <span className="ml-auto text-sm font-normal text-gray-400">
              {users.length}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-12 rounded-lg bg-gray-100 animate-pulse"
              />
            ))}
          </div>
        ) : users.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">
            {emptyMessage}
          </p>
        ) : (
          <div className="max-h-56 overflow-y-auto">
            {users.map((u, i) => (
              <Avatar key={i} user={u} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function SocialPanels({ userId }: { userId: string }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <SocialList
        title="Who viewed me"
        icon={<Eye className="w-5 h-5 text-pink-500" />}
        endpoint={`/api/users/${userId}/views`}
        emptyMessage="No profile views yet"
      />
      <SocialList
        title="Who liked me"
        icon={<Heart className="w-5 h-5 text-pink-500" />}
        endpoint={`/api/users/${userId}/likes`}
        emptyMessage="No likes yet"
      />
    </div>
  );
}
