import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  User, Palette, Shield, Bell, Lock, Save, Trash2, Sparkles, Eye, Zap, AlignVerticalSpaceAround,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { GlassCard } from '@/components/common/GlassCard';
import { Field, EditorSection } from '@/components/editor/Field';
import { ToggleRow } from '@/components/editor/ToggleRow';
import { ColorPicker } from '@/components/editor/ColorPicker';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useSettingsStore } from '@/stores/settings.store';
import { useAuthStore } from '@/stores/auth.store';
import { authService } from '@/services/auth.service';
import { formatRelative } from '@/utils/format';

const TABS = [
  { v: 'account', label: 'Account', icon: User },
  { v: 'appearance', label: 'Appearance', icon: Palette },
  { v: 'security', label: 'Security', icon: Shield },
  { v: 'notifications', label: 'Notifications', icon: Bell },
  { v: 'privacy', label: 'Privacy', icon: Lock },
];

export default function SettingsPage() {
  const store = useSettingsStore();
  const { account, appearance, notifications, privacy, security, setGroup } = store;
  const user = useAuthStore((s) => s.user);
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const { data: sessions = [] } = useQuery({ queryKey: ['auth-sessions'], queryFn: authService.getSessions });

  useEffect(() => {
    if (user) {
      setGroup('account', {
        displayName: user.displayName || user.username,
        email: user.email || '',
      });
    }
  }, [setGroup, user]);

  const saveLocalSettings = () => toast.success('Dashboard settings saved on this device');
  const updatePassword = () => {
    setPw({ current: '', next: '', confirm: '' });
    toast.error('Password changes are not exposed by this backend yet. An admin can reset passwords from the admin panel.');
  };

  return (
    <DashboardLayout title="Settings">
      <div className="mb-6">
        <h2 className="font-display text-2xl font-semibold tracking-tight">Settings</h2>
        <p className="text-sm text-muted-foreground">Manage your account, appearance and privacy.</p>
      </div>

      <Tabs defaultValue="account">
        <TabsList className="flex h-auto w-full justify-start gap-1 overflow-x-auto rounded-xl bg-secondary/30 p-1 no-scrollbar">
          {TABS.map((t) => (
            <TabsTrigger key={t.v} value={t.v} className="shrink-0 gap-1.5 data-[state=active]:bg-secondary" data-testid={`settings-tab-${t.v}`}>
              <t.icon className="h-3.5 w-3.5" /> {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Account */}
        <TabsContent value="account" className="mt-5">
          <GlassCard className="max-w-2xl p-6">
            <EditorSection title="Account" description="Your basic account details.">
              <Field label="Display name" hint="Profile identity is edited in the profile editor. This local value only affects dashboard preferences."><Input value={account.displayName} onChange={(e) => setGroup('account', { displayName: e.target.value })} /></Field>
              <Field label="Email" hint="Account email editing needs a backend account endpoint before it can be saved globally."><Input type="email" value={account.email} onChange={(e) => setGroup('account', { email: e.target.value })} /></Field>
              <Field label="Language">
                <Select value={account.language} onValueChange={(v) => setGroup('account', { language: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="de">Deutsch</SelectItem>
                    <SelectItem value="ja">日本語</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Button onClick={saveLocalSettings} data-testid="settings-save-account"><Save className="h-4 w-4" /> Save local settings</Button>
            </EditorSection>
          </GlassCard>
        </TabsContent>

        {/* Appearance */}
        <TabsContent value="appearance" className="mt-5">
          <GlassCard className="max-w-2xl p-6">
            <EditorSection title="Appearance" description="Tune the look and feel of your dashboard.">
              <ToggleRow icon={Zap} label="Reduce motion" description="Minimize animations across the app" checked={appearance.reduceMotion} onCheckedChange={(v) => setGroup('appearance', { reduceMotion: v })} />
              <ToggleRow icon={AlignVerticalSpaceAround} label="Compact mode" description="Tighter spacing in lists and tables" checked={appearance.compact} onCheckedChange={(v) => setGroup('appearance', { compact: v })} />
              <Field label={`Glass intensity · ${appearance.glassIntensity}%`}>
                <Slider value={[appearance.glassIntensity]} min={0} max={100} step={1} onValueChange={([v]) => setGroup('appearance', { glassIntensity: v })} />
              </Field>
              <Field label="Dashboard accent"><ColorPicker value={appearance.accent} onChange={(v) => setGroup('appearance', { accent: v })} /></Field>
            </EditorSection>
          </GlassCard>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security" className="mt-5">
          <div className="grid max-w-2xl gap-6">
            <GlassCard className="p-6">
              <EditorSection title="Password" description="Change your password.">
                <Field label="Current password"><Input type="password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} /></Field>
                <Field label="New password"><Input type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} /></Field>
                <Field label="Confirm new password"><Input type="password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} /></Field>
                <Button onClick={updatePassword}>Update password</Button>
              </EditorSection>
            </GlassCard>
            <GlassCard className="p-6">
              <EditorSection title="Security options">
                <ToggleRow icon={Shield} label="Two-factor authentication" description="Require a code at sign-in" checked={security.twoFactor} onCheckedChange={(v) => setGroup('security', { twoFactor: v })} />
                <ToggleRow icon={Bell} label="Login alerts" description="Show dashboard notices for new sign-ins when supported" checked={security.loginAlerts} onCheckedChange={(v) => setGroup('security', { loginAlerts: v })} />
              </EditorSection>
            </GlassCard>
            <GlassCard className="p-6">
              <h3 className="font-display text-base font-semibold">Active sessions</h3>
              <ul className="mt-4 space-y-3">
                {sessions.map((s) => (
                  <li key={s.id} className="flex items-center justify-between rounded-xl border border-border bg-secondary/20 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium">{s.device} {s.current && <span className="ml-1 rounded-full bg-success/15 px-2 py-0.5 text-[10px] text-success">This device</span>}</p>
                      <p className="text-xs text-muted-foreground">Last seen {formatRelative(s.lastSeenAt)}</p>
                    </div>
                    {!s.current && <Button variant="ghost" size="sm" onClick={() => toast.error('Session revocation needs a backend revoke endpoint.')}>Revoke</Button>}
                  </li>
                ))}
                {!sessions.length && (
                  <li className="rounded-xl border border-border bg-secondary/20 px-4 py-3 text-sm text-muted-foreground">
                    No active sessions returned by the backend.
                  </li>
                )}
              </ul>
            </GlassCard>
          </div>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="mt-5">
          <GlassCard className="max-w-2xl p-6">
            <EditorSection title="Notifications" description="Choose which in-app notices should appear in your dashboard.">
              {[
                { k: 'profileViews', label: 'Profile views', desc: 'When your profile gets traction' },
                { k: 'linkClicks', label: 'Link clicks', desc: 'Daily click summaries' },
                { k: 'newFollowers', label: 'New followers', desc: 'When someone follows you' },
                { k: 'productUpdates', label: 'Product updates', desc: 'New features and improvements' },
                { k: 'weeklyDigest', label: 'Weekly digest', desc: 'A summary every Monday' },
              ].map((n) => (
                <ToggleRow key={n.k} label={n.label} description={n.desc} checked={notifications[n.k]} onCheckedChange={(v) => setGroup('notifications', { [n.k]: v })} />
              ))}
            </EditorSection>
          </GlassCard>
        </TabsContent>

        {/* Privacy */}
        <TabsContent value="privacy" className="mt-5">
          <div className="grid max-w-2xl gap-6">
            <GlassCard className="p-6">
              <EditorSection title="Privacy" description="Control your visibility and data.">
                {[
                  { k: 'searchable', label: 'Searchable profile', desc: 'Appear in Vyntra discovery', icon: Eye },
                  { k: 'showViewCount', label: 'Show view count', desc: 'Display total views publicly' },
                  { k: 'showJoinDate', label: 'Show join date', desc: 'Display when you joined' },
                  { k: 'allowMessages', label: 'Allow messages', desc: 'Let visitors message you' },
                  { k: 'analyticsSharing', label: 'Anonymous analytics sharing', desc: 'Help improve Vyntra' },
                ].map((p) => (
                  <ToggleRow key={p.k} icon={p.icon} label={p.label} description={p.desc} checked={privacy[p.k]} onCheckedChange={(v) => setGroup('privacy', { [p.k]: v })} />
                ))}
              </EditorSection>
            </GlassCard>
            <GlassCard variant="solid" className="border-destructive/30 p-6">
              <h3 className="font-display text-base font-semibold text-destructive">Danger zone</h3>
              <p className="mt-1 text-sm text-muted-foreground">Permanently delete your account and all data. This cannot be undone.</p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="mt-4"><Trash2 className="h-4 w-4" /> Delete account</Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="border-border bg-card">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                    <AlertDialogDescription>Account deletion is disabled until a dedicated backend endpoint is added. This prevents accidental data loss.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => toast.error('Account deletion is not enabled in this build.')} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </GlassCard>
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
