'use client';

import type { FormEvent } from 'react';
import { FormError } from '@/components/ui';
import { acceptInvite } from '@/store';
import { useAuthForm } from '../hooks/useAuthForm';
import { validatePasswordPair, type PasswordPairValues } from '../utils';
import { AuthSubmitButton } from './AuthSubmitButton';
import { PasswordFields } from './PasswordFields';

const INITIAL: PasswordPairValues = { password: '', confirmPassword: '' };

export function AcceptInviteForm({ token, onAccepted }: { token: string; onAccepted: () => void }) {
  const { values, errors, formError, submitting, setField, submit } = useAuthForm(INITIAL, validatePasswordPair);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = await submit((v) => acceptInvite(token, v.password), { keepLoadingOnSuccess: true });
    if (result?.ok) onAccepted();
  };

  return (
    <>
      <FormError message={formError} />
      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        <PasswordFields idPrefix="invite" passwordLabel="Choose a password" values={values} errors={errors} disabled={submitting} onChange={setField} />
        <AuthSubmitButton loading={submitting} loadingLabel="Joining…">
          Join workspace
        </AuthSubmitButton>
      </form>
    </>
  );
}
