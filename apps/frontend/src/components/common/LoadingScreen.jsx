import { Logo } from '@/components/common/Logo';

export const LoadingScreen = () => (
  <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background">
    <div className="animate-float"><Logo size={36} showText={false} /></div>
    <div className="h-1 w-40 overflow-hidden rounded-full bg-secondary">
      <div className="h-full w-1/2 animate-marquee rounded-full bg-gradient-to-r from-transparent via-foreground to-transparent" />
    </div>
    <p className="text-sm text-muted-foreground">Loading your space…</p>
  </div>
);
