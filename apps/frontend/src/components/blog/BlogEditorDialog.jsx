import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

const defaultMarkdown = `# New Vyntra update

Write your announcement in **Markdown**.

- Add clear sections
- Link to resources with [label](https://example.com)
- Use fenced code blocks for technical notes
`;

const emptyDraft = {
  title: '',
  slug: '',
  excerpt: '',
  contentMarkdown: defaultMarkdown,
  isPublished: true,
  isPinned: false,
};

export function BlogEditorDialog({ open, onOpenChange, post, onSubmit }) {
  const [draft, setDraft] = useState(emptyDraft);
  const [saving, setSaving] = useState(false);
  const editing = Boolean(post?.id);

  useEffect(() => {
    if (!open) return;
    setDraft(post ? {
      title: post.title || '',
      slug: post.slug || '',
      excerpt: post.excerpt || '',
      contentMarkdown: post.contentMarkdown || '',
      isPublished: post.isPublished !== false,
      isPinned: !!post.isPinned,
    } : emptyDraft);
  }, [open, post]);

  const update = (key, value) => setDraft((current) => ({ ...current, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    const payload = {
      title: draft.title.trim(),
      slug: draft.slug.trim() || undefined,
      excerpt: draft.excerpt.trim(),
      contentMarkdown: draft.contentMarkdown.trim(),
      isPublished: draft.isPublished,
      isPinned: draft.isPinned,
    };
    if (!payload.title || !payload.contentMarkdown) return;
    setSaving(true);
    try {
      await onSubmit(payload);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto border-border bg-card sm:max-w-3xl">
        <form onSubmit={submit} className="space-y-5">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit blog post' : 'Create blog post'}</DialogTitle>
            <DialogDescription>
              Blog posts support Markdown and can be published or kept as staff-only drafts.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-[1fr_220px]">
              <div className="space-y-2">
                <Label htmlFor="blog-title">Title</Label>
                <Input id="blog-title" value={draft.title} onChange={(event) => update('title', event.target.value)} maxLength={140} placeholder="Platform update" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="blog-slug">Slug</Label>
                <Input id="blog-slug" value={draft.slug} onChange={(event) => update('slug', event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))} maxLength={90} placeholder="auto-generated" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="blog-excerpt">Excerpt</Label>
              <Textarea id="blog-excerpt" value={draft.excerpt} onChange={(event) => update('excerpt', event.target.value)} maxLength={280} placeholder="Short summary shown on the blog homepage." />
            </div>

            <div className="space-y-2">
              <Label htmlFor="blog-content">Markdown content</Label>
              <Textarea
                id="blog-content"
                value={draft.contentMarkdown}
                onChange={(event) => update('contentMarkdown', event.target.value)}
                className="min-h-[320px] font-mono text-sm"
                required
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/20 px-4 py-3">
                <div>
                  <Label htmlFor="blog-published">Published</Label>
                  <p className="text-xs text-muted-foreground">Visible to everyone on /blog.</p>
                </div>
                <Switch id="blog-published" checked={draft.isPublished} onCheckedChange={(value) => update('isPublished', value)} />
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/20 px-4 py-3">
                <div>
                  <Label htmlFor="blog-pinned">Pinned</Label>
                  <p className="text-xs text-muted-foreground">Pinned posts show first.</p>
                </div>
                <Switch id="blog-pinned" checked={draft.isPinned} onCheckedChange={(value) => update('isPinned', value)} />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" disabled={saving || !draft.title.trim() || !draft.contentMarkdown.trim()}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? 'Save post' : 'Publish post'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
