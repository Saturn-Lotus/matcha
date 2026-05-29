'use client';

import { Label } from '@/app/components/ui/label';
import { Slider } from '@/app/components/ui/slider';
import { InterestsPicker } from './interests-picker';

const AGE_MIN = 18;
const AGE_MAX = 120;
const FAME_MIN = 0;
const FAME_MAX = 100;
const DISTANCE_MIN = 0;
const DISTANCE_MAX = 100;

export interface SearchPreferencesState {
  prefMinAge: number;
  prefMaxAge: number;
  prefMinFame: number;
  prefMaxFame: number;
  prefMaxDistanceKm: number;
  prefTags: string[];
}

interface SearchPreferencesTabProps {
  value: SearchPreferencesState;
  onChange: (next: SearchPreferencesState) => void;
}

function RangeRow({
  min,
  max,
  current,
  unit,
}: {
  min: number;
  max: number;
  current: [number, number];
  unit?: string;
}) {
  return (
    <div className="flex items-baseline justify-between text-xs text-zinc-500">
      <span className="font-mono tabular-nums">
        {min}
        {unit}
      </span>
      <span className="rounded-full bg-rose-50 px-3 py-1 text-sm font-semibold text-rose-600 tabular-nums">
        {current[0]}
        {unit} – {current[1]}
        {unit}
      </span>
      <span className="font-mono tabular-nums">
        {max}
        {unit}
      </span>
    </div>
  );
}

export function SearchPreferencesTab({
  value,
  onChange,
}: SearchPreferencesTabProps) {
  const set = (patch: Partial<SearchPreferencesState>) =>
    onChange({ ...value, ...patch });

  const ageRange: [number, number] = [value.prefMinAge, value.prefMaxAge];
  const fameRange: [number, number] = [value.prefMinFame, value.prefMaxFame];

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Label>Age range</Label>
        <RangeRow min={AGE_MIN} max={AGE_MAX} current={ageRange} />
        <Slider
          min={AGE_MIN}
          max={AGE_MAX}
          step={1}
          minStepsBetweenThumbs={1}
          value={ageRange}
          onValueChange={(next) =>
            set({
              prefMinAge: next[0],
              prefMaxAge: next[1],
            })
          }
        />
      </div>

      <div className="space-y-3">
        <Label>Fame rating range</Label>
        <RangeRow min={FAME_MIN} max={FAME_MAX} current={fameRange} />
        <Slider
          min={FAME_MIN}
          max={FAME_MAX}
          step={1}
          minStepsBetweenThumbs={1}
          value={fameRange}
          onValueChange={(next) =>
            set({
              prefMinFame: next[0],
              prefMaxFame: next[1],
            })
          }
        />
      </div>

      <div className="space-y-3">
        <Label>Maximum distance</Label>
        <div className="flex items-baseline justify-between text-xs text-zinc-500">
          <span className="font-mono tabular-nums">{DISTANCE_MIN}km</span>
          <span className="rounded-full bg-rose-50 px-3 py-1 text-sm font-semibold text-rose-600 tabular-nums">
            {value.prefMaxDistanceKm}km
          </span>
          <span className="font-mono tabular-nums">{DISTANCE_MAX}km</span>
        </div>
        <Slider
          min={DISTANCE_MIN}
          max={DISTANCE_MAX}
          step={1}
          value={[value.prefMaxDistanceKm]}
          onValueChange={(next) => set({ prefMaxDistanceKm: next[0] })}
        />
      </div>

      <div className="space-y-2">
        <Label>Interests (matches must include ALL selected)</Label>
        <InterestsPicker
          selected={value.prefTags}
          onChange={(tags) => set({ prefTags: tags })}
        />
      </div>
    </div>
  );
}
