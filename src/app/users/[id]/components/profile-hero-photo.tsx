'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  MapPin,
  User as UserIcon,
} from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/app/components/ui/carousel';
import {
  RelationBadge,
  type RelationBadgeVariant,
} from '@/app/components/ui/relation-badge';
import { cn, formatDistanceKmShort, relativeTime } from '@/lib/utils';

interface ProfileHeroPhotoProps {
  photos: string[];
  firstName: string;
  lastName: string;
  age: number | null;
  genderLabel: string | null;
  orientationLabel: string | null;
  fameRating: number;
  isOnline: boolean;
  lastSeenAt: string | null;
  city: string | null;
  distanceKm: number | null;
  relationVariant: RelationBadgeVariant | null;
}

export function ProfileHeroPhoto({
  photos,
  firstName,
  lastName,
  age,
  genderLabel,
  orientationLabel,
  fameRating,
  isOnline,
  lastSeenAt,
  city,
  distanceKm,
  relationVariant,
}: ProfileHeroPhotoProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const hasPhotos = photos.length > 0;
  const items = hasPhotos ? photos : [null];

  useEffect(() => {
    if (!api) return;
    const sync = () => setCurrent(api.selectedScrollSnap());
    api.on('select', sync);
    api.on('reInit', sync);
    return () => {
      api.off('select', sync);
      api.off('reInit', sync);
    };
  }, [api]);

  const distanceShort = formatDistanceKmShort(distanceKm);
  const locationChipText = [city, distanceShort].filter(Boolean).join(' · ');
  const showLocationChip = Boolean(city || distanceShort);

  return (
    <div className="relative w-full aspect-[5/4] max-h-[38vh] bg-zinc-900 overflow-hidden">
      <Carousel
        setApi={setApi}
        opts={{ loop: items.length > 1 }}
        className="absolute inset-0"
      >
        <CarouselContent className="ml-0 h-full">
          {items.map((src, i) => (
            <CarouselItem key={i} className="pl-0 relative basis-full h-full">
              <div className="relative w-full h-full aspect-[5/4] max-h-[38vh]">
                {src ? (
                  <Image
                    src={src}
                    alt={`${firstName}'s photo`}
                    fill
                    unoptimized
                    priority={i === 0}
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-zinc-700 to-zinc-900">
                    <UserIcon className="w-20 h-20 text-white/30" />
                  </div>
                )}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {items.length > 1 && (
        <div className="absolute top-3 left-3 right-3 z-10 flex gap-1.5 pointer-events-none">
          {items.map((_, i) => (
            <button
              key={i}
              aria-label={`Show photo ${i + 1}`}
              onClick={() => api?.scrollTo(i)}
              className={cn(
                'flex-1 h-[3px] rounded-full transition-colors pointer-events-auto cursor-pointer',
                i === current ? 'bg-white' : 'bg-white/35 hover:bg-white/55',
              )}
            />
          ))}
        </div>
      )}

      <div className="absolute top-7 left-3 right-3 z-10 flex justify-between items-start gap-2 pointer-events-none">
        <div className="flex flex-wrap items-center gap-2 pointer-events-auto">
          {isOnline ? (
            <span className="inline-flex items-center gap-1.5 bg-white/95 text-emerald-700 text-[11px] font-semibold pl-2 pr-3 h-7 rounded-full shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_0_2px_rgba(16,185,129,0.25)]" />
              Online now
            </span>
          ) : lastSeenAt ? (
            <span className="inline-flex items-center gap-1.5 bg-white/95 text-foreground/80 text-[11px] font-semibold px-2.5 h-7 rounded-full shadow-sm">
              Active {relativeTime(lastSeenAt)}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-2 pointer-events-auto">
          {showLocationChip && (
            <span className="inline-flex items-center gap-1 bg-white/95 text-foreground/80 text-[11px] font-semibold px-2.5 h-7 rounded-full shadow-sm">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              {locationChipText}
            </span>
          )}
          {relationVariant && <RelationBadge variant={relationVariant} />}
        </div>
      </div>

      {items.length > 1 && (
        <>
          <button
            onClick={() => api?.scrollPrev()}
            aria-label="Previous photo"
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white/15 hover:bg-white/35 text-white flex items-center justify-center backdrop-blur transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => api?.scrollNext()}
            aria-label="Next photo"
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white/15 hover:bg-white/35 text-white flex items-center justify-center backdrop-blur transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none z-[2]" />

      <div className="absolute left-5 right-5 bottom-5 z-[3] text-white flex flex-col gap-1.5">
        <h1 className="text-3xl sm:text-[34px] font-extrabold leading-tight tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)]">
          {firstName} {lastName}
          {age !== null && (
            <span className="font-semibold text-white/90"> · {age}</span>
          )}
        </h1>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-white/90">
          {genderLabel && <span>{genderLabel}</span>}
          {genderLabel && orientationLabel && (
            <span className="w-[3px] h-[3px] rounded-full bg-white/70" />
          )}
          {orientationLabel && <span>{orientationLabel}</span>}
          {(genderLabel || orientationLabel) && (
            <span className="w-[3px] h-[3px] rounded-full bg-white/70" />
          )}
          <span className="inline-flex items-center gap-1">
            <Heart className="w-3.5 h-3.5 text-pink-300 fill-current" />
            {Math.round(fameRating)}
          </span>
        </div>
      </div>
    </div>
  );
}
