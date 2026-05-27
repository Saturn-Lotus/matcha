'use client';

import { useState } from 'react';
import {
  ArrowDownNarrowWide,
  ArrowUpNarrowWide,
  Flag,
  HeartOff,
  ShieldAlert,
} from 'lucide-react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { cn } from '@/lib/utils';
import type { SortBy, SortDirection } from '@/server/types';

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'sharedTagCount', label: 'Shared tags' },
  { value: 'distance', label: 'Distance' },
  { value: 'fameRating', label: 'Fame' },
  { value: 'age', label: 'Age' },
];

function stop(e: React.SyntheticEvent) {
  e.stopPropagation();
}

interface FeedCardMoreSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  firstName: string;
  isLiked: boolean;
  sortBy: SortBy;
  sortDirection: SortDirection;
  onSortChange: (sortBy: SortBy, sortDirection: SortDirection) => void;
  onUnlike: () => void;
  onReport: () => void;
  onBlock: () => void;
}

export function FeedCardMoreSheet({
  open,
  onOpenChange,
  firstName,
  isLiked,
  sortBy,
  sortDirection,
  onSortChange,
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
          <FeedCardMoreSheetContent
            key={`${sortBy}:${sortDirection}`}
            firstName={firstName}
            isLiked={isLiked}
            sortBy={sortBy}
            sortDirection={sortDirection}
            onSortChange={onSortChange}
            onClose={close}
            onUnlike={onUnlike}
            onReport={onReport}
            onBlock={onBlock}
          />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

interface FeedCardMoreSheetContentProps {
  firstName: string;
  isLiked: boolean;
  sortBy: SortBy;
  sortDirection: SortDirection;
  onSortChange: (sortBy: SortBy, sortDirection: SortDirection) => void;
  onClose: () => void;
  onUnlike: () => void;
  onReport: () => void;
  onBlock: () => void;
}

function FeedCardMoreSheetContent({
  firstName,
  isLiked,
  sortBy,
  sortDirection,
  onSortChange,
  onClose,
  onUnlike,
  onReport,
  onBlock,
}: FeedCardMoreSheetContentProps) {
  const [draftSortBy, setDraftSortBy] = useState<SortBy>(sortBy);
  const [draftSortDirection, setDraftSortDirection] =
    useState<SortDirection>(sortDirection);

  const hasSortChanges =
    draftSortBy !== sortBy || draftSortDirection !== sortDirection;

  const applySort = () => {
    if (hasSortChanges) onSortChange(draftSortBy, draftSortDirection);
    onClose();
  };

  return (
    <>
      <div className="mx-auto h-1.5 w-10 rounded-full bg-neutral-200" />

      <div className="px-3 pt-4 pb-2">
        <DialogPrimitive.Title className="text-[15px] font-semibold text-neutral-900">
          {firstName}
        </DialogPrimitive.Title>
        <DialogPrimitive.Description className="text-[12px] text-neutral-500 mt-0.5">
          Tune your feed or keep things safe.
        </DialogPrimitive.Description>
      </div>

      <div className="px-3 pt-2 pb-3">
        <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-pink-500/80 mb-2">
          Sort feed
        </div>
        <div className="flex flex-wrap gap-1.5">
          {SORT_OPTIONS.map((opt) => {
            const active = opt.value === draftSortBy;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setDraftSortBy(opt.value)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-[12.5px] font-semibold border transition-colors cursor-pointer',
                  active
                    ? 'border-transparent bg-gradient-to-r from-rose-400 to-rose-500 text-white shadow-sm shadow-rose-200'
                    : 'border-neutral-200 bg-white text-neutral-700 hover:bg-pink-50/70 hover:border-pink-200',
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex items-center gap-1.5 p-1 rounded-full bg-neutral-100">
          <DirectionPill
            active={draftSortDirection === 'asc'}
            onClick={() => setDraftSortDirection('asc')}
            icon={<ArrowUpNarrowWide className="w-[14px] h-[14px]" />}
            label="Ascending"
          />
          <DirectionPill
            active={draftSortDirection === 'desc'}
            onClick={() => setDraftSortDirection('desc')}
            icon={<ArrowDownNarrowWide className="w-[14px] h-[14px]" />}
            label="Descending"
          />
        </div>
      </div>

      <div className="h-px bg-neutral-100 mx-3" />

      <div className="flex flex-col gap-1 pt-2 pb-2">
        {isLiked && (
          <SheetRow
            tone="neutral"
            icon={<HeartOff className="w-[18px] h-[18px]" />}
            title="Unlike"
            subtitle="Remove your like from this profile"
            onClick={() => {
              onUnlike();
              onClose();
            }}
          />
        )}
        <SheetRow
          tone="neutral"
          icon={<Flag className="w-[18px] h-[18px]" />}
          title="Report"
          subtitle="Tell us if something feels off"
          onClick={() => {
            onClose();
            onReport();
          }}
        />
        <SheetRow
          tone="destructive"
          icon={<ShieldAlert className="w-[18px] h-[18px]" />}
          title="Block"
          subtitle="Hide each other across the app"
          onClick={() => {
            onClose();
            onBlock();
          }}
        />
      </div>

      <div className="mt-1 mb-1 flex gap-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 h-12 rounded-2xl bg-neutral-100 text-[14px] font-semibold text-neutral-700 hover:bg-neutral-200 transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={applySort}
          disabled={!hasSortChanges}
          className={cn(
            'flex-1 h-12 rounded-2xl text-[14px] font-semibold transition-colors',
            hasSortChanges
              ? 'bg-gradient-to-r from-rose-400 to-rose-500 text-white shadow-sm shadow-rose-200 hover:from-rose-500 hover:to-rose-600 cursor-pointer'
              : 'bg-neutral-100 text-neutral-400 cursor-not-allowed',
          )}
        >
          Apply
        </button>
      </div>
    </>
  );
}

interface DirectionPillProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

function DirectionPill({ active, onClick, icon, label }: DirectionPillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex-1 flex items-center justify-center gap-1.5 h-9 rounded-full text-[12.5px] font-semibold transition-all cursor-pointer',
        active
          ? 'bg-white text-rose-600 shadow-sm'
          : 'text-neutral-500 hover:text-neutral-700',
      )}
    >
      {icon}
      {label}
    </button>
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
