import { useEffect } from 'react';
import { toast } from 'sonner';
import {
  User, Image, Sparkles, Link2, Award, Music2,
  PlaySquare, FileText, BarChart3, SlidersHorizontal, Save, Eye,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from '@/components/ui/sheet';
import { useUIStore } from '@/stores/ui.store';
import { LivePreview } from '@/components/editor/LivePreview';
import { IdentityTab } from '@/components/editor/tabs/IdentityTab';
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
      <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Profile editor</h2>
          <p className="text-sm text-muted-foreground">Customize everything. The preview updates live.</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="w-full xl:hidden" data-testid="mobile-preview-btn"><Eye className="h-4 w-4" /> Preview</Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[92dvh] rounded-t-3xl border-border bg-card p-4">
              <SheetHeader><SheetTitle>Live preview</SheetTitle></SheetHeader>
              <div className="mt-4 h-[calc(92dvh-5.5rem)] overflow-y-auto rounded-2xl border border-border bg-background"><LivePreview /></div>
            </SheetContent>
          </Sheet>
          <Button onClick={save} disabled={saving || !dirty} data-testid="editor-save" className="w-full sm:w-auto">
            <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(380px,440px)_1fr]">
        <Tabs value={editorTab} onValueChange={setEditorTab} className="min-w-0">
          <TabsList className="-mx-3 flex h-auto w-[calc(100%+1.5rem)] snap-x justify-start gap-1 overflow-x-auto rounded-none border-y border-border bg-background/80 px-3 py-2 no-scrollbar sm:mx-0 sm:w-full sm:rounded-xl sm:border sm:bg-secondary/30 sm:p-1">
            {TABS.map((t) => (
              <TabsTrigger key={t.v} value={t.v} className="min-w-[6.25rem] shrink-0 snap-start gap-1.5 px-3 py-2 data-[state=active]:bg-secondary sm:min-w-0" data-testid={`tab-${t.v}`}>
                <t.icon className="h-3.5 w-3.5" /> <span>{t.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="mt-4 rounded-2xl glass-panel border-gradient p-4 sm:p-5">
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
