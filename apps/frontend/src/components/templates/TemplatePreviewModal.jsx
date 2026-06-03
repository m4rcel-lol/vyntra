import { Heart, Download, X } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatNumber } from '@/utils/format';

export const TemplatePreviewModal = ({ template, liked, onLike, onApply, onOpenChange }) => (
  <Dialog open={!!template} onOpenChange={(o) => !o && onOpenChange(null)}>
    <DialogContent className="max-w-2xl overflow-hidden border-border bg-card p-0">
      {template && (
        <div>
          <div className="relative aspect-video w-full overflow-hidden">
            <img src={template.preview} alt={template.name} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
            <span className="absolute left-4 top-4 rounded-full bg-background/70 px-3 py-1 text-xs backdrop-blur">{template.category} · {template.style}</span>
          </div>
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-display text-2xl font-semibold">{template.name}</h2>
                <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                  <img src={template.authorAvatar} alt="" className="h-5 w-5 rounded-full object-cover" />
                  by @{template.author}
                </div>
              </div>
              <div className="flex gap-4 text-right text-sm">
                <div><p className="font-semibold">{formatNumber(template.uses)}</p><p className="text-xs text-muted-foreground">uses</p></div>
                <div><p className="font-semibold">{formatNumber(template.likes)}</p><p className="text-xs text-muted-foreground">likes</p></div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {template.tags.map((t) => <span key={t} className="rounded-md bg-secondary/50 px-2 py-0.5 text-xs text-muted-foreground">#{t}</span>)}
            </div>
            <div className="mt-6 flex gap-2">
              <Button variant="outline" onClick={() => onLike(template.id)} className="flex-1">
                <Heart className={liked ? 'fill-destructive text-destructive' : ''} /> {liked ? 'Liked' : 'Like'}
              </Button>
              <Button onClick={() => onApply(template)} className="flex-1"><Download className="h-4 w-4" /> Use this template</Button>
            </div>
          </div>
        </div>
      )}
    </DialogContent>
  </Dialog>
);
