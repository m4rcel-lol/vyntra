import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * Ambient animated backdrop: soft white radial orbs drifting over a grid,
 * topped with subtle film grain. Kept under ~20% effective coverage and
 * always behind content (z -10). Monochrome to match the brand.
 */
export const AnimatedBackground = ({ variant = 'hero', className }) => {
  const orbs = variant === 'hero'
    ? [
        { size: 520, x: '8%', y: '2%', d: 16, o: 0.10 },
        { size: 420, x: '70%', y: '12%', d: 22, o: 0.07 },
        { size: 360, x: '42%', y: '55%', d: 19, o: 0.06 },
      ]
    : [
        { size: 380, x: '78%', y: '-6%', d: 24, o: 0.05 },
        { size: 300, x: '-4%', y: '40%', d: 20, o: 0.05 },
      ];

  return (
    <div className={cn('pointer-events-none absolute inset-0 -z-10 overflow-hidden', className)} aria-hidden="true">
      <div className="absolute inset-0 bg-grid mask-fade-b opacity-60" />
      {orbs.map((orb, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full blur-3xl"
          style={{
            width: orb.size,
            height: orb.size,
            left: orb.x,
            top: orb.y,
            background: `radial-gradient(circle, hsl(0 0% 100% / ${orb.o}), transparent 68%)`,
          }}
          animate={{ x: [0, 36, -24, 0], y: [0, -28, 18, 0] }}
          transition={{ duration: orb.d, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
      <div className="absolute inset-0 noise" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />
    </div>
  );
};
