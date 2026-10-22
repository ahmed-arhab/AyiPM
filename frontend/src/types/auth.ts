import type { ApiSchema } from './api-schema';

/** Kept in the store from the bootstrap payload's user and expiresAt. */
export interface Session {
  userId: string;
  expiresAt: string;
}

/** `emailed` says whether the server is also emailing the link to the person. False when email isn't set up on the server. */
export type AccessLink = ApiSchema<'AccessLink'>;

/**
 * TwoFactorService.Status in the backend. `available` is false when the server has no encryption key, so two-factor
 * authentication can't be turned on; `required` is true for admins while the workspace requires it.
 */
export type TwoFactorStatus = ApiSchema<'Status'>;

/** The secret to type into an authenticator app, and the otpauth:// link shown as a QR code. */
export type TwoFactorSetup = ApiSchema<'Setup'>;

/** A sign-in whose password was right and that still needs a code, or two-factor setup first. */
export type TwoFactorChallenge = ApiSchema<'Challenge'>;

export type NewRecoveryCodes = ApiSchema<'NewRecoveryCodes'>;

export type ActionResult<T = void> = { ok: true; data: T } | { ok: false; error: string };
