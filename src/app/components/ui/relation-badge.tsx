'use client';

import { Eye, Heart, HeartHandshake } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/app/components/ui/tooltip';

export type RelationBadgeVariant = 'connected' | 'liked-you' | 'viewed-you';

const VARIANTS: Record<
  RelationBadgeVariant,
  { Icon: typeof Heart; label: string; className: string }
> = {
  connected: {
    Icon: HeartHandshake,
    label: "You're connected",
    className: 'bg-primary text-primary-foreground',
  },
  'liked-you': {
    Icon: Heart,
    label: 'Liked you',
    className: 'bg-pink-500 text-white',
  },
  'viewed-you': {
    Icon: Eye,
    label: 'Viewed your profile',
    className: 'bg-white/85 text-zinc-800',
  },
};

interface RelationBadgeProps {
  variant: RelationBadgeVariant;
  size?: 'sm' | 'md';
  withLabel?: boolean;
  className?: string;
}

export function RelationBadge({
  variant,
  size = 'sm',
  withLabel = false,
  className,
}: RelationBadgeProps) {
  const { Icon, label, className: variantClass } = VARIANTS[variant];
  const dims =
    size === 'sm' ? 'h-7 min-w-7 px-1.5 text-[11px]' : 'h-8 px-2.5 text-xs';
  const iconDims = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';

  const filled = variant !== 'viewed-you';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          aria-label={label}
          className={cn(
            'inline-flex items-center gap-1 rounded-full font-semibold backdrop-blur shadow-sm',
            dims,
            variantClass,
            className,
          )}
        >
          <Icon className={cn(iconDims, filled && 'fill-current')} />
          {withLabel && <span>{label}</span>}
        </span>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}

export function pickRelationVariant(opts: {
  connected: boolean;
  targetLiked: boolean;
  targetViewedViewer: boolean;
}): RelationBadgeVariant | null {
  if (opts.connected) return 'connected';
  if (opts.targetLiked) return 'liked-you';
  if (opts.targetViewedViewer) return 'viewed-you';
  return null;
}
