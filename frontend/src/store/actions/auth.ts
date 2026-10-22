import { api, type ApiResult } from '@/lib/api';
import type {
  ActionResult,
  BootstrapPayload,
  Employee,
  InviteDetails,
  TwoFactorChallenge,
  TwoFactorRequired,
  TwoFactorSetup,
  TwoFactorSignIn,
} from '@/types';
import { authorize, fail, ok, setState } from '../appStore';
import { applyBootstrap, clearSession, handleUnauthorized, loadWorkspaceData, refreshActivity } from './session';

export interface SetupInput {
  companyName: string;
  name: string;
  email: string;
  password: string;
}

/** Either signed in, or the password was right and the account needs a two-factor code or setup next. */
export type SignInOutcome = { status: 'signedIn'; user: Employee } | { status: 'twoFactor'; challenge: TwoFactorChallenge };

async function applySignIn(payload: BootstrapPayload): Promise<ActionResult<Employee>> {
  applyBootstrap(payload);
  const user = payload.user;
  if (!user) return fail('Sign-in failed. Please try again.');
  await loadWorkspaceData();
  return ok(user);
}

// The server records the sign-in in the activity log. Failures keep their HTTP status.
async function signIn(request: Promise<ApiResult<BootstrapPayload>>): Promise<ApiResult<Employee>> {
  const result = await request;
  return result.ok ? applySignIn(result.data) : result;
}

async function signInOrChallenge(request: Promise<ApiResult<BootstrapPayload | TwoFactorRequired>>): Promise<ActionResult<SignInOutcome>> {
  const result = await request;
  if (!result.ok) return result;
  if ('twoFactorChallenge' in result.data) return ok({ status: 'twoFactor', challenge: result.data.twoFactorChallenge });
  const signedIn = await applySignIn(result.data);
  return signedIn.ok ? ok({ status: 'signedIn', user: signedIn.data }) : signedIn;
}

export function setupWorkspace(input: SetupInput): Promise<ActionResult<Employee>> {
  return signIn(api<BootstrapPayload>('POST', '/api/setup', input));
}

export function login(email: string, password: string, remember = false): Promise<ActionResult<SignInOutcome>> {
  return signInOrChallenge(api<BootstrapPayload | TwoFactorRequired>('POST', '/api/auth/login', { email, password, remember }));
}

export function acceptInvite(token: string, password: string): Promise<ActionResult<SignInOutcome>> {
  return signInOrChallenge(api<BootstrapPayload | TwoFactorRequired>('POST', '/api/auth/invite', { token, password }));
}

/** Completes a sign-in with a code from an authenticator app, or a recovery code. A 410 means the challenge expired. */
export function verifyLoginCode(challenge: string, code: string): Promise<ApiResult<Employee>> {
  return signIn(api<BootstrapPayload>('POST', '/api/auth/login/two-factor', { challenge, code }));
}

export function startLoginTwoFactorSetup(challenge: string): Promise<ApiResult<TwoFactorSetup>> {
  return api<TwoFactorSetup>('POST', '/api/auth/login/two-factor/setup', { challenge });
}

/** For admins who must set up two-factor authentication before their first session. */
export async function confirmLoginTwoFactorSetup(challenge: string, code: string): Promise<ApiResult<Employee>> {
  const result = await api<TwoFactorSignIn>('POST', '/api/auth/login/two-factor/confirm', { challenge, code });
  if (!result.ok) return result;
  setState({ newRecoveryCodes: result.data.recoveryCodes });
  return applySignIn(result.data.bootstrap);
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
