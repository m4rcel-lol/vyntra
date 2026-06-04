import { Suspense, lazy, useEffect } from 'react';
import { Navigate, Routes, Route, useLocation } from 'react-router-dom';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { useAuthStore } from '@/stores/auth.store';

const LandingPage = lazy(() => import('@/pages/LandingPage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/RegisterPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const EditorPage = lazy(() => import('@/pages/EditorPage'));
const TemplatesPage = lazy(() => import('@/pages/TemplatesPage'));
const AnalyticsPage = lazy(() => import('@/pages/AnalyticsPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const AdminPage = lazy(() => import('@/pages/AdminPage'));
const PublicProfilePage = lazy(() => import('@/pages/PublicProfilePage'));
const FilesPage = lazy(() => import('@/pages/FilesPage'));
const LeaderboardPage = lazy(() => import('@/pages/LeaderboardPage'));
const PerksPage = lazy(() => import('@/pages/PerksPage'));

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

export const AppRoutes = () => {
  const { pathname } = useLocation();
  const refresh = useAuthStore((s) => s.refresh);
  const checked = useAuthStore((s) => s.checked);

  useEffect(() => {
    refresh();
  }, [pathname, refresh]);

  if (!checked) return <LoadingScreen />;

  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<GuestOnly><LoginPage /></GuestOnly>} />
          <Route path="/register" element={<GuestOnly><RegisterPage /></GuestOnly>} />
          <Route path="/u/:username" element={<PublicProfilePage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/perks" element={<PerksPage />} />
          <Route path="/explore" element={<TemplatesPage publicView />} />

          <Route path="/dashboard" element={<Protected><DashboardPage /></Protected>} />
          <Route path="/dashboard/editor" element={<Protected><EditorPage /></Protected>} />
          <Route path="/dashboard/templates" element={<Protected><TemplatesPage /></Protected>} />
          <Route path="/dashboard/analytics" element={<Protected><AnalyticsPage /></Protected>} />
          <Route path="/dashboard/files" element={<Protected><FilesPage /></Protected>} />
          <Route path="/dashboard/settings" element={<Protected><SettingsPage /></Protected>} />
          <Route path="/admin" element={<AdminOnly><AdminPage /></AdminOnly>} />

          <Route path="/editor" element={<Navigate to="/dashboard/editor" replace />} />
          <Route path="/templates" element={<Navigate to="/dashboard/templates" replace />} />
          <Route path="/analytics" element={<Navigate to="/dashboard/analytics" replace />} />
          <Route path="/files" element={<Navigate to="/dashboard/files" replace />} />
          <Route path="/settings" element={<Navigate to="/dashboard/settings" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </>
  );
};

const Protected = ({ children }) => {
  const location = useLocation();
  const checked = useAuthStore((s) => s.checked);
  const loading = useAuthStore((s) => s.loading);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!checked || loading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
};

const GuestOnly = ({ children }) => {
  const location = useLocation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to={location.state?.from || '/dashboard'} replace />;
  }
  return children;
};

const AdminOnly = ({ children }) => {
  const location = useLocation();
  const checked = useAuthStore((s) => s.checked);
  const loading = useAuthStore((s) => s.loading);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  if (!checked || loading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
};
