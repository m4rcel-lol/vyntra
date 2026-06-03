import { Plus, Trash2 } from 'lucide-react';
import { useProfileStore } from '@/stores/profile.store';
import { EditorSection } from '@/components/editor/Field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToggleRow } from '@/components/editor/ToggleRow';
import { ColorPicker } from '@/components/editor/ColorPicker';
import { Icon } from '@/components/common/Icon';
import { mockBadges } from '@/mocks/badges.mock';

export const BadgesTab = () => {
  const badges = useProfileStore((s) => s.profile.badges);
  const { addBadge, updateBadge, removeBadge } = useProfileStore.getState();
  const ownedIds = badges.map((b) => b.id);

  return (
    <EditorSection title="Badges" description="Show who you are with glowing badges.">
      <div className="space-y-3">
        {badges.map((b) => (
          <div key={b.id} className="rounded-xl border border-border bg-secondary/20 p-3">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: `hsl(${b.color} / 0.16)`, color: `hsl(${b.color})`, boxShadow: b.glow ? `0 0 14px -2px hsl(${b.color} / 0.7)` : 'none' }}>
                <Icon name={b.icon} fallback="Star" className="h-4 w-4" />
              </span>
              <Input value={b.label} onChange={(e) => updateBadge(b.id, { label: e.target.value })} className="h-9" />
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeBadge(b.id)} aria-label="Remove badge"><Trash2 className="h-4 w-4" /></Button>
            </div>
            <Input value={b.tooltip} onChange={(e) => updateBadge(b.id, { tooltip: e.target.value })} placeholder="Tooltip text" className="mt-2 h-9" />
            <div className="mt-2 flex items-center justify-between gap-3">
              <ColorPicker value={b.color} onChange={(v) => updateBadge(b.id, { color: v })} />
            </div>
            <ToggleRow className="mt-2" label="Glow" checked={!!b.glow} onCheckedChange={(v) => updateBadge(b.id, { glow: v })} />
          </div>
        ))}
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Quick add</p>
        <div className="flex flex-wrap gap-2">
          {mockBadges.filter((b) => !ownedIds.includes(b.id)).map((b) => (
            <button key={b.id} onClick={() => addBadge(b)} className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary/30 px-2.5 py-1.5 text-xs transition-colors hover:bg-secondary/60" style={{ color: `hsl(${b.color})` }}>
              <Icon name={b.icon} fallback="Star" className="h-3.5 w-3.5" /> {b.label}
            </button>
          ))}
        </div>
      </div>
      <Button variant="outline" className="w-full" onClick={() => addBadge()}><Plus className="h-4 w-4" /> Custom badge</Button>
    </EditorSection>
  );
};
