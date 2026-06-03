import { motion } from 'framer-motion';
import { MousePointerClick } from 'lucide-react';

export const IntroScreen = ({ profile, onEnter }) => {
  const accent = `hsl(${profile.accent})`;
  return (
    <motion.button
      type="button"
      onClick={onEnter}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="absolute inset-0 z-50 flex cursor-pointer flex-col items-center justify-center gap-6 bg-background/80 backdrop-blur-2xl"
      data-testid="intro-enter"
      aria-label="Click to enter profile"
    >
      <motion.img
        src={profile.avatar}
        alt={profile.displayName}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="h-24 w-24 rounded-3xl object-cover"
        style={{ boxShadow: `0 0 50px -8px ${accent}` }}
      />
      <motion.div
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2.4, repeat: Infinity }}
        className="flex items-center gap-2 text-sm uppercase tracking-[0.3em] text-foreground/80"
      >
        <MousePointerClick className="h-4 w-4" /> Click to enter
      </motion.div>
      <p className="font-display text-lg text-muted-foreground">@{profile.username}</p>
    </motion.button>
  );
};
