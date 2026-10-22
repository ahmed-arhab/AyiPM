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
}

/** What login and invite acceptance return instead of a session when a second step is needed. */
export interface TwoFactorRequired {
  twoFactorChallenge: TwoFactorChallenge;
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
