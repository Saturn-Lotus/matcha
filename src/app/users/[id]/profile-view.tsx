'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Heart,
  MessageCircle,
  MoreVertical,
  User as UserIcon,
  ChevronLeft,
} from 'lucide-react';
import { cn, relativeTime } from '@/lib/utils';
import { Button } from '@/app/components/ui/button';
import { ProgressSegments } from '@/app/browse/components/progress-segments';
import { apiClient } from '@/lib/api';
import type { PublicProfile } from '@/server/types';

interface ProfileViewProps {
  id: string;
}

export function ProfileView({ id }: ProfileViewProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [photoIdx, setPhotoIdx] = useState(0);

  useEffect(() => {
    apiClient
      .get<PublicProfile>(`/users/${id}`)
      .then(setProfile)
      .catch(() => setNotFound(true));

    apiClient.post(`/users/${id}/views`);
  }, [id]);

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-center px-6">
        <UserIcon className="w-14 h-14 text-muted-foreground" />
        <p className="text-lg font-semibold">User not found</p>
        <p className="text-sm text-muted-foreground">
          This profile doesn&apos;t exist or may have been removed.
        </p>
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          Go back
        </Button>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
          <div className="h-4 w-32 rounded bg-muted animate-pulse" />
        </div>
        <div className="flex flex-col items-center gap-4 pt-10 px-6">
          <div className="w-24 h-24 rounded-full bg-muted animate-pulse" />
          <div className="h-5 w-40 rounded bg-muted animate-pulse" />
          <div className="h-4 w-24 rounded bg-muted animate-pulse" />
          <div className="flex gap-4 mt-2">
            <div className="w-12 h-12 rounded-full bg-muted animate-pulse" />
            <div className="w-12 h-12 rounded-full bg-muted animate-pulse" />
            <div className="w-12 h-12 rounded-full bg-muted animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  const photos = profile.pictures ?? [];
  const avatarSrc = profile.avatarUrl ?? photos[0] ?? null;

  const tapLeft = () =>
    setPhotoIdx((i) => (i - 1 + photos.length) % photos.length);
  const tapRight = () => setPhotoIdx((i) => (i + 1) % photos.length);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border sticky top-0 bg-background z-10">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-accent transition-colors"
          aria-label="Go back"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="font-semibold text-base truncate">
          {profile.firstName} {profile.lastName}
        </span>
      </div>

      <div className="flex flex-col items-center gap-3 pt-8 pb-6 px-6">
        <div className="relative w-24 h-24 rounded-full overflow-hidden bg-muted border-2 border-border">
          {avatarSrc ? (
            <Image
              src={avatarSrc}
              alt={profile.firstName}
              fill
              unoptimized
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <UserIcon className="w-10 h-10 text-muted-foreground" />
            </div>
          )}
        </div>

        <div className="flex flex-col items-center gap-1">
          <h1 className="text-xl font-bold">
            {profile.firstName} {profile.lastName}
          </h1>
          <p className="text-sm text-muted-foreground">@{profile.username}</p>
        </div>

        <div className="flex items-center gap-3 text-sm">
          {profile.isOnline ? (
            <span className="inline-flex items-center gap-1.5 text-emerald-500 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Online now
            </span>
          ) : profile.lastSeenAt ? (
            <span className="text-muted-foreground">
              Active {relativeTime(profile.lastSeenAt)}
            </span>
          ) : (
            <span className="text-muted-foreground">Recently active</span>
          )}
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <Heart className="w-3.5 h-3.5 text-primary fill-primary" />
            {Math.round(profile.fameRating)}
          </span>
        </div>

        <div className="flex items-center gap-6 mt-2">
          {(
            [
              { icon: Heart, label: 'Like', fill: true },
              { icon: MessageCircle, label: 'Message', fill: false },
              { icon: MoreVertical, label: 'More', fill: false },
            ] as const
          ).map(({ icon: Icon, label, fill }) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <button
                disabled
                aria-label={label}
                className="w-12 h-12 rounded-full flex items-center justify-center bg-white/[0.13] border border-border opacity-50 cursor-not-allowed transition-all"
              >
                <Icon
                  className={cn(
                    'w-6 h-6',
                    fill ? 'text-primary' : 'text-muted-foreground',
                  )}
                />
              </button>
              <span className="text-[11px] font-semibold text-muted-foreground drop-shadow">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-border" />

      <div className="flex flex-col gap-6 px-5 py-6">
        {photos.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Photos
            </h2>
            <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-muted">
              {photos.map((src, i) => (
                <div
                  key={i}
                  className={cn(
                    'absolute inset-0 transition-opacity duration-300',
                    i === photoIdx ? 'opacity-100' : 'opacity-0',
                  )}
                >
                  <Image
                    src={src}
                    alt=""
                    fill
                    unoptimized
                    className="object-cover"
                    priority={i === 0}
                  />
                </div>
              ))}
              {photos.length > 1 && (
                <>
                  <div
                    className="absolute z-10 inset-y-0 left-0 w-2/5 cursor-pointer"
                    onClick={tapLeft}
                  />
                  <div
                    className="absolute z-10 inset-y-0 right-0 w-2/5 cursor-pointer"
                    onClick={tapRight}
                  />
                  <ProgressSegments
                    total={photos.length}
                    activeIdx={photoIdx}
                    isActive={true}
                  />
                </>
              )}
            </div>
          </section>
        )}

        {profile.bio && (
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              About
            </h2>
            <p className="text-sm leading-relaxed">{profile.bio}</p>
          </section>
        )}

        {profile.interests && profile.interests.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Interests
            </h2>
            <div className="flex flex-wrap gap-2">
              {profile.interests.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center text-xs h-7 px-3 rounded-full bg-primary/10 text-primary font-medium"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </section>
        )}

        {(profile.gender || profile.sexualPreference) && (
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Identity
            </h2>
            <div className="flex flex-wrap gap-2">
              {profile.gender && (
                <span className="inline-flex items-center text-xs h-7 px-3 rounded-full border border-border text-foreground capitalize">
                  {profile.gender}
                </span>
              )}
              {profile.sexualPreference && (
                <span className="inline-flex items-center text-xs h-7 px-3 rounded-full border border-border text-foreground capitalize">
                  Interested in{' '}
                  {profile.sexualPreference === 'both'
                    ? 'everyone'
                    : profile.sexualPreference}
                </span>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
