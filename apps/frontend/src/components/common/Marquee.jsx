import { cn } from '@/lib/utils';

// Infinite horizontal marquee for logos / proof strips. Duplicates children.
export const Marquee = ({ children, className, speed = 'normal' }) => (
  <div className={cn('group relative flex overflow-hidden mask-fade-x', className)}>
    <div
      className={cn(
        'flex shrink-0 items-center gap-12 pr-12 animate-marquee group-hover:[animation-play-state:paused]',
        speed === 'slow' && '[animation-duration:48s]'
      )}
    >
      {children}
      {children}
    </div>
  </div>
);
