import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function yearsBetween(from: Date, to: Date): number {
  let years = to.getFullYear() - from.getFullYear();
  const monthDiff = to.getMonth() - from.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && to.getDate() < from.getDate())) {
    years--;
  }
  return years;
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function formatGenderLabel(g: 'male' | 'female' | null): string | null {
  if (g === 'male') return 'Man';
  if (g === 'female') return 'Woman';
  return null;
}

export function formatPreferenceLabel(
  pref: 'male' | 'female' | 'both' | null,
): string | null {
  if (pref === 'male') return 'Interested in men';
  if (pref === 'female') return 'Interested in women';
  if (pref === 'both') return 'Interested in everyone';
  return null;
}

export function formatOrientationLabel(
  gender: 'male' | 'female' | null,
  pref: 'male' | 'female' | 'both' | null,
): string | null {
  if (!gender || !pref) return null;
  if (pref === 'both') return 'Bi';
  if (gender === pref) return 'Gay';
  return 'Straight';
}

export function formatDistanceKm(km: number | null): string | null {
  if (km === null) return null;
  if (km < 1) return '<1 km away';
  if (km < 10) return `${km.toFixed(1)} km away`;
  return `${Math.round(km)} km away`;
}

export function formatDistanceKmShort(km: number | null): string | null {
  if (km === null) return null;
  if (km < 1) return '<1 km';
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

export function formatClockTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatCompactNumber(value: number): string {
  if (value < 1000) return `${Math.round(value)}`;
  return new Intl.NumberFormat(undefined, {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatDayLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const startOfDay = (x: Date) =>
    new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diffDays = Math.round((startOfDay(now) - startOfDay(d)) / 86_400_000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return d.toLocaleDateString(undefined, { weekday: 'long' });
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    ...(d.getFullYear() === now.getFullYear() ? {} : { year: 'numeric' }),
  });
}

export function formatMonthYear(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });
}
