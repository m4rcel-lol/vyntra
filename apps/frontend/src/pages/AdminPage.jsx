import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Users, Flag, Award, FileWarning, ShieldAlert, BadgeCheck, Ban, CheckCircle2,
  KeyRound, Plus, Search, X, Eye, RotateCcw, LockKeyhole, Headphones,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/common/StatCard';
import { GlassCard } from '@/components/common/GlassCard';
import { Icon } from '@/components/common/Icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { adminService } from '@/services/admin.service';
import { supportService } from '@/services/support.service';
import { useAuthStore } from '@/stores/auth.store';
import { formatDate, formatNumber } from '@/utils/format';
import { cn } from '@/lib/utils';

const emptyBadgeForm = {
  slug: '',
  name: '',
  description: '',
  tooltip: '',
  color: '#d4d4d4',
  glowColor: '#ffffff',
};

const roleOptions = ['user', 'moderator', 'admin'];
const protectedBadgeSlugs = new Set(['owner', 'staff', 'moderator']);
const isProtectedBadge = (badge) => protectedBadgeSlugs.has(String(badge?.slug || '').toLowerCase());
const isOwnerUser = (user) => String(user?.role || '').toLowerCase() === 'owner';
const isSelfUser = (user, currentUser) => Boolean(user?.id && currentUser?.id && user.id === currentUser.id);
const isProtectedOwnerTarget = (user, currentUser) => isOwnerUser(user) && !isSelfUser(user, currentUser);

export default function AdminPage() {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const [query, setQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [assignBadgeId, setAssignBadgeId] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [badgeForm, setBadgeForm] = useState(emptyBadgeForm);

  const { data: stats } = useQuery({ queryKey: ['admin-stats'], queryFn: adminService.getAdminStats });
  const { data: users = [] } = useQuery({ queryKey: ['admin-users'], queryFn: adminService.getUsers });
  const { data: badges = [] } = useQuery({ queryKey: ['admin-badges'], queryFn: adminService.getBadges });
  const { data: reports = [] } = useQuery({ queryKey: ['admin-reports'], queryFn: adminService.getReports });
  const { data: supportConversations = [] } = useQuery({ queryKey: ['admin-support'], queryFn: supportService.adminConversations });

  useEffect(() => {
    if (!selectedUserId && users.length) setSelectedUserId(users[0].id);
  }, [selectedUserId, users]);

  const selectedUser = users.find((user) => user.id === selectedUserId) ?? users[0] ?? null;
  const selectedIsSelf = isSelfUser(selectedUser, currentUser);
  const currentIsOwner = String(currentUser?.role || '').toLowerCase() === 'owner';
  const verifiedBadge = badges.find((badge) => badge.slug === 'verified');
  const selectedBadgeIds = new Set(selectedUser?.badges?.map((badge) => badge.id) ?? []);
  const assignableBadges = badges.filter((badge) => !selectedBadgeIds.has(badge.id) && (currentIsOwner || !isProtectedBadge(badge)));
  const badgeFormIsProtected = !currentIsOwner && isProtectedBadge(badgeForm);

  const filteredUsers = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return users;
    return users.filter((user) =>
      [user.username, user.email, user.displayName, user.role, user.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle))
    );
  }, [query, users]);

  const invalidateAdmin = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    queryClient.invalidateQueries({ queryKey: ['admin-badges'] });
    queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['public-profile'] });
    queryClient.invalidateQueries({ queryKey: ['admin-support'] });
  };

  const updateUser = useMutation({
    mutationFn: ({ id, patch }) => adminService.updateUser(id, patch),
    onSuccess: () => {
      invalidateAdmin();
      toast.success('User updated');
    },
    onError: (error) => toast.error(error.message || 'Could not update user'),
  });

  const upsertBadge = useMutation({
    mutationFn: adminService.upsertBadge,
    onSuccess: () => {
      invalidateAdmin();
      setBadgeForm(emptyBadgeForm);
      toast.success('Badge saved');
    },
    onError: (error) => toast.error(error.message || 'Could not save badge'),
  });

  const assignBadge = useMutation({
    mutationFn: ({ profileId, badgeId }) => adminService.assignBadge(profileId, badgeId),
    onSuccess: () => {
      setAssignBadgeId('');
      invalidateAdmin();
      toast.success('Badge assigned');
    },
    onError: (error) => toast.error(error.message || 'Could not assign badge'),
  });

  const removeBadge = useMutation({
    mutationFn: ({ profileId, badgeId }) => adminService.removeBadge(profileId, badgeId),
    onSuccess: () => {
      invalidateAdmin();
      toast.success('Badge removed');
    },
    onError: (error) => toast.error(error.message || 'Could not remove badge'),
  });

  const resetViews = useMutation({
    mutationFn: ({ profileId, mode }) => adminService.resetProfileViews(profileId, mode),
    onSuccess: () => {
      invalidateAdmin();
      toast.success('Profile views reset');
    },
    onError: (error) => toast.error(error.message || 'Could not reset views'),
  });

  const acceptSupport = useMutation({
    mutationFn: supportService.accept,
    onSuccess: () => {
      invalidateAdmin();
      toast.success('Support chat accepted');
    },
    onError: (error) => toast.error(error.message || 'Could not accept support chat'),
  });

  const closeSupport = useMutation({
    mutationFn: supportService.close,
    onSuccess: () => {
      invalidateAdmin();
      toast.success('Support chat closed');
    },
    onError: (error) => toast.error(error.message || 'Could not close support chat'),
  });

  const selectedIsVerified = !!selectedUser?.badges?.some((badge) => badge.slug === 'verified');

  const toggleVerified = (user = selectedUser) => {
    if (isProtectedOwnerTarget(user, currentUser)) {
      toast.error('Owner accounts can only be managed by that same owner');
      return;
    }
    if (!user?.profileId || !verifiedBadge) return;
    const hasVerified = user.badges?.some((badge) => badge.slug === 'verified');
    if (hasVerified) {
      removeBadge.mutate({ profileId: user.profileId, badgeId: verifiedBadge.id });
    } else {
      assignBadge.mutate({ profileId: user.profileId, badgeId: verifiedBadge.id });
    }
  };

  const saveBadge = (event) => {
    event.preventDefault();
    upsertBadge.mutate({
      ...badgeForm,
      slug: badgeForm.slug.trim().toLowerCase(),
      name: badgeForm.name.trim(),
      description: badgeForm.description.trim(),
      tooltip: badgeForm.tooltip.trim(),
    });
  };

  const assignSelectedBadge = () => {
    if (isProtectedOwnerTarget(selectedUser, currentUser)) {
      toast.error('Owner accounts can only be managed by that same owner');
      return;
    }
    if (!selectedUser?.profileId || !assignBadgeId) return;
    assignBadge.mutate({ profileId: selectedUser.profileId, badgeId: assignBadgeId });
  };

  const resetSelectedPassword = () => {
    if (isProtectedOwnerTarget(selectedUser, currentUser)) {
      toast.error('Owner accounts can only be managed by that same owner');
      return;
    }
    if (!selectedUser || !newPassword) return;
    updateUser.mutate({ id: selectedUser.id, patch: { newPassword } });
    setNewPassword('');
  };

  const resetSelectedViews = () => {
    if (isProtectedOwnerTarget(selectedUser, currentUser)) {
      toast.error('Owner accounts can only be managed by that same owner');
      return;
    }
    if (!selectedUser?.profileId) return;
    const confirmed = window.confirm(`Reset all views and view analytics for @${selectedUser.username}? This cannot be undone.`);
    if (!confirmed) return;
    resetViews.mutate({ profileId: selectedUser.profileId, mode: 'zero' });
  };

  return (
    <DashboardLayout title="Admin">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5" />
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-tight">Moderation & administration</h2>
            <p className="text-sm text-muted-foreground">Manage users, verified status, global badges, reports, and platform health.</p>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-secondary/30 px-4 py-3 text-sm text-muted-foreground">
          Verified badge: {verifiedBadge ? <span className="text-foreground">ready</span> : <span className="text-destructive">missing</span>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Users} label="Total users" value={stats?.users ?? 0} />
        <StatCard icon={Users} label="Profiles" value={stats?.profiles ?? 0} />
        <StatCard icon={Award} label="Badges" value={badges.length} />
        <StatCard icon={FileWarning} label="Open reports" value={stats?.openReports ?? 0} />
      </div>

      <Tabs defaultValue="users" className="mt-6">
        <TabsList className="h-auto rounded-xl bg-secondary/30 p-1">
          <TabsTrigger value="users">Users & badges</TabsTrigger>
          <TabsTrigger value="badges">Global badges</TabsTrigger>
          <TabsTrigger value="support">Support</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-5">
          <div className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
            <GlassCard className="p-4">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-display text-lg font-semibold">Users</h3>
                  <p className="text-sm text-muted-foreground">Select a user to manage role, status, password, and badges.</p>
                </div>
                <div className="relative w-full sm:w-72">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search users..." className="pl-9" />
                </div>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead>User</TableHead>
                      <TableHead>Badges</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => {
                      const isSelected = selectedUser?.id === user.id;
                      const isVerified = user.badges?.some((badge) => badge.slug === 'verified');
                      return (
                        <TableRow
                          key={user.id}
                          className={cn('cursor-pointer border-border', isSelected && 'bg-secondary/40')}
                          onClick={() => setSelectedUserId(user.id)}
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <img src={user.avatar} alt="" className="h-9 w-9 rounded-lg object-cover" />
                              <div>
                                <p className="flex items-center gap-1.5 text-sm font-medium">
                                  @{user.username}
                                  {isVerified && <BadgeCheck className="h-3.5 w-3.5 text-sky-300" />}
                                </p>
                                <p className="text-xs text-muted-foreground">{user.email || user.displayName}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex max-w-[14rem] flex-wrap gap-1">
                              {(user.badges ?? []).slice(0, 4).map((badge) => (
                                <Badge key={badge.id} variant="secondary" className="border-border bg-secondary/40">
                                  {badge.name}
                                </Badge>
                              ))}
                              {!user.badges?.length && <span className="text-xs text-muted-foreground">None</span>}
                            </div>
                          </TableCell>
                          <TableCell className="capitalize text-muted-foreground">{user.role}</TableCell>
                          <TableCell>
                            <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs capitalize', user.isBanned ? 'bg-destructive/15 text-destructive' : 'bg-success/15 text-success')}>
                              {user.isBanned ? <Ban className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                              {user.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant={isVerified ? 'outline' : 'secondary'}
                              size="sm"
                              disabled={!verifiedBadge || !user.profileId || isProtectedOwnerTarget(user, currentUser)}
                              onClick={(event) => {
                                event.stopPropagation();
                                toggleVerified(user);
                              }}
                            >
                              {isVerified ? 'Unverify' : 'Verify'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </GlassCard>

            <UserManagementCard
              user={selectedUser}
              badges={badges}
              assignableBadges={assignableBadges}
              assignBadgeId={assignBadgeId}
              setAssignBadgeId={setAssignBadgeId}
              selectedIsVerified={selectedIsVerified}
              verifiedBadge={verifiedBadge}
              newPassword={newPassword}
              setNewPassword={setNewPassword}
              currentUser={currentUser}
              onToggleVerified={() => toggleVerified()}
              onAssignBadge={assignSelectedBadge}
              onRemoveBadge={(badgeId) => selectedUser?.profileId && removeBadge.mutate({ profileId: selectedUser.profileId, badgeId })}
              onUpdateRole={(role) => {
                if (!selectedUser) return;
                if (isOwnerUser(selectedUser) || selectedIsSelf) {
                  toast.error('You cannot change this account role from the admin panel');
                  return;
                }
                updateUser.mutate({ id: selectedUser.id, patch: { role: role.toUpperCase() } });
              }}
              onToggleBan={() =>
                selectedUser &&
                !isProtectedOwnerTarget(selectedUser, currentUser) &&
                updateUser.mutate({
                  id: selectedUser.id,
                  patch: {
                    isBanned: !selectedUser.isBanned,
                    banReason: selectedUser.isBanned ? null : selectedUser.banReason || 'Moderation action',
                  },
                })
              }
              onSaveBanReason={(reason) =>
                selectedUser &&
                !isProtectedOwnerTarget(selectedUser, currentUser) &&
                updateUser.mutate({ id: selectedUser.id, patch: { banReason: reason || null } })}
              onResetPassword={resetSelectedPassword}
              onResetViews={resetSelectedViews}
            />
          </div>
        </TabsContent>

        <TabsContent value="badges" className="mt-5">
          <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <GlassCard className="p-5">
              <h3 className="font-display text-lg font-semibold">Create or update global badge</h3>
              <p className="mt-1 text-sm text-muted-foreground">Global badges can be assigned to any user from the admin panel.</p>
              <form onSubmit={saveBadge} className="mt-5 space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-2 text-sm">
                    <span>Slug</span>
                    <Input value={badgeForm.slug} onChange={(e) => setBadgeForm((s) => ({ ...s, slug: e.target.value }))} placeholder="verified" required />
                  </label>
                  <label className="space-y-2 text-sm">
                    <span>Name</span>
                    <Input value={badgeForm.name} onChange={(e) => setBadgeForm((s) => ({ ...s, name: e.target.value }))} placeholder="Verified" required />
                  </label>
                </div>
                <label className="space-y-2 text-sm">
                  <span>Description</span>
                  <Textarea value={badgeForm.description} onChange={(e) => setBadgeForm((s) => ({ ...s, description: e.target.value }))} placeholder="Shown inside admin tools." />
                </label>
                <label className="space-y-2 text-sm">
                  <span>Tooltip</span>
                  <Input value={badgeForm.tooltip} onChange={(e) => setBadgeForm((s) => ({ ...s, tooltip: e.target.value }))} placeholder="Identity verified by Vyntra" />
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-2 text-sm">
                    <span>Badge color</span>
                    <Input type="color" value={badgeForm.color} onChange={(e) => setBadgeForm((s) => ({ ...s, color: e.target.value }))} className="h-10 p-1" />
                  </label>
                  <label className="space-y-2 text-sm">
                    <span>Glow color</span>
                    <Input type="color" value={badgeForm.glowColor} onChange={(e) => setBadgeForm((s) => ({ ...s, glowColor: e.target.value }))} className="h-10 p-1" />
                  </label>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={upsertBadge.isPending || badgeFormIsProtected}><Plus className="h-4 w-4" /> Save badge</Button>
                  <Button type="button" variant="outline" onClick={() => setBadgeForm(emptyBadgeForm)}>Clear</Button>
                </div>
                {badgeFormIsProtected && (
                  <p className="text-xs text-muted-foreground">Owner, Staff, and Moderator badges are system protected and cannot be edited from the admin panel.</p>
                )}
              </form>
            </GlassCard>

            <GlassCard className="p-5">
              <h3 className="font-display text-lg font-semibold">Badge library</h3>
              <p className="mt-1 text-sm text-muted-foreground">Click a badge to load it into the editor.</p>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {badges.map((badge) => {
                  const protectedBadge = isProtectedBadge(badge);
                  const lockedForActor = protectedBadge && !currentIsOwner;
                  return (
                  <button
                    key={badge.id}
                    onClick={() => {
                      if (lockedForActor) return;
                      setBadgeForm({
                        slug: badge.slug,
                        name: badge.name,
                        description: badge.description,
                        tooltip: badge.tooltip,
                        color: badge.color,
                        glowColor: badge.glowColor,
                      });
                    }}
                    className={cn(
                      'rounded-2xl border border-border bg-secondary/20 p-4 text-left transition-colors hover:bg-secondary/40',
                      lockedForActor && 'cursor-not-allowed opacity-75 hover:bg-secondary/20'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="flex h-10 w-10 items-center justify-center rounded-xl border"
                        style={{ borderColor: badge.color, color: badge.color, boxShadow: `0 0 18px -8px ${badge.glowColor}` }}
                      >
                        <Icon name={badge.icon} fallback="Award" className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{badge.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{badge.slug}</p>
                      </div>
                      {badge.slug === 'verified' && <BadgeCheck className="ml-auto h-4 w-4 text-sky-300" />}
                      {protectedBadge && <LockKeyhole className="ml-auto h-4 w-4 text-amber-300" />}
                    </div>
                    <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">{badge.tooltip || badge.description || 'No tooltip set.'}</p>
                    <p className="mt-3 text-xs text-muted-foreground">
                      {formatNumber(badge.assignmentCount)} assigned
                      {protectedBadge ? currentIsOwner ? ' · owner editable' : ' · system protected' : ''}
                    </p>
                  </button>
                  );
                })}
              </div>
            </GlassCard>
          </div>
        </TabsContent>

        <TabsContent value="support" className="mt-5">
          <SupportQueue
            conversations={supportConversations}
            onAccept={(id) => acceptSupport.mutate(id)}
            onClose={(id) => closeSupport.mutate(id)}
            busy={acceptSupport.isPending || closeSupport.isPending}
          />
        </TabsContent>

        <TabsContent value="reports" className="mt-5">
          <GlassCard className="p-4">
            <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold"><Flag className="h-4 w-4" /> Reports</h3>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead>Target</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.id} className="border-border">
                      <TableCell>{report.targetType}</TableCell>
                      <TableCell className="max-w-[24rem] truncate text-muted-foreground">{report.reason}</TableCell>
                      <TableCell className="capitalize text-muted-foreground">{report.status}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(report.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {!reports.length && <p className="py-8 text-center text-sm text-muted-foreground">No reports have been submitted.</p>}
            </div>
          </GlassCard>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}

function SupportQueue({ conversations, onAccept, onClose, busy }) {
  return (
    <GlassCard className="p-4 sm:p-5">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="flex items-center gap-2 font-display text-lg font-semibold">
            <Headphones className="h-4 w-4" /> Support conversations
          </h3>
          <p className="text-sm text-muted-foreground">Saved user chats, bot triage, and staff handoff queue.</p>
        </div>
        <Badge variant="outline">{conversations.length} conversations</Badge>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {conversations.map((conversation) => (
          <div key={conversation.id} className="rounded-2xl border border-border bg-secondary/20 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h4 className="truncate font-display text-base font-semibold">{conversation.subject}</h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  @{conversation.requester.username} · {formatDate(conversation.updatedAt)}
                </p>
              </div>
              <Badge variant={conversation.status === 'waiting_for_staff' ? 'default' : 'outline'} className="shrink-0 capitalize">
                {conversation.status.replaceAll('_', ' ')}
              </Badge>
            </div>

            <div className="mt-4 max-h-64 space-y-2 overflow-y-auto rounded-xl border border-border bg-background/40 p-3">
              {conversation.messages.map((message) => (
                <div key={message.id} className="text-sm">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    {message.authorRole === 'bot' ? 'Vyntra Assist' : message.author?.username || message.authorRole}
                  </p>
                  <p className="whitespace-pre-wrap break-words text-foreground/85">{message.body}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" disabled={busy || conversation.status === 'active' || conversation.status === 'closed'} onClick={() => onAccept(conversation.id)}>
                Accept chat
              </Button>
              <Button size="sm" variant="outline" disabled={busy || conversation.status === 'closed'} onClick={() => onClose(conversation.id)}>
                Close
              </Button>
            </div>
          </div>
        ))}
        {!conversations.length && (
          <div className="rounded-2xl border border-border bg-secondary/20 p-8 text-center text-sm text-muted-foreground xl:col-span-2">
            No support conversations yet.
          </div>
        )}
      </div>
    </GlassCard>
  );
}

function UserManagementCard({
  user,
  badges,
  assignableBadges,
  assignBadgeId,
  setAssignBadgeId,
  selectedIsVerified,
  verifiedBadge,
  newPassword,
  setNewPassword,
  currentUser,
  onToggleVerified,
  onAssignBadge,
  onRemoveBadge,
  onUpdateRole,
  onToggleBan,
  onSaveBanReason,
  onResetPassword,
  onResetViews,
}) {
  const [banReasonDraft, setBanReasonDraft] = useState('');

  useEffect(() => {
    setBanReasonDraft(user?.banReason || '');
  }, [user]);

  if (!user) {
    return (
      <GlassCard className="flex min-h-[24rem] items-center justify-center p-6 text-center text-sm text-muted-foreground">
        Select a user to manage account status and badges.
      </GlassCard>
    );
  }

  const ownerRole = isOwnerUser(user);
  const selfTarget = isSelfUser(user, currentUser);
  const ownerProtected = isProtectedOwnerTarget(user, currentUser);
  const currentIsOwner = String(currentUser?.role || '').toLowerCase() === 'owner';
  const roleLocked = ownerRole || selfTarget;

  return (
    <GlassCard className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <img src={user.avatar} alt="" className="h-12 w-12 rounded-xl object-cover" />
          <div className="min-w-0">
            <h3 className="truncate font-display text-lg font-semibold">{user.displayName}</h3>
            <p className="truncate text-sm text-muted-foreground">@{user.username} · UID {user.uid ?? 'none'}</p>
          </div>
        </div>
        <Badge variant={user.isBanned ? 'destructive' : 'secondary'} className="capitalize">
          {user.status}
        </Badge>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3 rounded-2xl border border-border bg-secondary/20 p-3 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Views</p>
          <p className="font-medium">{formatNumber(user.views)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Badges</p>
          <p className="font-medium">{user.badges?.length ?? 0}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Joined</p>
          <p className="font-medium">{formatDate(user.joined)}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4">
        {ownerRole && (
          <div className="rounded-xl border border-amber-300/25 bg-amber-300/10 px-3 py-2 text-xs text-amber-100">
            {selfTarget
              ? 'Your owner rank and Owner badge are system protected. Other account actions are available because this is your own account.'
              : 'Owner accounts can only be managed by that same owner. Owner rank can only be changed with direct database access.'}
          </div>
        )}
        {!ownerRole && selfTarget && (
          <div className="rounded-xl border border-sky-300/20 bg-sky-300/10 px-3 py-2 text-xs text-sky-100">
            You cannot change your own admin role from this panel.
          </div>
        )}

        <Button variant="outline" disabled={ownerProtected || !user.profileId || user.views <= 0} onClick={onResetViews}>
          <RotateCcw className="h-4 w-4" /> Reset profile views
        </Button>

        <label className="space-y-2 text-sm">
          <span>Role</span>
          <Select value={user.role} onValueChange={onUpdateRole} disabled={roleLocked}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {ownerRole && <SelectItem value="owner">owner</SelectItem>}
              {roleOptions.map((role) => (
                <SelectItem key={role} value={role}>{role}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>

        <div className="grid gap-2 sm:grid-cols-2">
          <Button variant={selectedIsVerified ? 'outline' : 'secondary'} disabled={ownerProtected || !verifiedBadge || !user.profileId} onClick={onToggleVerified}>
            <BadgeCheck className="h-4 w-4" /> {selectedIsVerified ? 'Remove verified' : 'Mark verified'}
          </Button>
          <Button variant={user.isBanned ? 'outline' : 'destructive'} disabled={ownerProtected} onClick={onToggleBan}>
            {user.isBanned ? <CheckCircle2 className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
            {user.isBanned ? 'Unban user' : 'Ban user'}
          </Button>
        </div>

        <label className="space-y-2 text-sm">
          <span>Ban reason</span>
          <Textarea value={banReasonDraft} onChange={(e) => setBanReasonDraft(e.target.value)} placeholder="Visible to admins for context." disabled={ownerProtected} />
          <Button size="sm" variant="outline" disabled={ownerProtected} onClick={() => onSaveBanReason(banReasonDraft)}>Save reason</Button>
        </label>

        <div className="space-y-2">
          <p className="text-sm font-medium">Assigned badges</p>
          <div className="flex flex-wrap gap-2">
            {(user.badges ?? []).map((badge) => {
              const protectedBadge = isProtectedBadge(badge);
              return (
                <span key={badge.id} className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary/40 px-2.5 py-1 text-xs">
                  <Icon name={badge.icon} fallback="Award" className="h-3.5 w-3.5" />
                  {badge.name}
              {(protectedBadge && !currentIsOwner) || ownerProtected ? (
                    <LockKeyhole className="ml-1 h-3 w-3 text-amber-300" aria-label="System protected" />
                  ) : (
                    <button onClick={() => onRemoveBadge(badge.id)} className="ml-1 text-muted-foreground transition-colors hover:text-destructive" aria-label={`Remove ${badge.name}`}>
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </span>
              );
            })}
            {!user.badges?.length && <p className="text-sm text-muted-foreground">No badges assigned yet.</p>}
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
          <Select value={assignBadgeId} onValueChange={setAssignBadgeId} disabled={ownerProtected || !assignableBadges.length || !user.profileId}>
            <SelectTrigger><SelectValue placeholder={badges.length ? 'Assign badge...' : 'No badges available'} /></SelectTrigger>
            <SelectContent>
              {assignableBadges.map((badge) => (
                <SelectItem key={badge.id} value={badge.id}>{badge.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={onAssignBadge} disabled={ownerProtected || !assignBadgeId || !user.profileId}>Assign</Button>
        </div>

        <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
          <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Manual password reset" disabled={ownerProtected} />
          <Button variant="outline" onClick={onResetPassword} disabled={ownerProtected || !newPassword}>
            <KeyRound className="h-4 w-4" /> Reset
          </Button>
        </div>

        <Button variant="outline" onClick={() => window.open(`/u/${user.username}`, '_blank')}>
          <Eye className="h-4 w-4" /> Open public profile
        </Button>
      </div>
    </GlassCard>
  );
}
