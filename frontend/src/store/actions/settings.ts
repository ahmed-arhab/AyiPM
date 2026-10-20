import { storage } from '@/lib/storage';
import { applyTheme } from '@/lib/theme';
import { LANGUAGE_STORAGE_KEY, THEME_STORAGE_KEY } from '@/constants/defaults';
import type { ActionResult, ThemeMode, UserPreferences, WorkspaceSettings } from '@/types';
import { api } from '@/lib/api';
import { authorize, ok, setState } from '../appStore';
import { handleUnauthorized, refreshActivity } from './session';

// The theme is chosen per device, so it stays in the browser.
export function setTheme(theme: ThemeMode): void {
  storage.writeRaw(THEME_STORAGE_KEY, theme);
  applyTheme(theme);
  setState({ theme });
}

export async function setLanguage(language: string): Promise<ActionResult> {
  storage.writeRaw(LANGUAGE_STORAGE_KEY, language);
  if (authorize().ok) return updatePreferences({ language });
  // Re-trigger store updates so non-authenticated components re-render immediately
  setState((s) => ({ ...s }));
  return ok();
}

function storePreferences(userId: string, preferences: UserPreferences) {
  // The language is also kept in the browser, so pages shown before sign-in use it.
  storage.writeRaw(LANGUAGE_STORAGE_KEY, preferences.language);
  setState((s) => ({ preferences: { ...s.preferences, [userId]: preferences } }));
}

export async function updatePreferences(update: Partial<UserPreferences>): Promise<ActionResult> {
  const auth = authorize();
  if (!auth.ok) return auth;
  const result = handleUnauthorized(await api<UserPreferences>('PATCH', '/api/me/preferences', update));
  if (!result.ok) return result;
  storePreferences(auth.data.id, result.data);
  return ok();
}

export async function resetPreferences(): Promise<ActionResult> {
  const auth = authorize();
  if (!auth.ok) return auth;
  const result = handleUnauthorized(await api<UserPreferences>('DELETE', '/api/me/preferences'));
  if (!result.ok) return result;
  storePreferences(auth.data.id, result.data);
  return ok();
}

export async function updateWorkspace(update: Partial<WorkspaceSettings>): Promise<ActionResult> {
  const auth = authorize('workspace.manage');
  if (!auth.ok) return auth;
  const result = handleUnauthorized(await api<WorkspaceSettings>('PATCH', '/api/workspace', update));
  if (!result.ok) return result;
  setState({ workspace: result.data });
  void refreshActivity();
  return ok();
}
