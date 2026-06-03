import { MapPin, CalendarDays, Hash, Eye, BadgeCheck } from 'lucide-react';
import { formatDate, formatNumber } from '@/utils/format';
import { cn } from '@/lib/utils';

export const ProfileAvatar = ({ profile, size = 96, className }) => {
  const accent = `hsl(${profile.accent})`;
  return (
    <div className={cn('relative z-20 shrink-0', className)} style={{ width: size, height: size }}>
      <img
        src={profile.avatar}
        alt={profile.displayName}
        className="h-full w-full rounded-3xl border-2 border-background object-cover"
        style={{ boxShadow: `0 0 36px -8px ${accent}` }}
      />
      <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-background bg-success" />
    </div>
  );
};

export const ProfileIdentity = ({ profile, align = 'center', className }) => {
  const verified = profile.badges?.some((b) => {
    const value = `${b.slug || ''} ${b.label || ''} ${b.name || ''}`.toLowerCase();
    return value.includes('verified');
  });
  return (
    <div className={cn(align === 'center' ? 'text-center' : 'text-left', className)}>
      <div className={cn('flex items-center gap-1.5', align === 'center' && 'justify-center')}>
        <h1 className="font-display text-2xl font-semibold tracking-tight">{profile.displayName}</h1>
        {verified && <BadgeCheck className="h-5 w-5" style={{ color: `hsl(${profile.accent})` }} />}
      </div>
      <p className="text-sm text-muted-foreground">@{profile.username}</p>
      {profile.status && (
        <span className={cn('mt-2 inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/40 px-3 py-1 text-xs text-foreground/80', align === 'center' ? 'mx-auto' : '')}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: `hsl(${profile.accent})` }} />
          {profile.status}
        </span>
      )}
      {profile.bio && <p className="mt-3 text-sm leading-relaxed text-foreground/80">{profile.bio}</p>}
    </div>
  );
};

export const ProfileMeta = ({ profile, align = 'center', className }) => (
  <div className={cn('flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground', align === 'center' ? 'justify-center' : '', className)}>
    {profile.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {profile.location}</span>}
    {profile.joinDate && <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> Joined {formatDate(profile.joinDate)}</span>}
    {profile.uid && <span className="inline-flex items-center gap-1 font-mono"><Hash className="h-3.5 w-3.5" />{profile.uid}</span>}
    <span className="inline-flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {formatNumber(profile.views)} views</span>
  </div>
);

export const ProfileEmbeds = ({ profile, className }) => {
  const { embeds } = profile;
  if (!embeds) return null;
  const hasAny = embeds.youtube || embeds.portfolioCard;
  if (!hasAny) return null;
  return (
    <div className={cn('space-y-3', className)}>
      {embeds.youtube && (
        <div className="overflow-hidden rounded-2xl border border-border">
          <div className="aspect-video w-full">
            <iframe
              title="YouTube"
              src={`https://www.youtube-nocookie.com/embed/${embeds.youtube}`}
              className="h-full w-full"
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
            />
          </div>
        </div>
      )}
      {embeds.portfolioCard && (
        <div className="rounded-2xl glass border-gradient p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Featured work</p>
          <p className="mt-1 font-display text-base font-semibold">Selected projects 2025</p>
          <p className="mt-1 text-sm text-muted-foreground">A curated reel of recent commissions and personal pieces.</p>
        </div>
      )}
    </div>
  );
};
