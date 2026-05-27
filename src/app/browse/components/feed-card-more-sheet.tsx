'use client';

import { Flag, HeartOff, ShieldAlert } from 'lucide-react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { cn } from '@/lib/utils';

function stop(e: React.SyntheticEvent) {
  e.stopPropagation();
}

interface FeedCardMoreSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  firstName: string;
  isLiked: boolean;
  onUnlike: () => void;
  onReport: () => void;
  onBlock: () => void;
}

export function FeedCardMoreSheet({
  open,
  onOpenChange,
  firstName,
  isLiked,
  onUnlike,
  onReport,
  onBlock,
}: FeedCardMoreSheetProps) {
  const close = () => onOpenChange(false);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0"
          onClick={stop}
          onPointerDown={stop}
        />
        <DialogPrimitive.Content
          onClick={stop}
          onPointerDown={stop}
          className={cn(
            'fixed left-0 right-0 bottom-0 z-50 mx-auto w-full max-w-md',
            'rounded-t-[28px] border-t border-pink-100 bg-white text-neutral-900 shadow-[0_-20px_60px_-20px_rgba(244,114,182,0.45)]',
            'pb-[max(env(safe-area-inset-bottom),16px)] pt-2.5 px-3',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom',
            'data-[state=open]:duration-300 data-[state=closed]:duration-200',
          )}
        >
          <div className="mx-auto h-1.5 w-10 rounded-full bg-neutral-200" />

          <div className="px-3 pt-4 pb-2">
            <DialogPrimitive.Title className="text-[15px] font-semibold text-neutral-900">
              {firstName}
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="text-[12px] text-neutral-500 mt-0.5">
              Tidy up your feed or keep things safe.
            </DialogPrimitive.Description>
          </div>

          <div className="flex flex-col gap-1 pt-1 pb-2">
            {isLiked && (
              <SheetRow
                tone="neutral"
                icon={<HeartOff className="w-[18px] h-[18px]" />}
                title="Unlike"
                subtitle="Remove your like from this profile"
                onClick={() => {
                  onUnlike();
                  close();
                }}
              />
            )}
            <SheetRow
              tone="neutral"
              icon={<Flag className="w-[18px] h-[18px]" />}
              title="Report"
              subtitle="Tell us if something feels off"
              onClick={() => {
                close();
                onReport();
              }}
            />
            <SheetRow
              tone="destructive"
              icon={<ShieldAlert className="w-[18px] h-[18px]" />}
              title="Block"
              subtitle="Hide each other across the app"
              onClick={() => {
                close();
                onBlock();
              }}
            />
          </div>

          <button
            type="button"
            onClick={close}
            className="mt-1 mb-1 w-full h-12 rounded-2xl bg-neutral-100 text-[14px] font-semibold text-neutral-700 hover:bg-neutral-200 transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

interface SheetRowProps {
  tone: 'neutral' | 'destructive';
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
}

function SheetRow({ tone, icon, title, subtitle, onClick }: SheetRowProps) {
  const destructive = tone === 'destructive';
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 w-full text-left rounded-2xl px-3 py-3 transition-colors cursor-pointer',
        'hover:bg-pink-50/70 active:bg-pink-50',
      )}
    >
      <span
        className={cn(
          'shrink-0 w-10 h-10 rounded-full flex items-center justify-center border',
          destructive
            ? 'bg-pink-50 border-pink-100 text-pink-600'
            : 'bg-neutral-50 border-neutral-100 text-neutral-700',
        )}
      >
        {icon}
      </span>
      <span className="flex-1 min-w-0">
        <span
          className={cn(
            'block text-[15px] font-semibold leading-tight',
            destructive ? 'text-pink-600' : 'text-neutral-900',
          )}
        >
          {title}
        </span>
        <span className="block text-[12px] text-neutral-500 mt-0.5">
          {subtitle}
        </span>
      </span>
    </button>
  );
}
