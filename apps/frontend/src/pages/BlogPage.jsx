import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Heart, Loader2, PenLine, Pin, PinOff, Plus, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Footer } from '@/components/layout/Footer';
import { Logo } from '@/components/common/Logo';
import { GlassCard } from '@/components/common/GlassCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BlogEditorDialog } from '@/components/blog/BlogEditorDialog';
import { blogService } from '@/services/blog.service';
import { useAuthStore } from '@/stores/auth.store';
import { formatDate, formatNumber } from '@/utils/format';
import { cn } from '@/lib/utils';

export default function BlogPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [busyPostId, setBusyPostId] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['blog-posts'],
    queryFn: blogService.listPosts,
  });
  const posts = data?.posts ?? [];
  const canManage = !!data?.canManage;

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['blog-posts'] });

  const submitPost = async (payload) => {
    try {
      if (editingPost) {
        await blogService.updatePost(editingPost.id, payload);
        toast.success('Blog post updated');
      } else {
        await blogService.createPost(payload);
        toast.success(payload.isPublished ? 'Blog post published' : 'Draft saved');
      }
      setEditingPost(null);
      await refresh();
    } catch (error) {
      toast.error(error.message || 'Could not save blog post');
      throw error;
    }
  };

  const togglePin = async (post) => {
    setBusyPostId(post.id);
    try {
      await blogService.setPinned(post.id, !post.isPinned);
      toast.success(post.isPinned ? 'Post unpinned' : 'Post pinned');
      await refresh();
    } catch (error) {
      toast.error(error.message || 'Could not update pin state');
    } finally {
      setBusyPostId(null);
    }
  };

  const toggleLike = async (post) => {
    if (!isAuthenticated) {
      toast.error('Log in to like blog posts');
      navigate('/login', { state: { from: '/blog' } });
      return;
    }
    setBusyPostId(post.id);
    try {
      await blogService.toggleLike(post.id);
      await refresh();
    } catch (error) {
      toast.error(error.message || 'Could not update like');
    } finally {
      setBusyPostId(null);
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/75 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/" aria-label="Vyntra home"><Logo /></Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild><Link to="/explore">Templates</Link></Button>
            <Button onClick={() => navigate(isAuthenticated ? '/dashboard' : '/login')}>
              {isAuthenticated ? 'Dashboard' : 'Log in'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative px-6 py-16 sm:py-24">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-grid opacity-35" />
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.14),transparent_35%)]" />
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/40 px-3 py-1 text-xs font-medium text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5" /> Vyntra updates
                </div>
                <h1 className="mt-5 max-w-3xl font-display text-4xl font-semibold tracking-tight sm:text-6xl">Blog</h1>
                <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
                  Product updates, creator notes, moderation announcements, and self-hosting guides from the Vyntra team.
                </p>
              </div>
              {canManage && (
                <Button onClick={() => { setEditingPost(null); setEditorOpen(true); }}>
                  <Plus className="h-4 w-4" /> New post
                </Button>
              )}
            </div>

            {isLoading ? (
              <div className="mt-14 flex items-center justify-center py-20 text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading posts
              </div>
            ) : posts.length ? (
              <div className="mt-10 grid items-stretch gap-5 lg:grid-cols-2">
                {posts.map((post) => (
                  <BlogPostCard
                    key={post.id}
                    post={post}
                    canManage={canManage}
                    busy={busyPostId === post.id}
                    onLike={() => toggleLike(post)}
                    onPin={() => togglePin(post)}
                    onEdit={() => { setEditingPost(post); setEditorOpen(true); }}
                  />
                ))}
              </div>
            ) : (
              <GlassCard className="mt-10 p-8 text-center">
                <p className="font-display text-xl font-semibold">No blog posts yet</p>
                <p className="mt-2 text-sm text-muted-foreground">Staff posts will appear here once published.</p>
                {canManage && <Button className="mt-5" onClick={() => setEditorOpen(true)}>Create the first post</Button>}
              </GlassCard>
            )}
          </div>
        </section>
      </main>

      <Footer />

      <BlogEditorDialog
        open={editorOpen}
        onOpenChange={(open) => {
          setEditorOpen(open);
          if (!open) setEditingPost(null);
        }}
        post={editingPost}
        onSubmit={submitPost}
      />
    </div>
  );
}

function BlogPostCard({ post, canManage, busy, onLike, onPin, onEdit }) {
  return (
    <GlassCard glow={post.isPinned} className="group flex h-full min-h-[21rem] flex-col p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {post.isPinned && <Badge className="border-border bg-secondary text-foreground"><Pin className="mr-1 h-3 w-3" /> Pinned</Badge>}
          {!post.isPublished && <Badge variant="outline">Draft</Badge>}
        </div>
        {canManage && (
          <div className="flex shrink-0 gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit} aria-label="Edit post">
              <PenLine className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onPin} disabled={busy} aria-label={post.isPinned ? 'Unpin post' : 'Pin post'}>
              {post.isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
            </Button>
          </div>
        )}
      </div>

      <Link to={`/blog/${post.slug}`} className="mt-5 block flex-1">
        <h2 className="font-display text-2xl font-semibold tracking-tight transition-colors group-hover:text-foreground/80">{post.title}</h2>
        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{post.excerpt || 'Read the full update on the Vyntra blog.'}</p>
      </Link>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-5">
        <div className="flex min-w-0 items-center gap-3">
          <img src={post.author.avatar} alt={post.author.displayName} className="h-9 w-9 rounded-xl object-cover" />
          <div className="min-w-0">
            <p className="flex items-center gap-2 truncate text-sm font-medium">
              {post.author.displayName}
              {post.author.role !== 'user' && <Badge variant="outline" className="h-5 px-1.5 text-[10px] uppercase">{post.author.role}</Badge>}
            </p>
            <p className="text-xs text-muted-foreground">@{post.author.username} · {formatDate(post.publishedAt)}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onLike}
          disabled={busy}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs transition-colors hover:bg-secondary/60',
            post.likedByMe && 'border-foreground/30 bg-secondary text-foreground'
          )}
        >
          <Heart className={cn('h-3.5 w-3.5', post.likedByMe && 'fill-current')} />
          {formatNumber(post.likeCount)}
        </button>
      </div>
    </GlassCard>
  );
}
