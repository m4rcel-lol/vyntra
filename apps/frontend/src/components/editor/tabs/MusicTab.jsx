import { useProfileStore } from '@/stores/profile.store';
import { EditorSection, Field } from '@/components/editor/Field';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { ToggleRow } from '@/components/editor/ToggleRow';
import { FileUploadMock } from '@/components/editor/FileUploadMock';
import { Volume2, Repeat, Music2 } from 'lucide-react';

export const MusicTab = () => {
  const music = useProfileStore((s) => s.profile.music);
  const setNested = useProfileStore((s) => s.setNested);
  return (
    <EditorSection title="Music" description="Set a signature track. It never autoplays — only after the intro click.">
      <ToggleRow icon={Music2} label="Show music player" description="Display the frosted player on your profile" checked={!!music.enabled} onCheckedChange={(v) => setNested('music', 'enabled', v)} testId="music-enabled" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Track title"><Input value={music.title} onChange={(e) => setNested('music', 'title', e.target.value)} /></Field>
        <Field label="Artist"><Input value={music.artist} onChange={(e) => setNested('music', 'artist', e.target.value)} /></Field>
      </div>
      <Field label="Audio file" hint="Upload a local audio file. It is verified and compressed before storage. The player only appears after this is set.">
        <FileUploadMock
          value={music.src}
          onChange={(v, asset) => {
            setNested('music', 'src', v);
            setNested('music', 'enabled', Boolean(v));
            setNested('assetIds', 'audioFileId', asset?.id ?? null);
          }}
          label="Audio"
          aspect="aspect-[4/1]"
        />
      </Field>
      <Field label="Cover art"><FileUploadMock value={music.cover} onChange={(v) => setNested('music', 'cover', v)} label="Cover" aspect="aspect-square" /></Field>
      <ToggleRow icon={Repeat} label="Loop" checked={!!music.loop} onCheckedChange={(v) => setNested('music', 'loop', v)} />
      <Field label={`Volume · ${music.volume}%`}>
        <div className="flex items-center gap-3">
          <Volume2 className="h-4 w-4 text-muted-foreground" />
          <Slider value={[music.volume]} min={0} max={100} step={1} onValueChange={([v]) => setNested('music', 'volume', v)} />
        </div>
      </Field>
    </EditorSection>
  );
};
