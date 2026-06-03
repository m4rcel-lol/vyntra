import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Eye, MousePointerClick, Users, ArrowRight } from 'lucide-react';
import { EditorSection } from '@/components/editor/Field';
import { Button } from '@/components/ui/button';
import { analyticsService } from '@/services/analytics.service';
import { formatNumber } from '@/utils/format';

const Stat = ({ icon: Icon, label, value }) => (
  <div className="rounded-xl border border-border bg-secondary/20 p-4">
    <Icon className="h-4 w-4 text-muted-foreground" />
    <p className="mt-2 font-display text-xl font-semibold">{value}</p>
    <p className="text-xs text-muted-foreground">{label}</p>
  </div>
);

export const AnalyticsTab = () => {
  const navigate = useNavigate();
  const { data } = useQuery({ queryKey: ['editor-analytics'], queryFn: () => analyticsService.getAnalytics('30d') });
  const totals = data?.totals ?? { views: 0, uniqueVisitors: 0, linkClicks: 0 };
  const links = data?.mostClickedLinks ?? [];

  return (
    <EditorSection title="Analytics" description="A snapshot of your performance.">
      <div className="grid grid-cols-3 gap-3">
        <Stat icon={Eye} label="Views" value={formatNumber(totals.views)} />
        <Stat icon={Users} label="Visitors" value={formatNumber(totals.uniqueVisitors)} />
        <Stat icon={MousePointerClick} label="Clicks" value={formatNumber(totals.linkClicks)} />
      </div>
      <div className="rounded-xl border border-border bg-secondary/20 p-4">
        <p className="text-sm font-medium">Top links</p>
        <ul className="mt-3 space-y-2">
          {links.slice(0, 4).map((l) => (
            <li key={l.label} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{l.label}</span>
              <span className="font-medium">{formatNumber(l.clicks)}</span>
            </li>
          ))}
          {!links.length && <li className="text-sm text-muted-foreground">No link clicks yet.</li>}
        </ul>
      </div>
      <Button variant="outline" className="w-full" onClick={() => navigate('/analytics')}>Open full analytics <ArrowRight className="h-4 w-4" /></Button>
    </EditorSection>
  );
};
