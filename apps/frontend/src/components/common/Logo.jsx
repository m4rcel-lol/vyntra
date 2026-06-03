import { cn } from '@/lib/utils';

// Vyntra prism mark + wordmark. Monochrome, scales via `size`.
export const Logo = ({ className, showText = true, size = 28 }) => (
  <span className={cn('inline-flex items-center gap-2.5 select-none', className)}>
    <span className="relative inline-flex" style={{ width: size, height: size }}>
      <svg viewBox="0 0 32 32" width={size} height={size} fill="none" aria-hidden="true">
        <defs>
          <linearGradient id="vy-mark" x1="4" y1="2" x2="28" y2="30" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ffffff" />
            <stop offset="1" stopColor="#8a8a8a" />
          </linearGradient>
        </defs>
        <path d="M16 2 30 10v12L16 30 2 22V10L16 2Z" stroke="url(#vy-mark)" strokeWidth="1.4" opacity="0.5" />
        <path d="M9 11l7 12 7-12" stroke="url(#vy-mark)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="absolute inset-0 rounded-full blur-md opacity-40" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.5), transparent 70%)' }} />
    </span>
    {showText && (
      <span className="font-display text-lg font-semibold tracking-tight">
        Vyntra<span className="text-muted-foreground">.bio</span>
      </span>
    )}
  </span>
);
