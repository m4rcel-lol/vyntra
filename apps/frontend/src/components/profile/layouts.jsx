import { motion } from 'framer-motion';
import { Terminal as TerminalIcon, ArrowUpRight } from 'lucide-react';
import { ProfileAvatar, ProfileFriendActions, ProfileIdentity, ProfileMeta, ProfileUsername } from './ProfileParts';
import { BadgeRow } from './BadgeRow';
import { SocialLinks } from './SocialLinks';
import { WALLPAPERS } from '@/mocks/assets';
import { cn } from '@/lib/utils';

const card = 'rounded-3xl glass-strong border-gradient shadow-elevated';
const glow = (p) => (p.effects?.glowBorder ? { boxShadow: `0 0 60px -18px hsl(${p.accent} / 0.8), var(--shadow-elevated)` } : undefined);

const Reveal = ({ children, delay = 0, className }) => (
  <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }} className={className}>
    {children}
  </motion.div>
);

/* ---------- Centered ---------- */
export const CenteredLayout = ({ profile }) => (
  <Reveal className={cn(card, 'w-full max-w-md p-7')} >
    <div style={glow(profile)} className="-m-7 rounded-3xl p-7">
      <div className="flex flex-col items-center">
        <ProfileAvatar profile={profile} />
        <BadgeRow badges={profile.badges} className="mt-3" />
        <ProfileIdentity profile={profile} className="mt-3" />
        <ProfileMeta profile={profile} className="mt-4" />
        <SocialLinks links={profile.links} accent={profile.accent} className="mt-5 w-full" />
      </div>
    </div>
  </Reveal>
);

/* ---------- Wide ---------- */
export const WideLayout = ({ profile }) => (
  <Reveal className={cn(card, 'w-full max-w-3xl overflow-hidden')}>
    <div style={glow(profile)} className="rounded-3xl">
      <div className="relative z-0 h-36 w-full overflow-hidden">
        <img src={profile.banner} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
      </div>
      <div className="relative z-10 px-7 pb-7">
        <div className="relative z-20 -mt-12 flex flex-col gap-4 sm:flex-row sm:items-end">
          <ProfileAvatar profile={profile} size={104} />
          <div className="flex-1">
            <ProfileIdentity profile={profile} align="left" />
          </div>
          <BadgeRow badges={profile.badges} className="sm:justify-end" />
        </div>
        <ProfileMeta profile={profile} align="left" className="mt-4" />
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <SocialLinks links={profile.links} accent={profile.accent} />
          <ProfileMeta profile={profile} align="left" />
        </div>
      </div>
    </div>
  </Reveal>
);

/* ---------- Minimal ---------- */
export const MinimalLayout = ({ profile, social }) => (
  <Reveal className="flex w-full max-w-[22rem] flex-col items-center text-center sm:max-w-sm">
    <ProfileAvatar profile={profile} size={84} />
    <h1 className="mt-5 max-w-full break-words font-display text-2xl font-semibold tracking-tight sm:text-3xl">{profile.displayName}</h1>
    <ProfileUsername profile={profile} />
    <ProfileMeta profile={profile} className="mt-2.5" />
    <ProfileFriendActions social={social} className="mt-4" />
    {profile.bio && <p className="mt-3 max-w-xs text-sm text-foreground/75">{profile.bio}</p>}
    <BadgeRow badges={profile.badges} className="mt-4" size="sm" />
    <SocialLinks links={profile.links} accent={profile.accent} className="mt-6 w-full" />
  </Reveal>
);

/* ---------- Sidebar ---------- */
export const SidebarLayout = ({ profile }) => (
  <Reveal className={cn(card, 'grid w-full max-w-4xl overflow-hidden md:grid-cols-[300px_1fr]')}>
    <div className="flex flex-col items-center border-b border-border p-7 text-center md:border-b-0 md:border-r" style={glow(profile)}>
      <ProfileAvatar profile={profile} />
      <ProfileIdentity profile={profile} className="mt-4" />
      <BadgeRow badges={profile.badges} className="mt-4" />
    </div>
    <div className="max-h-[70vh] overflow-y-auto p-7">
      <ProfileMeta profile={profile} align="left" />
      <SocialLinks links={profile.links} accent={profile.accent} className="mt-5" />
    </div>
  </Reveal>
);

/* ---------- Floating ---------- */
export const FloatingLayout = ({ profile }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.94, y: 30 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
    className="w-full max-w-md"
  >
    <div className={cn(card, 'animate-float p-7')} style={glow(profile)}>
      <div className="flex flex-col items-center">
        <ProfileAvatar profile={profile} />
        <BadgeRow badges={profile.badges} className="mt-3" />
        <ProfileIdentity profile={profile} className="mt-3" />
        <SocialLinks links={profile.links} accent={profile.accent} variant="icons" className="mt-5" />
        <SocialLinks links={profile.links.slice(0, 3)} accent={profile.accent} className="mt-4 w-full" />
        <ProfileMeta profile={profile} className="mt-5" />
      </div>
    </div>
  </motion.div>
);

/* ---------- Terminal ---------- */
export const TerminalLayout = ({ profile }) => {
  const accent = `hsl(${profile.accent})`;
  return (
    <Reveal className="w-full max-w-2xl">
      <div className="overflow-hidden rounded-2xl border border-border bg-[hsl(0_0%_4%)] font-mono text-sm shadow-elevated" style={glow(profile)}>
        <div className="flex items-center gap-2 border-b border-border bg-secondary/30 px-4 py-2.5">
          <span className="h-3 w-3 rounded-full bg-destructive/70" />
          <span className="h-3 w-3 rounded-full bg-warning/70" />
          <span className="h-3 w-3 rounded-full bg-success/70" />
          <span className="ml-2 flex items-center gap-1.5 text-xs text-muted-foreground"><TerminalIcon className="h-3.5 w-3.5" /> {profile.username}@vyntra ~ </span>
        </div>
        <div className="space-y-2 p-5 leading-relaxed">
          <p><span style={{ color: accent }}>vyntra@user</span>:<span className="text-muted-foreground">~</span>$ whoami</p>
          <p className="flex flex-wrap items-center gap-1.5 text-foreground">
            <span>{profile.displayName}</span>
            <span className="text-muted-foreground">(</span>
            <ProfileUsername profile={profile} align="left" as="span" className="font-mono" />
            <span className="text-muted-foreground">)</span>
          </p>
          <p className="pt-2"><span style={{ color: accent }}>vyntra@user</span>:<span className="text-muted-foreground">~</span>$ cat bio.txt</p>
          <p className="text-foreground/80">{profile.bio}</p>
          <p className="pt-2"><span style={{ color: accent }}>vyntra@user</span>:<span className="text-muted-foreground">~</span>$ cat status</p>
          <p className="text-foreground/80">{profile.status}</p>
          <p className="pt-2"><span style={{ color: accent }}>vyntra@user</span>:<span className="text-muted-foreground">~</span>$ ls ./links</p>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {profile.links.map((l) => (
              <a key={l.id} href={l.url} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-2 rounded px-2 py-1 transition-colors hover:bg-secondary/50">
                <span style={{ color: accent }}>➜</span>
                <span className="flex-1 truncate">{l.label.toLowerCase().replace(/\s+/g, '_')}</span>
                <ArrowUpRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100" />
              </a>
            ))}
          </div>
          <p className="pt-2 flex items-center"><span style={{ color: accent }}>vyntra@user</span>:<span className="text-muted-foreground">~</span>$ <span className="ml-2 inline-block h-4 w-2 animate-pulse" style={{ background: accent }} /></p>
        </div>
      </div>
    </Reveal>
  );
};

/* ---------- Portfolio Grid ---------- */
const PROJECTS = [
  { title: 'Neon Dreams', tag: 'Motion', img: WALLPAPERS.cyber1 },
  { title: 'Aurora', tag: '3D', img: WALLPAPERS.mesh3 },
  { title: 'Sakura', tag: 'Illustration', img: WALLPAPERS.anime1 },
  { title: 'Prism', tag: 'Branding', img: WALLPAPERS.mesh1 },
];

export const PortfolioLayout = ({ profile }) => (
  <Reveal className="w-full max-w-4xl">
    <div className={cn(card, 'p-7')} style={glow(profile)}>
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:text-left">
        <ProfileAvatar profile={profile} size={88} />
        <div className="flex-1 text-center sm:text-left">
          <ProfileIdentity profile={profile} align="left" />
        </div>
        <BadgeRow badges={profile.badges} />
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {PROJECTS.map((p) => (
          <motion.a key={p.title} href="#" whileHover={{ y: -4 }} className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-border">
            <img src={p.img} alt={p.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
            <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-foreground/70">{p.tag}</p>
                <p className="font-display text-base font-semibold">{p.title}</p>
              </div>
              <ArrowUpRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
          </motion.a>
        ))}
      </div>
      <SocialLinks links={profile.links} accent={profile.accent} variant="icons" className="mt-6" />
    </div>
  </Reveal>
);

/* ---------- Spotlight ---------- */
export const SpotlightLayout = ({ profile }) => (
  <Reveal className="w-full max-w-5xl">
    <div className={cn(card, 'grid overflow-hidden lg:grid-cols-[1.05fr_0.95fr]')} style={glow(profile)}>
      <div className="relative min-h-[420px] p-7 sm:p-9">
        <img src={profile.banner} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.16),transparent_34%),linear-gradient(135deg,rgba(0,0,0,0.2),rgba(0,0,0,0.88))]" />
        <div className="relative z-10 flex h-full flex-col justify-between gap-10">
          <div>
            <ProfileAvatar profile={profile} size={112} />
            <BadgeRow badges={profile.badges} className="mt-4 justify-start" />
          </div>
          <div>
            <ProfileIdentity profile={profile} align="left" />
            <ProfileMeta profile={profile} align="left" className="mt-5" />
          </div>
        </div>
      </div>
      <div className="flex flex-col justify-center gap-4 border-t border-border p-7 sm:p-9 lg:border-l lg:border-t-0">
        <div className="rounded-2xl border border-border bg-secondary/20 p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Featured links</p>
          <SocialLinks links={profile.links.slice(0, 5)} accent={profile.accent} className="mt-4" />
        </div>
      </div>
    </div>
  </Reveal>
);

/* ---------- Stacked Links ---------- */
export const StackedLinksLayout = ({ profile }) => (
  <Reveal className="w-full max-w-lg">
    <div className={cn(card, 'overflow-hidden')} style={glow(profile)}>
      <div className="relative h-44">
        <img src={profile.banner} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/45 to-transparent" />
      </div>
      <div className="relative px-6 pb-6">
        <div className="-mt-16 flex flex-col items-center text-center">
          <ProfileAvatar profile={profile} size={112} />
          <BadgeRow badges={profile.badges} className="mt-4" />
          <ProfileIdentity profile={profile} className="mt-3" />
        </div>
        <ProfileMeta profile={profile} className="mt-5" />
        <div className="mt-5 space-y-2.5">
          <SocialLinks links={profile.links} accent={profile.accent} />
        </div>
      </div>
    </div>
  </Reveal>
);

/* ---------- Editorial ---------- */
export const EditorialLayout = ({ profile }) => (
  <Reveal className="w-full max-w-5xl">
    <div className={cn(card, 'grid gap-0 overflow-hidden md:grid-cols-[0.85fr_1.15fr]')} style={glow(profile)}>
      <aside className="border-b border-border p-7 md:border-b-0 md:border-r">
        <p className="mb-5 text-xs uppercase tracking-[0.3em] text-muted-foreground">Profile</p>
        <ProfileAvatar profile={profile} size={96} />
        <ProfileIdentity profile={profile} align="left" className="mt-5" />
        <BadgeRow badges={profile.badges} className="mt-5 justify-start" />
        <ProfileMeta profile={profile} align="left" className="mt-6" />
      </aside>
      <section className="p-7">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-border bg-secondary/20 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">About</p>
            <p className="mt-3 text-sm leading-relaxed text-foreground/80">{profile.bio || profile.status || 'No bio yet.'}</p>
          </div>
          <div className="rounded-2xl border border-border bg-secondary/20 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Status</p>
            <p className="mt-3 text-sm leading-relaxed text-foreground/80">{profile.status || 'Building on Vyntra'}</p>
          </div>
        </div>
        <SocialLinks links={profile.links} accent={profile.accent} className="mt-5" />
      </section>
    </div>
  </Reveal>
);

export const LAYOUTS = {
  centered: CenteredLayout,
  wide: WideLayout,
  minimal: MinimalLayout,
  sidebar: SidebarLayout,
  floating: FloatingLayout,
  terminal: TerminalLayout,
  portfolio: PortfolioLayout,
  spotlight: SpotlightLayout,
  stacked: StackedLinksLayout,
  editorial: EditorialLayout,
};
