import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Loader2, Lock, MessageSquare, Pin, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Footer } from '@/components/layout/Footer';
import { Logo } from '@/components/common/Logo';
import { GlassCard } from '@/components/common/GlassCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { forumsService } from '@/services/forums.service';
import { useAuthStore } from '@/stores/auth.store';
import { formatDate, formatNumber } from '@/utils/format';

export default function ForumsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draft, setDraft] = useState({ categoryId: '', title: '', bodyMarkdown: '' });
  const { data: categories = [], isLoading } = useQuery({ queryKey: ['forums'], queryFn: forumsService.list });
  const firstCategoryId = categories[0]?.id || '';
  const selectedCategoryId = draft.categoryId || firstCategoryId;

  const createThread = useMutation({
    mutationFn: () => forumsService.createThread({ ...draft, categoryId: selectedCategoryId }),
    onSuccess: async (result) => {
      toast.success('Forum thread created');
      setDialogOpen(false);
      setDraft({ categoryId: '', title: '', bodyMarkdown: '' });
      await queryClient.invalidateQueries({ queryKey: ['forums'] });
      navigate(`/forums/${result.thread.slug}`);
    },
    onError: (error) => toast.error(error.message || 'Could not create thread'),
  });

  const pinned = useMemo(() => categories.flatMap((category) => category.threads.filter((thread) => thread.isPinned).map((thread) => ({ ...thread, category }))).slice(0, 4), [categories]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/75 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" aria-label="Vyntra home"><Logo /></Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild><Link to="/blog">Blog</Link></Button>
            <Button onClick={() => navigate(isAuthenticated ? '/dashboard' : '/login')}>
              {isAuthenticated ? 'Dashboard' : 'Log in'} <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="px-4 py-12 sm:px-6 sm:py-16">
        <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.12),transparent_34%)]" />
        <section className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/40 px-3 py-1 text-xs text-muted-foreground">
                <MessageSquare className="h-3.5 w-3.5" /> Community support
              </div>
              <h1 className="mt-5 font-display text-4xl font-semibold tracking-tight sm:text-6xl">Forums</h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                Ask questions, share self-hosting fixes, show profile designs, and get help from the Vyntra community.
              </p>
            </div>
            <Button onClick={() => isAuthenticated ? setDialogOpen(true) : navigate('/login', { state: { from: '/forums' } })}>
              <Plus className="h-4 w-4" /> New thread
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-24 text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading forums</div>
          ) : (
            <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_18rem]">
              <div className="space-y-6">
                {categories.map((category) => (
                  <GlassCard key={category.id} className="p-5 sm:p-6">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h2 className="font-display text-xl font-semibold">{category.name}</h2>
                        <p className="mt-1 text-sm text-muted-foreground">{category.description}</p>
                      </div>
                      <Badge variant="outline">{formatNumber(category.threadCount)} threads</Badge>
                    </div>
                    <div className="mt-5 divide-y divide-border">
                      {category.threads.length ? category.threads.map((thread) => (
                        <ThreadRow key={thread.id} thread={thread} />
                      )) : (
                        <div className="rounded-xl border border-border bg-secondary/20 p-5 text-sm text-muted-foreground">No threads yet. Start the discussion.</div>
                      )}
                    </div>
                  </GlassCard>
                ))}
              </div>

              <aside className="space-y-4">
                <GlassCard className="p-5">
                  <h2 className="font-display text-lg font-semibold">Pinned</h2>
                  <div className="mt-4 space-y-3">
                    {pinned.length ? pinned.map((thread) => (
                      <Link key={thread.id} to={`/forums/${thread.slug}`} className="block rounded-xl border border-border bg-secondary/25 p-3 transition-colors hover:bg-secondary/50">
                        <p className="line-clamp-2 text-sm font-medium">{thread.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{thread.category.name}</p>
                      </Link>
                    )) : <p className="text-sm text-muted-foreground">No pinned threads yet.</p>}
                  </div>
                </GlassCard>
              </aside>
            </div>
          )}
        </section>
      </main>

      <Footer />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-2xl rounded-2xl border-border bg-card/95 backdrop-blur-xl">
          <DialogHeader><DialogTitle>Create forum thread</DialogTitle></DialogHeader>
          <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); createThread.mutate(); }}>
            <div className="grid gap-2">
              <Label>Category</Label>
              <select
                value={selectedCategoryId}
                onChange={(event) => setDraft((current) => ({ ...current, categoryId: event.target.value }))}
                className="h-10 rounded-xl border border-border bg-secondary/40 px-3 text-sm"
              >
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </div>
            <div className="grid gap-2">
              <Label>Title</Label>
              <Input value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} placeholder="How do I configure Vyntra behind Caddy?" />
            </div>
            <div className="grid gap-2">
              <Label>Markdown body</Label>
              <Textarea rows={8} value={draft.bodyMarkdown} onChange={(event) => setDraft((current) => ({ ...current, bodyMarkdown: event.target.value }))} placeholder="Describe the issue, steps, logs, and what you expected." />
            </div>
            <Button type="submit" disabled={createThread.isPending || !draft.title.trim() || !draft.bodyMarkdown.trim()}>
              {createThread.isPending ? 'Creating...' : 'Create thread'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ThreadRow({ thread }) {
  return (
    <Link to={`/forums/${thread.slug}`} className="block py-4 transition-colors hover:bg-secondary/20 sm:-mx-3 sm:rounded-xl sm:px-3">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {thread.isPinned && <Badge className="border-border bg-secondary text-foreground"><Pin className="mr-1 h-3 w-3" /> Pinned</Badge>}
            {thread.isLocked && <Badge variant="outline"><Lock className="mr-1 h-3 w-3" /> Locked</Badge>}
          </div>
          <h3 className="mt-2 line-clamp-2 font-display text-lg font-semibold">{thread.title}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{thread.excerpt}</p>
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <img src={thread.author.avatar} alt={thread.author.displayName} className="h-5 w-5 rounded-full object-cover" />
            <span>@{thread.author.username}</span>
            <span>·</span>
            <span>{formatDate(thread.updatedAt)}</span>
          </div>
        </div>
        <div className="hidden shrink-0 text-right text-xs text-muted-foreground sm:block">
          <p>{formatNumber(thread.replyCount)} replies</p>
          <p>{formatNumber(thread.viewCount)} views</p>
        </div>
      </div>
    </Link>
  );
}
