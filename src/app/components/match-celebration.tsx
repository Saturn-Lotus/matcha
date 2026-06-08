'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Heart, MessageCircle, User as UserIcon } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { cn } from '@/lib/utils';

interface MatchUser {
  name: string;
  avatarUrl: string | null;
}

interface MatchCelebrationProps {
  open: boolean;
  viewer: MatchUser;
  matched: MatchUser;
  onClose: () => void;
}

function MatchAvatar({
  user,
  className,
}: {
  user: MatchUser;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'relative w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-xl bg-pink-100',
        className,
      )}
    >
      {user.avatarUrl ? (
        <Image
          src={user.avatarUrl}
          alt={user.name}
          fill
          unoptimized
          className="object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-pink-300">
          <UserIcon className="w-10 h-10" />
        </div>
      )}
    </div>
  );
}

export function MatchCelebration({
  open,
  viewer,
  matched,
  onClose,
}: MatchCelebrationProps) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="It's a match"
      className="fixed inset-0 z-[100] flex items-center justify-center p-6"
    >
      <div
        className="absolute inset-0 bg-black/55 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-sm rounded-[28px] strawberry-matcha-bg shadow-2xl px-6 py-9 flex flex-col items-center text-center animate-match-pop">
        <span className="absolute left-8 top-6 text-pink-400/80 animate-match-float">
          <Heart className="w-6 h-6 fill-current" />
        </span>
        <span className="absolute right-9 top-10 text-recipe-matcha/70 animate-match-float">
          <Heart className="w-4 h-4 fill-current" />
        </span>

        <h2 className="text-3xl font-extrabold strawberry-matcha-gradient tracking-tight">
          It&apos;s a Match!
        </h2>
        <p className="mt-1.5 text-sm text-gray-600">
          You and {matched.name} liked each other.
        </p>

        <div className="mt-7 flex items-center justify-center">
          <MatchAvatar user={viewer} className="-mr-4 rotate-[-6deg]" />
          <span className="z-10 w-12 h-12 rounded-full strawberry-matcha-btn flex items-center justify-center text-white shadow-lg">
            <Heart className="w-6 h-6 fill-current" />
          </span>
          <MatchAvatar user={matched} className="-ml-4 rotate-[6deg]" />
        </div>

        <div className="mt-9 flex flex-col gap-2.5 w-full">
          <Button
            asChild
            className="strawberry-matcha-btn text-white font-semibold h-11 rounded-xl hover:opacity-90 shadow-sm"
          >
            <Link href="/matches" onClick={onClose}>
              <MessageCircle className="w-4 h-4" />
              Say hi — chat coming soon
            </Link>
          </Button>
          <Button
            variant="ghost"
            onClick={onClose}
            className="h-11 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-white/50 font-medium"
          >
            Keep browsing
          </Button>
        </div>
      </div>
    </div>
  );
}
