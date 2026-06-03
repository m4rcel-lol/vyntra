import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Plus, Search, SlidersHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { TemplateCard } from '@/components/templates/TemplateCard';
import { TemplatePreviewModal } from '@/components/templates/TemplatePreviewModal';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { templatesService } from '@/services/templates.service';
import { TEMPLATE_CATEGORIES } from '@/types';
import { useTemplateStore } from '@/stores/template.store';
import { useProfileStore } from '@/stores/profile.store';
import { useAuthStore } from '@/stores/auth.store';
import { cn } from '@/lib/utils';

const STYLES = ['All', 'Minimal', 'Clean', 'Portfolio', 'Gaming', 'Dark', 'Colorful', 'Music', 'Developer', 'Cyberpunk'];

export default function TemplatesPage({ publicView = false }) {
  const navigate = useNavigate();
  const { search, category, style, sort, setSearch, setCategory, setStyle, setSort, likedIds, toggleLike, markImported } = useTemplateStore();
  const applyTemplate = useProfileStore((s) => s.applyTemplate);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [preview, setPreview] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [templateDraft, setTemplateDraft] = useState({
    name: '',
    description: '',
    style: 'dark',
    tags: '',
    isPublished: true,
  });
  const { data: templates = [], refetch } = useQuery({
    queryKey: ['templates', search, style],
    queryFn: () => templatesService.getTemplates({ q: search, style }),
  });
  const canCreate = isAuthenticated && !publicView;

  const filtered = useMemo(() => {
    let list = templates.filter((t) => {
      const q = search.toLowerCase();
      const matchQ = !q || t.name.toLowerCase().includes(q) || t.tags.some((tag) => tag.includes(q)) || t.author.includes(q);
      const matchC = category === 'All' || t.category === category;
      const matchS = style === 'All' || t.style === style;
      return matchQ && matchC && matchS;
    });
    if (sort === 'popular') list = [...list].sort((a, b) => b.uses - a.uses);
    if (sort === 'likes') list = [...list].sort((a, b) => b.likes - a.likes);
    if (sort === 'name') list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [templates, search, category, style, sort]);

  const apply = (t) => {
    applyTemplate(t);
    markImported(t.id);
    setPreview(null);
    templatesService.importTemplate(t.id)
      .then(() => {
        toast.success(`Applied “${t.name}” to your profile`);
        navigate('/editor');
      })
      .catch((e) => toast.error(e.message || 'Could not import template'));
  };

  const createTemplate = async (event) => {
    event.preventDefault();
    const name = templateDraft.name.trim();
    if (!name) {
      toast.error('Template name is required');
      return;
    }
    setCreating(true);
    try {
      await templatesService.createFromProfile({
        name,
        description: templateDraft.description.trim(),
        style: templateDraft.style,
        tags: templateDraft.tags
          .split(',')
          .map((tag) => tag.trim().toLowerCase().replace(/^#/, ''))
          .filter(Boolean)
          .slice(0, 10),
        isPublished: templateDraft.isPublished,
      });
      toast.success(templateDraft.isPublished ? 'Template published to the community' : 'Template saved privately');
      setTemplateDraft({ name: '', description: '', style: 'dark', tags: '', isPublished: true });
      setCreateOpen(false);
      await refetch();
    } catch (e) {
      toast.error(e.message || 'Could not create template');
    } finally {
      setCreating(false);
    }
  };

  return (
    <DashboardLayout title="Templates">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <h2 className="font-display text-2xl font-semibold tracking-tight">Community templates</h2>
          <p className="text-sm text-muted-foreground">Remix published designs from creators around the world.</p>
        </div>
        {canCreate && (
          <Button onClick={() => setCreateOpen(true)} data-testid="tpl-create">
            <Plus className="h-4 w-4" /> Create template
          </Button>
        )}
      </div>

      {/* Controls */}
      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search templates, tags, authors…" className="pl-9" data-testid="tpl-search" />
        </div>
        <div className="flex gap-2">
          <Select value={style} onValueChange={setStyle}>
            <SelectTrigger className="w-36"><SlidersHorizontal className="h-3.5 w-3.5" /><SelectValue placeholder="Style" /></SelectTrigger>
            <SelectContent>{STYLES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="popular">Most used</SelectItem>
              <SelectItem value="likes">Most liked</SelectItem>
              <SelectItem value="name">A – Z</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Category chips */}
      <div className="mt-4 flex flex-wrap gap-2">
        {['All', ...TEMPLATE_CATEGORIES].map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={cn('rounded-full border px-3 py-1.5 text-sm transition-colors', category === c ? 'border-foreground bg-secondary text-foreground' : 'border-border text-muted-foreground hover:text-foreground')}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length ? (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((t) => (
            <TemplateCard
              key={t.id}
              template={t}
              liked={likedIds.includes(t.id)}
              onLike={(id) => {
                toggleLike(id);
                templatesService.likeTemplate(id).catch(() => {});
              }}
              onPreview={setPreview}
              onApply={apply}
            />
          ))}
        </div>
      ) : (
        <EmptyState className="mt-10" icon={Search} title="No templates found" description="Try a different search or category filter." />
      )}

      <TemplatePreviewModal
        template={preview}
        liked={preview && likedIds.includes(preview.id)}
        onLike={(id) => {
          toggleLike(id);
          templatesService.likeTemplate(id).catch(() => {});
        }}
        onApply={apply}
        onOpenChange={setPreview}
      />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="border-border bg-card sm:max-w-xl">
          <form onSubmit={createTemplate} className="space-y-5">
            <DialogHeader>
              <DialogTitle>Create community template</DialogTitle>
              <DialogDescription>
                Save your current profile layout, effects, links, and styling as a reusable template.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="template-name">Name</Label>
                <Input
                  id="template-name"
                  value={templateDraft.name}
                  onChange={(e) => setTemplateDraft((draft) => ({ ...draft, name: e.target.value }))}
                  placeholder="Midnight portfolio"
                  maxLength={80}
                  data-testid="tpl-create-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="template-description">Description</Label>
                <Textarea
                  id="template-description"
                  value={templateDraft.description}
                  onChange={(e) => setTemplateDraft((draft) => ({ ...draft, description: e.target.value }))}
                  placeholder="A clean dark profile for creators."
                  maxLength={240}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Style</Label>
                  <Select value={templateDraft.style} onValueChange={(value) => setTemplateDraft((draft) => ({ ...draft, style: value }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TEMPLATE_CATEGORIES.map((item) => (
                        <SelectItem key={item} value={item.toLowerCase()}>{item}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="template-tags">Tags</Label>
                  <Input
                    id="template-tags"
                    value={templateDraft.tags}
                    onChange={(e) => setTemplateDraft((draft) => ({ ...draft, tags: e.target.value }))}
                    placeholder="dark, portfolio, clean"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/20 px-4 py-3">
                <div>
                  <Label htmlFor="template-published">Publish publicly</Label>
                  <p className="text-xs text-muted-foreground">Turn this off to save it privately for later.</p>
                </div>
                <Switch
                  id="template-published"
                  checked={templateDraft.isPublished}
                  onCheckedChange={(value) => setTemplateDraft((draft) => ({ ...draft, isPublished: value }))}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} disabled={creating}>Cancel</Button>
              <Button type="submit" disabled={creating}>
                {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                {templateDraft.isPublished ? 'Publish template' : 'Save template'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
