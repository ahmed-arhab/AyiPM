'use client';

import type { FormEvent } from 'react';
import { AtSign } from 'lucide-react';
import { Field, FormError, Input } from '@/components/ui';
import { requestPasswordReset } from '@/store';
import { isValidEmail } from '@/lib/validation';
import { useAuthForm } from '../hooks/useAuthForm';
import { AuthSubmitButton } from './AuthSubmitButton';

interface ForgotValues {
  identifier: string;
}

const INITIAL: ForgotValues = { identifier: '' };

const validate = (v: ForgotValues) => ({
  identifier: !v.identifier.trim() ? 'Enter your work email' : isValidEmail(v.identifier) ? undefined : 'Enter a valid email address',
});

export function ForgotPasswordForm({ onRequested }: { onRequested: () => void }) {
  const { values, errors, formError, submitting, setField, submit } = useAuthForm(INITIAL, validate);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = await submit((v) => requestPasswordReset(v.identifier));
    if (result?.ok) onRequested();
  };

  return (
    <>
      <FormError message={formError} />
      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        <Field label="Work email" htmlFor="forgot-identifier" error={errors.identifier}>
          <Input
            id="forgot-identifier"
            type="email"
            inputMode="email"
            icon={AtSign}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="name@company.com"
            value={values.identifier}
            disabled={submitting}
            invalid={Boolean(errors.identifier)}
            onChange={(e) => setField('identifier', e.target.value)}
            autoFocus
          />
        </Field>
        <AuthSubmitButton loading={submitting} loadingLabel="Sending request…">
          Request a reset link
        </AuthSubmitButton>
      </form>
    </>
  );
}
