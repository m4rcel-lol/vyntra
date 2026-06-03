import { Check } from 'lucide-react';
import { GRADIENT_PRESETS } from '@/utils/color';
import { cn } from '@/lib/utils';

export const GradientPicker = ({ value, onChange, presets = GRADIENT_PRESETS }) => (
  <div className="grid grid-cols-4 gap-2">
    {presets.map((g) => (
      <button
        key={g}
        type="button"
        onClick={() => onChange(g)}
        className={cn('relative h-14 rounded-xl border transition-transform hover:scale-[1.03]', value === g ? 'border-foreground' : 'border-border')}
        style={{ background: g }}
        aria-label="Gradient option"
      >
        {value === g && (
          <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-background/70">
            <Check className="h-3 w-3" />
          </span>
        )}
      </button>
    ))}
  </div>
);
