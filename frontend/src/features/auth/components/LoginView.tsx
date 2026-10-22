'use client';

import { useState, type FormEvent } from 'react';
import { FormError } from '@/components/ui';
import { login } from '@/store';
import type { TwoFactorChallenge } from '@/types';
import { useAuthForm } from '../hooks/useAuthForm';
import { validateIdentifier, validateLoginPassword, type LoginValues } from '../utils';
import { AuthCard } from './AuthCard';
import { AuthSplitLayout } from './AuthSplitLayout';
import { LoginCodeStep } from './LoginCodeStep';
import { LoginIdentifierStep } from './LoginIdentifierStep';
import { LoginPasswordStep } from './LoginPasswordStep';
import { TwoFactorSetupStep } from './TwoFactorSetupStep';
import { useT } from '@/translations';

const INITIAL: LoginValues = { identifier: '', password: '', remember: false };

export function LoginView() {
  const t = useT();
  const [step, setStep] = useState<'identifier' | 'password'>('identifier');
  // Set once the password is right and the account needs a two-factor code, or setup first.
  const [challenge, setChallenge] = useState<TwoFactorChallenge | null>(null);
  const { values, errors, formError, submitting, setField, setFormError, submit, checkValid } = useAuthForm(
    INITIAL,
    step === 'identifier' ? validateIdentifier : validateLoginPassword
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (step === 'identifier') {
      if (checkValid()) setStep('password');
      return;
    }
    const result = await submit((v) => login(v.identifier, v.password, v.remember), {
      keepLoadingOnSuccess: (outcome) => outcome.status === 'signedIn',
    });
    if (!result) return;
    if (!result.ok) {
      setField('password', '');
      setFormError(result.error);
    } else if (result.data.status === 'twoFactor') {
      setField('password', '');
      setChallenge(result.data.challenge);
    }
  };

  // An expired challenge goes back to the password; "Change" goes back to the email.
  const restart = (error?: string) => {
    setChallenge(null);
    setStep(error ? 'password' : 'identifier');
    if (error) setFormError(t(error));
  };

  if (challenge) {
    const identifier = values.identifier.trim();
    return (
      <AuthSplitLayout>
        <AuthCard title={challenge.setupRequired ? t('Set up two-factor authentication') : t('Two-factor authentication')} logoOnMobileOnly>
          {challenge.setupRequired ? (
            <TwoFactorSetupStep challenge={challenge} identifier={identifier} onRestart={restart} />
          ) : (
            <LoginCodeStep challenge={challenge} identifier={identifier} onRestart={restart} />
          )}
        </AuthCard>
      </AuthSplitLayout>
    );
  }

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
