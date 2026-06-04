import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { Logo } from '@/components/common/Logo';
import { useAuthStore } from '@/stores/auth.store';
import { cn } from '@/lib/utils';

const NAV = [
  { label: 'Features', href: '#features' },
  { label: 'Templates', href: '#templates' },
  { label: 'Showcase', href: '#showcase' },
  { label: 'Perks', to: '/perks' },
  { label: 'Pricing', href: '#pricing' },
];

export const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-3"
    >
      <nav
        className={cn(
          'flex w-full max-w-6xl items-center justify-between rounded-2xl px-4 py-2.5 transition-all duration-500',
          scrolled ? 'glass-strong border-gradient shadow-soft' : 'border border-transparent'
        )}
      >
        <Link to="/" aria-label="Vyntra home">
          <Logo />
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            item.to ? (
              <Link
                key={item.label}
                to={item.to}
                className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            ) : (
              <a
                key={item.label}
                href={item.href}
                className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </a>
            )
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          {isAuthenticated ? (
            <Button size="sm" onClick={() => navigate('/dashboard')} data-testid="nav-dashboard" className="group">
              Dashboard
              <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate('/login')} data-testid="nav-login">
                Log in
              </Button>
              <Button size="sm" onClick={() => navigate('/register')} data-testid="nav-register" className="group">
                Claim your link
                <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
              </Button>
            </>
          )}
        </div>

        {/* Mobile */}
        <Sheet>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" aria-label="Open menu" data-testid="nav-mobile-toggle">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[80%] border-border bg-card/95 backdrop-blur-xl">
            <div className="mt-2 flex flex-col gap-1">
              <Logo className="mb-6" />
              {NAV.map((item) => (
                <SheetClose asChild key={item.label}>
                  {item.to ? (
                    <Link to={item.to} className="rounded-lg px-3 py-3 text-base text-foreground/90 hover:bg-secondary/60">
                      {item.label}
                    </Link>
                  ) : (
                    <a href={item.href} className="rounded-lg px-3 py-3 text-base text-foreground/90 hover:bg-secondary/60">
                      {item.label}
                    </a>
                  )}
                </SheetClose>
              ))}
              <div className="mt-6 flex flex-col gap-2">
                {isAuthenticated ? (
                  <Button onClick={() => navigate('/dashboard')}>Dashboard</Button>
                ) : (
                  <>
                    <Button variant="outline" onClick={() => navigate('/login')}>Log in</Button>
                    <Button onClick={() => navigate('/register')}>Claim your link</Button>
                  </>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </motion.header>
  );
};
