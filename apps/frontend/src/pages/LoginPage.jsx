import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { AuthShell } from '@/components/layout/AuthShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { loginSchema } from '@/validation/schemas';
import { useAuthStore } from '@/stores/auth.store';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((s) => s.login);
  const loading = useAuthStore((s) => s.loading);
  const [showPw, setShowPw] = useState(false);
  const [formError, setFormError] = useState('');

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: '', password: '', remember: true },
  });

  const onSubmit = async (data) => {
    setFormError('');
    try {
      const user = await login(data);
      toast.success(`Welcome back, ${user.displayName || user.username}`);
      const from = location.state?.from || '/dashboard';
      navigate(from, { replace: true });
    } catch (e) {
      setFormError(e.message || 'Invalid credentials. Please try again.');
    }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Log in to manage your Vyntra profile.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {formError && (
          <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive" role="alert">
            <AlertCircle className="h-4 w-4 shrink-0" /> {formError}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="identifier">Username or email</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="identifier" data-testid="login-identifier" placeholder="username or email" className="pl-9" {...register('identifier')} />
          </div>
          {errors.identifier && <p className="text-xs text-destructive">{errors.identifier.message}</p>}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <span className="text-xs text-muted-foreground">Admin reset only</span>
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="password" data-testid="login-password" type={showPw ? 'text' : 'password'} placeholder="Your password" className="pl-9 pr-10" {...register('password')} />
            <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="Toggle password">
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
          <Checkbox checked={watch('remember')} onCheckedChange={(v) => setValue('remember', !!v)} /> Remember me for 30 days
        </label>

        <Button type="submit" className="w-full" disabled={loading} data-testid="login-submit">
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing in…</> : 'Log in'}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          New here?{' '}
          <Link to="/register" className={cn('font-medium text-foreground hover:underline')}>Create an account</Link>
        </p>
      </form>
    </AuthShell>
  );
}
