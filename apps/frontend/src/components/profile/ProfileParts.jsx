import { MapPin, CalendarDays, Hash, Eye, BadgeCheck, ShieldCheck, UserPlus, Users } from 'lucide-react';
import { formatDate, formatNumber } from '@/utils/format';
import { cn } from '@/lib/utils';
import { getBadgeBySlug } from './badgeUtils';

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
    </div>
  );
};

export const ProfileIdentity = ({ profile, align = 'center', className }) => {
  return (
    <div className={cn(align === 'center' ? 'text-center' : 'text-left', className)}>
      <h1 className="font-display text-2xl font-semibold tracking-tight">{profile.displayName}</h1>
      <ProfileUsername profile={profile} align={align} />
      {profile.bio && <p className="mt-3 text-sm leading-relaxed text-foreground/80">{profile.bio}</p>}
    </div>
  );
};

export const ProfileUsername = ({ profile, align = 'center', className, muted = true, as: Component = 'p' }) => {
  const verifiedBadge = getBadgeBySlug(profile.badges, 'verified');
  const staffBadge = getBadgeBySlug(profile.badges, 'staff');
  return (
    <Component
      className={cn(
        'inline-flex min-w-0 items-center gap-1.5 text-sm',
        muted && 'text-muted-foreground',
        align === 'center' && 'justify-center',
        className
      )}
    >
      <span className="truncate">@{profile.username}</span>
      {verifiedBadge && (
        <BadgeCheck
          className="h-4 w-4 shrink-0 text-sky-300"
          aria-label="Verified"
          title={verifiedBadge.tooltip || verifiedBadge.label || 'Verified'}
        />
      )}
      {staffBadge && (
        <ShieldCheck
          className="h-4 w-4 shrink-0 text-zinc-100"
          aria-label="Staff"
          title={staffBadge.tooltip || staffBadge.label || 'Staff'}
        />
      )}
    </Component>
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

export const ProfileFriendActions = ({ social, className }) => {
  if (!social) return null;
  const state = social.state || 'guest';
  const buttonLabel = state === 'accepted'
    ? 'Friends'
    : state === 'pending_sent'
      ? 'Pending'
      : state === 'pending_received'
        ? 'Accept friend'
        : state === 'self'
          ? 'Your profile'
          : 'Add friend';
  const disabled = social.busy || state === 'pending_sent' || state === 'self' || state === 'accepted';

  return (
    <div className={cn('flex flex-wrap items-center justify-center gap-2', className)}>
      <button
        type="button"
        onClick={social.onOpenFriends}
        className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-foreground/80 transition-colors hover:bg-white/[0.1] hover:text-foreground"
      >
        <Users className="h-3.5 w-3.5" />
        {formatNumber(social.count || 0)} friends
      </button>
      {state !== 'self' && (
        <button
          type="button"
          onClick={state === 'accepted' ? social.onRemoveFriend : social.onAddFriend}
          disabled={disabled}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white text-black px-3 py-1.5 text-xs font-semibold transition hover:bg-white/90 disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white/55"
        >
          <UserPlus className="h-3.5 w-3.5" />
          {buttonLabel}
        </button>
      )}
    </div>
  );
};
