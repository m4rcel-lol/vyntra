import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, Eye, Trophy } from 'lucide-react';
import { Logo } from '@/components/common/Logo';
import { GlassCard } from '@/components/common/GlassCard';
import { Button } from '@/components/ui/button';
import { profileService } from '@/services/profile.service';
import { formatNumber } from '@/utils/format';

export default function LeaderboardPage() {
  const { data: profiles = [] } = useQuery({ queryKey: ['leaderboard'], queryFn: profileService.listProfiles });

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <nav className="mb-10 flex items-center justify-between">
          <Link to="/" aria-label="Vyntra home"><Logo /></Link>
          <Button asChild variant="outline"><Link to="/dashboard">Dashboard</Link></Button>
        </nav>

        <div className="mb-8">
          <p className="mb-3 text-xs uppercase tracking-[0.28em] text-muted-foreground">Community ranking</p>
          <h1 className="font-display text-4xl font-semibold tracking-tight">Leaderboard</h1>
          <p className="mt-2 text-muted-foreground">Public profiles ranked by profile views.</p>
        </div>

        <div className="space-y-3">
          {profiles.map((profile) => (
            <GlassCard key={profile.username} className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-secondary/70 font-display text-lg font-semibold">
                  {profile.rank <= 3 ? <Trophy className="h-5 w-5" /> : profile.rank}
                </div>
                <img src={profile.avatar} alt="" className="h-12 w-12 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{profile.displayName}</p>
                  <p className="truncate text-sm text-muted-foreground">@{profile.username} · {profile.bio || profile.layout}</p>
                </div>
                <div className="hidden items-center gap-1 text-sm text-muted-foreground sm:flex">
                  <Eye className="h-4 w-4" /> {formatNumber(profile.views)}
                </div>
                <Button asChild size="icon" variant="outline"><Link to={`/u/${profile.username}`}><ArrowUpRight className="h-4 w-4" /></Link></Button>
              </div>
            </GlassCard>
          ))}
        </div>

        {!profiles.length && <GlassCard className="p-10 text-center text-muted-foreground">No public profiles yet.</GlassCard>}
      </div>
    </main>
  );
}
