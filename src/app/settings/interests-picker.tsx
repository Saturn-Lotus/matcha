'use client';

import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { X } from 'lucide-react';
import { useState } from 'react';

const POPULAR_INTERESTS = [
  'Travel',
  'Photography',
  'Hiking',
  'Coffee',
  'Dogs',
  'Music',
  'Fitness',
  'Reading',
  'Cooking',
  'Art',
  'Gaming',
  'Yoga',
  'Vegan',
  'Geek',
  'Piercing',
  'Tattoos',
  'Dancing',
  'Movies',
];

const POPULAR_LOWER = POPULAR_INTERESTS.map((i) => i.toLowerCase());

interface InterestsPickerProps {
  selected: string[];
  onChange: (interests: string[]) => void;
}

export function InterestsPicker({ selected, onChange }: InterestsPickerProps) {
  const [custom, setCustom] = useState('');

  const toggle = (interest: string) => {
    onChange(
      selected.includes(interest)
        ? selected.filter((i) => i !== interest)
        : [...selected, interest],
    );
  };

  const addCustom = () => {
    const trimmed = custom.trim().toLowerCase();
    if (trimmed && !selected.includes(trimmed)) {
      onChange([...selected, trimmed]);
    }
    setCustom('');
  };

  const customSelected = selected.filter((i) => !POPULAR_LOWER.includes(i));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {POPULAR_INTERESTS.map((interest) => (
          <button
            key={interest}
            type="button"
            onClick={() => toggle(interest.toLowerCase())}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selected.includes(interest.toLowerCase())
                ? 'strawberry-matcha-btn text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
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
              addCustom();
            }
          }}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          onClick={addCustom}
          className="border-gray-300"
        >
          Add
        </Button>
      </div>
    </div>
  );
}
