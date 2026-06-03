import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Quote } from 'lucide-react';
import { AnimatedBackground } from '@/components/common/AnimatedBackground';
import { Logo } from '@/components/common/Logo';
import { MiniProfileCard } from '@/components/profile/MiniProfileCard';
import { mockProfiles } from '@/mocks/profiles.mock';

// Split-screen auth shell: brand/visual aside (desktop) + form (children).
export const AuthShell = ({ children, title, subtitle }) => (
  <div className="relative grid min-h-screen lg:grid-cols-2">
    {/* Visual side */}
    <aside className="relative hidden overflow-hidden border-r border-border lg:flex">
      <AnimatedBackground variant="hero" />
      <div className="relative z-10 flex w-full flex-col justify-between p-12">
        <Link to="/"><Logo size={30} /></Link>
        <div className="flex flex-1 items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 24, rotate: -4 }}
            animate={{ opacity: 1, y: 0, rotate: -4 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="animate-float"
          >
            <MiniProfileCard profile={mockProfiles.nova} interactive={false} showViews={false} />
          </motion.div>
        </div>
        <figure className="max-w-md">
          <Quote className="h-6 w-6 text-muted-foreground" />
          <blockquote className="mt-3 font-display text-lg leading-relaxed">
            “Vyntra is the first link page that actually looks like my brand. Setup took five minutes.”
          </blockquote>
          <figcaption className="mt-3 text-sm text-muted-foreground">Nova Sterling — 3D Artist</figcaption>
        </figure>
      </div>
    </aside>

    {/* Form side */}
    <main className="relative flex items-center justify-center px-6 py-12">
      <AnimatedBackground variant="subtle" className="lg:hidden" />
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-between lg:hidden">
          <Link to="/"><Logo /></Link>
        </div>
        <Link to="/" className="mb-6 hidden items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground lg:inline-flex">
          <ArrowLeft className="h-4 w-4" /> Back home
        </Link>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="font-display text-3xl font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
          <div className="mt-8">{children}</div>
        </motion.div>
      </div>
    </main>
  </div>
);
