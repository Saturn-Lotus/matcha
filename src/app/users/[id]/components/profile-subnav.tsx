'use client';

import { ChevronLeft, Flag } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/button';

interface ProfileSubnavProps {
  firstName: string;
  lastName: string;
  username: string;
  onReport?: () => void;
}

export function ProfileSubnav({
  firstName,
  lastName,
  username,
  onReport,
}: ProfileSubnavProps) {
  const router = useRouter();

  return (
    <div className="mx-auto w-full max-w-[560px] px-4 pt-3 pb-2 flex items-center gap-3">
      <button
        onClick={() => router.back()}
        aria-label="Go back"
        className="w-10 h-10 inline-flex items-center justify-center rounded-full bg-white/70 hover:bg-white text-foreground/80 transition-colors shadow-sm border border-white"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <div className="flex flex-col leading-tight min-w-0 flex-1">
        <span className="font-semibold text-lg truncate">
          {firstName} {lastName}
        </span>
        <span className="text-xs text-muted-foreground font-mono truncate">
          @{username}
        </span>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onReport}
        className="rounded-full bg-white/70 hover:bg-white border-white shadow-sm h-9 px-3.5 text-foreground/80"
      >
        <Flag className="w-4 h-4" />
        Report
      </Button>
    </div>
  );
}
