'use client';

import { useEffect, useState } from 'react';
import { ChevronUp, Eye, Heart, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SocialGrid } from './social-grid';

type ActivityTab = 'likes' | 'views';

interface ActivityDrawerProps {
  userId: string;
}

export function ActivityDrawer({ userId }: ActivityDrawerProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<ActivityTab>('likes');

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open activity"
        className={cn(
          'fixed bottom-4 left-1/2 -translate-x-1/2 z-20',
          'group flex items-center gap-2 pl-3 pr-3.5 h-12 rounded-full cursor-pointer',
          'bg-white/95 backdrop-blur border border-[#ffe4e6]',
          'shadow-[0_10px_30px_-12px_rgba(244,114,182,0.45),0_2px_6px_rgba(0,0,0,0.06)]',
          'hover:shadow-[0_14px_36px_-12px_rgba(244,114,182,0.55),0_3px_8px_rgba(0,0,0,0.08)]',
          'transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0',
        )}
      >
        <span className="relative flex items-center justify-center w-7 h-7 rounded-full strawberry-matcha-btn">
          <Heart className="w-3.5 h-3.5 text-white fill-current" />
        </span>
        <span className="text-[13px] font-semibold text-gray-800 tracking-tight">
          Likes
        </span>
        <span className="w-1 h-1 rounded-full bg-gray-300 mx-1" />
        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-gray-100">
          <Eye className="w-3.5 h-3.5 text-gray-500" />
        </span>
        <span className="text-[13px] font-semibold text-gray-800 tracking-tight">
          Views
        </span>
        <ChevronUp className="w-4 h-4 text-gray-400 ml-0.5 transition-transform group-hover:-translate-y-0.5" />
      </button>

      <div
        onClick={() => setOpen(false)}
        className={cn(
          'fixed inset-0 z-30 bg-black/40 backdrop-blur-sm transition-opacity duration-300',
          open ? 'opacity-100' : 'opacity-0 pointer-events-none',
        )}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Activity"
        className={cn(
          'fixed inset-x-0 bottom-0 z-40 flex flex-col',
          'bg-white rounded-t-[28px]',
          'shadow-[0_-20px_60px_-20px_rgba(244,114,182,0.35),0_-4px_18px_rgba(0,0,0,0.06)]',
          'transition-transform duration-300 ease-out will-change-transform',
          'max-h-[88vh] h-[88vh]',
          open ? 'translate-y-0' : 'translate-y-full',
        )}
      >
        <div className="absolute inset-x-0 -top-px h-12 flex justify-center items-start pt-2 pointer-events-none">
          <span className="block w-10 h-1.5 rounded-full bg-gray-300/80" />
        </div>

        <div className="flex items-center justify-between px-5 pt-7 pb-4 shrink-0">
          <div className="flex flex-col">
            <span className="text-[11px] uppercase tracking-[0.18em] font-semibold text-pink-400">
              Your inbox
            </span>
            <h2 className="text-[22px] font-bold text-gray-900 leading-tight">
              Activity
            </h2>
          </div>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="w-9 h-9 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        <div className="px-5 pb-3 shrink-0">
          <div className="grid grid-cols-2 gap-2 p-1 bg-gray-50 rounded-full border border-gray-100">
            {(
              [
                { key: 'likes', label: 'Likes', icon: Heart },
                { key: 'views', label: 'Views', icon: Eye },
              ] as const
            ).map(({ key, label, icon: Icon }) => {
              const active = tab === key;
              return (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={cn(
                    'h-10 rounded-full flex items-center justify-center gap-2 text-sm font-semibold cursor-pointer transition-all duration-200',
                    active
                      ? 'bg-white text-gray-900 shadow-[0_1px_2px_rgba(0,0,0,0.06),0_4px_12px_-4px_rgba(244,114,182,0.35)]'
                      : 'text-gray-500 hover:text-gray-800',
                  )}
                >
                  <Icon
                    className={cn(
                      'w-4 h-4',
                      active && key === 'likes'
                        ? 'text-pink-500 fill-current'
                        : active
                          ? 'text-gray-700'
                          : 'text-gray-400',
                    )}
                  />
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-8 pt-2">
          {open && (
            <SocialGrid
              key={tab}
              userId={userId}
              type={tab === 'likes' ? 'like' : 'view'}
            />
          )}
        </div>
      </div>
    </>
  );
}
