import { useProfileStore } from '@/stores/profile.store';
import { EditorSection, Field } from '@/components/editor/Field';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { ToggleRow } from '@/components/editor/ToggleRow';
import { FileUploadMock } from '@/components/editor/FileUploadMock';
import { Volume2, Repeat, Music2 } from 'lucide-react';

export const MusicTab = () => {
  const profile = useProfileStore((s) => s.profile);
  const music = profile.music;
  const setNested = useProfileStore((s) => s.setNested);
  const applyAudioUpload = (value, asset) => {
    const metadata = asset?.metadata ?? {};
    const cover = metadata.cover ?? {};
    const title = cleanTrackTitle(metadata.title || titleFromAsset(asset));
    const artist = cleanTrackTitle(metadata.artist || music.artist || profile.displayName || profile.username);

    setNested('music', 'src', value);
    setNested('music', 'enabled', Boolean(value));
    setNested('assetIds', 'audioFileId', asset?.id ?? null);
    setNested('music', 'title', value ? title : '');
    setNested('music', 'artist', value ? artist : '');
    if (cover.url || cover.fileId) {
      setNested('music', 'cover', cover.url || '');
      setNested('music', 'coverFileId', cover.fileId ?? null);
      setNested('assetIds', 'musicCoverFileId', cover.fileId ?? null);
    }
  };
  const applyCoverUpload = (value, asset) => {
    setNested('music', 'cover', value);
    setNested('music', 'coverFileId', asset?.id ?? null);
    setNested('assetIds', 'musicCoverFileId', asset?.id ?? null);
  };
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
          onChange={applyAudioUpload}
          label="Audio"
          aspect="aspect-[4/1]"
        />
      </Field>
      <Field label="Cover art" hint="If the audio file has no embedded artwork, upload a PNG, WebP, JPG, or GIF here. It will be compressed before storage.">
        <FileUploadMock value={music.cover} onChange={applyCoverUpload} label="Music cover" aspect="aspect-square" />
      </Field>
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

function titleFromAsset(asset) {
  return cleanTrackTitle(String(asset?.originalName || '').replace(/\.[^/.]+$/, ''));
}

function cleanTrackTitle(value) {
  return String(value || '').replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
}
