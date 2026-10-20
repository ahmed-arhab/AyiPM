'use client';

import { useState, type FormEvent } from 'react';
import { FormError } from '@/components/ui';
import { login } from '@/store';
import { useAuthForm } from '../hooks/useAuthForm';
import { validateIdentifier, validateLoginPassword, type LoginValues } from '../utils';
import { AuthCard } from './AuthCard';
import { AuthSplitLayout } from './AuthSplitLayout';
import { LoginIdentifierStep } from './LoginIdentifierStep';
import { LoginPasswordStep } from './LoginPasswordStep';
import { useT } from '@/translations';

const INITIAL: LoginValues = { identifier: '', password: '', remember: false };

export function LoginView() {
  const t = useT();
  const [step, setStep] = useState<'identifier' | 'password'>('identifier');
  const { values, errors, formError, submitting, setField, submit, checkValid } = useAuthForm(
    INITIAL,
    step === 'identifier' ? validateIdentifier : validateLoginPassword
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (step === 'identifier') {
      if (checkValid()) setStep('password');
      return;
    }
    const result = await submit((v) => login(v.identifier, v.password, v.remember), { keepLoadingOnSuccess: true });
    if (result && !result.ok) setField('password', '');
  };

  return (
    <AuthSplitLayout>
      <AuthCard title={t('Log in to AyiPM')} logoOnMobileOnly>
        <FormError message={formError} />
        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {step === 'identifier' ? (
            <LoginIdentifierStep value={values.identifier} error={errors.identifier} onChange={(v) => setField('identifier', v)} />
          ) : (
            <LoginPasswordStep
              identifier={values.identifier.trim()}
              password={values.password}
              remember={values.remember}
              error={errors.password}
              submitting={submitting}
              onPasswordChange={(v) => setField('password', v)}
              onRememberChange={(v) => setField('remember', v)}
              onChangeIdentifier={() => {
                setField('password', '');
                setStep('identifier');
              }}
            />
          )}
        </form>
      </AuthCard>
    </AuthSplitLayout>
  );
}
