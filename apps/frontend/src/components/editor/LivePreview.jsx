import { Monitor, Smartphone, ExternalLink } from 'lucide-react';
import { useProfileStore } from '@/stores/profile.store';
import { useUIStore } from '@/stores/ui.store';
import { PublicProfileRenderer } from '@/components/profile/PublicProfileRenderer';
import { cn } from '@/lib/utils';

export const LivePreview = ({ className }) => {
  const profile = useProfileStore((s) => s.profile);
  const device = useUIStore((s) => s.previewDevice);
  const setDevice = useUIStore((s) => s.setPreviewDevice);

  return (
    <div className={cn('flex flex-col', className)}>
      <div className="mb-3 flex items-center justify-between">
        <div className="inline-flex rounded-lg border border-border bg-secondary/30 p-0.5">
          <button
            onClick={() => setDevice('desktop')}
            className={cn('flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors', device === 'desktop' ? 'bg-secondary text-foreground' : 'text-muted-foreground')}
            data-testid="preview-desktop"
          >
            <Monitor className="h-3.5 w-3.5" /> Desktop
          </button>
          <button
            onClick={() => setDevice('mobile')}
            className={cn('flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors', device === 'mobile' ? 'bg-secondary text-foreground' : 'text-muted-foreground')}
            data-testid="preview-mobile"
          >
            <Smartphone className="h-3.5 w-3.5" /> Mobile
          </button>
        </div>
        <a
          href={`/u/${profile.username}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ExternalLink className="h-3.5 w-3.5" /> Open live
        </a>
      </div>

      {device === 'desktop' ? (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-elevated">
          <div className="flex items-center gap-1.5 border-b border-border bg-secondary/30 px-4 py-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40" />
            <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40" />
            <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40" />
            <span className="mx-auto rounded-full bg-background px-4 py-0.5 text-xs text-muted-foreground">vyntra.sarl/{profile.username}</span>
          </div>
          <div className="h-[620px] overflow-y-auto no-scrollbar">
            <PublicProfileRenderer profile={profile} preview forceEntered />
          </div>
        </div>
      ) : (
        <div className="flex justify-center">
          <div className="relative h-[660px] w-[330px] rounded-[2.6rem] border-[10px] border-secondary bg-card shadow-elevated">
            <div className="absolute left-1/2 top-2 z-20 h-5 w-24 -translate-x-1/2 rounded-full bg-secondary" />
            <div className="h-full w-full overflow-hidden overflow-y-auto rounded-[1.9rem] no-scrollbar">
              <PublicProfileRenderer profile={profile} preview forceEntered />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
