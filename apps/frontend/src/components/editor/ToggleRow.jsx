import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

export const ToggleRow = ({ icon: Icon, label, description, checked, onCheckedChange, testId, className }) => (
  <label className={cn('flex items-center justify-between gap-4 rounded-xl border border-border bg-secondary/20 px-4 py-3 cursor-pointer', className)}>
    <div className="flex items-center gap-3">
      {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      <div>
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
    </div>
    <Switch checked={checked} onCheckedChange={onCheckedChange} data-testid={testId} />
  </label>
);
