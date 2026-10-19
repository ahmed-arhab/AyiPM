export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}

export interface PasswordRule {
  id: string;
  label: string;
  test: (value: string) => boolean;
}

export const PASSWORD_RULES: PasswordRule[] = [
  { id: 'length', label: 'At least 8 characters', test: (v) => v.length >= 8 },
  { id: 'upper', label: 'One uppercase letter', test: (v) => /[A-Z]/.test(v) },
  { id: 'number', label: 'One number', test: (v) => /\d/.test(v) },
  { id: 'symbol', label: 'One special character', test: (v) => /[^A-Za-z0-9]/.test(v) },
];

export type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong';

export function getPasswordStrength(value: string): { score: number; level: PasswordStrength } {
  const score = PASSWORD_RULES.filter((rule) => rule.test(value)).length;
  const level: PasswordStrength = score <= 1 ? 'weak' : score === 2 ? 'fair' : score === 3 ? 'good' : 'strong';
  return { score, level };
}

export function validatePassword(value: string): string | undefined {
  if (!value) return 'Password is required';
  if (value.length < 8) return 'Password must be at least 8 characters';
  return undefined;
}

export type FieldErrors<T> = Partial<Record<keyof T, string>>;

export function hasErrors<T>(errors: FieldErrors<T>): boolean {
  return Object.values(errors).some(Boolean);
}
