import { useProfileStore } from '@/stores/profile.store';
import { EditorSection, Field } from '@/components/editor/Field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FileUploadMock } from '@/components/editor/FileUploadMock';

export const MetadataTab = () => {
  const profile = useProfileStore((s) => s.profile);
  const meta = profile.metadata;
  const setNested = useProfileStore((s) => s.setNested);
  return (
    <EditorSection title="Metadata" description="Control how your profile appears when shared.">
      <Field label="Page title"><Input value={meta.title} onChange={(e) => setNested('metadata', 'title', e.target.value)} /></Field>
      <Field label="Description" hint={`${(meta.description || '').length}/160`}>
        <Textarea rows={3} value={meta.description} onChange={(e) => setNested('metadata', 'description', e.target.value.slice(0, 160))} />
      </Field>
      <Field label="Open Graph image"><FileUploadMock value={meta.ogImage} onChange={(v, asset) => { setNested('metadata', 'ogImage', v); setNested('assetIds', 'metadataFileId', asset?.id ?? null); }} label="Metadata image" /></Field>

      <div>
        <p className="mb-2 text-sm font-medium">Preview</p>
        <div className="overflow-hidden rounded-xl border border-border">
          {meta.ogImage && <img src={meta.ogImage} alt="" className="h-36 w-full object-cover" />}
          <div className="bg-secondary/30 p-3">
            <p className="text-xs uppercase text-muted-foreground">vyntra.sarl/{profile.username}</p>
            <p className="truncate text-sm font-semibold">{meta.title}</p>
            <p className="line-clamp-2 text-xs text-muted-foreground">{meta.description}</p>
          </div>
        </div>
      </div>
    </EditorSection>
  );
};
