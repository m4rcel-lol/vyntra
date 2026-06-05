import { Link } from 'react-router-dom';
import { ArrowUpRight, Github, Twitter } from 'lucide-react';
import { Logo } from '@/components/common/Logo';

const COLUMNS = [
  {
    title: 'Product',
    links: [
      { label: 'Features', to: '/features' },
      { label: 'Templates', to: '/explore' },
      { label: 'Showcase', to: '/showcase' },
      { label: 'Free features', to: '/perks' },
      { label: 'Changelog', to: '/changelog' },
    ],
  },
  {
    title: 'Creators',
    links: [
      { label: 'Explore', to: '/explore' },
      { label: 'Top profiles', to: '/leaderboard' },
      { label: 'Verified', to: '/verified' },
      { label: 'Badges', to: '/badges' },
      { label: 'API', to: '/api-info' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', to: '/about' },
      { label: 'Blog', to: '/blog' },
      { label: 'Careers', to: '/careers' },
      { label: 'Press', to: '/press' },
      { label: 'Contact', to: '/contact' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy', to: '/privacy' },
      { label: 'Terms', to: '/terms' },
      { label: 'Cookies', to: '/cookies' },
      { label: 'Guidelines', to: '/guidelines' },
      { label: 'Status', to: '/status' },
    ],
  },
];

const socials = [
  { label: 'X / Twitter', href: 'https://twitter.com/m5rcode', icon: Twitter },
  { label: 'GitHub', href: 'https://github.com/m4rcel-lol', icon: Github },
];

export const Footer = () => (
  <footer className="relative overflow-hidden border-t border-border bg-background">
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.08),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.035),transparent_42%)]" />
    <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-line" />

    <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="grid gap-10 lg:grid-cols-[1.25fr_2.2fr]">
        <div className="max-w-sm">
          <Link to="/" aria-label="Vyntra home" className="inline-flex">
            <Logo />
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
            One polished link for everything you are. Vyntra.bio is self-hosted, creator-focused, and fully unlocked.
          </p>
          <div className="mt-5 flex gap-2">
            {socials.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
                className="group flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-secondary/35 text-muted-foreground transition-all hover:-translate-y-0.5 hover:border-foreground/30 hover:bg-secondary/70 hover:text-foreground"
              >
                <social.icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-4 sm:gap-8">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold text-foreground">{col.title}</h4>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="group inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                      <ArrowUpRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10 flex flex-col gap-4 border-t border-border pt-6 sm:mt-12 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Vyntra.bio. Self-hosted creator profiles.</p>
        <Link to="/status" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <span className="flex h-2 w-2 rounded-full bg-success shadow-[0_0_12px_rgba(34,197,94,0.5)]" />
          All systems operational
        </Link>
      </div>
    </div>
  </footer>
);
