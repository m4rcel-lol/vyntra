import { motion } from 'framer-motion';
import { Heart, Download, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatNumber } from '@/utils/format';
import { cn } from '@/lib/utils';

export const TemplateCard = ({ template, liked, onLike, onPreview, onApply }) => (
  <motion.div
    initial={{ opacity: 0, y: 18 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card glow-hover"
  >
    <div className="relative aspect-[4/3] overflow-hidden">
      <img src={template.preview} alt={template.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
      <div className="absolute inset-0 bg-gradient-to-t from-card via-card/10 to-transparent" />
      <span className="absolute left-3 top-3 rounded-full bg-background/70 px-2.5 py-1 text-xs font-medium backdrop-blur">{template.category}</span>
      <button
        onClick={() => onLike(template.id)}
        className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-background/70 backdrop-blur transition-colors"
        aria-label="Like template"
        data-testid={`tpl-like-${template.id}`}
      >
        <Heart className={cn('h-4 w-4 transition-colors', liked ? 'fill-destructive text-destructive' : 'text-foreground')} />
      </button>
      <div className="absolute inset-x-3 bottom-3 flex translate-y-2 gap-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
        <Button size="sm" variant="secondary" className="flex-1" onClick={() => onPreview(template)}><Eye className="h-3.5 w-3.5" /> Preview</Button>
        <Button size="sm" className="flex-1" onClick={() => onApply(template)} data-testid={`tpl-apply-${template.id}`}><Download className="h-3.5 w-3.5" /> Use</Button>
      </div>
    </div>
    <div className="flex flex-1 flex-col p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-semibold">{template.name}</h3>
        <span className="text-xs text-muted-foreground">{formatNumber(template.uses)} uses</span>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <img src={template.authorAvatar} alt={template.author} className="h-5 w-5 rounded-full object-cover" />
        <span className="text-xs text-muted-foreground">@{template.author}</span>
        <span className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground"><Heart className="h-3 w-3" /> {formatNumber(template.likes)}</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {template.tags.map((t) => (
          <span key={t} className="rounded-md bg-secondary/50 px-2 py-0.5 text-[11px] text-muted-foreground">#{t}</span>
        ))}
      </div>
    </div>
  </motion.div>
);
