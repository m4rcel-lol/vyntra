import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Icon } from '@/components/common/Icon';
import { cn } from '@/lib/utils';
import { withoutInlineBadges } from './badgeUtils';

export const BadgeRow = ({ badges = [], size = 'md', className }) => {
  const visibleBadges = withoutInlineBadges(badges);
  if (!visibleBadges.length) return null;
  const dim = size === 'sm' ? 'h-6 w-6' : 'h-7 w-7';
  const ic = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';
  return (
    <TooltipProvider delayDuration={120}>
      <div className={cn('flex flex-wrap items-center justify-center gap-1.5', className)}>
        {visibleBadges.map((b) => (
          <Tooltip key={b.id}>
            <TooltipTrigger asChild>
              <span
                className={cn('flex items-center justify-center rounded-lg border transition-transform hover:scale-110', dim)}
                style={{
                  background: `hsl(${b.color} / 0.16)`,
                  borderColor: `hsl(${b.color} / 0.35)`,
                  color: `hsl(${b.color})`,
                  boxShadow: b.glow ? `0 0 14px -2px hsl(${b.color} / 0.7)` : 'none',
                }}
              >
                <Icon name={b.icon} fallback="Star" className={ic} />
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-medium">{b.label}</p>
              {b.tooltip && <p className="text-xs text-muted-foreground">{b.tooltip}</p>}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
};
