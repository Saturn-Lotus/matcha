import { cn } from '@/lib/utils';

interface ProfileSectionProps {
  title: string;
  className?: string;
  children: React.ReactNode;
}

export function ProfileSection({
  title,
  className,
  children,
}: ProfileSectionProps) {
  return (
    <section className={cn('flex flex-col gap-2', className)}>
      <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.14em]">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function ProfileDivider() {
  return <div className="h-px bg-border/70" />;
}
