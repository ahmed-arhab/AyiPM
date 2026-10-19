import { Lock } from 'lucide-react';
import { Field, PasswordInput } from '@/components/ui';
import type { FieldErrors } from '@/lib/validation';
import type { PasswordPairValues } from '../utils';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';

interface PasswordFieldsProps {
  idPrefix: string;
  values: PasswordPairValues;
  errors: FieldErrors<PasswordPairValues>;
  disabled?: boolean;
  passwordLabel?: string;
  onChange: (key: keyof PasswordPairValues, value: string) => void;
}

export function PasswordFields({ idPrefix, values, errors, disabled, passwordLabel = 'Password', onChange }: PasswordFieldsProps) {
  const passwordId = `${idPrefix}-password`;
  const confirmId = `${idPrefix}-confirm-password`;
  return (
    <>
      <Field label={passwordLabel} htmlFor={passwordId} error={errors.password} required>
        <PasswordInput
          id={passwordId}
          icon={Lock}
          autoComplete="new-password"
          placeholder="At least 8 characters"
          value={values.password}
          disabled={disabled}
          invalid={Boolean(errors.password)}
          onChange={(e) => onChange('password', e.target.value)}
        />
        <PasswordStrengthMeter value={values.password} />
      </Field>
      <Field label="Confirm password" htmlFor={confirmId} error={errors.confirmPassword} required>
        <PasswordInput
          id={confirmId}
          icon={Lock}
          autoComplete="new-password"
          placeholder="Re-enter your password"
          value={values.confirmPassword}
          disabled={disabled}
          invalid={Boolean(errors.confirmPassword)}
          onChange={(e) => onChange('confirmPassword', e.target.value)}
        />
      </Field>
    </>
  );
}
