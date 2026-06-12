import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight, BadgeCheck, BarChart3, Check, Code2, Globe, LayoutTemplate,
  Music2, Palette, ShieldCheck, Sparkles, UploadCloud, Users,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Footer } from '@/components/layout/Footer';
import { Logo } from '@/components/common/Logo';
import { GlassCard } from '@/components/common/GlassCard';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth.store';

const perkGroups = [
  {
    title: 'Profile design',
    icon: Palette,
    perks: ['Focused minimal profile layout', 'Image, GIF, video, gradient, and solid backgrounds', 'Blur and dark overlays', 'Custom colors, fonts, buttons, badges, and card styling'],
  },
  {
    title: 'Effects and media',
    icon: Sparkles,
    perks: ['Particles, snow, rain, stars, sparkles, and shape effects', 'Click-to-enter intro screens', 'Custom cursor and cursor trail options', 'Background music player with loop and volume controls'],
  },
  {
    title: 'Links and media',
    icon: Globe,
    perks: ['Unlimited profile links', 'Built-in social icons', 'Custom link icons', 'Clean hover labels and click analytics'],
  },
  {
    title: 'Badges and identity',
    icon: BadgeCheck,
    perks: ['Global staff-managed badges', 'Automatic Owner, Staff, and Moderator role badges', 'Verified and Unlimited badge support', 'Badge colors, glow colors, icons, and tooltips'],
  },
  {
    title: 'Templates',
    icon: LayoutTemplate,
    perks: ['Save your profile as a template', 'Publish community templates', 'Preview, like, import, search, and filter templates', 'Report unsafe or copied templates'],
  },
  {
    title: 'Analytics',
    icon: BarChart3,
    perks: ['Profile views and unique visitors', 'Views over time', 'Top referrers, browser, device, and approximate country from headers', 'Link clicks, social clicks, template imports, and file views'],
  },
  {
    title: 'Storage',
    icon: UploadCloud,
    perks: ['Compressed local file uploads', 'Avatars, banners, backgrounds, audio, cursors, badges, and previews', 'MIME validation and safe filenames', 'No S3 or paid storage provider required'],
  },
  {
    title: 'Security',
    icon: ShieldCheck,
    perks: ['Custom password auth with HTTP-only cookies', 'Argon2id password hashing', 'CSRF protection and rate limits', 'Input sanitization and safe custom CSS handling'],
  },
  {
    title: 'Self-hosting',
    icon: Code2,
    perks: ['Docker Compose deployment', 'PostgreSQL and Valkey support', 'Reverse proxy ready for Caddy, Nginx, and Traefik', 'Custom domains through your own server setup'],
  },
];

const stats = [
  { value: '$0', label: 'Paid tiers' },
  { value: '100%', label: 'Features unlocked' },
  { value: '1', label: 'Minimal layout' },
  { value: 'Local', label: 'Compressed storage' },
];

export default function PerksPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/75 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/" aria-label="Vyntra home"><Logo /></Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild><Link to="/explore">Templates</Link></Button>
            <Button onClick={() => navigate(isAuthenticated ? '/dashboard/editor' : '/register')}>
              {isAuthenticated ? 'Open editor' : 'Create profile'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative px-6 py-20 sm:py-28">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.12),transparent_34%)]" />
          <div className="mx-auto max-w-5xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-auto inline-flex items-center gap-2 rounded-full border border-border bg-secondary/40 px-3 py-1 text-xs font-medium text-muted-foreground"
            >
              <Sparkles className="h-3.5 w-3.5" /> Unlimited is the default
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="mx-auto mt-6 max-w-3xl font-display text-4xl font-semibold leading-tight tracking-tight sm:text-6xl"
            >
              Every Vyntra perk is included for every user.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg"
            >
              No paid plan, no locked customization, no feature upsells. Profiles, themes, analytics, badges, templates, uploads, and effects are all available on self-hosted installs.
            </motion.p>

            <div className="mt-10 grid gap-3 sm:grid-cols-4">
              {stats.map((stat) => (
                <GlassCard key={stat.label} className="p-5">
                  <p className="font-display text-2xl font-semibold">{stat.value}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.22em] text-muted-foreground">{stat.label}</p>
                </GlassCard>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 pb-24">
          <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-2 xl:grid-cols-3">
            {perkGroups.map((group, index) => (
              <motion.div
                key={group.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.03 }}
              >
                <GlassCard glow className="flex h-full flex-col p-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary/70">
                    <group.icon className="h-5 w-5" />
                  </div>
                  <h2 className="mt-5 font-display text-lg font-semibold">{group.title}</h2>
                  <ul className="mt-4 space-y-3">
                    {group.perks.map((perk) => (
                      <li key={perk} className="flex gap-2 text-sm leading-relaxed text-foreground/80">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                        <span>{perk}</span>
                      </li>
                    ))}
                  </ul>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="px-6 pb-24">
          <div className="mx-auto max-w-5xl">
            <GlassCard variant="strong" className="grid gap-6 p-8 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/40 px-3 py-1 text-xs text-muted-foreground">
                  <Music2 className="h-3.5 w-3.5" /> Built for creators, hosted by you
                </div>
                <h2 className="font-display text-2xl font-semibold tracking-tight">Use the full product without upgrading anything.</h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  The Unlimited badge is not a paid tier. It represents the project rule: every creator gets every feature.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row md:flex-col">
                <Button onClick={() => navigate(isAuthenticated ? '/dashboard/editor' : '/register')}>
                  {isAuthenticated ? 'Open editor' : 'Start building'}
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/leaderboard"><Users className="h-4 w-4" /> View community</Link>
                </Button>
              </div>
            </GlassCard>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
