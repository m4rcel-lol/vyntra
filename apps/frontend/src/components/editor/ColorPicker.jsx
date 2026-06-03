import { Check } from 'lucide-react';
import { hslToHex, hexToHsl, ACCENT_PRESETS } from '@/utils/color';
import { cn } from '@/lib/utils';

// value/onChange use an "h s% l%" string.
export const ColorPicker = ({ value, onChange, presets = ACCENT_PRESETS }) => (
  <div className="flex flex-wrap items-center gap-2">
    {presets.map((c) => (
      <button
        key={c}
        type="button"
        onClick={() => onChange(c)}
        className={cn('relative h-8 w-8 rounded-lg border border-border transition-transform hover:scale-110')}
        style={{ background: `hsl(${c})` }}
        aria-label={`Accent ${c}`}
      >
        {value === c && <Check className="absolute inset-0 m-auto h-4 w-4" style={{ color: 'hsl(0 0% 8%)' }} />}
      </button>
    ))}
    <label className="relative h-8 w-8 cursor-pointer overflow-hidden rounded-lg border border-border" title="Custom color">
      <span className="pointer-events-none absolute inset-0" style={{ background: 'conic-gradient(from 0deg, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)' }} />
      <input
        type="color"
        value={hslToHex(value)}
        onChange={(e) => onChange(hexToHsl(e.target.value))}
        className="absolute inset-0 cursor-pointer opacity-0"
        aria-label="Custom color picker"
      />
    </label>
  </div>
);
