import { useProfileStore } from '@/stores/profile.store';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field, EditorSection } from '@/components/editor/Field';
import { ColorPicker } from '@/components/editor/ColorPicker';
import { FileUploadMock } from '@/components/editor/FileUploadMock';

export const IdentityTab = () => {
  const profile = useProfileStore((s) => s.profile);
  const setField = useProfileStore((s) => s.setField);
  const setNested = useProfileStore((s) => s.setNested);
  const applyMusicUpload = (value, asset) => {
    const hasMusic = Boolean(value);
    setNested('music', 'src', value);
    setNested('music', 'enabled', hasMusic);
    setNested('assetIds', 'audioFileId', asset?.id ?? null);

    if (hasMusic && asset?.originalName && !profile.music?.title) {
      setNested('music', 'title', asset.originalName.replace(/\.[^/.]+$/, ''));
    }
    if (hasMusic && !profile.music?.artist) {
      setNested('music', 'artist', profile.displayName || profile.username);
    }
  };

  return (
    <EditorSection title="Identity" description="The core of your profile — who you are.">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Display name" htmlFor="displayName">
          <Input id="displayName" value={profile.displayName} onChange={(e) => setField('displayName', e.target.value)} data-testid="id-displayname" />
        </Field>
        <Field label="Username" htmlFor="username">
          <Input id="username" value={profile.username} onChange={(e) => setField('username', e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))} />
        </Field>
      </div>

      <Field label="Status" hint="A short line shown under your name.">
        <Input value={profile.status} onChange={(e) => setField('status', e.target.value)} placeholder="What are you up to?" />
      </Field>

      <Field label="Bio" hint={`${(profile.bio || '').length}/180`}>
        <Textarea value={profile.bio} onChange={(e) => setField('bio', e.target.value.slice(0, 180))} rows={3} data-testid="id-bio" />
      </Field>

      <Field label="Location">
        <Input value={profile.location} onChange={(e) => setField('location', e.target.value)} placeholder="City, Country" />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Avatar"><FileUploadMock value={profile.avatar} onChange={(v, asset) => { setField('avatar', v); setNested('assetIds', 'avatarFileId', asset?.id ?? null); }} label="Avatar" aspect="aspect-square" /></Field>
        <Field label="Banner"><FileUploadMock value={profile.banner} onChange={(v, asset) => { setField('banner', v); setNested('assetIds', 'bannerFileId', asset?.id ?? null); }} label="Banner" aspect="aspect-video" /></Field>
      </div>

      <Field label="Profile song" hint="Upload a local music file for the public profile player. It is compressed before storage.">
        <FileUploadMock value={profile.music?.src} onChange={applyMusicUpload} label="Music" aspect="aspect-[4/1]" />
      </Field>

      <Field label="Accent color" hint="Tints glows, badges and highlights.">
        <ColorPicker value={profile.accent} onChange={(v) => setField('accent', v)} />
      </Field>
    </EditorSection>
  );
};
