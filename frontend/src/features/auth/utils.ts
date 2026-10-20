import { isValidEmail, validatePassword, type FieldErrors } from '@/lib/validation';

export interface LoginValues {
  identifier: string;
  password: string;
  remember: boolean;
}

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
