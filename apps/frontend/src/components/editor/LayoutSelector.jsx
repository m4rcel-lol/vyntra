import { LayoutGrid, AlignCenter, Rows, PanelLeft, Layers, TerminalSquare, Square } from 'lucide-react';
import { PROFILE_LAYOUTS } from '@/types';
import { cn } from '@/lib/utils';

const ICONS = {
  centered: AlignCenter,
  wide: Rows,
  minimal: Square,
  sidebar: PanelLeft,
  floating: Layers,
  terminal: TerminalSquare,
  portfolio: LayoutGrid,
  spotlight: Layers,
  stacked: Rows,
  editorial: LayoutGrid,
};

export const LayoutSelector = ({ value, onChange }) => (
  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
    {PROFILE_LAYOUTS.map((l) => {
      const Icon = ICONS[l.key] || Square;
      const active = value === l.key;
      return (
        <button
          key={l.key}
          type="button"
          onClick={() => onChange(l.key)}
          className={cn(
            'flex flex-col items-start gap-2 rounded-xl border p-3 text-left transition-colors',
            active ? 'border-foreground bg-secondary/60' : 'border-border bg-secondary/20 hover:bg-secondary/40'
          )}
          data-testid={`layout-${l.key}`}
        >
          <Icon className="h-5 w-5" />
          <div>
            <p className="text-sm font-medium">{l.label}</p>
            <p className="text-xs text-muted-foreground">{l.desc}</p>
          </div>
        </button>
      );
    })}
  </div>
);
