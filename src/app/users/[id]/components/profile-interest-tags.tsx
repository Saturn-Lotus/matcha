import { cn } from '@/lib/utils';

interface ProfileInterestTagsProps {
  tags: string[];
}

export function ProfileInterestTags({ tags }: ProfileInterestTagsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag, i) => (
        <span
          key={tag}
          className={cn(
            'inline-flex items-center text-[12px] h-7 px-3 rounded-full font-medium',
            i % 2 === 0
              ? 'bg-primary/12 text-primary'
              : 'bg-emerald-500/14 text-emerald-700 dark:text-emerald-300',
          )}
        >
          <span className="opacity-60">#</span>
          {tag}
        </span>
      ))}
    </div>
  );
}
