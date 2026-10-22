export interface Session {
  userId: string;
  expiresAt: string;
}

export interface AccessLink {
  token: string;
  expiresAt: string;
  /** Whether the server is also emailing the link to the person. False when email isn't set up on the server. */
  emailed: boolean;
}

/** Matches TwoFactorService.Status in the backend. */
export interface TwoFactorStatus {
  enabled: boolean;
  /** False when the server has no encryption key, so two-factor authentication can't be turned on. */
  available: boolean;
  /** True for admins while the workspace requires two-factor authentication. */
  required: boolean;
  recoveryCodesLeft: number;
}

/** The secret to type into an authenticator app, and the otpauth:// link shown as a QR code. */
export interface TwoFactorSetup {
  secret: string;
  otpauthUri: string;
}

/** A sign-in whose password was right and that still needs a code, or two-factor setup first. */
export interface TwoFactorChallenge {
  token: string;
  expiresAt: string;
  setupRequired: boolean;
}

export interface NewRecoveryCodes {
  recoveryCodes: string[];
  status: TwoFactorStatus;
}

export type ActionResult<T = void> = { ok: true; data: T } | { ok: false; error: string };
