import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';
import { Eye, Users, MousePointerClick, Percent, Download } from 'lucide-react';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/common/StatCard';
import { ChartFrame } from '@/components/common/ChartFrame';
import { ChartCard, ChartTooltip } from '@/components/analytics/ChartCard';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Icon } from '@/components/common/Icon';
import { analyticsService } from '@/services/analytics.service';
import { formatNumber } from '@/utils/format';
import { cn } from '@/lib/utils';

const RANGES = [
  { v: '7d', label: '7 days' },
  { v: '30d', label: '30 days' },
  { v: '90d', label: '90 days' },
];
const PIE = ['hsl(0 0% 92%)', 'hsl(0 0% 62%)', 'hsl(0 0% 38%)'];
const axis = { fill: 'hsl(0 0% 45%)', fontSize: 11 };

export default function AnalyticsPage() {
  const [range, setRange] = useState('30d');
  const { data } = useQuery({ queryKey: ['analytics', range], queryFn: () => analyticsService.getAnalytics(range) });
  const analyticsTotals = data?.totals ?? { views: 0, uniqueVisitors: 0, linkClicks: 0, ctr: 0 };
  const viewsOverTime = data?.viewsOverTime ?? [];
  const clicksOverTime = data?.clicksOverTime ?? [];
  const topCountries = data?.topCountries ?? [];
  const deviceTypes = data?.deviceTypes ?? [];
  const browsers = data?.browsers ?? [];
  const referrers = data?.referrers ?? [];
  const mostClickedLinks = data?.mostClickedLinks ?? [];
  const templateImports = data?.templateImports ?? [];
  const slice = range === '7d' ? -7 : range === '90d' ? -90 : -30;
  const views = viewsOverTime.slice(slice);
  const clicks = clicksOverTime.slice(slice);
  const maxCountry = Math.max(...topCountries.map((c) => c.value), 1);

  return (
    <DashboardLayout title="Analytics">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold tracking-tight">Analytics</h2>
          <p className="text-sm text-muted-foreground">Understand who visits and what they click.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-border bg-secondary/30 p-0.5">
            {RANGES.map((r) => (
              <button key={r.v} onClick={() => setRange(r.v)} className={cn('rounded-md px-3 py-1.5 text-xs font-medium transition-colors', range === r.v ? 'bg-secondary text-foreground' : 'text-muted-foreground')}>
                {r.label}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={() => toast.success('Export prepared locally')}><Download className="h-3.5 w-3.5" /> Export</Button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Eye} label="Total views" value={formatNumber(analyticsTotals.views)} delta={analyticsTotals.viewsDelta} />
        <StatCard icon={Users} label="Unique visitors" value={formatNumber(analyticsTotals.uniqueVisitors)} delta={analyticsTotals.visitorsDelta} />
        <StatCard icon={MousePointerClick} label="Link clicks" value={formatNumber(analyticsTotals.linkClicks)} delta={analyticsTotals.clicksDelta} />
        <StatCard icon={Percent} label="CTR" value={analyticsTotals.ctr} suffix="%" delta={analyticsTotals.ctrDelta} />
      </div>

      {/* Views over time */}
      <ChartCard className="mt-6" title="Views & visitors" subtitle="Traffic over the selected period">
        <ChartFrame height={280}>
          {(w, h) => (
            <AreaChart width={w} height={h} data={views} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="aViews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(0 0% 100%)" stopOpacity={0.32} />
                  <stop offset="100%" stopColor="hsl(0 0% 100%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="aVis" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(0 0% 55%)" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="hsl(0 0% 55%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 14%)" vertical={false} />
              <XAxis dataKey="label" tick={axis} axisLine={false} tickLine={false} interval={Math.ceil(views.length / 8)} />
              <YAxis tick={axis} axisLine={false} tickLine={false} width={42} tickFormatter={formatNumber} />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'hsl(0 0% 40%)', strokeDasharray: 4 }} />
              <Area type="monotone" dataKey="views" stroke="hsl(0 0% 96%)" strokeWidth={2} fill="url(#aViews)" />
              <Area type="monotone" dataKey="visitors" stroke="hsl(0 0% 55%)" strokeWidth={2} fill="url(#aVis)" />
            </AreaChart>
          )}
        </ChartFrame>
      </ChartCard>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Link clicks bar */}
        <ChartCard className="lg:col-span-2" title="Link clicks" subtitle="Daily click volume">
          <ChartFrame height={240}>
            {(w, h) => (
              <BarChart width={w} height={h} data={clicks} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 14%)" vertical={false} />
                <XAxis dataKey="label" tick={axis} axisLine={false} tickLine={false} interval={Math.ceil(clicks.length / 8)} />
                <YAxis tick={axis} axisLine={false} tickLine={false} width={42} tickFormatter={formatNumber} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'hsl(0 0% 100% / 0.04)' }} />
                <Bar dataKey="clicks" fill="hsl(0 0% 74%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ChartFrame>
        </ChartCard>

        {/* Device donut */}
        <ChartCard title="Devices" subtitle="Visitor device types">
          <ChartFrame height={240}>
            {(w, h) => (
              <PieChart width={w} height={h}>
                <Pie data={deviceTypes} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={52} outerRadius={84} paddingAngle={3} stroke="none">
                  {deviceTypes.map((d, i) => <Cell key={d.name} fill={PIE[i % PIE.length]} />)}
                </Pie>
                <Tooltip content={<ChartTooltip unit="%" />} />
              </PieChart>
            )}
          </ChartFrame>
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            {deviceTypes.map((d, i) => (
              <span key={d.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: PIE[i % PIE.length] }} /> {d.name} {d.value}%
              </span>
            ))}
          </div>
        </ChartCard>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Top countries */}
        <ChartCard title="Top countries" subtitle="Where your visitors are">
          <ul className="space-y-3">
            {topCountries.length ? topCountries.map((c) => (
              <li key={c.code}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span>{c.country}</span>
                  <span className="text-muted-foreground">{formatNumber(c.value)}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-foreground/80" style={{ width: `${(c.value / maxCountry) * 100}%` }} />
                </div>
              </li>
            )) : <li className="text-sm text-muted-foreground">No country data yet.</li>}
          </ul>
        </ChartCard>

        {/* Browsers */}
        <ChartCard title="Browsers" subtitle="Visitor browsers">
          <ChartFrame height={220}>
            {(w, h) => (
              <BarChart layout="vertical" width={w} height={h} data={browsers} margin={{ top: 0, right: 12, left: 10, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" tick={axis} axisLine={false} tickLine={false} width={56} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'hsl(0 0% 100% / 0.04)' }} />
                <Bar dataKey="value" fill="hsl(0 0% 70%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            )}
          </ChartFrame>
        </ChartCard>

        {/* Referrers */}
        <ChartCard title="Referrers" subtitle="Top traffic sources">
          <ul className="space-y-3">
            {referrers.length ? referrers.map((r) => {
              const max = Math.max(...referrers.map((x) => x.value), 1);
              return (
                <li key={r.name}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span>{r.name}</span>
                    <span className="text-muted-foreground">{formatNumber(r.value)}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                    <div className="h-full rounded-full bg-foreground/70" style={{ width: `${(r.value / max) * 100}%` }} />
                  </div>
                </li>
              );
            }) : <li className="text-sm text-muted-foreground">No referrers yet.</li>}
          </ul>
        </ChartCard>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Most clicked links table */}
        <ChartCard title="Most clicked links" subtitle="Your best performers">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>Link</TableHead>
                <TableHead className="text-right">Clicks</TableHead>
                <TableHead className="text-right">Share</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mostClickedLinks.map((l) => {
                const total = mostClickedLinks.reduce((a, b) => a + b.clicks, 0) || 1;
                return (
                  <TableRow key={l.label} className="border-border">
                    <TableCell className="flex items-center gap-2 font-medium"><Icon name={l.icon} className="h-4 w-4" /> {l.label}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatNumber(l.clicks)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{Math.round((l.clicks / total) * 100)}%</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </ChartCard>

        {/* Template imports */}
        <ChartCard title="Template imports" subtitle="Templates imported by this profile">
          <ChartFrame height={236}>
            {(w, h) => (
              <AreaChart width={w} height={h} data={templateImports} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="aImp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(0 0% 100%)" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="hsl(0 0% 100%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 14%)" vertical={false} />
                <XAxis dataKey="label" tick={axis} axisLine={false} tickLine={false} interval={2} />
                <YAxis tick={axis} axisLine={false} tickLine={false} width={32} />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'hsl(0 0% 40%)', strokeDasharray: 4 }} />
                <Area type="monotone" dataKey="imports" stroke="hsl(0 0% 92%)" strokeWidth={2} fill="url(#aImp)" />
              </AreaChart>
            )}
          </ChartFrame>
        </ChartCard>
      </div>
    </DashboardLayout>
  );
}
