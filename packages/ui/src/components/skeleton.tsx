import { cn } from '../utils/cn';

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-[rgb(var(--color-surface-tertiary))]',
        'relative overflow-hidden',
        'after:absolute after:inset-0',
        'after:translate-x-[-100%] after:animate-shimmer',
        'after:bg-gradient-to-r after:from-transparent',
        'after:via-white/10 after:to-transparent',
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
