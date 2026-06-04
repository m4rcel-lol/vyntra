import { Link } from 'react-router-dom';
import { Twitter, Instagram, Github, Youtube } from 'lucide-react';
import { Logo } from '@/components/common/Logo';

const COLUMNS = [
  { title: 'Product', links: ['Features', 'Templates', 'Showcase', 'Free features', 'Changelog'] },
  { title: 'Creators', links: ['Explore', 'Top profiles', 'Verified', 'Badges', 'API'] },
  { title: 'Company', links: ['About', 'Blog', 'Careers', 'Press', 'Contact'] },
  { title: 'Legal', links: ['Privacy', 'Terms', 'Cookies', 'Guidelines', 'Status'] },
];

const socials = [Twitter, Instagram, Github, Youtube];

export const Footer = () => (
  <footer className="relative border-t border-border">
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="grid gap-12 md:grid-cols-[1.4fr_repeat(4,1fr)]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
            One link for everything you are. Build an animated creator profile in minutes, no code required.
          </p>
          <div className="mt-5 flex gap-2">
            {socials.map((Icon, i) => (
              <a
                key={i}
                href="#"
                aria-label="social"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-secondary/40 text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h4 className="text-sm font-semibold">{col.title}</h4>
            <ul className="mt-4 space-y-3">
              {col.links.map((l) => (
                <li key={l}>
                  {l === 'Free features' ? (
                    <Link to="/perks" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                      {l}
                    </Link>
                  ) : (
                    <a href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                      {l}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row">
        <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Vyntra.bio — self-hosted creator profiles.</p>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="flex h-2 w-2 rounded-full bg-success" />
          All systems operational
        </div>
      </div>
    </div>
  </footer>
);
