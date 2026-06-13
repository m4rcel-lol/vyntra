import { cn } from '@/lib/utils';

const LOGO_SRC = '/brand/vyntra-logo.png';

export const Logo = ({ className, showText = true, size = 28 }) => (
  <span className={cn('inline-flex items-center gap-2.5 select-none', className)}>
    <span className="relative inline-flex" style={{ width: size, height: size }}>
      <img
        src={LOGO_SRC}
        alt=""
        aria-hidden="true"
        draggable="false"
        width={size}
        height={size}
        className="relative z-10 h-full w-full object-contain"
      />
      <span className="absolute inset-0 rounded-full bg-white/35 blur-md opacity-30" />
    </span>
    {showText && (
      <span className="font-display text-lg font-semibold tracking-tight">
        Vyntra
      </span>
    )}
  </span>
);
