import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export const SectionHeading = ({ eyebrow, title, description, align = 'center', className }) => (
  <div className={cn('max-w-2xl', align === 'center' && 'mx-auto text-center', className)}>
    {eyebrow && (
      <motion.span
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/40 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground"
      >
        {eyebrow}
      </motion.span>
    )}
    <motion.h2
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-4xl text-balance"
    >
      {title}
    </motion.h2>
    {description && (
      <motion.p
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className="mt-4 text-base leading-relaxed text-muted-foreground text-pretty"
      >
        {description}
      </motion.p>
    )}
  </div>
);
