import { useEffect, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Home, Frown, Users } from 'lucide-react';
import { toast } from 'sonner';
import { PublicProfileRenderer } from '@/components/profile/PublicProfileRenderer';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { Logo } from '@/components/common/Logo';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { profileService } from '@/services/profile.service';
import { socialService } from '@/services/social.service';
import { useAuthStore } from '@/stores/auth.store';

export default function PublicProfilePage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const viewedRef = useRef(null);
  const queryClient = useQueryClient();
  const [friendsOpen, setFriendsOpen] = useState(false);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { data: profile, isLoading, isError } = useQuery({
    queryKey: ['public-profile', username],
    queryFn: () => profileService.getPublicProfile(username),
    retry: false,
  });
  const { data: friendsData = { count: 0, state: 'guest', friends: [] } } = useQuery({
    queryKey: ['public-friends', username],
    queryFn: () => socialService.publicFriends(username),
    enabled: !!username && !!profile,
  });
  const friendMutation = useMutation({
    mutationFn: () => socialService.addFriend(username),
    onSuccess: async () => {
      toast.success(friendsData.state === 'pending_received' ? 'Friend request accepted' : 'Friend request sent');
      await queryClient.invalidateQueries({ queryKey: ['public-friends', username] });
    },
    onError: (error) => toast.error(error.message || 'Could not update friend request'),
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
      <PublicProfileRenderer
        profile={profile}
        social={{
          count: friendsData.count,
          state: friendsData.state,
          busy: friendMutation.isPending,
          onOpenFriends: () => setFriendsOpen(true),
          onAddFriend: () => {
            if (!isAuthenticated) {
              navigate('/login', { state: { from: `/u/${username}` } });
              return;
            }
            friendMutation.mutate();
          },
        }}
      />
      <Dialog open={friendsOpen} onOpenChange={setFriendsOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md rounded-2xl border-border bg-card/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" /> {friendsData.count} friends
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-96 space-y-2 overflow-y-auto">
            {friendsData.friends.length ? friendsData.friends.map((friend) => (
              <Link
                key={friend.id}
                to={`/u/${friend.username}`}
                onClick={() => setFriendsOpen(false)}
                className="flex items-center gap-3 rounded-xl border border-border bg-secondary/30 p-3 transition-colors hover:bg-secondary/60"
              >
                <img src={friend.avatar} alt={friend.displayName} className="h-10 w-10 rounded-xl object-cover" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{friend.displayName}</p>
                  <p className="truncate text-xs text-muted-foreground">@{friend.username}</p>
                </div>
              </Link>
            )) : (
              <div className="rounded-xl border border-border bg-secondary/20 p-6 text-center text-sm text-muted-foreground">
                No friends are shown yet.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
