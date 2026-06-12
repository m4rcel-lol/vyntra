import { RotateCcw, Globe, MousePointer2 } from 'lucide-react';
import { toast } from 'sonner';
import { useProfileStore } from '@/stores/profile.store';
import { EditorSection, Field } from '@/components/editor/Field';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ToggleRow } from '@/components/editor/ToggleRow';
import { FileUploadMock } from '@/components/editor/FileUploadMock';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { VISIBILITY_OPTIONS } from '@/types';

export const AdvancedTab = () => {
  const advanced = useProfileStore((s) => s.profile.advanced);
  const cursorFileId = useProfileStore((s) => s.profile.assetIds?.cursorFileId);
  const setNested = useProfileStore((s) => s.setNested);
  const reset = useProfileStore((s) => s.reset);

  const applyCursorUpload = (value, asset) => {
    setNested('advanced', 'customCursor', value);
    setNested('assetIds', 'cursorFileId', asset?.id ?? null);
  };

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

      <Field label="Custom cursor image" hint="Upload a .cur, .gif, or .png file. Cursor files are preserved so they keep working on the live profile.">
        <div className="space-y-2">
          <FileUploadMock
            value={advanced.customCursor}
            onChange={applyCursorUpload}
            label="Cursor"
            kind="CURSOR"
            aspect="aspect-[3/1]"
          />
          {cursorFileId && (
            <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <MousePointer2 className="h-3.5 w-3.5" /> Cursor upload is connected to this profile.
            </p>
          )}
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
