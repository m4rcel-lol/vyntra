import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { MobileBottomNav, Sidebar, SidebarContent } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { PageTransition } from '@/components/common/PageTransition';
import { useUIStore } from '@/stores/ui.store';
import { useAuthStore } from '@/stores/auth.store';
import { subscribeRealtime } from '@/services/realtime.service';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export const DashboardLayout = ({ title, children, fluid = false, mainClassName }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const mobileNavOpen = useUIStore((s) => s.mobileNavOpen);
  const setMobileNav = useUIStore((s) => s.setMobileNav);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const currentUser = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    return subscribeRealtime((event, payload) => {
      if (!['notification:new', 'message:new', 'support:accepted', 'support:message', 'support:closed', 'support:waiting', 'support:queue'].includes(event)) return;
      const ownMessageEvent = event === 'message:new' && payload?.message?.sender?.id === currentUser?.id;
      if (!ownMessageEvent) playDing();
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['support'] });
      queryClient.invalidateQueries({ queryKey: ['admin-support'] });

      if (event === 'notification:new' && payload?.title) {
        const open = () => payload.url && navigate(payload.url);
        toast(payload.title, {
          description: payload.body || undefined,
          icon: payload.imageUrl ? <img src={payload.imageUrl} alt="" className="h-7 w-7 rounded-full object-cover" /> : undefined,
          action: payload.url ? { label: 'Open', onClick: open } : undefined,
        });
        showBrowserNotification(payload.title, payload.body, payload.imageUrl, payload.url);
      }
    });
  }, [currentUser?.id, isAuthenticated, navigate, queryClient]);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      {/* Mobile drawer */}
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNav}>
        <SheetContent side="left" className="w-[min(88vw,20rem)] border-border bg-card/95 p-0 backdrop-blur-xl">
          <SidebarContent onNavigate={() => setMobileNav(false)} />
        </SheetContent>
      </Sheet>

      <div className={cn('transition-[padding] duration-300', collapsed ? 'lg:pl-[76px]' : 'lg:pl-64')}>
        <Topbar title={title} />
        <main className={cn('mx-auto w-full px-3 py-5 pb-28 sm:px-6 sm:py-6 lg:py-8 lg:pb-8', !fluid && 'max-w-7xl', mainClassName)}>
          <PageTransition className="h-full min-h-0">{children}</PageTransition>
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
};

function playDing() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(1320, context.currentTime + 0.08);
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.08, context.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.22);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.24);
    window.setTimeout(() => context.close(), 400);
  } catch {
    // Audio can be blocked by browser policy; notifications still work.
  }
}

async function showBrowserNotification(title, body, icon, url) {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'default') {
    await Notification.requestPermission().catch(() => null);
  }
  if (Notification.permission === 'granted') {
    const notification = new Notification(title, { body: body || 'Vyntra notification', icon: icon || undefined });
    if (url) {
      notification.onclick = () => {
        window.focus();
        window.location.assign(url);
      };
    }
  }
}
