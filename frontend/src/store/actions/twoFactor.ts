import { api } from '@/lib/api';
import type { ActionResult, NewRecoveryCodes, TwoFactorSetup, TwoFactorStatus } from '@/types';
import { authorize, ok, setState } from '../appStore';
import { handleUnauthorized, refreshActivity } from './session';

// Wrong codes are 400s here, so they don't look like an ended session.

export async function refreshTwoFactorStatus(): Promise<void> {
  if (!authorize().ok) return;
  const result = handleUnauthorized(await api<TwoFactorStatus>('GET', '/api/auth/two-factor'));
  if (result.ok) setState({ twoFactor: result.data });
}

export async function startTwoFactorSetup(): Promise<ActionResult<TwoFactorSetup>> {
  const auth = authorize();
  if (!auth.ok) return auth;
  return handleUnauthorized(await api<TwoFactorSetup>('POST', '/api/auth/two-factor/setup'));
}

function showNewRecoveryCodes(data: NewRecoveryCodes) {
  setState({ twoFactor: data.status, newRecoveryCodes: data.recoveryCodes });
  void refreshActivity();
}

export async function confirmTwoFactorSetup(code: string): Promise<ActionResult> {
  const auth = authorize();
  if (!auth.ok) return auth;
  const result = handleUnauthorized(await api<NewRecoveryCodes>('POST', '/api/auth/two-factor/confirm', { code }));
  if (!result.ok) return result;
  showNewRecoveryCodes(result.data);
  return ok();
}

export async function regenerateRecoveryCodes(code: string): Promise<ActionResult> {
  const auth = authorize();
  if (!auth.ok) return auth;
  const result = handleUnauthorized(await api<NewRecoveryCodes>('POST', '/api/auth/two-factor/recovery-codes', { code }));
  if (!result.ok) return result;
  showNewRecoveryCodes(result.data);
  return ok();
}

export async function disableTwoFactor(code: string): Promise<ActionResult> {
  const auth = authorize();
  if (!auth.ok) return auth;
  const result = handleUnauthorized(await api<TwoFactorStatus>('POST', '/api/auth/two-factor/disable', { code }));
  if (!result.ok) return result;
  setState({ twoFactor: result.data });
  void refreshActivity();
  return ok();
}

export function dismissNewRecoveryCodes(): void {
  setState({ newRecoveryCodes: null });
}
