import { useEffect } from 'react';
import { toast } from 'sonner';
import {
  User, LayoutGrid, Image, Sparkles, Link2, Award, Music2,
  PlaySquare, FileText, BarChart3, SlidersHorizontal, Save, Eye,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from '@/components/ui/sheet';
import { useUIStore } from '@/stores/ui.store';
import { LivePreview } from '@/components/editor/LivePreview';
import { IdentityTab } from '@/components/editor/tabs/IdentityTab';
import { LayoutTab } from '@/components/editor/tabs/LayoutTab';
import { BackgroundTab } from '@/components/editor/tabs/BackgroundTab';
import { EffectsTab } from '@/components/editor/tabs/EffectsTab';
import { LinksTab } from '@/components/editor/tabs/LinksTab';
import { BadgesTab } from '@/components/editor/tabs/BadgesTab';
import { MusicTab } from '@/components/editor/tabs/MusicTab';
import { EmbedsTab } from '@/components/editor/tabs/EmbedsTab';
import { MetadataTab } from '@/components/editor/tabs/MetadataTab';
import { AnalyticsTab } from '@/components/editor/tabs/AnalyticsTab';
import { AdvancedTab } from '@/components/editor/tabs/AdvancedTab';
import { useProfileStore } from '@/stores/profile.store';

const TABS = [
  { v: 'identity', label: 'Identity', icon: User, C: IdentityTab },
  { v: 'layout', label: 'Layout', icon: LayoutGrid, C: LayoutTab },
  { v: 'background', label: 'Background', icon: Image, C: BackgroundTab },
  { v: 'effects', label: 'Effects', icon: Sparkles, C: EffectsTab },
  { v: 'links', label: 'Links', icon: Link2, C: LinksTab },
  { v: 'badges', label: 'Badges', icon: Award, C: BadgesTab },
  { v: 'music', label: 'Music', icon: Music2, C: MusicTab },
  { v: 'embeds', label: 'Embeds', icon: PlaySquare, C: EmbedsTab },
  { v: 'metadata', label: 'Metadata', icon: FileText, C: MetadataTab },
  { v: 'analytics', label: 'Analytics', icon: BarChart3, C: AnalyticsTab },
  { v: 'advanced', label: 'Advanced', icon: SlidersHorizontal, C: AdvancedTab },
];

export default function EditorPage() {
  const editorTab = useUIStore((s) => s.editorTab);
  const setEditorTab = useUIStore((s) => s.setEditorTab);
  const loadCurrentProfile = useProfileStore((s) => s.loadCurrentProfile);
  const saveProfile = useProfileStore((s) => s.saveProfile);
  const saving = useProfileStore((s) => s.saving);
  const dirty = useProfileStore((s) => s.dirty);

  useEffect(() => {
    loadCurrentProfile().catch((e) => toast.error(e.message || 'Could not load profile'));
  }, [loadCurrentProfile]);

  const save = async () => {
    try {
      await saveProfile();
      toast.success('Profile saved');
    } catch (e) {
      toast.error(e.message || 'Could not save profile');
    }
  };

  return (
    <DashboardLayout title="Editor" fluid>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-semibold tracking-tight">Profile editor</h2>
          <p className="text-sm text-muted-foreground">Customize everything. The preview updates live.</p>
        </div>
        <div className="flex gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="xl:hidden" data-testid="mobile-preview-btn"><Eye className="h-4 w-4" /> Preview</Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[88vh] border-border bg-card">
              <SheetHeader><SheetTitle>Live preview</SheetTitle></SheetHeader>
              <div className="mt-4 h-[calc(88vh-5rem)] overflow-y-auto"><LivePreview /></div>
            </SheetContent>
          </Sheet>
          <Button onClick={save} disabled={saving || !dirty} data-testid="editor-save">
            <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(380px,440px)_1fr]">
        <Tabs value={editorTab} onValueChange={setEditorTab} className="min-w-0">
          <TabsList className="flex h-auto w-full justify-start gap-1 overflow-x-auto rounded-xl bg-secondary/30 p-1 no-scrollbar">
            {TABS.map((t) => (
              <TabsTrigger key={t.v} value={t.v} className="shrink-0 gap-1.5 data-[state=active]:bg-secondary" data-testid={`tab-${t.v}`}>
                <t.icon className="h-3.5 w-3.5" /> <span className="hidden sm:inline">{t.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="mt-4 rounded-2xl glass-panel border-gradient p-5">
            {TABS.map(({ v, C }) => (
              <TabsContent key={v} value={v} className="mt-0 focus-visible:outline-none">
                <C />
              </TabsContent>
            ))}
          </div>
        </Tabs>

        <div className="hidden xl:block">
          <div className="sticky top-20"><LivePreview /></div>
        </div>
      </div>
    </DashboardLayout>
  );
}
