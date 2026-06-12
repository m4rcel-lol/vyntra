import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { cn } from '@/lib/utils';

export const StatCard = ({ icon: Icon, label, value, delta, suffix, className }) => {
  const positive = typeof delta === 'number' ? delta >= 0 : null;
  return (
    <GlassCard glow className={cn('p-4 sm:p-5', className)}>
      <div className="flex items-start justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary/60 text-foreground sm:h-10 sm:w-10">
          {Icon && <Icon className="h-4 w-4 sm:h-5 sm:w-5" />}
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
          className="font-display text-xl font-semibold tracking-tight sm:text-2xl"
        >
          {value}
          {suffix && <span className="ml-0.5 text-base text-muted-foreground">{suffix}</span>}
        </motion.div>
        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{label}</p>
      </div>
    </GlassCard>
  );
};
