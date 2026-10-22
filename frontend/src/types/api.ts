import type { TwoFactorChallenge, TwoFactorStatus } from './auth';
import type { Employee } from './employee';
import type { UserPreferences, WorkspaceSettings } from './settings';

export interface BootstrapPayload {
  needsSetup: boolean;
  user: Employee | null;
  expiresAt: string | null;
  workspace: WorkspaceSettings | null;
  employees: Employee[];
  preferences: UserPreferences | null;
  twoFactor: TwoFactorStatus | null;
  /** Whether the server offers sign-in with Google. Set whether or not someone is signed in. */
  googleSignIn: boolean;
}

/** What login and invite acceptance return instead of a session when a second step is needed. */
export interface TwoFactorRequired {
  twoFactorChallenge: TwoFactorChallenge;
}

/** The two-factor step of a sign-in with Google, which the login page fetches after Google sent the browser back. */
export interface PendingGoogleSignIn extends TwoFactorRequired {
  email: string;
}

export interface TwoFactorSignIn {
  bootstrap: BootstrapPayload;
  recoveryCodes: string[];
}

export interface InviteDetails {
  name: string;
  email: string;
  employeeId: string;
  companyName: string;
  expiresAt: string;
}
