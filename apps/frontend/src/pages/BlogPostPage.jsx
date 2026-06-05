import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Heart, Loader2, PenLine, Pin, PinOff } from 'lucide-react';
import { toast } from 'sonner';
import { Footer } from '@/components/layout/Footer';
import { Logo } from '@/components/common/Logo';
import { GlassCard } from '@/components/common/GlassCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BlogEditorDialog } from '@/components/blog/BlogEditorDialog';
import { MarkdownRenderer } from '@/components/blog/MarkdownRenderer';
import { blogService } from '@/services/blog.service';
import { useAuthStore } from '@/stores/auth.store';
import { formatDate, formatNumber } from '@/utils/format';
import { cn } from '@/lib/utils';

export default function BlogPostPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [editorOpen, setEditorOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['blog-post', slug],
    queryFn: () => blogService.getPost(slug),
    enabled: !!slug,
    retry: false,
  });

  const post = data?.post;
  const canManage = !!data?.canManage;

  const refresh = async (nextSlug = slug) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['blog-post', nextSlug] }),
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] }),
    ]);
  };

  const submitPost = async (payload) => {
    try {
      const updated = await blogService.updatePost(post.id, payload);
      toast.success('Blog post updated');
      setEditorOpen(false);
      if (updated.slug !== slug) {
        navigate(`/blog/${updated.slug}`, { replace: true });
      }
      await refresh(updated.slug);
    } catch (error) {
      toast.error(error.message || 'Could not update post');
      throw error;
    }
  };

  const togglePin = async () => {
    setBusy(true);
    try {
      await blogService.setPinned(post.id, !post.isPinned);
      toast.success(post.isPinned ? 'Post unpinned' : 'Post pinned');
      await refresh();
    } catch (error) {
      toast.error(error.message || 'Could not update pin state');
    } finally {
      setBusy(false);
    }
  };

  const toggleLike = async () => {
    if (!isAuthenticated) {
      toast.error('Log in to like blog posts');
      navigate('/login', { state: { from: `/blog/${slug}` } });
      return;
    }
    setBusy(true);
    try {
      await blogService.toggleLike(post.id);
      await refresh();
    } catch (error) {
      toast.error(error.message || 'Could not update like');
    } finally {
      setBusy(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading post
      </div>
    );
  }

  if (isError || !post) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <Logo />
        <h1 className="font-display text-2xl font-semibold">Post not found</h1>
        <p className="max-w-sm text-muted-foreground">This blog post does not exist or is not published.</p>
        <Button asChild><Link to="/blog"><ArrowLeft className="h-4 w-4" /> Back to blog</Link></Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/75 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/" aria-label="Vyntra home"><Logo /></Link>
          <Button variant="ghost" asChild><Link to="/blog"><ArrowLeft className="h-4 w-4" /> Blog</Link></Button>
        </div>
      </header>

      <main className="px-4 py-12 sm:px-6 sm:py-20">
        <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.13),transparent_34%)]" />
        <article className="mx-auto max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            {post.isPinned && <Badge className="border-border bg-secondary text-foreground"><Pin className="mr-1 h-3 w-3" /> Pinned</Badge>}
            {!post.isPublished && <Badge variant="outline">Draft</Badge>}
          </div>

          <h1 className="mt-5 font-display text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">{post.title}</h1>
          {post.excerpt && <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{post.excerpt}</p>}

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-y border-border py-5">
            <div className="flex min-w-0 items-center gap-3">
              <img src={post.author.avatar} alt={post.author.displayName} className="h-11 w-11 rounded-xl object-cover" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{post.author.displayName}</p>
                <p className="text-xs text-muted-foreground">@{post.author.username} · {formatDate(post.publishedAt)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant={post.likedByMe ? 'default' : 'outline'} size="sm" onClick={toggleLike} disabled={busy}>
                <Heart className={cn('h-4 w-4', post.likedByMe && 'fill-current')} />
                {formatNumber(post.likeCount)}
              </Button>
              {canManage && (
                <>
                  <Button variant="outline" size="sm" onClick={() => setEditorOpen(true)}>
                    <PenLine className="h-4 w-4" /> Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={togglePin} disabled={busy}>
                    {post.isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                    {post.isPinned ? 'Unpin' : 'Pin'}
                  </Button>
                </>
              )}
            </div>
          </div>

          <GlassCard className="mt-8 p-6 sm:p-8">
            <MarkdownRenderer markdown={post.contentMarkdown} />
          </GlassCard>
        </article>
      </main>

      <Footer />

      <BlogEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        post={post}
        onSubmit={submitPost}
      />
    </div>
  );
}
