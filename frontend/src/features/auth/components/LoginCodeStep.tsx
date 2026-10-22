'use client';

import { useState, type FormEvent } from 'react';
import { LifeBuoy, Smartphone } from 'lucide-react';
import { Field, FormError, Input } from '@/components/ui';
import { verifyLoginCode } from '@/store';
import type { TwoFactorChallenge } from '@/types';
import { useT } from '@/translations';
import { useAuthForm } from '../hooks/useAuthForm';
import { validateAuthenticatorCode, validateRecoveryCode, type CodeValues } from '../utils';
import { AuthSubmitButton } from './AuthSubmitButton';
import { TwoFactorIdentity } from './TwoFactorIdentity';
import styles from './TwoFactorStep.module.css';

const INITIAL: CodeValues = { code: '' };

interface LoginCodeStepProps {
  challenge: TwoFactorChallenge;
  identifier: string;
  /** Back to the password step, with an error to show there if the challenge expired. */
  onRestart: (error?: string) => void;
}

/** The third sign-in step for accounts with two-factor authentication. */
export function LoginCodeStep({ challenge, identifier, onRestart }: LoginCodeStepProps) {
  const t = useT();
  const [recovery, setRecovery] = useState(false);
  const { values, errors, formError, submitting, setField, setFormError, submit } = useAuthForm(
    INITIAL,
    recovery ? validateRecoveryCode : validateAuthenticatorCode
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    let expired = false;
    const result = await submit(
      async (v) => {
        const response = await verifyLoginCode(challenge.token, v.code);
        expired = !response.ok && response.status === 410;
        return response;
      },
      { keepLoadingOnSuccess: true }
    );
    if (!result || result.ok) return;
    if (expired) {
      onRestart(result.error);
      return;
    }
    setField('code', '');
    setFormError(result.error);
  };

  const switchMode = () => {
    setRecovery((value) => !value);
    setField('code', '');
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form" noValidate>
      <FormError message={formError && t(formError)} />
      <TwoFactorIdentity identifier={identifier} disabled={submitting} onChange={() => onRestart()} />
      <p className={styles.lead}>
        {recovery
          ? t('Enter one of the recovery codes you saved when you turned on two-factor authentication. Each code works once.')
          : t('Open your authenticator app and enter the 6-digit code for this account.')}
      </p>
      <Field label={recovery ? t('Recovery code') : t('Authentication code')} htmlFor="login-code" error={errors.code && t(errors.code)}>
        <Input
          key={recovery ? 'recovery' : 'authenticator'}
          id="login-code"
          name="code"
          icon={recovery ? LifeBuoy : Smartphone}
          className={styles.code}
          inputMode={recovery ? 'text' : 'numeric'}
          autoComplete="one-time-code"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={recovery ? 20 : 7}
          placeholder={recovery ? 'xxxxx-xxxxx' : '123456'}
          value={values.code}
          disabled={submitting}
          invalid={Boolean(errors.code)}
          onChange={(e) => setField('code', e.target.value)}
          autoFocus
        />
      </Field>
      <button type="button" className={styles.linkButton} onClick={switchMode} disabled={submitting}>
        {recovery ? t('Use your authenticator app instead') : t('Use a recovery code instead')}
      </button>
      <AuthSubmitButton loading={submitting} loadingLabel={t('Verifying…')}>
        {t('Verify')}
      </AuthSubmitButton>
    </form>
  );
}
