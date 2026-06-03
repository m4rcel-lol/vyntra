import { GlassCard } from '@/components/common/GlassCard';
import { cn } from '@/lib/utils';

export const ChartCard = ({ title, subtitle, action, children, className }) => (
  <GlassCard className={cn('flex flex-col p-6', className)}>
    <div className="flex items-start justify-between gap-3">
      <div>
        <h3 className="font-display text-base font-semibold">{title}</h3>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
    <div className="mt-4 flex-1">{children}</div>
  </GlassCard>
);

export const ChartTooltip = ({ active, payload, label, unit = '' }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-soft">
      {label && <p className="mb-1 text-muted-foreground">{label}</p>}
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-2 font-medium capitalize">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color || p.fill }} />
          {p.name}: {Number(p.value).toLocaleString()}{unit}
        </p>
      ))}
    </div>
  );
};
