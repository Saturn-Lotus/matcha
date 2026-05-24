'use client';

import { useEffect, useRef, useState } from 'react';
import { Heart, User as UserIcon, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { cn, relativeTime } from '@/lib/utils';
import { ProgressSegments } from './progress-segments';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/app/components/ui/tooltip';
import {
  RelationBadge,
  pickRelationVariant,
} from '@/app/components/ui/relation-badge';
import type { BrowseProfile } from '../types';

const getPhotosListFromProfile = (profile: BrowseProfile) => {
  const hasPhotos = profile.photos.length > 0;
  if (hasPhotos) return profile.photos;
  if (profile.previewPictureUrl) return [profile.previewPictureUrl];
  return [];
};

interface FeedCardProps {
  profile: BrowseProfile;
  isActive: boolean;
  isLiked: boolean;
  framed: boolean;
  viewerInterests: string[];
  viewerHasAvatar: boolean;
  onLike: (id: string) => void;
  onPass: (id: string) => void;
  onPhotoView?: (id: string) => void;
}

export function FeedCard({
  profile,
  isActive,
  isLiked,
  framed,
  viewerInterests,
  viewerHasAvatar,
  onLike,
  onPass,
  onPhotoView,
}: FeedCardProps) {
  const photos = getPhotosListFromProfile(profile);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [burst, setBurst] = useState(0);
  const viewFiredRef = useRef(false);

  useEffect(() => {
    if (isActive) return;
    const id = setTimeout(() => setPhotoIdx(0), 0);
    return () => clearTimeout(id);
  }, [isActive]);

  useEffect(() => {
    if (!isActive || photos.length <= 1) return;
    const t = setTimeout(
      () => setPhotoIdx((i) => (i + 1) % photos.length),
      4000,
    );
    return () => clearTimeout(t);
  }, [isActive, photoIdx, photos.length]);

  useEffect(() => {
    if (!isActive || viewFiredRef.current) return;
    if (photoIdx >= 1) {
      viewFiredRef.current = true;
      onPhotoView?.(profile.id);
    }
  }, [isActive, photoIdx, onPhotoView, profile.id]);

  const tapLeft = () =>
    setPhotoIdx((i) => (i - 1 + photos.length) % photos.length);
  const tapRight = () => setPhotoIdx((i) => (i + 1) % photos.length);

  const likeDisabled = !viewerHasAvatar && !isLiked;
  const relationVariant = pickRelationVariant({
    connected: profile.connected,
    targetLiked: profile.targetLiked,
    targetViewedViewer: profile.targetViewedViewer,
  });

  const handleLike = () => {
    onLike(profile.id);
    if (!isLiked && !likeDisabled) setBurst((n) => n + 1);
  };

  const tags = profile.tags.slice(0, 5);

  return (
    <div
      className={cn(
        'relative overflow-hidden bg-zinc-900 w-full h-full',
        framed && 'rounded-[18px] shadow-2xl',
      )}
    >
      <div className="absolute inset-0 bg-black">
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
        {photos.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <UserIcon className="w-20 h-20 text-zinc-600" />
          </div>
        )}
      </div>

      {photos.length > 1 && (
        <>
          <div
            className="absolute z-10 cursor-pointer"
            style={{ top: 60, bottom: 200, left: 0, width: '40%' }}
            onClick={tapLeft}
          />
          <div
            className="absolute z-10 cursor-pointer"
            style={{ top: 60, bottom: 200, right: 0, width: '40%' }}
            onClick={tapRight}
          />
          <ProgressSegments
            total={photos.length}
            activeIdx={photoIdx}
            isActive={isActive}
          />
        </>
      )}

      <div className="absolute top-6 left-3 right-3 flex justify-between items-center z-10 pointer-events-none">
        <div className="flex items-center gap-1.5 pointer-events-auto">
          {relationVariant && <RelationBadge variant={relationVariant} />}
        </div>
        <span className="inline-flex items-center gap-1.5 bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-semibold text-white pointer-events-auto">
          <Heart className="w-3 h-3 text-pink-400 fill-current" />
          For you
        </span>
      </div>

      <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none z-[2]" />

      <div className="absolute left-4 right-[88px] bottom-24 z-[3] flex flex-col gap-2">
        <div className="flex items-center gap-2.5 flex-wrap text-xs text-white/85">
          {profile.isOnline ? (
            <span className="inline-flex items-center gap-1.5">
              <span className="w-[7px] h-[7px] rounded-full bg-emerald-400 shadow-[0_0_0_2px_rgba(74,222,128,0.3)]" />
              Online now
            </span>
          ) : (
            <span>
              {profile.lastSeenAt
                ? `Active ${relativeTime(profile.lastSeenAt)}`
                : 'Recently active'}
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <Heart className="w-[13px] h-[13px] text-pink-300 fill-current" />
            {Math.round(profile.fameRating)}
          </span>
        </div>

        <span className="text-[22px] font-bold text-white leading-tight">
          {profile.firstName}
        </span>

        {profile.bio && (
          <p className="text-[13px] leading-snug text-white/90 line-clamp-2">
            {profile.bio}
          </p>
        )}

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.map((tag) => {
              const matched = viewerInterests.includes(tag);
              return (
                <span
                  key={tag}
                  className={cn(
                    'inline-flex items-center text-[11px] h-[22px] px-2.5 rounded-full font-medium',
                    matched
                      ? 'bg-primary/80 border border-primary text-white'
                      : 'bg-white/18 backdrop-blur border border-white/20 text-white',
                  )}
                >
                  #{tag}
                </span>
              );
            })}
          </div>
        )}
      </div>

      <div className="absolute right-2 bottom-24 z-20 flex flex-col items-center gap-4">
        <Link
          href={`/users/${profile.id}`}
          aria-label={`View ${profile.firstName}'s profile`}
          className="relative w-11 h-11 rounded-full border-2 border-white overflow-hidden mb-1 block"
        >
          {photos[0] ? (
            <Image
              src={photos[0]}
              alt=""
              fill
              unoptimized
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-zinc-700 flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-white/60" />
            </div>
          )}
        </Link>

        <div className="flex flex-col items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleLike}
                aria-label={isLiked ? 'Unlike' : 'Like'}
                aria-disabled={likeDisabled || undefined}
                className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center transition-all duration-150 border-0',
                  isLiked
                    ? 'bg-gradient-to-br from-pink-600 to-pink-400 cursor-pointer'
                    : likeDisabled
                      ? 'bg-white/[0.13] backdrop-blur opacity-60 cursor-not-allowed'
                      : 'bg-white/[0.13] backdrop-blur hover:bg-white/20 cursor-pointer',
                )}
              >
                <Heart
                  className={cn(
                    'w-6 h-6 transition-transform',
                    isLiked ? 'fill-white text-white scale-110' : 'text-white',
                  )}
                />
              </button>
            </TooltipTrigger>
            {likeDisabled && (
              <TooltipContent side="left">
                Add a profile picture to like
              </TooltipContent>
            )}
          </Tooltip>
          <span className="text-[11px] font-semibold text-white drop-shadow">
            {Math.round(
              profile.fameRating + (isLiked ? 1 : 0),
            ).toLocaleString()}
          </span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPass(profile.id);
            }}
            aria-label="Pass"
            className="w-12 h-12 rounded-full flex items-center justify-center bg-white/[0.13] backdrop-blur hover:bg-red-400/40 transition-all border-0 cursor-pointer"
          >
            <X className="w-[22px] h-[22px] text-white" />
          </button>
          <span className="text-[11px] font-semibold text-white drop-shadow">
            Pass
          </span>
        </div>
      </div>

      {burst > 0 && (
        <div
          key={burst}
          className="absolute left-1/2 top-1/2 z-[6] pointer-events-none animate-like-burst text-pink-400"
        >
          <Heart className="w-[120px] h-[120px] fill-current drop-shadow-[0_6px_16px_rgba(244,114,182,0.6)]" />
        </div>
      )}
    </div>
  );
}
