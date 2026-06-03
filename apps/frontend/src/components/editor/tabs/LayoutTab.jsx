import { useProfileStore } from '@/stores/profile.store';
import { EditorSection } from '@/components/editor/Field';
import { LayoutSelector } from '@/components/editor/LayoutSelector';

export const LayoutTab = () => {
  const layout = useProfileStore((s) => s.profile.layout);
  const setField = useProfileStore((s) => s.setField);
  return (
    <EditorSection title="Layout" description="Choose how your profile is arranged. The preview updates instantly.">
      <LayoutSelector value={layout} onChange={(v) => setField('layout', v)} />
    </EditorSection>
  );
};
