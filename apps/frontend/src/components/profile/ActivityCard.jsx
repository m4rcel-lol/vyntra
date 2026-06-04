import { Disc, Headphones, Music2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS = {
  online: 'Online',
  idle: 'Idle',
  dnd: 'Do Not Disturb',
  offline: 'Offline',
};

export const DiscordCard = ({ activity, className }) => {
  if (!activity) return null;
  const status = STATUS[activity.status] || STATUS.offline;
  return (
    <div className={cn('flex items-center gap-3 rounded-2xl glass border-gradient p-3', className)}>
      <div className="relative shrink-0">
        <img src={activity.avatar} alt="" className="h-11 w-11 rounded-xl object-cover" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-sm font-medium">
          <Disc className="h-3.5 w-3.5 text-muted-foreground" /> @{activity.username}
        </div>
        <p className="truncate text-xs text-muted-foreground">{status} · {activity.activity}</p>
      </div>
    </div>
  );
};

export const SpotifyCard = ({ activity, accent = '142 70% 45%', className }) => {
  if (!activity?.track && !activity?.artist) return null;
  return (
    <div className={cn('flex items-center gap-3 rounded-2xl glass border-gradient p-3', className)}>
      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl">
        {activity.cover ? (
          <img src={activity.cover} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-secondary text-muted-foreground">
            <Music2 className="h-5 w-5" />
          </div>
        )}
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
