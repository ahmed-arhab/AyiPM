'use client';

import type { FormEvent } from 'react';
import { FormError } from '@/components/ui';
import { acceptInvite } from '@/store';
import type { TwoFactorChallenge } from '@/types';
import { useAuthForm } from '../hooks/useAuthForm';
import { validatePasswordPair, type PasswordPairValues } from '../utils';
import { AuthSubmitButton } from './AuthSubmitButton';
import { PasswordFields } from './PasswordFields';

const INITIAL: PasswordPairValues = { password: '', confirmPassword: '' };

interface AcceptInviteFormProps {
  token: string;
  onAccepted: () => void;
  /** New admins whose workspace requires two-factor authentication set it up before their first session. */
  onTwoFactorRequired: (challenge: TwoFactorChallenge) => void;
}

export function AcceptInviteForm({ token, onAccepted, onTwoFactorRequired }: AcceptInviteFormProps) {
  const { values, errors, formError, submitting, setField, submit } = useAuthForm(INITIAL, validatePasswordPair);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = await submit((v) => acceptInvite(token, v.password), {
      keepLoadingOnSuccess: (outcome) => outcome.status === 'signedIn',
    });
    if (!result?.ok) return;
    if (result.data.status === 'signedIn') onAccepted();
    else onTwoFactorRequired(result.data.challenge);
  };

  return (
    <>
      <FormError message={formError} />
      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        <PasswordFields
          idPrefix="invite"
          passwordLabel="Choose a password"
          values={values}
          errors={errors}
          disabled={submitting}
          onChange={setField}
        />
        <AuthSubmitButton loading={submitting} loadingLabel="Joining…">
          Join workspace
        </AuthSubmitButton>
      </form>
    </>
  );
}
