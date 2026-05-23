'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Search, X, User as UserIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api';
import { useDebounce } from '@/lib/hooks/use-debounce';
import type { UserSearchResult } from '@/server/types';

function HighlightMatch({ text, query }: { text: string; query: string }) {
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (!query || idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <span className="text-primary font-semibold">
        {text.slice(idx, idx + query.length)}
      </span>
      {text.slice(idx + query.length)}
    </>
  );
}

export function UserSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = debouncedQuery.trim();
    if (!q) return;

    let cancelled = false;
    (async () => {
      if (!cancelled) setLoading(true);
      try {
        const data = await apiClient.get<UserSearchResult[]>(
          `/users/search?q=${encodeURIComponent(q)}&limit=5`,
        );
        if (!cancelled) setResults(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  const close = () => {
    setOpen(false);
    setQuery('');
    setResults([]);
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        close();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleSelect = (id: string) => {
    router.push(`/users/${id}`);
    close();
  };

  const showDropdown = open && query.trim().length > 0;

  return (
    <div ref={containerRef} className="relative">
      {open ? (
        <div className="flex items-center gap-1.5 pl-2.5 pr-1 h-8 rounded-lg bg-gray-100 border border-gray-200 focus-within:border-primary/40 transition-colors w-44 sm:w-56">
          <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Escape' && close()}
            placeholder="Search users…"
            className="flex-1 bg-transparent text-sm outline-none text-gray-800 placeholder:text-gray-400 min-w-0"
          />
          <button
            onClick={close}
            className="text-gray-400 hover:text-gray-600 shrink-0 transition-colors"
            aria-label="Close search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all duration-150"
          aria-label="Search"
        >
          <Search className="w-4 h-4" />
        </button>
      )}

      {showDropdown && (
        <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-xl border border-gray-200/80 shadow-lg shadow-black/5 z-50 overflow-hidden">
          <p className="px-3 pt-2.5 pb-1 text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
            Users
          </p>
          {loading ? (
            <div className="px-3 py-3 text-sm text-gray-400">Searching…</div>
          ) : results.length > 0 ? (
            <ul className="pb-1.5">
              {results.map((user) => {
                const initials =
                  `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase();
                return (
                  <li key={user.id}>
                    <button
                      onClick={() => handleSelect(user.id)}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 transition-colors text-left"
                    >
                      <div
                        className={cn(
                          'w-9 h-9 rounded-full overflow-hidden shrink-0 flex items-center justify-center text-sm font-semibold',
                          !user.avatarUrl && 'bg-pink-100 text-pink-400',
                        )}
                      >
                        {user.avatarUrl ? (
                          <Image
                            src={user.avatarUrl}
                            alt={user.firstName}
                            width={36}
                            height={36}
                            unoptimized
                            className="w-full h-full object-cover"
                          />
                        ) : initials ? (
                          initials
                        ) : (
                          <UserIcon className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          <HighlightMatch
                            text={`${user.firstName} ${user.lastName}`}
                            query={query.trim()}
                          />
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          @
                          <HighlightMatch
                            text={user.username}
                            query={query.trim()}
                          />
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="px-3 py-3 text-sm text-gray-400">
              No users found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
