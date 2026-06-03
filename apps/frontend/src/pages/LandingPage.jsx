import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight, Sparkles, Palette, Layers, Music, BarChart3, Shield,
  Wand2, Zap, Check, Star, MousePointerClick, Play, Brush, Globe,
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { AnimatedBackground } from '@/components/common/AnimatedBackground';
import { GradientText } from '@/components/common/GradientText';
import { SectionHeading } from '@/components/common/SectionHeading';
import { GlassCard } from '@/components/common/GlassCard';
import { Marquee } from '@/components/common/Marquee';
import { MiniProfileCard } from '@/components/profile/MiniProfileCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useAuthStore } from '@/stores/auth.store';
import { mockProfiles } from '@/mocks/profiles.mock';
import { mockTemplates } from '@/mocks/templates.mock';
import { cn } from '@/lib/utils';

const PROOF = ['Streamers', 'Designers', 'Musicians', 'Developers', 'Gamers', 'Photographers', 'Founders', 'Artists'];

const FEATURES = [
  { icon: Layers, title: '7 cinematic layouts', desc: 'Centered, wide, minimal, sidebar, floating, terminal & portfolio grid. Switch in one click.' },
  { icon: Palette, title: 'Total customization', desc: 'Gradients, images, GIFs and video backgrounds with blur, overlays and accent control.' },
  { icon: Wand2, title: 'Living effects', desc: 'Particles, snow, rain, stars, glow borders, cursor trails and a click-to-enter intro.' },
  { icon: Music, title: 'Background audio', desc: 'Set a signature track with a frosted player. Never autoplays without consent.' },
  { icon: BarChart3, title: 'Real-time analytics', desc: 'Views, clicks, countries and devices in a clean, glassy dashboard.' },
  { icon: Shield, title: 'Unlimited badges', desc: 'Create custom badges, use global badges, and style every glow without locked tiers.' },
];

const STEPS = [
  { n: '01', title: 'Claim your link', desc: 'Grab your unique vyntra.bio/username in seconds.' },
  { n: '02', title: 'Design it live', desc: 'Tune layout, effects and links with an instant live preview.' },
  { n: '03', title: 'Share everywhere', desc: 'One link for every platform, fully responsive and lightning fast.' },
];

const STATS = [
  { value: '$0', label: 'Forever, no paid tiers' },
  { value: '100%', label: 'Features unlocked' },
  { value: 'Local', label: 'Compressed asset storage' },
  { value: '7/30/90d', label: 'Analytics ranges' },
];

const INCLUSIONS = [
  { name: 'Create', highlight: false, features: ['Public profile page', 'All card layouts', 'Unlimited links', 'Community templates', 'Mobile responsive pages'], cta: 'Start building' },
  { name: 'Customize', highlight: true, features: ['Video and image backgrounds', 'Background audio', 'Particles and cursor effects', 'Custom CSS with sanitization', 'Unlimited badges'], cta: 'Open the editor' },
  { name: 'Understand', highlight: false, features: ['Profile views', 'Unique visitors', 'Link click counts', 'Referrer and device summaries', 'Template import stats'], cta: 'View analytics' },
];

const FAQS = [
  { q: 'Is Vyntra.bio really free?', a: 'Yes. Every profile layout, effect, badge, template, upload type, and analytics view is available to every user for free.' },
  { q: 'Do I need to know how to code?', a: 'Not at all. Everything is visual with a live preview. Advanced users can still add sanitized custom CSS.' },
  { q: 'Can I use my own domain?', a: 'Yes. The app is reverse-proxy ready, so self-hosted installs can route custom domains through Caddy, Nginx, or Traefik.' },
  { q: 'Will my profile work on mobile?', a: 'Every layout is fully responsive and tuned for fast loads on any device.' },
  { q: 'Can I migrate my existing links?', a: 'Import a community template or start from scratch. Adding and reordering links takes seconds.' },
];

const FloatingCard = ({ profile, className, delay = 0, rotate = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 30, rotate }}
    animate={{ opacity: 1, y: 0, rotate }}
    transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
    className={cn('absolute', className)}
  >
    <div className="animate-float" style={{ animationDelay: `${delay}s` }}>
      <MiniProfileCard profile={profile} showViews={false} />
    </div>
  </motion.div>
);

export default function LandingPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [username, setUsername] = useState('');

  const claim = (e) => {
    e?.preventDefault();
    navigate(isAuthenticated ? '/dashboard/editor' : '/register');
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background">
      <Navbar />

      {/* ============ HERO ============ */}
      <section className="relative pt-36 pb-24 sm:pt-44">
        <AnimatedBackground variant="hero" />
        <div className="mx-auto grid max-w-6xl items-center gap-16 px-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/40 px-3 py-1 text-xs font-medium text-muted-foreground"
            >
              <Sparkles className="h-3.5 w-3.5" /> The self-hosted bio-link, reimagined
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05, duration: 0.6 }}
              className="mt-6 font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl text-balance"
            >
              Your whole world,
              <br />
              <GradientText>one beautiful link.</GradientText>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12, duration: 0.6 }}
              className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg text-pretty"
            >
              Vyntra.bio turns your links into a cinematic, animated profile card.
              Pick a layout, drop in your accents, and ship a page that feels like you.
            </motion.p>

            <motion.form
              onSubmit={claim}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18, duration: 0.6 }}
              className="mt-8 flex max-w-md items-center gap-2 rounded-2xl glass-panel border-gradient p-2"
            >
              <span className="pl-3 text-sm text-muted-foreground">vyntra.bio/</span>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                placeholder="yourname"
                aria-label="Choose your username"
                data-testid="hero-username"
                className="h-10 border-0 bg-transparent px-1 focus-visible:ring-0"
              />
              <Button type="submit" className="group shrink-0" data-testid="hero-claim">
                Claim
                <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
              </Button>
            </motion.form>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-8 flex flex-wrap items-center gap-6 text-sm text-muted-foreground"
            >
              <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-success" /> No credit card</span>
              <span className="inline-flex items-center gap-2"><Zap className="h-4 w-4" /> Live in 2 minutes</span>
              <span className="inline-flex items-center gap-2"><Star className="h-4 w-4" /> Self-hosted by you</span>
            </motion.div>
          </div>

          {/* Floating cards cluster */}
          <div className="relative hidden h-[520px] lg:block perspective">
            <FloatingCard profile={mockProfiles.nova} className="left-6 top-0 z-20" delay={0.1} rotate={-4} />
            <FloatingCard profile={mockProfiles.kairo} className="right-0 top-28 z-10" delay={0.5} rotate={5} />
            <FloatingCard profile={mockProfiles.lumen} className="left-16 bottom-0 z-30" delay={0.9} rotate={2} />
            <div className="absolute inset-0 -z-10 rounded-full bg-gradient-radial-glow blur-2xl" />
          </div>

          {/* Mobile single card */}
          <div className="flex justify-center lg:hidden">
            <div className="animate-float">
              <MiniProfileCard profile={mockProfiles.nova} showViews={false} />
            </div>
          </div>
        </div>

        {/* Proof marquee */}
        <div className="mx-auto mt-20 max-w-6xl px-6">
          <p className="mb-6 text-center text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Trusted by creators of every kind
          </p>
          <Marquee>
            {PROOF.map((p) => (
              <span key={p} className="font-display text-2xl font-medium text-muted-foreground/70">
                {p}
              </span>
            ))}
          </Marquee>
        </div>
      </section>

      {/* ============ FEATURES ============ */}
      <section id="features" className="relative py-24">
        <div className="mx-auto max-w-6xl px-6">
          <SectionHeading
            eyebrow="Features"
            title="Everything you need to stand out"
            description="A complete toolkit for a profile that looks designed, not generated."
          />
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <GlassCard glow className="flex h-full flex-col p-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary/60">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 font-display text-lg font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section className="relative py-24">
        <div className="mx-auto max-w-6xl px-6">
          <SectionHeading eyebrow="How it works" title="From zero to iconic in three steps" />
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <GlassCard className="relative h-full overflow-hidden p-7">
                  <span className="font-display text-5xl font-bold text-foreground/10">{s.n}</span>
                  <h3 className="mt-3 font-display text-xl font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ TEMPLATES ============ */}
      <section id="templates" className="relative py-24">
        <div className="mx-auto max-w-6xl px-6">
          <SectionHeading
            eyebrow="Templates"
            title="Start from a stunning template"
            description="Remix a community design, save your own profile as a template, or build from scratch."
          />
        </div>
        <div className="mt-14 space-y-5">
          <Marquee>
            {mockTemplates.slice(0, 6).map((t) => (
              <TemplateThumb key={t.id} t={t} />
            ))}
          </Marquee>
          <Marquee speed="slow">
            {mockTemplates.slice(6, 12).map((t) => (
              <TemplateThumb key={t.id} t={t} />
            ))}
          </Marquee>
        </div>
        <div className="mt-12 flex justify-center">
          <Button variant="outline" onClick={() => navigate('/templates')} className="group">
            Browse all templates
            <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
          </Button>
        </div>
      </section>

      {/* ============ SHOWCASE ============ */}
      <section id="showcase" className="relative py-24">
        <AnimatedBackground variant="subtle" />
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid items-center gap-14 lg:grid-cols-2">
            <div>
              <SectionHeading
                align="left"
                eyebrow="Showcase"
                title="A profile that feels alive"
                description="Cinematic backgrounds, glowing badges, an activity card and a frosted music player — all responsive, all yours."
              />
              <ul className="mt-8 space-y-4">
                {[
                  { icon: Brush, t: 'Click-to-enter intro', d: 'A cinematic entrance before your page reveals.' },
                  { icon: MousePointerClick, t: 'Discord & Spotify cards', d: 'Show what you are playing and listening to, live.' },
                  { icon: Globe, t: 'Reverse proxy ready', d: 'Run behind Caddy, Nginx, or Traefik with your own domain.' },
                ].map((item) => (
                  <li key={item.t} className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary/60">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">{item.t}</p>
                      <p className="text-sm text-muted-foreground">{item.d}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex gap-3">
                <Button onClick={() => navigate('/u/nova')} className="group">
                  <Play className="h-4 w-4" /> View a live profile
                </Button>
                <Button variant="ghost" onClick={() => navigate('/editor')}>Try the editor</Button>
              </div>
            </div>
            <div className="flex justify-center gap-6">
              <div className="mt-10 animate-float"><MiniProfileCard profile={mockProfiles.kairo} showViews={false} /></div>
              <div className="hidden animate-float-slow sm:block"><MiniProfileCard profile={mockProfiles.lumen} showViews={false} /></div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ STATS ============ */}
      <section className="relative py-20">
        <div className="mx-auto max-w-6xl px-6">
          <GlassCard variant="strong" className="grid grid-cols-2 gap-8 p-10 md:grid-cols-4">
            {STATS.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="text-center"
              >
                <p className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{s.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
              </motion.div>
            ))}
          </GlassCard>
        </div>
      </section>

      {/* ============ INCLUDED ============ */}
      <section id="pricing" className="relative py-24">
        <div className="mx-auto max-w-6xl px-6">
          <SectionHeading eyebrow="Free for everyone" title="No plans, no locked features" description="Vyntra.bio is built for self-hosting. Every advanced feature is included by default." />
          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {INCLUSIONS.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
              >
                <GlassCard
                  variant={plan.highlight ? 'strong' : 'default'}
                  glow
                  className={cn('flex h-full flex-col p-7', plan.highlight && 'ring-1 ring-foreground/20')}
                >
                  {plan.highlight && (
                    <span className="mb-4 inline-flex w-fit items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                      <Sparkles className="h-3 w-3" /> Most popular
                    </span>
                  )}
                  <h3 className="font-display text-xl font-semibold">{plan.name}</h3>
                  <div className="mt-3 rounded-2xl border border-border bg-secondary/30 px-4 py-3">
                    <span className="font-display text-2xl font-semibold tracking-tight">$0</span>
                    <span className="ml-2 text-sm text-muted-foreground">forever</span>
                  </div>
                  <ul className="mt-6 space-y-3">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-foreground/80">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" /> {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    onClick={claim}
                    variant={plan.highlight ? 'default' : 'outline'}
                    className="mt-auto w-full !mt-8"
                  >
                    {plan.cta}
                  </Button>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section className="relative py-24">
        <div className="mx-auto max-w-3xl px-6">
          <SectionHeading eyebrow="FAQ" title="Questions, answered" />
          <Accordion type="single" collapsible className="mt-10">
            {FAQS.map((f, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border-border">
                <AccordionTrigger className="text-left text-base font-medium hover:no-underline">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ============ FINAL CTA ============ */}
      <section className="relative py-24">
        <div className="mx-auto max-w-5xl px-6">
          <GlassCard variant="strong" className="relative overflow-hidden p-12 text-center sm:p-16">
            <div className="absolute inset-0 -z-10 bg-gradient-radial-glow" />
            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-5xl text-balance">
              Ready to build your <GradientText>iconic link</GradientText>?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Join hundreds of thousands of creators. Claim your name before someone else does.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" onClick={claim} className="group">
                {isAuthenticated ? 'Open editor' : 'Claim your link'} <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/templates">Explore templates</Link>
              </Button>
            </div>
          </GlassCard>
        </div>
      </section>

      <Footer />
    </div>
  );
}

const TemplateThumb = ({ t }) => (
  <div className="relative h-44 w-72 shrink-0 overflow-hidden rounded-2xl border border-border">
    <img src={t.preview} alt={t.name} className="h-full w-full object-cover" loading="lazy" />
    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
    <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
      <div>
        <p className="font-display text-sm font-semibold">{t.name}</p>
        <p className="text-xs text-muted-foreground">{t.category}</p>
      </div>
      <span className="rounded-full bg-secondary/70 px-2 py-0.5 text-xs text-muted-foreground">
        Preview
      </span>
    </div>
  </div>
);
