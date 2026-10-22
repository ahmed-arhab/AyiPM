'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { refreshSession, useHydrated, useNeedsSetup, useSessionUser } from '@/store';
import { AUTH_ROUTES, ROUTES } from '@/constants/navigation';
import { FullPageLoader } from '@/components/ui/Spinner';
import { RecoveryCodesDialog } from '@/features/auth/components/RecoveryCodesDialog';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import styles from './AppShell.module.css';

const SESSION_CHECK_MS = 5 * 60_000;

function isAuthPath(pathname: string): boolean {
  return AUTH_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

function isKnownPath(pathname: string): boolean {
  const knownRoutes = [
    ROUTES.home,
    ROUTES.dashboard,
    ROUTES.team,
    ROUTES.attendance,
    ROUTES.leave,
    ROUTES.projects,
    ROUTES.tasks,
    ROUTES.activity,
    ROUTES.notifications,
    ROUTES.settings,
    ROUTES.profile,
    ...AUTH_ROUTES,
  ];
  return knownRoutes.includes(pathname) || pathname.startsWith(`${ROUTES.projects}/`);
}

function safeNextPath(): string {
  if (typeof window === 'undefined') return ROUTES.dashboard;
  const next = new URLSearchParams(window.location.search).get('next');
  return next && next.startsWith('/') && !next.startsWith('//') && !isAuthPath(next) ? next : ROUTES.dashboard;
}

function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- Closes the mobile menu after each navigation.
  useEffect(() => setMobileNavOpen(false), [pathname]);

  return (
    <div className="app-layout">
      <Sidebar mobileOpen={mobileNavOpen} onMobileClose={() => setMobileNavOpen(false)} />
      <div className="main-content">
        <Navbar onMenuClick={() => setMobileNavOpen(true)} />
        <main className={styles.main}>{children}</main>
      </div>
      <RecoveryCodesDialog />
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? '/';
  const router = useRouter();
  const hydrated = useHydrated();
  const user = useSessionUser();
  const authRoute = isAuthPath(pathname);
  const allowSignedInOnAuthRoute = pathname === ROUTES.resetPassword || pathname === ROUTES.acceptInvite;

  const needsSetup = useNeedsSetup();
  const onSetupPage = pathname === ROUTES.setup;
  const notFoundRoute = !isKnownPath(pathname);

  useEffect(() => {
    if (!hydrated || notFoundRoute) return;
    const check = () => void refreshSession();
    check();
    const timer = setInterval(check, SESSION_CHECK_MS);
    const onVisible = () => document.visibilityState === 'visible' && check();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
    // notFoundRoute is left out for now: adding it would also start and stop the check when moving between a 404 page and
    // the rest of the app, a behaviour change for its own pull request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    if (needsSetup) {
      if (!onSetupPage) router.replace(ROUTES.setup);
      return;
    }
    if (onSetupPage && !user) {
      router.replace(ROUTES.login);
    } else if (!authRoute && !user) {
      const next = pathname === ROUTES.home ? '' : `?next=${encodeURIComponent(pathname)}`;
      router.replace(`${ROUTES.login}${next}`);
    } else if (authRoute && user && !allowSignedInOnAuthRoute) {
      router.replace(safeNextPath());
    }
  }, [hydrated, needsSetup, onSetupPage, authRoute, user, pathname, router, allowSignedInOnAuthRoute, notFoundRoute]);

  // A native Next.js not-found page must remain reachable even without a session.
  if (notFoundRoute) return <>{children}</>;

  if (!hydrated) return <FullPageLoader />;
  const redirectingForSetup = needsSetup ? !onSetupPage : onSetupPage && !user;
  if (redirectingForSetup) return <FullPageLoader />;

  if (authRoute) {
    if (user && !allowSignedInOnAuthRoute) return <FullPageLoader />;
    return <main className="auth-container-root">{children}</main>;
  }

  if (!user) return <FullPageLoader />;
  return <DashboardLayout>{children}</DashboardLayout>;
}
