import { GlassCard } from './GlassCard';
import { cn } from '@/lib/utils';

export const EmptyState = ({ icon: Icon, title, description, action, className }) => (
  <GlassCard className={cn('flex flex-col items-center justify-center gap-3 p-10 text-center', className)}>
    {Icon && (
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/60 text-muted-foreground">
        <Icon className="h-6 w-6" />
      </div>
    )}
    <h3 className="font-display text-lg font-semibold">{title}</h3>
    {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
    {action && <div className="mt-2">{action}</div>}
  </GlassCard>
);
