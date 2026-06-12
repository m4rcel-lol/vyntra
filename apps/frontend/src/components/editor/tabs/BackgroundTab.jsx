import { useProfileStore } from '@/stores/profile.store';
import { EditorSection, Field } from '@/components/editor/Field';
import { ColorPicker } from '@/components/editor/ColorPicker';
import { GradientPicker } from '@/components/editor/GradientPicker';
import { FileUploadMock } from '@/components/editor/FileUploadMock';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BACKGROUND_TYPES } from '@/types';

const DARK_PRESETS = ['0 0% 3%', '0 0% 6%', '230 25% 8%', '260 30% 10%', '210 40% 10%', '0 0% 100%'];

export const BackgroundTab = () => {
  const bg = useProfileStore((s) => s.profile.background);
  const setNested = useProfileStore((s) => s.setNested);

  return (
    <EditorSection title="Background" description="Set the scene behind your profile card.">
      <Field label="Type">
        <Select value={bg.type} onValueChange={(v) => setNested('background', 'type', v)}>
          <SelectTrigger data-testid="bg-type"><SelectValue /></SelectTrigger>
          <SelectContent>
            {BACKGROUND_TYPES.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </Field>

      {bg.type === 'solid' && (
        <Field label="Color"><ColorPicker value={bg.color} onChange={(v) => setNested('background', 'color', v)} presets={DARK_PRESETS} /></Field>
      )}
      {bg.type === 'gradient' && (
        <Field label="Gradient"><GradientPicker value={bg.gradient} onChange={(v) => setNested('background', 'gradient', v)} /></Field>
      )}
      {(bg.type === 'image' || bg.type === 'gif') && (
        <Field label={bg.type === 'gif' ? 'GIF' : 'Image'}><FileUploadMock value={bg.image} onChange={(v, asset) => { setNested('background', 'image', v); setNested('background', 'video', ''); setNested('assetIds', 'backgroundFileId', asset?.id ?? null); }} label="Background" kind="BACKGROUND_IMAGE" /></Field>
      )}
      {bg.type === 'video' && (
        <Field label="Video" hint="Upload an .mp4 or .webm file. It will be compressed before storage.">
          <FileUploadMock value={bg.video || bg.image} onChange={(v, asset) => { setNested('background', 'video', v); setNested('background', 'image', v); setNested('assetIds', 'backgroundFileId', asset?.id ?? null); }} label="Video" kind="BACKGROUND_VIDEO" />
        </Field>
      )}

      <Field label={`Blur · ${bg.blur}px`}>
        <Slider value={[bg.blur]} min={0} max={24} step={1} onValueChange={([v]) => setNested('background', 'blur', v)} />
      </Field>
      <Field label={`Dark overlay · ${bg.overlay}%`}>
        <Slider value={[bg.overlay]} min={0} max={100} step={1} onValueChange={([v]) => setNested('background', 'overlay', v)} />
      </Field>
    </EditorSection>
  );
};
