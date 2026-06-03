import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { AnimatedBackground } from '@/components/common/AnimatedBackground';
import { GradientText } from '@/components/common/GradientText';
import { Logo } from '@/components/common/Logo';
import { Button } from '@/components/ui/button';

export default function NotFoundPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <AnimatedBackground variant="hero" />
      <Logo size={34} className="mb-10" />
      <p className="font-display text-8xl font-bold tracking-tighter"><GradientText>404</GradientText></p>
      <h1 className="mt-4 font-display text-2xl font-semibold">This page drifted into the void</h1>
      <p className="mt-2 max-w-sm text-muted-foreground">The profile or page you are looking for does not exist or has been moved.</p>
      <Button asChild className="mt-8">
        <Link to="/"><Home className="h-4 w-4" /> Back to home</Link>
      </Button>
    </div>
  );
}
