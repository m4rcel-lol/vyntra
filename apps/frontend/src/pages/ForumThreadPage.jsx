import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Eye, Lock, Loader2, MessageSquare, Pin, PinOff, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Footer } from '@/components/layout/Footer';
import { Logo } from '@/components/common/Logo';
import { GlassCard } from '@/components/common/GlassCard';
import { MarkdownRenderer } from '@/components/blog/MarkdownRenderer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { forumsService } from '@/services/forums.service';
import { useAuthStore } from '@/stores/auth.store';
import { formatDate, formatNumber } from '@/utils/format';

export default function ForumThreadPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const canModerate = ['owner', 'admin', 'moderator'].includes(user?.role);
  const [reply, setReply] = useState('');
  const { data, isLoading, isError } = useQuery({
    queryKey: ['forum-thread', slug],
    queryFn: () => forumsService.getThread(slug),
    enabled: !!slug,
    retry: false,
  });
  const thread = data?.thread;
  const posts = data?.posts ?? [];

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['forum-thread', slug] }),
      queryClient.invalidateQueries({ queryKey: ['forums'] }),
    ]);
  };

  const replyMutation = useMutation({
    mutationFn: () => forumsService.reply(thread.id, reply),
    onSuccess: async () => {
      setReply('');
      toast.success('Reply posted');
      await refresh();
    },
    onError: (error) => toast.error(error.message || 'Could not post reply'),
  });

  const patchThread = useMutation({
    mutationFn: (patch) => forumsService.updateThread(thread.id, patch),
    onSuccess: refresh,
    onError: (error) => toast.error(error.message || 'Could not update thread'),
  });

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading thread</div>;
  }

  if (isError || !thread) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <Logo />
        <h1 className="font-display text-2xl font-semibold">Thread not found</h1>
        <Button asChild><Link to="/forums"><ArrowLeft className="h-4 w-4" /> Back to forums</Link></Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/75 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link to="/" aria-label="Vyntra home"><Logo /></Link>
          <Button variant="ghost" asChild><Link to="/forums"><ArrowLeft className="h-4 w-4" /> Forums</Link></Button>
        </div>
      </header>

      <main className="px-4 py-10 sm:px-6 sm:py-14">
        <article className="mx-auto max-w-4xl">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{thread.category?.name}</Badge>
            {thread.isPinned && <Badge className="border-border bg-secondary text-foreground"><Pin className="mr-1 h-3 w-3" /> Pinned</Badge>}
            {thread.isLocked && <Badge variant="outline"><Lock className="mr-1 h-3 w-3" /> Locked</Badge>}
          </div>
          <h1 className="mt-5 font-display text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">{thread.title}</h1>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-y border-border py-4">
            <Author user={thread.author} date={thread.createdAt} />
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" /> {formatNumber(thread.replyCount)} replies</span>
              <span className="inline-flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {formatNumber(thread.viewCount)} views</span>
            </div>
          </div>

          {canModerate && (
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="outline" size="sm" disabled={patchThread.isPending} onClick={() => patchThread.mutate({ isPinned: !thread.isPinned })}>
                {thread.isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                {thread.isPinned ? 'Unpin' : 'Pin'}
              </Button>
              <Button variant="outline" size="sm" disabled={patchThread.isPending} onClick={() => patchThread.mutate({ isLocked: !thread.isLocked })}>
                <Lock className="h-4 w-4" /> {thread.isLocked ? 'Unlock' : 'Lock'}
              </Button>
            </div>
          )}

          <GlassCard className="mt-6 p-5 sm:p-7">
            <MarkdownRenderer markdown={thread.bodyMarkdown} />
          </GlassCard>

          <section className="mt-8 space-y-4">
            <h2 className="font-display text-2xl font-semibold">Replies</h2>
            {posts.length ? posts.map((post) => (
              <GlassCard key={post.id} className="p-5">
                <Author user={post.author} date={post.createdAt} />
                <MarkdownRenderer markdown={post.bodyMarkdown} className="mt-4" />
              </GlassCard>
            )) : (
              <GlassCard className="p-6 text-sm text-muted-foreground">No replies yet.</GlassCard>
            )}
          </section>

          <GlassCard className="mt-6 p-5">
            {thread.isLocked && !canModerate ? (
              <p className="text-sm text-muted-foreground">This thread is locked.</p>
            ) : isAuthenticated ? (
              <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); replyMutation.mutate(); }}>
                <Textarea rows={5} value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Reply with Markdown..." />
                <Button type="submit" disabled={replyMutation.isPending || !reply.trim()}>
                  <Send className="h-4 w-4" /> {replyMutation.isPending ? 'Posting...' : 'Post reply'}
                </Button>
              </form>
            ) : (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">Log in to reply.</p>
                <Button onClick={() => navigate('/login', { state: { from: `/forums/${slug}` } })}>Log in</Button>
              </div>
            )}
          </GlassCard>
        </article>
      </main>
      <Footer />
    </div>
  );
}

function Author({ user, date }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <img src={user.avatar} alt={user.displayName} className="h-10 w-10 rounded-xl object-cover" />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{user.displayName}</p>
        <p className="text-xs text-muted-foreground">@{user.username} · {formatDate(date)}</p>
      </div>
    </div>
  );
}
