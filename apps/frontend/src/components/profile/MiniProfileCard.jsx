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
      whileHover={interactive ? { y: -7, scale: 1.015 } : undefined}
      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      className={cn(
        'group relative isolate w-72 overflow-hidden rounded-[1.4rem] border border-white/[0.16] bg-[#0b0b0c] shadow-[0_28px_90px_-28px_rgba(0,0,0,0.95)] ring-1 ring-white/[0.08]',
        className
      )}
      style={{
        boxShadow: `0 28px 90px -28px rgba(0,0,0,0.98), 0 0 58px -36px ${accent}`,
      }}
    >
      <div className="pointer-events-none absolute inset-0 z-0 bg-[#0b0b0c]" />
      <div className="pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(180deg,rgba(255,255,255,0.10),rgba(255,255,255,0.025)_38%,rgba(0,0,0,0.26))]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

      {/* accent glow */}
      <div
        className="pointer-events-none absolute -top-24 left-1/2 z-[2] h-52 w-52 -translate-x-1/2 rounded-full blur-3xl opacity-28"
        style={{ background: `radial-gradient(circle, ${accent}, transparent 70%)` }}
      />

      <div className="relative z-10 h-24 w-full overflow-hidden border-b border-white/[0.09] bg-[#111113]">
        <img
          src={profile.banner}
          alt=""
          className="h-full w-full object-cover opacity-90 transition duration-700 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b0c] via-[#0b0b0c]/70 to-black/25" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.20),transparent_42%)]" />
      </div>

      <div className="relative z-20 bg-[#0b0b0c] px-5 pb-5">
        <div className="relative z-20 -mt-9 flex items-end gap-3">
          <img
            src={profile.avatar}
            alt={profile.displayName}
            className="relative z-20 h-[68px] w-[68px] rounded-2xl border-[3px] border-[#0b0b0c] object-cover ring-1 ring-white/22"
            style={{ boxShadow: `0 16px 34px -22px rgba(0,0,0,0.95), 0 0 28px -10px ${accent}` }}
            loading="lazy"
          />
          <div className="relative z-20 mb-1.5 flex flex-wrap gap-1">
            {profile.badges.slice(0, 3).map((b) => (
              <span
                key={b.id}
                className="flex h-5 w-5 items-center justify-center rounded-md border border-white/[0.08] shadow-[0_10px_24px_-18px_rgba(255,255,255,0.6)]"
                style={{ background: `hsl(${b.color} / 0.24)`, color: `hsl(${b.color})` }}
                title={b.tooltip}
              >
                <Icon name={b.icon} className="h-3 w-3" />
              </span>
            ))}
          </div>
        </div>
        <div className="mt-3">
          <p className="font-display text-base font-semibold leading-tight text-white">{profile.displayName}</p>
          <p className="text-sm text-white/55">@{profile.username}</p>
        </div>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-white/74">{profile.bio}</p>
        <div className="mt-3 flex items-center gap-3 text-xs text-white/50">
          <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{profile.location}</span>
          {showViews && <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" />{formatNumber(profile.views)}</span>}
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {profile.links.slice(0, 4).map((l) => (
            <span
              key={l.id}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.10] bg-white/[0.075] text-white/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition duration-300 group-hover:bg-white/[0.105]"
            >
              <Icon name={l.icon} className="h-4 w-4" />
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
