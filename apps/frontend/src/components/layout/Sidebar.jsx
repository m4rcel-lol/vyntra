import { NavLink, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, PenTool, LayoutTemplate, BarChart3, Settings,
  ShieldCheck, ChevronLeft, LogOut, ExternalLink, Sparkles, FolderOpen, Trophy, Newspaper,
  MessageCircle, MessagesSquare, Headphones,
} from 'lucide-react';
import { Logo } from '@/components/common/Logo';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/stores/ui.store';
import { useAuthStore } from '@/stores/auth.store';
import { dashboardData } from '@/services/backend';
import { cn } from '@/lib/utils';

const fallbackUser = {
  username: 'profile',
  displayName: 'Vyntra user',
  avatar: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect width="96" height="96" rx="24" fill="%23111111"/><text x="48" y="57" text-anchor="middle" font-size="34" fill="white" font-family="Arial">V</text></svg>',
};

export const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/dashboard/editor', label: 'Editor', icon: PenTool },
  { to: '/dashboard/templates', label: 'Templates', icon: LayoutTemplate },
  { to: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/dashboard/files', label: 'Files', icon: FolderOpen },
  { to: '/dashboard/messages', label: 'Messages', icon: MessageCircle },
  { to: '/dashboard/support', label: 'Support', icon: Headphones },
  { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { to: '/blog', label: 'Blog', icon: Newspaper },
  { to: '/forums', label: 'Forums', icon: MessagesSquare },
  { to: '/dashboard/settings', label: 'Settings', icon: Settings },
  { to: '/admin', label: 'Admin', icon: ShieldCheck, adminOnly: true },
];

const MOBILE_NAV_ITEMS = NAV_ITEMS.filter((item) =>
  ['/dashboard', '/dashboard/editor', '/dashboard/messages', '/dashboard/support', '/dashboard/settings'].includes(item.to)
);

export const SidebarContent = ({ collapsed = false, onNavigate }) => {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const authUser = useAuthStore((s) => s.user) || fallbackUser;
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { data } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardData,
    enabled: isAuthenticated,
    staleTime: 30_000,
  });
  const user = {
    ...authUser,
    displayName: data?.profile?.displayName || authUser.displayName,
    avatar: data?.profile?.avatar || authUser.avatar,
  };
  const navItems = NAV_ITEMS.filter((item) => !item.adminOnly || ['owner', 'admin'].includes(user.role));

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex h-full flex-col">
      <div className={cn('flex h-16 items-center px-5', collapsed && 'justify-center px-0')}>
        <Logo showText={!collapsed} />
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                collapsed && 'justify-center px-0',
                isActive
                  ? 'bg-secondary/70 text-foreground'
                  : 'text-muted-foreground hover:bg-secondary/40 hover:text-foreground'
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span layoutId="sidebar-active" className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-foreground" />
                )}
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {!collapsed && (
        <div className="mx-3 mb-3 rounded-2xl glass-panel border-gradient p-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Sparkles className="h-4 w-4" /> Unlimited is free
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Every badge, effect, template, file upload and analytics feature is available to everyone.</p>
          <Button size="sm" className="mt-3 w-full" onClick={() => navigate('/dashboard/editor')}>Customize</Button>
        </div>
      )}

      <div className={cn('border-t border-border p-3', collapsed && 'px-2')}>
        <div className={cn('flex items-center gap-3 rounded-xl p-2', collapsed && 'justify-center')}>
          <img src={user.avatar} alt={user.displayName} className="h-9 w-9 rounded-lg object-cover" />
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user.displayName}</p>
              <p className="truncate text-xs text-muted-foreground">@{user.username}</p>
            </div>
          )}
          {!collapsed && (
            <button onClick={handleLogout} className="text-muted-foreground hover:text-foreground" aria-label="Log out" data-testid="sidebar-logout">
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
        {!collapsed && (
          <Button variant="outline" size="sm" className="mt-2 w-full" onClick={() => navigate(`/u/${user.username}`)}>
            <ExternalLink className="h-3.5 w-3.5" /> View public profile
          </Button>
        )}
      </div>
    </div>
  );
};

export const Sidebar = () => {
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggle = useUIStore((s) => s.toggleSidebar);

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 hidden border-r border-border bg-card/40 backdrop-blur-xl transition-[width] duration-300 lg:block',
        collapsed ? 'w-[76px]' : 'w-64'
      )}
    >
      <SidebarContent collapsed={collapsed} />
      <button
        onClick={toggle}
        aria-label="Toggle sidebar"
        className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')} />
      </button>
    </aside>
  );
};

export const MobileBottomNav = () => (
  <nav
    className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-2 pt-2 backdrop-blur-xl lg:hidden"
    style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 0.5rem)' }}
    aria-label="Dashboard navigation"
  >
    <div className="mx-auto grid max-w-md grid-cols-5 gap-1 rounded-2xl border border-border bg-secondary/20 p-1 shadow-soft">
      {MOBILE_NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            cn(
              'flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1.5 py-2 text-[11px] font-medium transition-colors',
              isActive ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
            )
          }
        >
          <item.icon className="h-4 w-4 shrink-0" />
          <span className="truncate">{item.label}</span>
        </NavLink>
      ))}
    </div>
  </nav>
);
