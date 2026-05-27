import { cn } from '@/lib/utils';

interface ProfileCardProps {
  className?: string;
  children: React.ReactNode;
}

export function ProfileCard({ className, children }: ProfileCardProps) {
  return (
    <div
      className={cn(
        'mx-auto w-full max-w-[560px] bg-white rounded-[28px] overflow-hidden',
        'shadow-[0_24px_60px_-30px_rgba(31,41,55,0.18),0_4px_12px_-6px_rgba(31,41,55,0.08)]',
        'border border-white/80',
        className,
      )}
    >
      {children}
    </div>
  );
}
