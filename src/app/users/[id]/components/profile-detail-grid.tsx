import { cn } from '@/lib/utils';

export interface ProfileDetailItem {
  icon: React.ReactNode;
  label: React.ReactNode;
  accent?: 'pink' | 'matcha';
}

interface ProfileDetailGridProps {
  items: ProfileDetailItem[];
}

export function ProfileDetailGrid({ items }: ProfileDetailGridProps) {
  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3 text-sm leading-snug">
          <span
            className={cn(
              'inline-flex items-center justify-center w-5 h-5 shrink-0 mt-0.5',
              item.accent === 'matcha' ? 'text-emerald-600' : 'text-primary',
            )}
          >
            {item.icon}
          </span>
          <span className="text-foreground/90">{item.label}</span>
        </li>
      ))}
    </ul>
  );
}
