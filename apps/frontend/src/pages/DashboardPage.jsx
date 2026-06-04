import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, Tooltip } from 'recharts';
import { ChartFrame } from '@/components/common/ChartFrame';
import {
  Eye, MousePointerClick, Users, Percent, PenTool, Share2, LayoutTemplate,
  BarChart3, Sparkles, Check, ArrowRight,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { GlassCard } from '@/components/common/GlassCard';
import { StatCard } from '@/components/common/StatCard';
import { PublicProfileRenderer } from '@/components/profile/PublicProfileRenderer';
import { Icon } from '@/components/common/Icon';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { dashboardData } from '@/services/backend';
import { formatNumber, formatRelative } from '@/utils/format';
import { toast } from 'sonner';

const CHECKLIST = [
  { label: 'Set a display name', done: true },
  { label: 'Add a bio', done: true },
  { label: 'Upload an avatar', done: true },
  { label: 'Add 3+ social links', done: true },
  { label: 'Use the minimal profile layout', done: true },
  { label: 'Set a background', done: true },
  { label: 'Add a music track', done: false },
  { label: 'Verify your account', done: false },
];

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-soft">
      <p className="text-muted-foreground">{label}</p>
      <p className="font-medium">{formatNumber(payload[0].value)} views</p>
    </div>
  );
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: dashboardData });
  const currentUser = data?.user ?? { username: 'user', displayName: 'Creator' };
  const currentProfile = data?.profile;
  const analyticsTotals = data?.analytics?.totals ?? { views: 0, uniqueVisitors: 0, linkClicks: 0, ctr: 0 };
  const viewsOverTime = data?.analytics?.viewsOverTime ?? [];
  const mostClickedLinks = data?.analytics?.mostClickedLinks ?? [];
  const checklist = data?.dashboard?.checklist ?? CHECKLIST;
  const chartData = useMemo(() => viewsOverTime.slice(-14), [viewsOverTime]);
  const activity = useMemo(() => {
    const recentViews = data?.dashboard?.recentViews ?? [];
    const recentClicks = data?.dashboard?.recentClicks ?? [];
    const announcements = data?.dashboard?.announcements ?? [];

    return [
      ...recentViews.map((view) => ({
        id: `view-${view.id}`,
        icon: Eye,
        text: `Profile view from ${view.referrer || view.country || view.device || 'direct traffic'}`,
        time: view.createdAt,
      })),
      ...recentClicks.map((click) => ({
        id: `click-${click.id}`,
        icon: MousePointerClick,
        text: `${click.link?.title || 'A link'} was clicked`,
        time: click.createdAt,
      })),
      ...announcements.map((announcement) => ({
        id: `announcement-${announcement.id}`,
        icon: Sparkles,
        text: announcement.title,
        time: announcement.createdAt,
      })),
    ]
      .filter((item) => item.time)
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 6);
  }, [data]);
  const completion = Math.round((checklist.filter((c) => c.done).length / Math.max(checklist.length, 1)) * 100);

  const share = () => {
    const url = `${window.location.origin}/u/${currentUser.username}`;
    navigator.clipboard?.writeText(url);
    toast.success('Profile link copied to clipboard');
  };

  return (
    <DashboardLayout title="Dashboard">
      {/* Greeting */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold tracking-tight">
            Welcome back, {(currentUser.displayName || currentUser.username).split(' ')[0]}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Here is how <span className="text-foreground">vyntra.bio/{currentUser.username}</span> is performing.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={share} data-testid="dash-share"><Share2 className="h-4 w-4" /> Share</Button>
          <Button onClick={() => navigate('/dashboard/editor')} data-testid="dash-edit"><PenTool className="h-4 w-4" /> Edit profile</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Eye} label="Total views" value={isLoading ? '...' : formatNumber(analyticsTotals.views)} delta={analyticsTotals.viewsDelta} />
        <StatCard icon={Users} label="Unique visitors" value={isLoading ? '...' : formatNumber(analyticsTotals.uniqueVisitors)} delta={analyticsTotals.visitorsDelta} />
        <StatCard icon={MousePointerClick} label="Link clicks" value={isLoading ? '...' : formatNumber(analyticsTotals.linkClicks)} delta={analyticsTotals.clicksDelta} />
        <StatCard icon={Percent} label="Click-through rate" value={analyticsTotals.ctr} suffix="%" delta={analyticsTotals.ctrDelta} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Views chart */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-semibold">Profile views</h3>
                <p className="text-sm text-muted-foreground">Last 14 days</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/analytics')}>
                View all <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            <ChartFrame height={224} className="mt-4">
              {(w, h) => (
                <AreaChart width={w} height={h} data={chartData} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
                  <defs>
                    <linearGradient id="dashViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(0 0% 100%)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="hsl(0 0% 100%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" tick={{ fill: 'hsl(0 0% 45%)', fontSize: 11 }} axisLine={false} tickLine={false} interval={2} />
                  <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'hsl(0 0% 40%)', strokeDasharray: 4 }} />
                  <Area type="monotone" dataKey="views" stroke="hsl(0 0% 96%)" strokeWidth={2} fill="url(#dashViews)" />
                </AreaChart>
              )}
            </ChartFrame>
          </GlassCard>

          {/* Recent link clicks + activity */}
          <div className="grid gap-6 md:grid-cols-2">
            <GlassCard className="p-6">
              <h3 className="font-display text-lg font-semibold">Top links</h3>
              <p className="text-sm text-muted-foreground">Most clicked in the last 30 days</p>
              <ul className="mt-4 space-y-3">
                {mostClickedLinks.length ? mostClickedLinks.map((l) => (
                  <li key={l.label} className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary/60">
                      <Icon name={l.icon} className="h-4 w-4" />
                    </div>
                    <span className="flex-1 truncate text-sm">{l.label}</span>
                    <span className="text-sm font-medium tabular-nums">{formatNumber(l.clicks)}</span>
                  </li>
                )) : <li className="text-sm text-muted-foreground">No link clicks yet.</li>}
              </ul>
            </GlassCard>

            <GlassCard className="p-6">
              <h3 className="font-display text-lg font-semibold">Recent activity</h3>
              <p className="text-sm text-muted-foreground">What is happening</p>
              <ul className="mt-4 space-y-4">
                {activity.map((a, i) => (
                  <motion.li
                    key={a.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex gap-3"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary/60">
                      <a.icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm leading-snug">{a.text}</p>
                      <p className="text-xs text-muted-foreground">{formatRelative(a.time)}</p>
                    </div>
                  </motion.li>
                ))}
                {!activity.length && (
                  <li className="rounded-xl border border-border bg-secondary/20 px-4 py-3 text-sm text-muted-foreground">
                    No recent views, clicks, or announcements yet.
                  </li>
                )}
              </ul>
            </GlassCard>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Profile preview */}
          <GlassCard className="flex flex-col items-center p-6">
            <h3 className="self-start font-display text-lg font-semibold">Your public profile</h3>
            <div className="mt-4 h-[520px] w-full overflow-hidden rounded-2xl border border-border bg-background shadow-soft">
              {currentProfile ? (
                <PublicProfileRenderer profile={currentProfile} preview forceEntered />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading profile preview...</div>
              )}
            </div>
            <div className="mt-5 grid w-full grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => navigate(`/u/${currentUser.username}`)}>Preview</Button>
              <Button onClick={() => navigate('/dashboard/editor')}>Customize</Button>
            </div>
          </GlassCard>

          {/* Completion checklist */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold">Profile completion</h3>
              <span className="text-sm font-medium">{completion}%</span>
            </div>
            <Progress value={completion} className="mt-3 h-2" />
            <ul className="mt-4 space-y-2.5">
              {checklist.map((c) => (
                <li key={c.label} className="flex items-center gap-2.5 text-sm">
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full ${c.done ? 'bg-success/20 text-success' : 'border border-border text-muted-foreground'}`}>
                    {c.done && <Check className="h-3 w-3" />}
                  </span>
                  <span className={c.done ? 'text-muted-foreground line-through' : ''}>{c.label}</span>
                </li>
              ))}
            </ul>
          </GlassCard>

          {/* Quick actions */}
          <GlassCard className="p-6">
            <h3 className="font-display text-lg font-semibold">Quick actions</h3>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {[
                { label: 'Editor', icon: PenTool, to: '/dashboard/editor' },
                { label: 'Templates', icon: LayoutTemplate, to: '/dashboard/templates' },
                { label: 'Analytics', icon: BarChart3, to: '/dashboard/analytics' },
                { label: 'Unlimited', icon: Sparkles, to: '/dashboard/settings' },
              ].map((q) => (
                <button
                  key={q.label}
                  onClick={() => navigate(q.to)}
                  className="flex flex-col items-start gap-2 rounded-xl border border-border bg-secondary/30 p-3 text-left transition-colors hover:bg-secondary/60"
                >
                  <q.icon className="h-5 w-5" />
                  <span className="text-sm font-medium">{q.label}</span>
                </button>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </DashboardLayout>
  );
}
