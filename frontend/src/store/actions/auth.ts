import { api } from '@/lib/api';
import type { ActionResult, BootstrapPayload, Employee, InviteDetails } from '@/types';
import { authorize, fail, ok } from '../appStore';
import { applyBootstrap, clearSession, handleUnauthorized, loadWorkspaceData, refreshActivity } from './session';

export interface SetupInput {
  companyName: string;
  name: string;
  email: string;
  password: string;
}

// The server records the sign-in in the activity log.
async function signIn(request: Promise<ActionResult<BootstrapPayload>>): Promise<ActionResult<Employee>> {
  const result = await request;
  if (!result.ok) return result;
  applyBootstrap(result.data);
  const user = result.data.user;
  if (!user) return fail('Sign-in failed. Please try again.');
  await loadWorkspaceData();
  return ok(user);
}

export function setupWorkspace(input: SetupInput): Promise<ActionResult<Employee>> {
  return signIn(api<BootstrapPayload>('POST', '/api/setup', input));
}

export function login(email: string, password: string, remember = false): Promise<ActionResult<Employee>> {
  return signIn(api<BootstrapPayload>('POST', '/api/auth/login', { email, password, remember }));
}

export function acceptInvite(token: string, password: string): Promise<ActionResult<Employee>> {
  return signIn(api<BootstrapPayload>('POST', '/api/auth/invite', { token, password }));
}

export async function logout(): Promise<void> {
  await api('POST', '/api/auth/logout');
  clearSession();
}

export async function requestPasswordReset(email: string): Promise<ActionResult> {
  const result = await api<null>('POST', '/api/auth/forgot', { email });
  return result.ok ? ok() : result;
}

export function fetchInvite(token: string): Promise<ActionResult<InviteDetails>> {
  return api<InviteDetails>('GET', `/api/auth/invite?token=${encodeURIComponent(token)}`);
}

export function fetchPasswordReset(token: string): Promise<ActionResult<{ name: string }>> {
  return api<{ name: string }>('GET', `/api/auth/reset?token=${encodeURIComponent(token)}`);
}

export async function resetPassword(token: string, password: string): Promise<ActionResult> {
  const result = await api<null>('POST', '/api/auth/reset', { token, password });
  return result.ok ? ok() : result;
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<ActionResult> {
  const auth = authorize();
  if (!auth.ok) return auth;
  const result = handleUnauthorized(await api<null>('POST', '/api/auth/password', { currentPassword, newPassword }));
  if (!result.ok) return result;
  void refreshActivity();
  return ok();
}
