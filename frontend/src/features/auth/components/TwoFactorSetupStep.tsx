'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ShieldAlert, Smartphone } from 'lucide-react';
import { Field, FormError, Input, Spinner } from '@/components/ui';
import { confirmLoginTwoFactorSetup, startLoginTwoFactorSetup } from '@/store';
import type { ApiResult } from '@/lib/api';
import type { TwoFactorChallenge, TwoFactorSetup } from '@/types';
import { useT } from '@/translations';
import { useAuthForm } from '../hooks/useAuthForm';
import { validateAuthenticatorCode, type CodeValues } from '../utils';
import { AuthNotice } from './AuthNotice';
import { AuthSubmitButton } from './AuthSubmitButton';
import { TwoFactorIdentity } from './TwoFactorIdentity';
import { TwoFactorSetupPanel } from './TwoFactorSetupPanel';
import styles from './TwoFactorStep.module.css';

const INITIAL: CodeValues = { code: '' };

// Each request makes a new secret, so a remounted step (React runs effects twice in development) must reuse the first
// request. Otherwise the QR code shown could belong to a secret the server has already replaced.
const setupRequests = new Map<string, Promise<ApiResult<TwoFactorSetup>>>();

function requestSetup(token: string): Promise<ApiResult<TwoFactorSetup>> {
  let request = setupRequests.get(token);
  if (!request) {
    request = startLoginTwoFactorSetup(token).then((result) => {
      if (!result.ok) setupRequests.delete(token);
      return result;
    });
    setupRequests.set(token, request);
  }
  return request;
}

interface TwoFactorSetupStepProps {
  challenge: TwoFactorChallenge;
  identifier: string;
  /** Back to the start, with an error to show there if the challenge expired. */
  onRestart: (error?: string) => void;
  onSignedIn?: () => void;
}

/** For admins who must turn on two-factor authentication before they get a session. */
export function TwoFactorSetupStep({ challenge, identifier, onRestart, onSignedIn }: TwoFactorSetupStepProps) {
  const t = useT();
  const [setup, setSetup] = useState<TwoFactorSetup | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { values, errors, formError, submitting, setField, setFormError, submit } = useAuthForm(INITIAL, validateAuthenticatorCode);
  const onRestartRef = useRef(onRestart);
  onRestartRef.current = onRestart;

  useEffect(() => {
    let cancelled = false;
    void requestSetup(challenge.token).then((result) => {
      if (cancelled) return;
      if (result.ok) setSetup(result.data);
      else if (result.status === 410) onRestartRef.current(result.error);
      else setLoadError(result.error);
    });
    return () => {
      cancelled = true;
    };
  }, [challenge.token]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    let expired = false;
    const result = await submit(
      async (v) => {
        const response = await confirmLoginTwoFactorSetup(challenge.token, v.code);
        expired = !response.ok && response.status === 410;
        return response;
      },
      { keepLoadingOnSuccess: true }
    );
    if (!result) return;
    if (result.ok) {
      onSignedIn?.();
      return;
    }
    if (expired) {
      onRestart(result.error);
      return;
    }
    setField('code', '');
    setFormError(result.error);
  };

  const shownError = formError ?? loadError;

  return (
    <form onSubmit={handleSubmit} className="auth-form" noValidate>
      <FormError message={shownError && t(shownError)} />
      <TwoFactorIdentity identifier={identifier} disabled={submitting} onChange={() => onRestart()} />
      <AuthNotice icon={ShieldAlert} tone="warning" title={t('Two-factor authentication is required')}>
        {t('Your workspace requires admins to use two-factor authentication. Set it up now to finish signing in.')}
      </AuthNotice>
      {setup ? (
        <>
          <TwoFactorSetupPanel setup={setup} />
          <Field label={t('Code from your app')} htmlFor="setup-code" error={errors.code && t(errors.code)}>
            <Input
              id="setup-code"
              name="code"
              icon={Smartphone}
              className={styles.code}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={7}
              placeholder="123456"
              value={values.code}
              disabled={submitting}
              invalid={Boolean(errors.code)}
              onChange={(e) => setField('code', e.target.value)}
            />
          </Field>
          <AuthSubmitButton loading={submitting} loadingLabel={t('Turning on…')}>
            {t('Turn on and sign in')}
          </AuthSubmitButton>
        </>
      ) : (
        !loadError && (
          <div className={styles.loading}>
            <Spinner size={24} />
          </div>
        )
      )}
    </form>
  );
}
