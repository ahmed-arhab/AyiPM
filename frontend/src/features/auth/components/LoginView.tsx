'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { FormError, Spinner } from '@/components/ui';
import { ROUTES } from '@/constants/navigation';
import type { ApiResult } from '@/lib/api';
import { fetchGoogleTwoFactorStep, login, useGoogleSignIn } from '@/store';
import type { PendingGoogleSignIn, TwoFactorChallenge } from '@/types';
import { useAuthForm } from '../hooks/useAuthForm';
import { GOOGLE_SIGN_IN_ERRORS, googleSignInUrl, validateIdentifier, validateLoginPassword, type LoginValues } from '../utils';
import { AuthCard } from './AuthCard';
import { AuthSplitLayout } from './AuthSplitLayout';
import { AuthDivider, GoogleSignInButton } from './GoogleSignInButton';
import { LoginCodeStep } from './LoginCodeStep';
import { LoginIdentifierStep } from './LoginIdentifierStep';
import { LoginPasswordStep } from './LoginPasswordStep';
import { TwoFactorSetupStep } from './TwoFactorSetupStep';
import { useT } from '@/translations';

const INITIAL: LoginValues = { identifier: '', password: '', remember: false };
const GOOGLE_CHALLENGE_EXPIRED = 'This sign-in has expired. Continue with Google again.';

// The server hands out Google's two-factor step once, so a remounted page (React runs effects twice in development)
// must reuse the first request.
let googleStepRequest: Promise<ApiResult<PendingGoogleSignIn>> | null = null;

function requestGoogleStep(): Promise<ApiResult<PendingGoogleSignIn>> {
  googleStepRequest ??= fetchGoogleTwoFactorStep();
  return googleStepRequest;
}

/** The ?google= code that the backend adds when it sends the browser back from Google. */
function googleResult(): string | null {
  return typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('google');
}

export function LoginView() {
  const t = useT();
  const router = useRouter();
  const googleSignIn = useGoogleSignIn();
  const [step, setStep] = useState<'identifier' | 'password'>('identifier');
  // Set once the password is right and the account needs a two-factor code, or setup first.
  const [challenge, setChallenge] = useState<TwoFactorChallenge | null>(null);
  // Google replaced the password, so starting over means going back to Google rather than to the password.
  const [viaGoogle, setViaGoogle] = useState(false);
  // Read once: the effect below takes it out of the address bar.
  const [googleCode] = useState(googleResult);
  const [loadingGoogleStep, setLoadingGoogleStep] = useState(googleCode === 'two-factor');
  const { values, errors, formError, submitting, setField, setFormError, submit, checkValid } = useAuthForm(
    INITIAL,
    step === 'identifier' ? validateIdentifier : validateLoginPassword
  );

  useEffect(() => {
    if (!googleCode) return;
    // So that reloading the page doesn't show the message again.
    router.replace(ROUTES.login);
    if (googleCode !== 'two-factor') {
      if (Object.hasOwn(GOOGLE_SIGN_IN_ERRORS, googleCode)) setFormError(GOOGLE_SIGN_IN_ERRORS[googleCode]);
      return;
    }
    let cancelled = false;
    void requestGoogleStep().then((response) => {
      if (cancelled) return;
      setLoadingGoogleStep(false);
      if (!response.ok) {
        setFormError(response.status === 410 ? GOOGLE_CHALLENGE_EXPIRED : response.error);
        return;
      }
      setField('identifier', response.data.email);
      setViaGoogle(true);
      setChallenge(response.data.twoFactorChallenge);
    });
    return () => {
      cancelled = true;
    };
  }, [googleCode, router, setField, setFormError]);

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

  // An expired challenge goes back to the password (or to the start, after Google); "Change" goes back to the email.
  const restart = (error?: string) => {
    setChallenge(null);
    setStep(error && !viaGoogle ? 'password' : 'identifier');
    setViaGoogle(false);
    if (error) setFormError(viaGoogle ? GOOGLE_CHALLENGE_EXPIRED : error);
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
        {loadingGoogleStep ? (
          <Spinner size={28} />
        ) : (
          <>
            <FormError message={formError && t(formError)} />
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
            {googleSignIn && step === 'identifier' && (
              <>
                <AuthDivider />
                <GoogleSignInButton href={googleSignInUrl()} />
              </>
            )}
          </>
        )}
      </AuthCard>
    </AuthSplitLayout>
  );
}
