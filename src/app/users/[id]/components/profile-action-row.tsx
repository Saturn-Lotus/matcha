'use client';

import {
  Flag,
  Heart,
  MessageCircle,
  MoreHorizontal,
  ShieldAlert,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/app/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';

interface ProfileActionRowProps {
  isLiked: boolean;
  likeDisabled: boolean;
  isConnected: boolean;
  onPass: () => void;
  onMessage?: () => void;
  onLike: () => void;
  onReport?: () => void;
  onBlock?: () => void;
}

export function ProfileActionRow({
  isLiked,
  likeDisabled,
  isConnected,
  onPass,
  onMessage,
  onLike,
  onReport,
  onBlock,
}: ProfileActionRowProps) {
  return (
    <div className="flex items-start justify-center gap-4 sm:gap-5 -mt-6 px-4 relative z-10">
      <ActionButton
        label="Pass"
        ariaLabel="Pass"
        onClick={onPass}
        variant="secondary"
      >
        <X className="w-5 h-5" />
      </ActionButton>

      <ActionButton
        label="Message"
        ariaLabel={isConnected ? 'Message' : 'Connect first to message'}
        onClick={onMessage}
        disabled={!isConnected || !onMessage}
        variant="secondary"
        tooltip={isConnected ? 'Chat coming soon' : 'Connect first to message'}
      >
        <MessageCircle className="w-5 h-5" />
      </ActionButton>

      <ActionButton
        label={isLiked ? 'Liked' : 'Like'}
        ariaLabel={isLiked ? 'Unlike' : 'Like'}
        onClick={onLike}
        ariaDisabled={likeDisabled}
        variant="primary"
        primaryActive={isLiked}
        tooltip={likeDisabled ? 'Add a profile picture to like' : undefined}
      >
        <Heart
          className={cn(
            'w-6 h-6 transition-transform',
            isLiked ? 'fill-white text-white scale-110' : 'text-primary',
          )}
        />
      </ActionButton>

      <div className="flex flex-col items-center gap-1.5">
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <button
              aria-label="More options"
              className={cn(
                'w-12 h-12 sm:w-[52px] sm:h-[52px] rounded-full inline-flex items-center justify-center transition-all duration-150',
                'bg-white border border-border/70 text-foreground/70 shadow-sm',
                'hover:bg-zinc-100 hover:border-zinc-200 cursor-pointer',
              )}
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="w-44">
            {onReport && (
              <DropdownMenuItem onClick={onReport}>
                <Flag className="w-4 h-4" />
                Report
              </DropdownMenuItem>
            )}
            {onReport && onBlock && <DropdownMenuSeparator />}
            {onBlock && (
              <DropdownMenuItem variant="destructive" onClick={onBlock}>
                <ShieldAlert className="w-4 h-4" />
                Block
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        <span className="text-[11px] font-semibold text-muted-foreground">
          More
        </span>
      </div>
    </div>
  );
}

interface ActionButtonProps {
  label: string;
  ariaLabel: string;
  onClick?: () => void;
  disabled?: boolean;
  ariaDisabled?: boolean;
  variant: 'primary' | 'secondary';
  primaryActive?: boolean;
  tooltip?: string;
  children: React.ReactNode;
}

function ActionButton({
  label,
  ariaLabel,
  onClick,
  disabled,
  ariaDisabled,
  variant,
  primaryActive,
  tooltip,
  children,
}: ActionButtonProps) {
  const isPrimary = variant === 'primary';
  const dims = isPrimary
    ? 'w-14 h-14 sm:w-[60px] sm:h-[60px]'
    : 'w-12 h-12 sm:w-[52px] sm:h-[52px]';

  const palette = isPrimary
    ? primaryActive
      ? 'bg-gradient-to-br from-pink-500 to-pink-400 text-white shadow-[0_10px_28px_-8px_rgba(236,72,153,0.55)] border border-pink-300/60'
      : 'bg-white border border-pink-200 text-primary shadow-[0_6px_18px_-6px_rgba(236,72,153,0.4)] hover:bg-pink-50'
    : 'bg-white border border-border/70 text-foreground/70 shadow-sm hover:bg-zinc-100 hover:border-zinc-200';

  const button = (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-disabled={ariaDisabled || undefined}
      className={cn(
        'rounded-full inline-flex items-center justify-center transition-all duration-150',
        dims,
        palette,
        disabled && 'opacity-50 cursor-not-allowed',
        !disabled && 'cursor-pointer',
        ariaDisabled && !primaryActive && 'opacity-60',
      )}
    >
      {children}
    </button>
  );

  return (
    <div className="flex flex-col items-center gap-1.5">
      {tooltip ? (
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent side="bottom">{tooltip}</TooltipContent>
        </Tooltip>
      ) : (
        button
      )}
      <span className="text-[11px] font-semibold text-muted-foreground">
        {label}
      </span>
    </div>
  );
}
