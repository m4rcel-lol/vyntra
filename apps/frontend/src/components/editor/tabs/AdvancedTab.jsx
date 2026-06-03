import { RotateCcw, Globe, MousePointer2 } from 'lucide-react';
import { toast } from 'sonner';
import { useProfileStore } from '@/stores/profile.store';
import { EditorSection, Field } from '@/components/editor/Field';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToggleRow } from '@/components/editor/ToggleRow';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { VISIBILITY_OPTIONS } from '@/types';

export const AdvancedTab = () => {
  const advanced = useProfileStore((s) => s.profile.advanced);
  const setNested = useProfileStore((s) => s.setNested);
  const reset = useProfileStore((s) => s.reset);

  return (
    <EditorSection title="Advanced" description="Power-user controls. Custom CSS is simulated safely on the live page.">
      <Field label="Visibility">
        <Select value={advanced.visibility} onValueChange={(v) => setNested('advanced', 'visibility', v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {VISIBILITY_OPTIONS.map((o) => (
              <SelectItem key={o.key} value={o.key}>{o.label} — <span className="text-muted-foreground">{o.desc}</span></SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <ToggleRow icon={Globe} label="SEO indexing" description="Allow search engines to find your profile" checked={!!advanced.seo} onCheckedChange={(v) => setNested('advanced', 'seo', v)} />

      <Field label="Custom cursor URL" hint="A small PNG works best (32x32).">
        <div className="relative">
          <MousePointer2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={advanced.customCursor} onChange={(e) => setNested('advanced', 'customCursor', e.target.value)} placeholder="https://..." className="pl-9" />
        </div>
      </Field>

      <Field label="Custom CSS" hint="Applied only on your public page.">
        <Textarea value={advanced.customCss} onChange={(e) => setNested('advanced', 'customCss', e.target.value)} rows={6} className="font-mono text-xs" placeholder=".card { box-shadow: 0 0 40px #fff2; }" />
      </Field>

      <Button
        variant="destructive"
        className="w-full"
        onClick={() => { reset(); toast.success('Profile reset to defaults'); }}
      >
        <RotateCcw className="h-4 w-4" /> Reset profile
      </Button>
    </EditorSection>
  );
};
