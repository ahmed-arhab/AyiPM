import { storage } from '@/lib/storage';
import { LEGACY_STORAGE_KEYS, LEGACY_STORAGE_PREFIX, THEME_STORAGE_KEY } from '@/constants/defaults';
import type { ThemeMode } from '@/types';
import { setState } from './appStore';
import { loadWorkspaceData, refreshNotifications, refreshSession } from './actions/session';

// Shared data is re-read when the tab regains focus (at most this often), and notifications every minute.
const FOCUS_REFRESH_MS = 30_000;
const NOTIFICATION_POLL_MS = 60_000;

let started = false;

// The browser only keeps the theme and the language; everything else comes from the server.
function removeLegacyKeys() {
  storage
    .keys()
    .filter((key) => key.startsWith(LEGACY_STORAGE_PREFIX) || LEGACY_STORAGE_KEYS.includes(key))
    .forEach((key) => storage.remove(key));
}

export function readStoredTheme(): ThemeMode {
  const value = storage.readRaw(THEME_STORAGE_KEY);
  return value === 'dark' || value === 'device' ? value : 'light';
}

export function startPersistence(): () => void {
  if (started || typeof window === 'undefined') return () => undefined;
  started = true;

  removeLegacyKeys();
  setState({ theme: readStoredTheme() });
  void refreshSession().finally(() => setState({ hydrated: true }));

  let lastFocusRefresh = Date.now();
  const onFocus = () => {
    if (Date.now() - lastFocusRefresh < FOCUS_REFRESH_MS) return;
    lastFocusRefresh = Date.now();
    void loadWorkspaceData();
  };
  const poll = setInterval(() => {
    if (document.visibilityState === 'visible') void refreshNotifications();
  }, NOTIFICATION_POLL_MS);

  window.addEventListener('focus', onFocus);

  return () => {
    clearInterval(poll);
    window.removeEventListener('focus', onFocus);
    started = false;
  };
}
