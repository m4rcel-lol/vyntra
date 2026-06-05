import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  User, Image, Sparkles, Link2, Music2,
  FileText, BarChart3, SlidersHorizontal, Save, Eye,
  ChevronLeft, ChevronRight, AlertTriangle,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from '@/components/ui/sheet';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { useUIStore } from '@/stores/ui.store';
import { LivePreview } from '@/components/editor/LivePreview';
import { IdentityTab } from '@/components/editor/tabs/IdentityTab';
import { BackgroundTab } from '@/components/editor/tabs/BackgroundTab';
import { EffectsTab } from '@/components/editor/tabs/EffectsTab';
import { LinksTab } from '@/components/editor/tabs/LinksTab';
import { MusicTab } from '@/components/editor/tabs/MusicTab';
import { MetadataTab } from '@/components/editor/tabs/MetadataTab';
import { AnalyticsTab } from '@/components/editor/tabs/AnalyticsTab';
import { AdvancedTab } from '@/components/editor/tabs/AdvancedTab';
import { useProfileStore } from '@/stores/profile.store';
import { useUnsavedRouteGuard } from '@/hooks/useUnsavedRouteGuard';

const TABS = [
  { v: 'identity', label: 'Identity', icon: User, C: IdentityTab },
  { v: 'background', label: 'Background', icon: Image, C: BackgroundTab },
  { v: 'effects', label: 'Effects', icon: Sparkles, C: EffectsTab },
  { v: 'links', label: 'Links', icon: Link2, C: LinksTab },
  { v: 'music', label: 'Music', icon: Music2, C: MusicTab },
  { v: 'metadata', label: 'Metadata', icon: FileText, C: MetadataTab },
  { v: 'analytics', label: 'Analytics', icon: BarChart3, C: AnalyticsTab },
  { v: 'advanced', label: 'Advanced', icon: SlidersHorizontal, C: AdvancedTab },
];

export default function EditorPage() {
  const tabListRef = useRef(null);
  const editorTab = useUIStore((s) => s.editorTab);
  const setEditorTab = useUIStore((s) => s.setEditorTab);
  const loadCurrentProfile = useProfileStore((s) => s.loadCurrentProfile);
  const saveProfile = useProfileStore((s) => s.saveProfile);
  const saving = useProfileStore((s) => s.saving);
  const dirty = useProfileStore((s) => s.dirty);
  const [tabScrollState, setTabScrollState] = useState({ prev: false, next: false });
  const [savingBeforeLeave, setSavingBeforeLeave] = useState(false);
  const {
    isBlocked: unsavedDialogOpen,
    nextLocation,
    proceed: proceedBlockedNavigation,
    reset: resetBlockedNavigation,
  } = useUnsavedRouteGuard(dirty);
  const activeEditorTab = TABS.some((tab) => tab.v === editorTab) ? editorTab : 'identity';

  useEffect(() => {
    loadCurrentProfile().catch((e) => toast.error(e.message || 'Could not load profile'));
  }, [loadCurrentProfile]);

  useEffect(() => {
    if (activeEditorTab !== editorTab) {
      setEditorTab(activeEditorTab);
    }
  }, [activeEditorTab, editorTab, setEditorTab]);

  const updateTabScrollState = useCallback(() => {
    const el = tabListRef.current;
    if (!el) return;

    const maxScrollLeft = el.scrollWidth - el.clientWidth;
    setTabScrollState({
      prev: el.scrollLeft > 4,
      next: el.scrollLeft < maxScrollLeft - 4,
    });
  }, []);

  useEffect(() => {
    const el = tabListRef.current;
    if (!el) return undefined;

    updateTabScrollState();
    el.addEventListener('scroll', updateTabScrollState, { passive: true });

    const resizeObserver = new ResizeObserver(updateTabScrollState);
    resizeObserver.observe(el);

    return () => {
      el.removeEventListener('scroll', updateTabScrollState);
      resizeObserver.disconnect();
    };
  }, [updateTabScrollState]);

  useEffect(() => {
    const el = tabListRef.current;
    if (!el) return;

    const activeTab = el.querySelector(`[data-editor-tab="${activeEditorTab}"]`);
    activeTab?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [activeEditorTab]);

  const scrollTabs = (direction) => {
    tabListRef.current?.scrollBy({ left: direction * 240, behavior: 'smooth' });
  };

  const save = async () => {
    try {
      await saveProfile();
      toast.success('Profile saved');
    } catch (e) {
      toast.error(e.message || 'Could not save profile');
    }
  };

  const saveAndLeave = async () => {
    setSavingBeforeLeave(true);
    try {
      await saveProfile();
      toast.success('Profile saved');
      proceedBlockedNavigation();
    } catch (e) {
      toast.error(e.message || 'Could not save profile');
      resetBlockedNavigation();
    } finally {
      setSavingBeforeLeave(false);
    }
  };

  const destination = nextLocation?.pathname || 'another page';

  return (
    <DashboardLayout title="Editor" fluid>
      <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Profile editor</h2>
            {dirty && (
              <span className="rounded-full border border-border bg-secondary/50 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                Unsaved changes
              </span>
            )}
          </div>
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
        <Tabs value={activeEditorTab} onValueChange={setEditorTab} className="min-w-0">
          <div className="sticky top-14 z-20 -mx-3 border-y border-border bg-background/92 px-3 py-2 backdrop-blur-xl sm:static sm:mx-0 sm:rounded-xl sm:border sm:bg-secondary/30 sm:p-1">
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => scrollTabs(-1)}
                disabled={!tabScrollState.prev}
                aria-label="Scroll editor tabs left"
                className="h-9 w-9 shrink-0 rounded-lg"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="relative min-w-0 flex-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-5 bg-gradient-to-r from-background/95 to-transparent sm:from-secondary/30" />
                <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-5 bg-gradient-to-l from-background/95 to-transparent sm:from-secondary/30" />
                <TabsList
                  ref={tabListRef}
                  className="flex h-auto w-full snap-x justify-start gap-1 overflow-x-auto rounded-none bg-transparent p-0 no-scrollbar"
                >
                  {TABS.map((t) => (
                    <TabsTrigger
                      key={t.v}
                      value={t.v}
                      data-editor-tab={t.v}
                      className="min-w-[7rem] shrink-0 snap-center gap-1.5 px-3 py-2 data-[state=active]:bg-secondary sm:min-w-[6.5rem]"
                      data-testid={`tab-${t.v}`}
                    >
                      <t.icon className="h-3.5 w-3.5" /> <span>{t.label}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => scrollTabs(1)}
                disabled={!tabScrollState.next}
                aria-label="Scroll editor tabs right"
                className="h-9 w-9 shrink-0 rounded-lg"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
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

      <Dialog
        open={unsavedDialogOpen}
        onOpenChange={(open) => {
          if (!open && !savingBeforeLeave) resetBlockedNavigation();
        }}
      >
        <DialogContent className="w-[calc(100vw-2rem)] rounded-2xl border-border bg-card/95 shadow-soft backdrop-blur-xl sm:max-w-md">
          <DialogHeader>
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-secondary/60">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <DialogTitle>Unsaved profile changes</DialogTitle>
            <DialogDescription>
              You have edits that are not saved yet. Save before leaving, discard the edits, or keep editing.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-xl border border-border bg-secondary/30 px-3 py-2 text-xs text-muted-foreground">
            Leaving editor for <span className="font-medium text-foreground">{destination}</span>.
          </div>
          <DialogFooter className="gap-2 sm:space-x-0">
            <Button
              type="button"
              variant="outline"
              onClick={resetBlockedNavigation}
              disabled={savingBeforeLeave}
              className="w-full sm:w-auto"
            >
              Keep editing
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={proceedBlockedNavigation}
              disabled={savingBeforeLeave}
              className="w-full sm:w-auto"
            >
              Leave without saving
            </Button>
            <Button
              type="button"
              onClick={saveAndLeave}
              disabled={savingBeforeLeave || saving}
              className="w-full sm:w-auto"
            >
              {savingBeforeLeave ? 'Saving…' : 'Save and leave'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
