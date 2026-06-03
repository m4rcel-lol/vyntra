import { useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Home, Frown } from 'lucide-react';
import { PublicProfileRenderer } from '@/components/profile/PublicProfileRenderer';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { Logo } from '@/components/common/Logo';
import { Button } from '@/components/ui/button';
import { profileService } from '@/services/profile.service';

export default function PublicProfilePage() {
  const { username } = useParams();
  const viewedRef = useRef(null);
  const queryClient = useQueryClient();
  const { data: profile, isLoading, isError } = useQuery({
    queryKey: ['public-profile', username],
    queryFn: () => profileService.getPublicProfile(username),
    retry: false,
  });

  useEffect(() => {
    if (!username || !profile || viewedRef.current === username) return;
    viewedRef.current = username;
    profileService.recordView(username)
      .then((result) => {
        if (typeof result?.viewCount !== 'number') return;
        queryClient.setQueryData(['public-profile', username], (current) =>
          current ? { ...current, views: result.viewCount } : current
        );
      })
      .catch(() => {
        viewedRef.current = null;
      });
  }, [profile, queryClient, username]);

  if (isLoading) return <LoadingScreen />;

  if (isError || !profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary/60"><Frown className="h-7 w-7 text-muted-foreground" /></div>
        <h1 className="font-display text-2xl font-semibold">@{username} isn't here</h1>
        <p className="max-w-sm text-muted-foreground">This profile does not exist or is private.</p>
        <Button asChild className="mt-2"><Link to="/"><Home className="h-4 w-4" /> Back home</Link></Button>
      </div>
    );
  }

  return (
    <div className="relative">
      <Link
        to="/"
        className="fixed left-4 top-4 z-30 flex items-center gap-2 rounded-full glass-strong border-gradient px-3 py-1.5 text-xs text-foreground/70 transition-colors hover:text-foreground"
        aria-label="Vyntra home"
      >
        <Logo size={18} showText={false} /> vyntra.bio
      </Link>
      <PublicProfileRenderer profile={profile} />
    </div>
  );
}
