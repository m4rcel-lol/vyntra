import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { Icon } from '@/components/common/Icon';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { profileService } from '@/services/profile.service';

const styleClasses = {
  glass: 'glass border-gradient hover:bg-white/10',
  solid: 'bg-primary text-primary-foreground hover:opacity-90',
  outline: 'border border-border bg-transparent hover:bg-secondary/50',
  minimal: 'bg-secondary/40 hover:bg-secondary/70',
};

// Full-width link pills (default) or compact icon row.
export const SocialLinks = ({ links = [], accent = '0 0% 100%', variant = 'list', className }) => {
  if (!links.length) return null;

  if (variant === 'icons') {
    return (
      <TooltipProvider delayDuration={120}>
        <div className={cn('flex flex-wrap items-center justify-center gap-2', className)}>
          {links.map((l) => (
            <Tooltip key={l.id}>
              <TooltipTrigger asChild>
                <a
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-11 w-11 items-center justify-center rounded-xl glass border-gradient transition-transform hover:scale-110"
                  style={{ '--tw-ring-color': `hsl(${accent})` }}
                  aria-label={l.label}
                  title={l.label}
                  onClick={() => profileService.recordLinkClick(l.id).catch(() => {})}
                >
                  <Icon name={l.icon} className="h-5 w-5" />
                </a>
              </TooltipTrigger>
              <TooltipContent>{l.label}</TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>
    );
  }

  return (
    <div className={cn('flex flex-col gap-2.5', className)}>
      {links.map((l, i) => (
        <motion.a
          key={l.id}
          href={l.url}
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 * i }}
          whileHover={{ y: -2 }}
          className={cn(
            'group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all',
            styleClasses[l.style] || styleClasses.glass
          )}
          title={l.label}
          style={l.style === 'glass' ? { boxShadow: `inset 0 0 0 1px hsl(${accent} / 0.04)` } : undefined}
          onMouseEnter={(e) => { if (l.style === 'glass') e.currentTarget.style.boxShadow = `0 0 22px -6px hsl(${accent} / 0.6)`; }}
          onMouseLeave={(e) => { if (l.style === 'glass') e.currentTarget.style.boxShadow = `inset 0 0 0 1px hsl(${accent} / 0.04)`; }}
          onClick={() => profileService.recordLinkClick(l.id).catch(() => {})}
        >
          <Icon name={l.icon} className="h-5 w-5 shrink-0" />
          <span className="flex-1 truncate text-left">{l.label}</span>
          <ArrowUpRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
        </motion.a>
      ))}
    </div>
  );
};
