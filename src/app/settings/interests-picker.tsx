'use client';

import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { cn } from '@/lib/utils';

const DEFAULT_INTERESTS = [
  'travel',
  'photography',
  'hiking',
  'coffee',
  'dogs',
  'music',
  'fitness',
  'reading',
  'cooking',
  'art',
  'gaming',
  'yoga',
  'vegan',
  'geek',
  'piercing',
  'tattoos',
  'dancing',
  'movies',
];

interface InterestsPickerProps {
  selected: string[];
  onChange: (interests: string[]) => void;
}

export function InterestsPicker({ selected, onChange }: InterestsPickerProps) {
  const [custom, setCustom] = useState('');
  const [popular, setPopular] = useState<string[]>(DEFAULT_INTERESTS);
  const [matches, setMatches] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    const loadPopular = async () => {
      try {
        const tags = await apiClient.get<string[]>('/users/tags?limit=18');
        if (!cancelled && tags.length > 0) setPopular(tags);
      } catch {
        // keep the default list
      }
    };
    loadPopular();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const q = custom.trim().toLowerCase();
    if (!q) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const tags = await apiClient.get<string[]>(
          `/users/tags?q=${encodeURIComponent(q)}&limit=8`,
        );
        if (!cancelled) setMatches(tags);
      } catch {
        if (!cancelled) setMatches([]);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [custom]);

  const toggle = (interest: string) => {
    onChange(
      selected.includes(interest)
        ? selected.filter((i) => i !== interest)
        : [...selected, interest],
    );
  };

  const add = (interest: string) => {
    const trimmed = interest.trim().toLowerCase();
    if (trimmed && !selected.includes(trimmed)) {
      onChange([...selected, trimmed]);
    }
    setCustom('');
  };

  const customSelected = selected.filter((i) => !popular.includes(i));
  const suggestions = custom.trim()
    ? matches.filter((tag) => !selected.includes(tag))
    : [];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {popular.map((interest) => (
          <button
            key={interest}
            type="button"
            onClick={() => toggle(interest)}
            className={cn(
              'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
              selected.includes(interest)
                ? 'strawberry-matcha-btn text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
            )}
          >
            #{interest}
          </button>
        ))}
      </div>

      {customSelected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {customSelected.map((interest) => (
            <span
              key={interest}
              className="flex items-center gap-1 px-3 py-1.5 strawberry-matcha-btn text-white rounded-full text-sm font-medium"
            >
              #{interest}
              <button type="button" onClick={() => toggle(interest)}>
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Input
          placeholder="Add custom interest..."
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add(custom);
            }
          }}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => add(custom)}
          className="border-gray-300"
        >
          Add
        </Button>
      </div>

      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => add(tag)}
              className="px-3 py-1.5 rounded-full text-sm font-medium bg-gray-50 text-gray-500 border border-dashed border-gray-300 hover:bg-gray-100 transition-colors"
            >
              #{tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
