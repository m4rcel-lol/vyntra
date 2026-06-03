import { motion } from 'framer-motion';
import { MapPin, Eye } from 'lucide-react';
import { Icon } from '@/components/common/Icon';
import { formatNumber } from '@/utils/format';
import { cn } from '@/lib/utils';

/**
 * Compact glass profile card used on the landing hero + showcase.
 * Tints its glow with the profile's accent while keeping the shell monochrome.
 */
export const MiniProfileCard = ({ profile, className, interactive = true, showViews = true }) => {
  const accent = `hsl(${profile.accent})`;
  return (
    <motion.div
      whileHover={interactive ? { y: -6 } : undefined}
      className={cn('relative w-72 overflow-hidden rounded-2xl glass-strong border-gradient shadow-elevated', className)}
    >
      {/* accent glow */}
      <div
        className="pointer-events-none absolute -top-16 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full blur-3xl opacity-50"
        style={{ background: `radial-gradient(circle, ${accent}, transparent 70%)` }}
      />
      <div className="relative z-0 h-20 w-full overflow-hidden">
        <img src={profile.banner} alt="" className="h-full w-full object-cover opacity-80" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-card/90 to-transparent" />
      </div>
      <div className="relative z-10 px-5 pb-5">
        <div className="relative z-20 -mt-8 flex items-end gap-3">
          <img
            src={profile.avatar}
            alt={profile.displayName}
            className="relative z-20 h-16 w-16 rounded-2xl border-2 border-background object-cover"
            style={{ boxShadow: `0 0 24px -6px ${accent}` }}
            loading="lazy"
          />
          <div className="relative z-20 mb-1 flex flex-wrap gap-1">
            {profile.badges.slice(0, 3).map((b) => (
              <span
                key={b.id}
                className="flex h-5 w-5 items-center justify-center rounded-md"
                style={{ background: `hsl(${b.color} / 0.16)`, color: `hsl(${b.color})` }}
                title={b.tooltip}
              >
                <Icon name={b.icon} className="h-3 w-3" />
              </span>
            ))}
          </div>
        </div>
        <div className="mt-3">
          <p className="font-display text-base font-semibold leading-tight">{profile.displayName}</p>
          <p className="text-sm text-muted-foreground">@{profile.username}</p>
        </div>
        <p className="mt-2 line-clamp-2 text-sm text-foreground/75">{profile.bio}</p>
        <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{profile.location}</span>
          {showViews && <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" />{formatNumber(profile.views)}</span>}
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {profile.links.slice(0, 4).map((l) => (
            <span
              key={l.id}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-secondary/50 text-foreground/80"
            >
              <Icon name={l.icon} className="h-4 w-4" />
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
