'use client';

import type { FormEvent } from 'react';
import { FormError } from '@/components/ui';
import { resetPassword } from '@/store';
import { useAuthForm } from '../hooks/useAuthForm';
import { validatePasswordPair, type PasswordPairValues } from '../utils';
import { AuthSubmitButton } from './AuthSubmitButton';
import { PasswordFields } from './PasswordFields';

const INITIAL: PasswordPairValues = { password: '', confirmPassword: '' };

export function ResetPasswordForm({ token, onReset }: { token: string; onReset: () => void }) {
  const { values, errors, formError, submitting, setField, submit } = useAuthForm(INITIAL, validatePasswordPair);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = await submit((v) => resetPassword(token, v.password));
    if (result?.ok) onReset();
  };

  return (
    <>
      <FormError message={formError} />
      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        <PasswordFields
          idPrefix="reset"
          passwordLabel="New password"
          values={values}
          errors={errors}
          disabled={submitting}
          onChange={setField}
        />
        <AuthSubmitButton loading={submitting} loadingLabel="Updating password…">
          Update password
        </AuthSubmitButton>
      </form>
    </>
  );
}
