import { storage } from '@/lib/storage';
import { LEGACY_STORAGE_KEYS, LEGACY_STORAGE_PREFIX, STORAGE_KEY, THEME_STORAGE_KEY } from '@/constants/defaults';
import type { ThemeMode } from '@/types';
import { appStore, getState, setState } from './appStore';
import { refreshSession } from './actions/session';
import { createInitialState, PERSISTED_KEYS, type AppState, type PersistedState } from './state';

const SAVE_DELAY_MS = 250;

let started = false;
let lastSerialized: string | null = null;
let saveTimer: ReturnType<typeof setTimeout> | null = null;

function pickPersisted(state: AppState): PersistedState {
  const out = {} as Record<keyof PersistedState, unknown>;
  PERSISTED_KEYS.forEach((key) => {
    out[key] = state[key];
  });
  return out as PersistedState;
}

function readPersisted(raw: string | null): Partial<PersistedState> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function applySnapshot(raw: string | null) {
  const saved = readPersisted(raw);
  const base = createInitialState();
  const next: Partial<AppState> = {};
  PERSISTED_KEYS.forEach((key) => {
    (next as Record<string, unknown>)[key] = saved[key] ?? base[key];
  });
  lastSerialized = raw;
  setState(next);
}

function removeLegacyKeys() {
  storage
    .keys()
    .filter((key) => key.startsWith(LEGACY_STORAGE_PREFIX) || LEGACY_STORAGE_KEYS.includes(key))
    .forEach((key) => storage.remove(key));
}

function flush() {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  const state = getState();
  if (!state.hydrated) return;
  const serialized = JSON.stringify(pickPersisted(state));
  if (serialized === lastSerialized) return;
  lastSerialized = serialized;
  storage.writeRaw(STORAGE_KEY, serialized);
}

function scheduleSave() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(flush, SAVE_DELAY_MS);
}

export function readStoredTheme(): ThemeMode {
  const value = storage.readRaw(THEME_STORAGE_KEY);
  return value === 'dark' || value === 'device' ? value : 'light';
}

export function startPersistence(): () => void {
  if (started || typeof window === 'undefined') return () => undefined;
  started = true;

  removeLegacyKeys();
  applySnapshot(storage.readRaw(STORAGE_KEY));
  setState({ theme: readStoredTheme() });
  void refreshSession().finally(() => setState({ hydrated: true }));

  let previous = getState();
  const unsubscribe = appStore.subscribe(() => {
    const current = getState();
    const changed = PERSISTED_KEYS.some((key) => current[key] !== previous[key]);
    previous = current;
    if (changed) scheduleSave();
  });

  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY && event.newValue !== lastSerialized) {
      applySnapshot(event.newValue);
    }
  };
  const onHide = () => flush();

  window.addEventListener('storage', onStorage);
  window.addEventListener('pagehide', onHide);

  return () => {
    flush();
    unsubscribe();
    window.removeEventListener('storage', onStorage);
    window.removeEventListener('pagehide', onHide);
    started = false;
  };
}
