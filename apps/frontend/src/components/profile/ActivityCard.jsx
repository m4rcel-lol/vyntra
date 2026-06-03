import { Disc, Headphones } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS = {
  online: { color: '142 70% 45%', label: 'Online' },
  idle: { color: '38 92% 55%', label: 'Idle' },
  dnd: { color: '0 80% 60%', label: 'Do Not Disturb' },
  offline: { color: '0 0% 45%', label: 'Offline' },
};

export const DiscordCard = ({ activity, className }) => {
  if (!activity) return null;
  const st = STATUS[activity.status] || STATUS.offline;
  return (
    <div className={cn('flex items-center gap-3 rounded-2xl glass border-gradient p-3', className)}>
      <div className="relative shrink-0">
        <img src={activity.avatar} alt="" className="h-11 w-11 rounded-xl object-cover" />
        <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-card" style={{ background: `hsl(${st.color})` }} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-sm font-medium">
          <Disc className="h-3.5 w-3.5 text-muted-foreground" /> @{activity.username}
        </div>
        <p className="truncate text-xs text-muted-foreground">{activity.activity}</p>
      </div>
    </div>
  );
};

export const SpotifyCard = ({ activity, accent = '142 70% 45%', className }) => {
  if (!activity?.track && !activity?.artist) return null;
  return (
    <div className={cn('flex items-center gap-3 rounded-2xl glass border-gradient p-3', className)}>
      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl">
        <img src={activity.cover} alt="" className="h-full w-full object-cover" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Headphones className="h-3.5 w-3.5" /> Now playing
        </div>
        <p className="truncate text-sm font-medium">{activity.track}</p>
        <p className="truncate text-xs text-muted-foreground">{activity.artist}</p>
        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full" style={{ width: `${activity.progress}%`, background: `hsl(${accent})` }} />
        </div>
      </div>
    </div>
  );
};
