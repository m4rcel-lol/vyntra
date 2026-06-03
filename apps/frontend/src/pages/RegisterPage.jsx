import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { User, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, Check } from 'lucide-react';
import { AuthShell } from '@/components/layout/AuthShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { registerSchema } from '@/validation/schemas';
import { useAuthStore } from '@/stores/auth.store';

const strength = (pw = '') => {
  let s = 0;
  if (pw.length >= 10) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const registerUser = useAuthStore((s) => s.register);
  const loading = useAuthStore((s) => s.loading);
  const [showPw, setShowPw] = useState(false);
  const [formError, setFormError] = useState('');

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: '', email: '', password: '', confirm: '', terms: false },
  });

  const pw = watch('password');
  const score = strength(pw);
  const labels = ['Too weak', 'Weak', 'Okay', 'Good', 'Strong'];

  const onSubmit = async (data) => {
    setFormError('');
    try {
      const user = await registerUser(data);
      toast.success(`Account created — welcome, @${user.username}!`);
      navigate('/dashboard');
    } catch (e) {
      setFormError(e.message || 'Could not create account.');
    }
  };

  return (
    <AuthShell title="Create your profile" subtitle="Claim your name and start building in minutes.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {formError && (
          <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive" role="alert">
            <AlertCircle className="h-4 w-4 shrink-0" /> {formError}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">vyntra.bio/</span>
            <Input id="username" data-testid="register-username" placeholder="yourname" className="pl-[5.4rem]" {...register('username')} />
          </div>
          {errors.username && <p className="text-xs text-destructive">{errors.username.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="email" data-testid="register-email" type="email" placeholder="you@email.com" className="pl-9" {...register('email')} />
          </div>
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="password" data-testid="register-password" type={showPw ? 'text' : 'password'} placeholder="At least 10 characters" className="pl-9 pr-10" {...register('password')} />
            <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="Toggle password">
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {pw && (
            <div className="flex items-center gap-2">
              <div className="flex h-1.5 flex-1 gap-1">
                {[0, 1, 2, 3].map((i) => (
                  <span key={i} className={`h-full flex-1 rounded-full ${i < score ? 'bg-success' : 'bg-secondary'}`} />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">{labels[score]}</span>
            </div>
          )}
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm">Confirm password</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="confirm" data-testid="register-confirm" type={showPw ? 'text' : 'password'} placeholder="Repeat password" className="pl-9" {...register('confirm')} />
          </div>
          {errors.confirm && <p className="text-xs text-destructive">{errors.confirm.message}</p>}
        </div>

        <label className="flex cursor-pointer items-start gap-2 text-sm text-muted-foreground">
          <Checkbox className="mt-0.5" checked={watch('terms')} onCheckedChange={(v) => setValue('terms', !!v, { shouldValidate: true })} data-testid="register-terms" />
          <span>I agree to the <a href="#" className="text-foreground hover:underline">Terms</a> and <a href="#" className="text-foreground hover:underline">Privacy Policy</a>.</span>
        </label>
        {errors.terms && <p className="-mt-3 text-xs text-destructive">{errors.terms.message}</p>}

        <Button type="submit" className="w-full" disabled={loading} data-testid="register-submit">
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating account…</> : <><Check className="h-4 w-4" /> Create account</>}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-foreground hover:underline">Log in</Link>
        </p>
      </form>
    </AuthShell>
  );
}
