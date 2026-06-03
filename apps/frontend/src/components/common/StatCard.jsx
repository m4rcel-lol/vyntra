import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { cn } from '@/lib/utils';

export const StatCard = ({ icon: Icon, label, value, delta, suffix, className }) => {
  const positive = typeof delta === 'number' ? delta >= 0 : null;
  return (
    <GlassCard glow className={cn('p-5', className)}>
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/60 text-foreground">
          {Icon && <Icon className="h-5 w-5" />}
        </div>
        {positive !== null && (
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
              positive ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive'
            )}
          >
            {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(delta)}%
          </span>
        )}
      </div>
      <div className="mt-4">
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display text-2xl font-semibold tracking-tight"
        >
          {value}
          {suffix && <span className="ml-0.5 text-base text-muted-foreground">{suffix}</span>}
        </motion.div>
        <p className="mt-1 text-sm text-muted-foreground">{label}</p>
      </div>
    </GlassCard>
  );
};
