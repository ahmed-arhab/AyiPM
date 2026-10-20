'use client';

import { useEffect, type ReactNode } from 'react';
import { startPersistence } from '@/store/persistence';
import { useHydrated, useTheme } from '@/store';
import { applyTheme } from '@/lib/theme';
import { ToastProvider } from '@/components/feedback/ToastProvider';
import { ConfirmProvider } from '@/components/feedback/ConfirmProvider';
import { GlobalRipple } from './GlobalRipple';

function ThemeSync() {
  const theme = useTheme();
  const hydrated = useHydrated();
  useEffect(() => {
    if (!hydrated) return;
    applyTheme(theme);
    if (theme !== 'device' || !window.matchMedia) return;
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyTheme('device');
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, [theme, hydrated]);
  return null;
}

export function AppProviders({ children }: { children: ReactNode }) {
  useEffect(() => startPersistence(), []);

  return (
    <ToastProvider>
      <ConfirmProvider>
        <ThemeSync />
        <GlobalRipple />
        {children}
      </ConfirmProvider>
    </ToastProvider>
  );
}
