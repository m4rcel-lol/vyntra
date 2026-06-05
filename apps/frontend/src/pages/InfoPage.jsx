import { Link, Navigate } from 'react-router-dom';
import {
  ArrowRight, BadgeCheck, BookOpen, Briefcase, Cookie, FileText, Gauge,
  Github, HeartHandshake, Layers, Mail, Newspaper, Rocket, Scale, Shield,
  Sparkles, Star, Terminal, Trophy, Users,
} from 'lucide-react';
import { Footer } from '@/components/layout/Footer';
import { Logo } from '@/components/common/Logo';
import { GlassCard } from '@/components/common/GlassCard';
import { Button } from '@/components/ui/button';

const pages = {
  features: {
    eyebrow: 'Product',
    title: 'Features built for serious creator profiles.',
    description: 'Vyntra.bio keeps the product focused: fast public profiles, polished customization, self-hosted storage, and privacy-friendly analytics.',
    icon: Sparkles,
    cta: { label: 'Open the editor', to: '/dashboard/editor' },
    sections: [
      { title: 'Profile design', icon: Layers, body: 'Use a refined minimal public layout with custom avatars, banners, backgrounds, colors, blur, overlays, metadata, and responsive spacing.' },
      { title: 'Media and effects', icon: Star, body: 'Add compressed images, background video, music, particles, cursor effects, and click-to-enter intros without paid services.' },
      { title: 'Analytics', icon: Gauge, body: 'Track views, unique visitors, referrers, devices, countries from request headers, link clicks, and template imports.' },
    ],
  },
  showcase: {
    eyebrow: 'Showcase',
    title: 'A public page that feels clean, cinematic, and fast.',
    description: 'The public profile experience is tuned around one strong layout so avatars, banners, badges, links, music, and metadata do not fight for space.',
    icon: Trophy,
    cta: { label: 'View leaderboard', to: '/leaderboard' },
    sections: [
      { title: 'Minimal by default', icon: Layers, body: 'The profile keeps focus on identity first, then links, badges, views, and optional audio.' },
      { title: 'Real creator links', icon: ArrowRight, body: 'Profile links render as full, readable buttons with hover states, click tracking, and custom uploaded icons when available.' },
      { title: 'Mobile-ready', icon: Rocket, body: 'The layout is constrained, centered, and stable across desktop, tablets, and small phones.' },
    ],
  },
  changelog: {
    eyebrow: 'Updates',
    title: 'Changelog',
    description: 'Major Vyntra.bio updates are tracked here and in the blog so self-hosted installs know what changed.',
    icon: Newspaper,
    cta: { label: 'Read the blog', to: '/blog' },
    sections: [
      { title: 'Blog engine', icon: BookOpen, body: 'Owners and staff can publish Markdown posts, pin important updates, and show authorship on every post.' },
      { title: 'Profile links', icon: ArrowRight, body: 'Public links now render reliably on deployed profiles using normalized backend data.' },
      { title: 'Badge policy', icon: Shield, body: 'Custom user badge creation was removed; trusted badges are now staff-managed or role-managed.' },
    ],
  },
  verified: {
    eyebrow: 'Identity',
    title: 'Verified profiles',
    description: 'Verification is a trust signal controlled by the platform team, not a user-created visual style.',
    icon: BadgeCheck,
    cta: { label: 'Contact staff', to: '/support' },
    sections: [
      { title: 'Manual assignment', icon: Shield, body: 'Verified badges are assigned through moderation/admin tooling after review.' },
      { title: 'Inline display', icon: BadgeCheck, body: 'Verified appears directly after the username so visitors can identify it immediately.' },
      { title: 'Impersonation protection', icon: Scale, body: 'Users cannot create custom badges that imitate verification, staff, owner, moderator, admin, or OG roles.' },
    ],
  },
  badges: {
    eyebrow: 'Identity',
    title: 'Badges',
    description: 'Vyntra.bio badges are designed as trust and role markers, not paid perks.',
    icon: BadgeCheck,
    cta: { label: 'View perks', to: '/perks' },
    sections: [
      { title: 'Role badges', icon: Shield, body: 'Owner, Staff, and Moderator badges are synchronized automatically from account roles.' },
      { title: 'Global badges', icon: Star, body: 'Admins can create and assign global badges from the moderation panel.' },
      { title: 'No user-created badges', icon: Scale, body: 'Custom badge creation is disabled to prevent fake verification and staff impersonation.' },
    ],
  },
  api: {
    eyebrow: 'Developers',
    title: 'API and integration notes',
    description: 'Vyntra.bio exposes the internal JSON API used by the frontend. It is designed for the self-hosted app and protected by cookies, CSRF, and role checks.',
    icon: Terminal,
    cta: { label: 'View GitHub', href: 'https://github.com/m4rcel-lol' },
    sections: [
      { title: 'Authentication', icon: Shield, body: 'Authenticated writes use secure HTTP-only session cookies and CSRF headers.' },
      { title: 'Public data', icon: ArrowRight, body: 'Public profiles, profile views, links, templates, and blog posts use documented route patterns in the codebase.' },
      { title: 'Self-hosted first', icon: Github, body: 'The project is built to run behind Caddy, Nginx, or Traefik with your own domain.' },
    ],
  },
  about: {
    eyebrow: 'Company',
    title: 'About Vyntra.bio',
    description: 'Vyntra.bio is a self-hosted creator identity platform for profiles, links, portfolios, templates, analytics, and updates.',
    icon: HeartHandshake,
    cta: { label: 'Start building', to: '/register' },
    sections: [
      { title: 'Free by design', icon: Sparkles, body: 'Premium-style features are available to everyone. There are no paid tiers, payment processors, or locked customization.' },
      { title: 'Creator-focused', icon: Users, body: 'Profiles are built around identity, presentation, links, media, and trustworthy badges.' },
      { title: 'Operated by you', icon: Rocket, body: 'The stack runs with Docker Compose, PostgreSQL, Valkey, local compressed uploads, and a reverse proxy.' },
    ],
  },
  careers: {
    eyebrow: 'Company',
    title: 'Careers',
    description: 'Vyntra.bio is self-hosted software, not a hiring marketplace. This page exists so the footer is complete and transparent.',
    icon: Briefcase,
    cta: { label: 'Contact', to: '/support' },
    sections: [
      { title: 'No open roles', icon: Briefcase, body: 'There are no public hiring roles listed for this self-hosted project right now.' },
      { title: 'Contribute', icon: Github, body: 'If you want to improve the project, contribute through the GitHub workflow used by the repository owner.' },
      { title: 'Security first', icon: Shield, body: 'Bug reports and security issues should be sent through the contact channel.' },
    ],
  },
  press: {
    eyebrow: 'Company',
    title: 'Press',
    description: 'Use this page for quick project context, screenshots, and owner contact details when writing about Vyntra.bio.',
    icon: Newspaper,
    cta: { label: 'Contact', to: '/support' },
    sections: [
      { title: 'What it is', icon: Sparkles, body: 'A dark, polished, self-hosted bio-link and profile-card platform for creators.' },
      { title: 'What makes it different', icon: Shield, body: 'No paid tiers, no Stripe, no external S3 requirement, and no locked premium features.' },
      { title: 'Brand usage', icon: FileText, body: 'Use the Vyntra.bio name clearly and avoid implying affiliation with unrelated bio-link services.' },
    ],
  },
  contact: {
    eyebrow: 'Support',
    title: 'Contact',
    description: 'For support, moderation, bug reports, or project questions, use the owner-maintained channels below.',
    icon: Mail,
    cta: { label: 'GitHub profile', href: 'https://github.com/m4rcel-lol' },
    sections: [
      { title: 'GitHub', icon: Github, body: 'Project and code-related requests should go through github.com/m4rcel-lol.' },
      { title: 'X / Twitter', icon: ArrowRight, body: 'Short public updates and contact can use twitter.com/m5rcode.' },
      { title: 'Self-hosting support', icon: Terminal, body: 'Include your Docker Compose logs, environment summary, and exact failing URL when asking for help.' },
    ],
  },
  privacy: {
    eyebrow: 'Legal',
    title: 'Privacy',
    description: 'Vyntra.bio is designed for privacy-friendly self-hosting. Your deployment controls its own database, uploads, logs, and retention.',
    icon: Shield,
    cta: { label: 'View settings', to: '/dashboard/settings' },
    sections: [
      { title: 'Data collected', icon: FileText, body: 'Accounts store username, optional email, password hash, profile content, links, uploaded asset metadata, sessions, and privacy-friendly analytics.' },
      { title: 'Analytics', icon: Gauge, body: 'Analytics avoid invasive tracking and use request headers for approximate device, browser, referrer, and country information when available.' },
      { title: 'Your server', icon: Terminal, body: 'Because the app is self-hosted, the operator is responsible for backups, retention, and legal compliance in their region.' },
    ],
  },
  terms: {
    eyebrow: 'Legal',
    title: 'Terms',
    description: 'These terms describe expected use for a self-hosted Vyntra.bio instance.',
    icon: Scale,
    cta: { label: 'Read guidelines', to: '/guidelines' },
    sections: [
      { title: 'Use responsibly', icon: Shield, body: 'Do not use profiles, templates, links, uploads, or blog posts for abuse, impersonation, malware, scams, or illegal content.' },
      { title: 'Operator responsibility', icon: Terminal, body: 'The person hosting the instance controls enforcement, backups, domains, and server operations.' },
      { title: 'No paid feature promise', icon: Sparkles, body: 'Vyntra.bio ships all premium-style features free in this project.' },
    ],
  },
  cookies: {
    eyebrow: 'Legal',
    title: 'Cookies',
    description: 'Vyntra.bio uses only practical cookies needed for authentication, CSRF protection, and privacy-friendly view deduplication.',
    icon: Cookie,
    cta: { label: 'Privacy details', to: '/privacy' },
    sections: [
      { title: 'Session cookie', icon: Shield, body: 'The session cookie is HTTP-only and keeps authenticated users signed in.' },
      { title: 'CSRF protection', icon: Scale, body: 'A CSRF token protects authenticated write requests from cross-site request abuse.' },
      { title: 'Visitor dedupe', icon: Gauge, body: 'Public profile view counting may use a lightweight visitor cookie to avoid repeated self-refresh view inflation.' },
    ],
  },
  guidelines: {
    eyebrow: 'Legal',
    title: 'Community guidelines',
    description: 'These guidelines keep public profiles, templates, uploads, and blog posts useful and safe.',
    icon: Shield,
    cta: { label: 'Report through admin', to: '/dashboard' },
    sections: [
      { title: 'No impersonation', icon: BadgeCheck, body: 'Do not pretend to be staff, verified, owner, moderator, or another person.' },
      { title: 'No harmful content', icon: Shield, body: 'Do not host malware, phishing, harassment, threats, explicit abuse, or illegal material.' },
      { title: 'Respect uploads', icon: FileText, body: 'Only upload assets you own or have permission to use.' },
    ],
  },
  status: {
    eyebrow: 'Operations',
    title: 'Status',
    description: 'This self-hosted instance reports application health through Docker, the backend health endpoint, and your reverse proxy.',
    icon: Gauge,
    cta: { label: 'Open dashboard', to: '/dashboard' },
    sections: [
      { title: 'Application', icon: Rocket, body: 'Frontend routes are available when the frontend container and reverse proxy are healthy.' },
      { title: 'Backend', icon: Terminal, body: 'The backend exposes /health for container and reverse proxy checks.' },
      { title: 'Database and cache', icon: Shield, body: 'PostgreSQL and Valkey health depend on Docker volumes, credentials, migrations, and server resources.' },
    ],
  },
};

export default function InfoPage({ page }) {
  const content = pages[page];
  if (!content) return <Navigate to="/" replace />;
  const Icon = content.icon;

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/75 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/" aria-label="Vyntra home"><Logo /></Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild><Link to="/blog">Blog</Link></Button>
            <Button asChild><Link to="/dashboard">Dashboard</Link></Button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative px-6 py-20 sm:py-24">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-grid opacity-35" />
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.13),transparent_34%)]" />
          <div className="mx-auto max-w-5xl">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-secondary/45">
              <Icon className="h-5 w-5" />
            </div>
            <p className="mt-6 text-xs font-medium uppercase tracking-[0.28em] text-muted-foreground">{content.eyebrow}</p>
            <h1 className="mt-4 max-w-3xl font-display text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">{content.title}</h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">{content.description}</p>
            <div className="mt-8">
              {'href' in content.cta ? (
                <Button asChild>
                  <a href={content.cta.href} target="_blank" rel="noopener noreferrer">
                    {content.cta.label}
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
              ) : (
                <Button asChild>
                  <Link to={content.cta.to}>
                    {content.cta.label}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </section>

        <section className="px-6 pb-24">
          <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-3">
            {content.sections.map((section) => (
              <GlassCard key={section.title} glow className="flex h-full flex-col p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary/60">
                  <section.icon className="h-5 w-5" />
                </div>
                <h2 className="mt-5 font-display text-lg font-semibold">{section.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{section.body}</p>
              </GlassCard>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
