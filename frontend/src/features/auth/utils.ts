import { isValidEmail, validatePassword, type FieldErrors } from '@/lib/validation';

export interface LoginValues {
  identifier: string;
  password: string;
  remember: boolean;
}

export interface CodeValues {
  code: string;
}

export function validateAuthenticatorCode(values: CodeValues): FieldErrors<CodeValues> {
  return { code: /^\d{6}$/.test(values.code.replace(/\s/g, '')) ? undefined : 'Enter the 6-digit code from your authenticator app.' };
}

export function validateRecoveryCode(values: CodeValues): FieldErrors<CodeValues> {
  return { code: values.code.trim() ? undefined : 'Enter one of your recovery codes.' };
}

/** Splits a base32 secret into groups of four so it is easier to type. */
export function groupSecret(secret: string): string {
  return secret.replace(/(.{4})(?=.)/g, '$1 ');
}

/** Where "Continue with Google" goes. With an invitation's token, accepting it is limited to the invited address. */
export function googleSignInUrl(inviteToken?: string): string {
  return inviteToken ? `/api/auth/google/start?invite=${encodeURIComponent(inviteToken)}` : '/api/auth/google/start';
}

/** The backend sends the browser back to /login?google=<code> when a sign-in with Google doesn't work (GoogleSignInException). */
export const GOOGLE_SIGN_IN_ERRORS: Record<string, string> = {
  unavailable: "Sign-in with Google isn't set up on this server.",
  expired: 'This sign-in with Google expired, or it was started in another browser. Try again.',
  failed: "Signing in with Google didn't work. Try again.",
  'not-invited': "There's no account for this Google account's email address. Ask your admin for an invitation.",
  'wrong-domain': 'This workspace only accepts Google accounts from its own domain. Use your work Google account.',
  deactivated: 'This account has been deactivated. Contact your administrator.',
  'invite-expired': 'Your invitation has expired. Ask your admin for a new one.',
  'invite-mismatch': 'This invitation is for another email address. Continue with the Google account it was sent to.',
  'linked-elsewhere': "This Google account doesn't match the one linked to your account. Sign in with your password, or ask your admin.",
  'too-many-attempts': 'Too many attempts. Wait a minute and try again.',
};

export interface PasswordPairValues {
  password: string;
  confirmPassword: string;
}

export function validateIdentifier(values: LoginValues): FieldErrors<LoginValues> {
  const email = values.identifier.trim();
  return { identifier: !email ? 'Enter your work email' : isValidEmail(email) ? undefined : 'Enter a valid email address' };
}

export function validateLoginPassword(values: LoginValues): FieldErrors<LoginValues> {
  return { password: values.password ? undefined : 'Enter your password' };
}

export function validatePasswordPair(values: PasswordPairValues): FieldErrors<PasswordPairValues> {
  return {
    password: validatePassword(values.password),
    confirmPassword: !values.confirmPassword
      ? 'Confirm your password'
      : values.confirmPassword !== values.password
        ? 'Passwords do not match'
        : undefined,
  };
}

export interface SetupValues extends PasswordPairValues {
  companyName: string;
  name: string;
  email: string;
}

export function validateSetup(values: SetupValues): FieldErrors<SetupValues> {
  const email = values.email.trim();
  return {
    companyName: values.companyName.trim() ? undefined : 'Enter your company name',
    name: values.name.trim() ? undefined : 'Enter your full name',
    email: !email ? 'Enter your work email' : isValidEmail(email) ? undefined : 'Enter a valid email address',
    ...validatePasswordPair(values),
  };
}
