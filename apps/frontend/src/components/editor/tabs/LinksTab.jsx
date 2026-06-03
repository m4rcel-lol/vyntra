import { Plus, Trash2, ArrowUp, ArrowDown, GripVertical } from 'lucide-react';
import { useProfileStore } from '@/stores/profile.store';
import { EditorSection } from '@/components/editor/Field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Icon } from '@/components/common/Icon';
import { SOCIAL_ICONS, BUTTON_STYLES } from '@/types';

export const LinksTab = () => {
  const links = useProfileStore((s) => s.profile.links);
  const { addLink, updateLink, removeLink, reorderLinks } = useProfileStore.getState();

  return (
    <EditorSection title="Links" description="Add, reorder and style your links.">
      <div className="space-y-3">
        {links.map((l, i) => (
          <div key={l.id} className="rounded-xl border border-border bg-secondary/20 p-3">
            <div className="flex items-center gap-2">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary/60"><Icon name={l.icon} className="h-4 w-4" /></div>
              <Input value={l.label} onChange={(e) => updateLink(l.id, { label: e.target.value })} placeholder="Label" className="h-9" />
              <div className="flex shrink-0 gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" disabled={i === 0} onClick={() => reorderLinks(i, i - 1)} aria-label="Move up"><ArrowUp className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" disabled={i === links.length - 1} onClick={() => reorderLinks(i, i + 1)} aria-label="Move down"><ArrowDown className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeLink(l.id)} aria-label="Remove"><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
            <div className="mt-2 grid grid-cols-[1fr_120px_120px] gap-2">
              <Input value={l.url} onChange={(e) => updateLink(l.id, { url: e.target.value })} placeholder="https://" className="h-9" />
              <Select value={l.icon} onValueChange={(v) => updateLink(l.id, { icon: v })}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Icon" /></SelectTrigger>
                <SelectContent>{SOCIAL_ICONS.map((ic) => <SelectItem key={ic} value={ic}>{ic}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={l.style} onValueChange={(v) => updateLink(l.id, { style: v })}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Style" /></SelectTrigger>
                <SelectContent>{BUTTON_STYLES.map((s) => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        ))}
      </div>
      <Button variant="outline" className="w-full" onClick={() => addLink()} data-testid="link-add"><Plus className="h-4 w-4" /> Add link</Button>
    </EditorSection>
  );
};
