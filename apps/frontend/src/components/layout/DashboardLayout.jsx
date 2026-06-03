import { Sidebar, SidebarContent } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { PageTransition } from '@/components/common/PageTransition';
import { useUIStore } from '@/stores/ui.store';
import { cn } from '@/lib/utils';

export const DashboardLayout = ({ title, children, fluid = false }) => {
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const mobileNavOpen = useUIStore((s) => s.mobileNavOpen);
  const setMobileNav = useUIStore((s) => s.setMobileNav);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      {/* Mobile drawer */}
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNav}>
        <SheetContent side="left" className="w-72 border-border bg-card/95 p-0 backdrop-blur-xl">
          <SidebarContent onNavigate={() => setMobileNav(false)} />
        </SheetContent>
      </Sheet>

      <div className={cn('transition-[padding] duration-300', collapsed ? 'lg:pl-[76px]' : 'lg:pl-64')}>
        <Topbar title={title} />
        <main className={cn('mx-auto w-full px-4 py-6 sm:px-6 lg:py-8', !fluid && 'max-w-7xl')}>
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
};
