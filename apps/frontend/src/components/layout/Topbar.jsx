import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Menu, Search, Bell, ExternalLink, Headphones, MessageCircle, Sparkles, UserRoundPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useUIStore } from '@/stores/ui.store';
import { useAuthStore } from '@/stores/auth.store';
import { dashboardData } from '@/services/backend';
import { notificationsService } from '@/services/notifications.service';
import { formatRelative } from '@/utils/format';

const fallbackUser = {
  username: 'profile',
  displayName: 'Vyntra user',
  avatar: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect width="96" height="96" rx="24" fill="%23111111"/><text x="48" y="57" text-anchor="middle" font-size="34" fill="white" font-family="Arial">V</text></svg>',
};

export const Topbar = ({ title }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setMobileNav = useUIStore((s) => s.setMobileNav);
  const authUser = useAuthStore((s) => s.user) || fallbackUser;
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);
  const { data } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardData,
    enabled: isAuthenticated,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
  const user = {
    ...authUser,
    displayName: data?.profile?.displayName || authUser.displayName,
    avatar: data?.profile?.avatar || authUser.avatar,
  };
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationsService.list,
    enabled: isAuthenticated,
    staleTime: 15_000,
    refetchInterval: 60_000,
  });
  const clearNotifications = useMutation({
    mutationFn: notificationsService.clear,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/82 px-3 backdrop-blur-xl sm:h-16 sm:gap-3 sm:px-6">
      <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 lg:hidden" onClick={() => setMobileNav(true)} aria-label="Open navigation" data-testid="topbar-menu">
        <Menu className="h-5 w-5" />
      </Button>

      <h1 className="min-w-0 truncate font-display text-base font-semibold tracking-tight sm:text-lg">{title}</h1>

      <div className="relative ml-auto hidden w-64 md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search…" className="h-9 pl-9" />
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-1 md:ml-0 sm:gap-2">
        <Button variant="outline" size="sm" className="hidden shrink-0 sm:inline-flex" onClick={() => navigate(`/u/${user.username}`)}>
          <ExternalLink className="h-3.5 w-3.5" /> View profile
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Notifications" className="relative" data-testid="topbar-notifications">
              <Bell className="h-5 w-5" />
              {notifications.length > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-foreground" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="mr-2 w-[calc(100vw-1rem)] max-w-80 sm:mr-0">
            <DropdownMenuLabel className="flex items-center justify-between gap-3">
              <span>Notifications</span>
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    clearNotifications.mutate();
                  }}
                  className="text-xs font-normal text-muted-foreground transition-colors hover:text-foreground"
                >
                  Clear
                </button>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.length ? (
              <div className="max-h-96 overflow-y-auto p-1">
                {notifications.map((item) => {
                  const ItemIcon = iconForNotification(item.type);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => item.url && navigate(item.url)}
                      className="flex w-full gap-3 rounded-md px-2 py-2.5 text-left text-sm hover:bg-accent"
                    >
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary/70">
                        <ItemIcon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{item.title}</p>
                        <p className="line-clamp-2 text-xs text-muted-foreground">{item.body}</p>
                        <p className="mt-1 text-[11px] text-muted-foreground">{formatRelative(item.createdAt)}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                No notifications yet.
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex shrink-0 items-center gap-2 rounded-full p-0.5 transition-colors hover:bg-secondary/50 sm:pr-1" data-testid="topbar-user">
              <img src={user.avatar} alt={user.displayName} className="h-8 w-8 rounded-full object-cover" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <p className="text-sm font-medium">{user.displayName}</p>
              <p className="text-xs font-normal text-muted-foreground">@{user.username}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/dashboard/editor')}>Edit profile</DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/dashboard/messages')}>Messages</DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/dashboard/support')}>Support</DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/dashboard/settings')}>Settings</DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/dashboard/analytics')}>Analytics</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={async () => { await logout(); navigate('/login'); }} className="text-destructive focus:text-destructive">
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

function iconForNotification(type = '') {
  if (type.includes('message')) return MessageCircle;
  if (type.includes('friend')) return UserRoundPlus;
  if (type.includes('support')) return Headphones;
  return Sparkles;
}
