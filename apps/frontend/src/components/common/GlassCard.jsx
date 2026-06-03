import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const glassVariants = cva('relative rounded-2xl', {
  variants: {
    variant: {
      default: 'glass-panel border-gradient',
      strong: 'glass-strong border-gradient',
      flat: 'glass',
      solid: 'bg-card border border-border',
    },
    glow: {
      true: 'glow-hover',
      false: '',
    },
  },
  defaultVariants: { variant: 'default', glow: false },
});

export const GlassCard = React.forwardRef(
  ({ className, variant, glow, children, ...props }, ref) => (
    <div ref={ref} className={cn(glassVariants({ variant, glow }), className)} {...props}>
      {children}
    </div>
  )
);
GlassCard.displayName = 'GlassCard';
